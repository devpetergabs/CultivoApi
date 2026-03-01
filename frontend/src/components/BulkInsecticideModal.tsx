import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';
import type { Aditivo, PlantaEvento } from '../types';
import type { Plant } from '../types/pokedex';
import {
  getAditivoStock,
  setAditivoStock,
  syncAditivoStocksFromApi,
  type AditivoStock,
} from '../utils/aditivoStorage';

interface BulkInsecticideModalProps {
  open: boolean;
  onClose: () => void;
  plants: Plant[];
}

type BulkPreset = {
  aditivoId: number;
  dosePorPlanta: number;
};

type PestSignal = {
  pestType: string;
  intensity: string | null;
};

type InfectedPlant = {
  plant: Plant;
  signal: PestSignal;
};

const PRESET_KEY = 'pokedex:bulk-insecticide-preset';

function safeParsePreset(raw: string | null): BulkPreset | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const aditivoId = Number(parsed?.aditivoId);
    const dosePorPlanta = Number(parsed?.dosePorPlanta);

    if (!Number.isFinite(aditivoId) || aditivoId <= 0) return null;
    if (!Number.isFinite(dosePorPlanta) || dosePorPlanta <= 0) return null;

    return {
      aditivoId: Math.round(aditivoId),
      dosePorPlanta: Number(dosePorPlanta.toFixed(2)),
    };
  } catch {
    return null;
  }
}

function clampFloat(value: number, min: number, max: number, decimals = 2): number {
  if (!Number.isFinite(value)) return min;
  const v = Math.max(min, Math.min(max, value));
  return Number(v.toFixed(decimals));
}

function isInsecticideLike(aditivo: Aditivo): boolean {
  const tipo = String((aditivo as any)?.tipo ?? '').toUpperCase();
  const classe = String((aditivo as any)?.classe ?? '').toUpperCase();
  const label = String((aditivo as any)?.label ?? '').toUpperCase();

  if (tipo === 'INSETICIDA') return true;
  if (label === 'INSETICIDA') return true;
  if (classe === 'PROTECAO' || classe === 'PROTEÇÃO') return true;

  const nome = String(aditivo?.nome ?? '').toLowerCase();
  const marca = String(aditivo?.marca ?? '').toLowerCase();
  const hay = `${nome} ${marca}`;

  return (
    hay.includes('spinosad') ||
    hay.includes('neem') ||
    hay.includes('bacillus') ||
    hay.includes('bt') ||
    hay.includes('fung') ||
    hay.includes('inset')
  );
}

function resolveStockMl(anyObj: any): number | null {
  if (!anyObj) return null;

  const candidates = [
    anyObj.stockMlAtual,
    anyObj.stockML,
    anyObj.stockMl,
    anyObj.mlAtual,
    anyObj.mlCurrent,
    anyObj.currentMl,
    anyObj.totalMl,
    anyObj.totalML,
    anyObj.mlTotal,
  ];

  for (const c of candidates) {
    const v = Number(c);
    if (Number.isFinite(v)) return v;
  }

  const unidades = Number(anyObj.unidades);
  const mlFrasco = Number(anyObj.mlFrasco);
  if (Number.isFinite(unidades) && Number.isFinite(mlFrasco)) {
    return Math.max(0, unidades * mlFrasco);
  }

  return null;
}

function mergeLocalStock(item: Aditivo): Aditivo {
  try {
    const local: any = getAditivoStock(item.id);
    const localMl = resolveStockMl(local);

    if (local && localMl !== null) {
      return {
        ...item,
        estoque: {
          tracked: true,
          tipoProduto: local.tipoProduto ?? (item as any)?.tipo ?? null,
          stockMlAtual: localMl ?? 0,
          unidades: Number(local.unidades ?? 0),
          mlFrasco: Number(local.mlFrasco ?? 0),
        } as any,
      };
    }
  } catch {
    // ignore
  }
  return item;
}

function parsePestSignal(descricao: string | null | undefined): PestSignal | null {
  const text = String(descricao ?? '');
  if (!text.includes('[PEST_SIGNAL]')) return null;

  const match = text.match(/\[PEST_SIGNAL\]\s*type=([A-Z0-9_\-]+)(?:\s+intensity=([A-Z0-9_\-]+))?/i);
  if (!match) return null;

  const pestType = String(match[1] ?? '').trim().toUpperCase();
  const intensity = String(match[2] ?? '').trim().toUpperCase() || null;

  if (!pestType) return null;

  return { pestType, intensity };
}

