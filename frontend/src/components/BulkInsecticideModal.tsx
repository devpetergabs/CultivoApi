import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';
import type { Aditivo } from '../types';
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

type InsecticidePreset = {
  aditivoId: number;
  doseMlPorLitro: number;
  litrosAplicados: number;
  roundsTotal: number;
  descansoDias: number;
};

const PRESET_KEY = 'pokedex:bulk-insecticide-preset';

function safeParsePreset(raw: string | null): InsecticidePreset | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const aditivoId = Number(parsed?.aditivoId);
    const doseMlPorLitro = Number(parsed?.doseMlPorLitro);
    const litrosAplicados = Number(parsed?.litrosAplicados);
    const roundsTotal = Number(parsed?.roundsTotal);
    const descansoDias = Number(parsed?.descansoDias);

    if (!Number.isFinite(aditivoId) || aditivoId <= 0) return null;
    if (!Number.isFinite(doseMlPorLitro) || doseMlPorLitro <= 0) return null;
    if (!Number.isFinite(litrosAplicados) || litrosAplicados <= 0) return null;
    if (!Number.isFinite(roundsTotal) || roundsTotal <= 0) return null;
    if (!Number.isFinite(descansoDias) || descansoDias < 0) return null;

    return {
      aditivoId: Math.round(aditivoId),
      doseMlPorLitro: Math.round(doseMlPorLitro),
      litrosAplicados: Number(litrosAplicados.toFixed(2)),
      roundsTotal: Math.round(roundsTotal),
      descansoDias: Math.round(descansoDias),
    };
  } catch {
    return null;
  }
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampFloat(value: number, min: number, max: number, decimals = 2): number {
  if (!Number.isFinite(value)) return min;
  const v = Math.max(min, Math.min(max, value));
  return Number(v.toFixed(decimals));
}

function brief(text: unknown, max = 220) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '—';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
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

/**
 * Resolve estoque (mL) de forma tolerante:
 * - aceita diferentes nomes de campo (stockMlAtual, stockML, mlAtual, etc)
 * - se não tiver mL direto, tenta calcular unidades * mlFrasco
 */
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

    // Se existir qualquer valor de estoque, usa (mesmo que tracked venha false/undefined)
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