function normalizeEventsPayload(payload: any): PlantaEvento[] {
  const content = (payload as any)?.content ?? payload;
  if (!Array.isArray(content)) return [];
  return content as PlantaEvento[];
}

export function BulkInsecticideModal({ open, onClose, plants }: BulkInsecticideModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<Aditivo[]>([]);
  const [signalsByPlantId, setSignalsByPlantId] = useState<Record<number, PestSignal>>({});

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dosePorPlanta, setDosePorPlanta] = useState<number>(8);
  const [notes, setNotes] = useState('');
  const [filterPestType, setFilterPestType] = useState<string>('ALL');

  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(() => {
    const filtered = inventory.filter(isInsecticideLike);
    return filtered.sort((a, b) => {
      const na = String(a.nome ?? '').toLocaleLowerCase('pt-BR');
      const nb = String(b.nome ?? '').toLocaleLowerCase('pt-BR');
      return na.localeCompare(nb, 'pt-BR');
    });
  }, [inventory]);

  const effectiveSelectedId = useMemo(() => {
    if (selectedId && selectedId > 0) return selectedId;
    return selectable[0]?.id ?? null;
  }, [selectedId, selectable]);

  useEffect(() => {
    if (!open) return;
    if (!effectiveSelectedId) return;
    if (selectedId !== effectiveSelectedId) setSelectedId(effectiveSelectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectiveSelectedId]);

  const selected = useMemo(() => {
    if (!effectiveSelectedId) return null;
    return selectable.find((a) => a.id === effectiveSelectedId) ?? null;
  }, [selectable, effectiveSelectedId]);

  const infectedPlants = useMemo<InfectedPlant[]>(() => {
    return plants
      .map((plant) => {
        const signal = signalsByPlantId[plant.id];
        if (!signal) return null;
        return { plant, signal };
      })
      .filter(Boolean) as InfectedPlant[];
  }, [plants, signalsByPlantId]);

  const pestTypeOptions = useMemo(() => {
    return Array.from(new Set(infectedPlants.map((item) => item.signal.pestType))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
  }, [infectedPlants]);

  const filteredInfectedPlants = useMemo(() => {
    if (filterPestType === 'ALL') return infectedPlants;
    return infectedPlants.filter((item) => item.signal.pestType === filterPestType);
  }, [filterPestType, infectedPlants]);

  const filteredIds = useMemo(() => filteredInfectedPlants.map((item) => item.plant.id), [filteredInfectedPlants]);

  useEffect(() => {
    setSelectedPlantIds((current) => current.filter((id) => filteredIds.includes(id)));
  }, [filteredIds]);

  const selectedCount = selectedPlantIds.length;

  const dosePorPlantaClamped = useMemo(
    () => clampFloat(Number(dosePorPlanta), 0.1, 100000, 2),
    [dosePorPlanta]
  );

  const totalEstimado = useMemo(() => {
    return Number((dosePorPlantaClamped * selectedCount).toFixed(2));
  }, [dosePorPlantaClamped, selectedCount]);

  const selectedStockMl = useMemo(() => {
    if (!selected) return null;

    try {
      const local: any = getAditivoStock(selected.id);
      const localMl = resolveStockMl(local);
      if (localMl !== null) return localMl;
    } catch {
      // ignore
    }

    const est: any = (selected as any)?.estoque;
    const apiMl = resolveStockMl(est);
    if (apiMl !== null) return apiMl;

    return null;
  }, [selected]);

  const hasStockEnough = useMemo(() => {
    if (typeof selectedStockMl !== 'number') return true;
    return selectedStockMl >= totalEstimado;
  }, [selectedStockMl, totalEstimado]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setNotes('');
    setFilterPestType('ALL');

    try {
      const preset = safeParsePreset(localStorage.getItem(PRESET_KEY));
      if (preset) {
        setSelectedId(preset.aditivoId);
        setDosePorPlanta(preset.dosePorPlanta);
      } else {
        setSelectedId(null);
        setDosePorPlanta(8);
      }
    } catch {
      setSelectedId(null);
      setDosePorPlanta(8);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    setIsLoading(true);
    setError(null);

    Promise.all([
      apiService.getAditivos(0, 500),
      Promise.all(
        plants.map(async (plant) => {
          try {
            const response = await apiService.getPlantaEventos(plant.id, 0, 120);
            const eventos = normalizeEventsPayload(response);
            const signalEvent = eventos.find((evento) => parsePestSignal(evento?.descricao ?? null));
            const signal = parsePestSignal(signalEvent?.descricao ?? null);
            return { plantId: plant.id, signal };
          } catch {
            return { plantId: plant.id, signal: null };
          }
        })
      ),
    ])
      .then(([inventoryResponse, signalResults]) => {
        if (!active) return;

        const inventoryList = (inventoryResponse as any)?.content ?? inventoryResponse;
        const inventoryRaw = Array.isArray(inventoryList) ? (inventoryList as Aditivo[]) : [];

        try {
          syncAditivoStocksFromApi(inventoryRaw as any);
        } catch {
          // ignore
        }

        const inventoryMerged = inventoryRaw.map(mergeLocalStock);
        setInventory(inventoryMerged);

        const map: Record<number, PestSignal> = {};
        for (const result of signalResults) {
          if (result.signal) map[result.plantId] = result.signal;
        }
        setSignalsByPlantId(map);

        const firstInsecticide = inventoryMerged.filter(isInsecticideLike)[0];
        setSelectedId((current) => {
          if (current && inventoryMerged.some((x) => x.id === current)) return current;
          return firstInsecticide?.id ?? null;
        });

        const infectedIds = plants
          .filter((plant) => Boolean(map[plant.id]))
          .map((plant) => plant.id);
        setSelectedPlantIds(infectedIds);
      })
      .catch(() => {
        if (!active) return;
        setInventory([]);
        setSignalsByPlantId({});
        setSelectedPlantIds([]);
        setError('Não foi possível carregar inventário e sinais de praga.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, plants]);

  if (!open || typeof document === 'undefined') return null;

  const canInteract = !isSaving && !isLoading;

  const togglePlant = (id: number) => {
    setSelectedPlantIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return [...current, id];
    });
  };

  const selectAllFiltered = () => setSelectedPlantIds(filteredIds);
  const selectNone = () => setSelectedPlantIds([]);

  const handleAplicar = async () => {
    const id = Number(effectiveSelectedId);

    if (!Number.isFinite(id) || id <= 0 || !selected) {
      setError('Selecione um produto do inventário.');
      return;
    }
    if (selectedPlantIds.length <= 0) {
      setError('Selecione ao menos 1 planta infectada.');
      return;
    }
    if (!(dosePorPlantaClamped > 0)) {
      setError('Informe uma dose por planta válida.');
      return;
    }
    if (!hasStockEnough) {
      setError('Estoque insuficiente para esse tratamento em lote.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      try {
        localStorage.setItem(
          PRESET_KEY,
          JSON.stringify({
            aditivoId: id,
            dosePorPlanta: dosePorPlantaClamped,
          })
        );
      } catch {
        // ignore
      }

      const batchId = `B${Date.now().toString(36)}`;
      const safeObs = notes.trim();
      const baseDesc = `${selected.nome} (${selected.marca}) — tratamento em lote`;

      await Promise.all(
        selectedPlantIds.map((plantId) => {
          const signal = signalsByPlantId[plantId];
          const pestType = signal?.pestType ?? 'DESCONHECIDA';
          const intensityPart = signal?.intensity ? ` intensity=${signal.intensity}` : '';
          const signalBlock = `[PEST_SIGNAL] type=${pestType}${intensityPart}`;
          const descricao = `${baseDesc} | ${signalBlock}${safeObs ? ` | ${safeObs}` : ''}`;

          return apiService.createPlantaEvento(plantId, {
            tipo: 'INSETICIDA',
            descricao,
            doseEmML: dosePorPlantaClamped,
            produtoId: id,
            roundsTotal: null,
            descansoDias: null,
            idempotencyKey: `insecticide-bulk:${batchId}:${plantId}:${id}:${dosePorPlantaClamped}`,
          });
        })
      );

      try {
        const localAny: any = getAditivoStock(id);
        const currentMl = resolveStockMl(localAny);
        if (localAny && currentMl !== null) {
          const next = Math.max(0, Number(currentMl ?? 0) - totalEstimado);

          const payload: AditivoStock = {
            tracked: true,
            tipoProduto: localAny.tipoProduto ?? (selected as any)?.tipo ?? null,
            stockMlAtual: next,
            unidades: Number(localAny.unidades ?? 0),
            mlFrasco: Number(localAny.mlFrasco ?? 0),
          };
          setAditivoStock(id, payload);

          setInventory((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    estoque: {
                      tracked: true,
                      tipoProduto: payload.tipoProduto,
                      stockMlAtual: payload.stockMlAtual,
                      unidades: payload.unidades,
                      mlFrasco: payload.mlFrasco,
                    } as any,
                  }
                : p
            )
          );
        }
      } catch {
        // ignore
      }

      onClose();
    } catch {
      setError('Não foi possível registrar o tratamento em lote.');
    } finally {
      setIsSaving(false);
    }
  };

  const estText =
    typeof selectedStockMl === 'number'
      ? `${Math.max(0, Math.round(selectedStockMl))} mL`
      : '—';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[580px] max-w-[94vw] rounded-xl border border-[#f39a5c]/25 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tratar praga em lote"
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">Tratar Praga (lote)</h3>
          <p className="text-xs text-[#9fb0c0] font-normal">Aplicação em lote para plantas já marcadas com sinal de praga.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Plantas infectadas</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  disabled={!canInteract}
                  className="text-[11px] text-slate-200/80 hover:text-white"
                >
                  tudo
                </button>
                <span className="text-slate-500">•</span>
                <button
                  type="button"
                  onClick={selectNone}
                  disabled={!canInteract}
                  className="text-[11px] text-slate-200/80 hover:text-white"
                >
                  nada
                </button>
              </div>
            </div>

            <div className="mt-2">
              <label className="text-[11px] text-slate-300/90 uppercase tracking-[0.06em]">Filtro por tipo de praga</label>
              <select
                value={filterPestType}
                onChange={(event) => setFilterPestType(event.target.value)}
                disabled={!canInteract}
                className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
              >
                <option value="ALL">Todos os tipos</option>
                {pestTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 max-h-[240px] overflow-auto pr-1 space-y-2">
              {filteredInfectedPlants.length === 0 ? (
                <div className="text-xs text-slate-400">Nenhuma planta marcada com [PEST_SIGNAL] para este filtro.</div>
              ) : (
                filteredInfectedPlants.map((item) => {
                  const checked = selectedPlantIds.includes(item.plant.id);
                  return (
                    <label
                      key={item.plant.id}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition ${
                        checked
                          ? 'border-[#f39a5c]/40 bg-[#f39a5c]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePlant(item.plant.id)}
                        disabled={!canInteract}
                        className="h-4 w-4 accent-[#f39a5c]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{item.plant.name}</div>
                        <div className="text-[11px] text-slate-300/70 truncate">
                          type={item.signal.pestType}
                          {item.signal.intensity ? ` | intensity=${item.signal.intensity}` : ''}
                        </div>
                      </div>
                      <div className="ml-auto text-[11px] text-slate-400/70">#{item.plant.id}</div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="mt-2 text-[11px] text-slate-400/80">
              Selecionadas: <span className="font-semibold text-slate-200">{selectedCount}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Produtos do inventário</div>
              <div className="text-[11px] text-slate-400/80">
                Estoque — <span className="font-semibold text-slate-200">{estText}</span>
              </div>
            </div>

            <select
              value={effectiveSelectedId ?? ''}
              onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : null)}
              disabled={!canInteract}
              className="mt-2 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
            >
              {selectable.length === 0 ? (
                <option value="">Nenhum produto de proteção encontrado</option>
              ) : (
                <>
                  <option value="">Selecione um produto…</option>
                  {selectable.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} — {a.marca}
                    </option>
                  ))}
                </>
              )}
            </select>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Dose por planta (mL)</label>
                <span className="text-[11px] text-slate-400/80">(obrigatório)</span>
              </div>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={dosePorPlanta}
                onChange={(event) => setDosePorPlanta(Number(event.target.value))}
                disabled={!canInteract}
                className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
              />
            </div>

            <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300/90 uppercase tracking-[0.06em]">Total estimado</span>
                <span className={`text-xs font-semibold ${hasStockEnough ? 'text-[#f7c6a1]' : 'text-red-400'}`}>
                  {totalEstimado} mL
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400/80">
                {hasStockEnough ? 'Ok para aplicar.' : 'Estoque insuficiente para as selecionadas.'}
              </div>
            </div>
          </div>
        </div>

        <label className="mt-3 block text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">
          Observação (opcional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={!canInteract}
          className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
        />

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600/70 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-400 disabled:opacity-60"
            disabled={!canInteract}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleAplicar}
            className="rounded-lg bg-[#f39a5c] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110 disabled:opacity-60"
            disabled={!canInteract || !selected || !hasStockEnough || selectedPlantIds.length === 0 || !(dosePorPlantaClamped > 0)}
          >
            {isSaving ? 'Aplicando...' : 'Aplicar lote'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