export function BulkInsecticideModal({ open, onClose, plants }: BulkInsecticideModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<Aditivo[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [doseMlPorLitro, setDoseMlPorLitro] = useState<number>(10);
  const [litrosAplicados, setLitrosAplicados] = useState<number>(1);
  const [roundsTotal, setRoundsTotal] = useState<number>(6);
  const [descansoDias, setDescansoDias] = useState<number>(4);
  const [notes, setNotes] = useState('');

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

  // ✅ ID efetivo: se o state estiver null, usa o 1º do select
  const effectiveSelectedId = useMemo(() => {
    if (selectedId && selectedId > 0) return selectedId;
    return selectable[0]?.id ?? null;
  }, [selectedId, selectable]);

  // ✅ Garante que o state NÃO fique null enquanto existe item no select (evita “parece selecionado mas não está”)
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

  // ✅ estoque: tolerante, NÃO depende de tracked
  const selectedStockMl = useMemo(() => {
    if (!selected) return null;

    // 1) localStorage (tolerante)
    try {
      const local: any = getAditivoStock(selected.id);
      const localMl = resolveStockMl(local);
      if (localMl !== null) return localMl;
    } catch {
      // ignore
    }

    // 2) payload API (tolerante)
    const est: any = (selected as any)?.estoque;
    const apiMl = resolveStockMl(est);
    if (apiMl !== null) return apiMl;

    return null;
  }, [selected]);

  const totalMl = useMemo(() => {
    const dose = clampInt(Number(doseMlPorLitro), 1, 100000);
    const litros = clampFloat(Number(litrosAplicados), 0.1, 9999, 2);
    return Math.max(1, Math.round(dose * litros));
  }, [doseMlPorLitro, litrosAplicados]);

  const perPlantMl = useMemo(() => {
    const count = Math.max(0, selectedPlantIds.length);
    if (count <= 0) return null;
    return Number((totalMl / count).toFixed(2));
  }, [selectedPlantIds.length, totalMl]);

  const hasStockEnough = useMemo(() => {
    // se não temos estoque rastreado (null), NÃO bloqueia (MVP)
    if (typeof selectedStockMl !== 'number') return true;
    return selectedStockMl >= totalMl;
  }, [selectedStockMl, totalMl]);

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
    setSelectedPlantIds(plants.map((p) => p.id));

    let preset: InsecticidePreset | null = null;
    try {
      preset = safeParsePreset(localStorage.getItem(PRESET_KEY));
    } catch {}

    if (preset) {
      setSelectedId(preset.aditivoId);
      setDoseMlPorLitro(preset.doseMlPorLitro);
      setLitrosAplicados(preset.litrosAplicados);
      setRoundsTotal(preset.roundsTotal);
      setDescansoDias(preset.descansoDias);
    } else {
      setSelectedId(null);
      setDoseMlPorLitro(10);
      setLitrosAplicados(1);
      setRoundsTotal(6);
      setDescansoDias(4);
    }
  }, [open, plants]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    setIsLoading(true);
    setError(null);

    apiService
      .getAditivos(0, 500)
      .then((response) => {
        const list = (response as any)?.content ?? response;
        const itemsRaw = Array.isArray(list) ? (list as Aditivo[]) : [];
        if (!active) return;

        try {
          syncAditivoStocksFromApi(itemsRaw as any);
        } catch {
          // ignore
        }

        const items = itemsRaw.map(mergeLocalStock);
        setInventory(items);

        // garante selectedId consistente (evita select "fantasma")
        const first = items.filter(isInsecticideLike)[0];
        setSelectedId((cur) => {
          if (cur && items.some((x) => x.id === cur)) return cur;
          return first?.id ?? null;
        });
      })
      .catch(() => {
        if (!active) return;
        setInventory([]);
        setError('Não foi possível carregar os produtos do inventário.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const canInteract = !isSaving && !isLoading;

  const togglePlant = (id: number) => {
    setSelectedPlantIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      return [...cur, id];
    });
  };

  const selectAll = () => setSelectedPlantIds(plants.map((p) => p.id));
  const selectNone = () => setSelectedPlantIds([]);

  const handleSalvarPreset = () => {
    const id = Number(effectiveSelectedId);
    const dose = clampInt(Number(doseMlPorLitro), 1, 100000);
    const litros = clampFloat(Number(litrosAplicados), 0.1, 9999, 2);
    const rounds = clampInt(Number(roundsTotal), 1, 50);
    const descanso = clampInt(Number(descansoDias), 0, 30);

    if (!Number.isFinite(id) || id <= 0 || !selected) {
      setError('Selecione um produto do inventário.');
      return;
    }

    try {
      localStorage.setItem(
        PRESET_KEY,
        JSON.stringify({
          aditivoId: id,
          doseMlPorLitro: dose,
          litrosAplicados: litros,
          roundsTotal: rounds,
          descansoDias: descanso,
        })
      );
      onClose();
    } catch {
      setError('Não foi possível salvar o preset.');
    }
  };

  const handleAplicar = async () => {
    const id = Number(effectiveSelectedId);
    const dose = clampInt(Number(doseMlPorLitro), 1, 100000);
    const litros = clampFloat(Number(litrosAplicados), 0.1, 9999, 2);
    const rounds = clampInt(Number(roundsTotal), 1, 50);
    const descanso = clampInt(Number(descansoDias), 0, 30);

    if (!Number.isFinite(id) || id <= 0 || !selected) {
      setError('Selecione um produto do inventário.');
      return;
    }
    if (selectedPlantIds.length <= 0) {
      setError('Selecione ao menos 1 planta.');
      return;
    }
    if (!hasStockEnough) {
      setError('Estoque insuficiente para esse consumo total (mL).');
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
            doseMlPorLitro: dose,
            litrosAplicados: litros,
            roundsTotal: rounds,
            descansoDias: descanso,
          })
        );
      } catch {}

      const batchId = `B${Date.now().toString(36)}`;
      const safeObs = notes.trim();
      const baseDesc = `${selected.nome} (${selected.marca}) — ${dose} mL/L × ${litros} L = ${totalMl} mL | Tratamento: ${rounds} rounds / descanso ${descanso}d`;

      const alvo = selectedPlantIds
        .map((pid) => plants.find((p) => p.id === pid)?.name ?? `#${pid}`)
        .filter(Boolean)
        .join(', ');

      const desc = `${baseDesc} | LOTE:${batchId} | Plantas: ${alvo}${safeObs ? ` | ${safeObs}` : ''}`;
      const perMl = typeof perPlantMl === 'number' ? perPlantMl : null;

      await Promise.all(
        selectedPlantIds.map((plantId) =>
          apiService.createPlantaEvento(plantId, {
            tipo: 'INSETICIDA',
            descricao: desc,
            doseEmML: perMl,
            produtoId: id,
            roundsTotal: rounds,
            descansoDias: descanso,
            idempotencyKey: `insecticide-bulk:${batchId}:${plantId}:${id}:${dose}:${litros}:${rounds}:${descanso}`,
          })
        )
      );

      // Atualiza cache local 1x (preparo)
      try {
        const localAny: any = getAditivoStock(id);
        const currentMl = resolveStockMl(localAny);
        if (localAny && currentMl !== null) {
          const next = Math.max(0, Number(currentMl ?? 0) - totalMl);

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
      } catch {}

      onClose();
    } catch {
      setError('Não foi possível registrar a aplicação em lote.');
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
        className="w-[560px] max-w-[94vw] rounded-xl border border-[#f39a5c]/25 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Registrar inseticida em lote"
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">Inseticida (lote)</h3>
          <p className="text-xs text-[#9fb0c0] font-normal">Selecione as plantas e aplique um único preparo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Plantas</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
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

            <div className="mt-2 max-h-[240px] overflow-auto pr-1 space-y-2">
              {plants.length === 0 ? (
                <div className="text-xs text-slate-400">Nenhuma planta na lista atual.</div>
              ) : (
                plants.map((p) => {
                  const checked = selectedPlantIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition ${
                        checked
                          ? 'border-[#f39a5c]/40 bg-[#f39a5c]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePlant(p.id)}
                        disabled={!canInteract}
                        className="h-4 w-4 accent-[#f39a5c]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-300/70 truncate">
                          {(p as any).strain || (p as any).variant || '—'}
                        </div>
                      </div>
                      <div className="ml-auto text-[11px] text-slate-400/70">#{p.id}</div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="mt-2 text-[11px] text-slate-400/80">
              Selecionadas: <span className="font-semibold text-slate-200">{selectedPlantIds.length}</span>
              {typeof perPlantMl === 'number' ? (
                <>
                  {' '}
                  | consumo por planta: <span className="font-semibold text-[#f7c6a1]">{perPlantMl} mL</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Produto</div>
              <div className="text-[11px] text-slate-400/80">
                Estoque — <span className="font-semibold text-slate-200">{estText}</span>
              </div>
            </div>

            <select
              value={effectiveSelectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
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

            <div className="mt-2 text-[11px] text-slate-400/80">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f39a5c]" />
                Label: <span className="font-semibold text-slate-200">INSETICIDA</span>
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">mL/L</label>
                  <span className="text-[11px] text-slate-400/80">(dose)</span>
                </div>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={doseMlPorLitro}
                  onChange={(event) => setDoseMlPorLitro(Number(event.target.value))}
                  disabled={!canInteract}
                  className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Litros</label>
                  <span className="text-[11px] text-slate-400/80">(preparo)</span>
                </div>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={litrosAplicados}
                  onChange={(event) => setLitrosAplicados(Number(event.target.value))}
                  disabled={!canInteract}
                  className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Rounds</label>
                  <span className="text-[11px] text-slate-400/80">(tratamento)</span>
                </div>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={roundsTotal}
                  onChange={(event) => setRoundsTotal(Number(event.target.value))}
                  disabled={!canInteract}
                  className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">
                    Descanso (dias)
                  </label>
                  <span className="text-[11px] text-slate-400/80">(entre rounds)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={descansoDias}
                  onChange={(event) => setDescansoDias(Number(event.target.value))}
                  disabled={!canInteract}
                  className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300/90 uppercase tracking-[0.06em]">Consumo total</span>
                <span className={`text-xs font-semibold ${hasStockEnough ? 'text-[#f7c6a1]' : 'text-red-400'}`}>
                  {totalMl} mL
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400/80">
                {hasStockEnough ? 'Ok para aplicar.' : 'Estoque insuficiente para esse volume.'}
              </div>
            </div>

            <div className="mt-2">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Recomendação</label>
              <div className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200/90">
                {selected ? brief((selected as any)?.descricao, 260) : 'Selecione um produto para ver a recomendação.'}
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
            onClick={handleSalvarPreset}
            className="rounded-lg border border-[#f39a5c]/60 bg-[#0f1726] px-3 py-2 text-xs font-semibold text-[#f7c6a1] hover:bg-white/5 hover:border-[#f39a5c]/80 disabled:opacity-60"
            disabled={!canInteract || !selected}
          >
            Salvar
          </button>

          <button
            type="button"
            onClick={handleAplicar}
            className="rounded-lg bg-[#f39a5c] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110 disabled:opacity-60"
            disabled={!canInteract || !selected || !hasStockEnough || selectedPlantIds.length === 0}
          >
            {isSaving ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}