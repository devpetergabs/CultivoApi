import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';
import type { Aditivo } from '../types';
import { getAditivoStock } from '../utils/aditivoStorage';

interface InsecticideModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
}

type InsecticidePreset = {
  aditivoId: number;
  doseMlPorLitro: number;
  litrosAplicados: number;
};

function presetKey(plantId: number) {
  return `plant:${plantId}:insecticide-preset`;
}

function safeParsePreset(raw: string | null): InsecticidePreset | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const aditivoId = Number(parsed?.aditivoId);
    const doseMlPorLitro = Number(parsed?.doseMlPorLitro);
    const litrosAplicados = Number(parsed?.litrosAplicados);

    if (!Number.isFinite(aditivoId) || aditivoId <= 0) return null;
    if (!Number.isFinite(doseMlPorLitro) || doseMlPorLitro <= 0) return null;
    if (!Number.isFinite(litrosAplicados) || litrosAplicados <= 0) return null;

    return {
      aditivoId: Math.round(aditivoId),
      doseMlPorLitro: Math.round(doseMlPorLitro),
      litrosAplicados: Number(litrosAplicados.toFixed(2)),
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
  const classe = String((aditivo as any)?.classe ?? '');
  const nome = String(aditivo?.nome ?? '').toLowerCase();
  const marca = String(aditivo?.marca ?? '').toLowerCase();

  if (classe === 'PROTECAO') return true;

  const hay = `${nome} ${marca}`;
  return (
    hay.includes('inset') ||
    hay.includes('spinosad') ||
    hay.includes('neem') ||
    hay.includes('bacillus') ||
    hay.includes('bt ') ||
    hay.includes('fung')
  );
}

export function InsecticideModal({ open, onClose, plantId, plantName }: InsecticideModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<Aditivo[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [doseMlPorLitro, setDoseMlPorLitro] = useState<number>(10);
  const [litrosAplicados, setLitrosAplicados] = useState<number>(1);
  const [notes, setNotes] = useState('');

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

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return selectable.find((a) => a.id === selectedId) ?? null;
  }, [selectable, selectedId]);

  const selectedStockMl = useMemo(() => {
    if (!selected) return null;
    try {
      const stock = getAditivoStock(selected.id);
      return typeof (stock as any)?.estoqueMl === 'number' ? (stock as any).estoqueMl : null;
    } catch {
      return null;
    }
  }, [selected]);

  const totalMl = useMemo(() => {
    const dose = clampInt(Number(doseMlPorLitro), 1, 100000);
    const litros = clampFloat(Number(litrosAplicados), 0.1, 9999, 2);
    return clampInt(dose * litros, 1, 100000000);
  }, [doseMlPorLitro, litrosAplicados]);

  const hasStockEnough = useMemo(() => {
    if (typeof selectedStockMl !== 'number') return true; // sem estoque -> não bloqueia
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

    let preset: InsecticidePreset | null = null;
    try {
      preset = safeParsePreset(localStorage.getItem(presetKey(plantId)));
    } catch {}

    if (preset) {
      setSelectedId(preset.aditivoId);
      setDoseMlPorLitro(preset.doseMlPorLitro);
      setLitrosAplicados(preset.litrosAplicados);
    } else {
      setSelectedId(null);
      setDoseMlPorLitro(10);
      setLitrosAplicados(1);
    }
  }, [open, plantId]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    setIsLoading(true);
    setError(null);

    apiService
      .getAditivos(0, 500)
      .then((response) => {
        const list = (response as any)?.content ?? response;
        const items = Array.isArray(list) ? (list as Aditivo[]) : [];
        if (!active) return;

        setInventory(items);

        setSelectedId((current) => {
          if (current && items.some((a) => a.id === current)) return current;
          const first = items.filter(isInsecticideLike)[0];
          return first ? first.id : null;
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
  }, [open, plantId]);

  if (!open || typeof document === 'undefined') return null;

  const canInteract = !isSaving && !isLoading;

  const handleSalvarPreset = () => {
    const id = Number(selectedId);
    const dose = clampInt(Number(doseMlPorLitro), 1, 100000);
    const litros = clampFloat(Number(litrosAplicados), 0.1, 9999, 2);

    if (!Number.isFinite(id) || id <= 0) {
      setError('Selecione um produto do inventário.');
      return;
    }
    if (dose <= 0) {
      setError('Informe uma dose maior que 0.');
      return;
    }
    if (litros <= 0) {
      setError('Informe os litros aplicados.');
      return;
    }

    try {
      localStorage.setItem(
        presetKey(plantId),
        JSON.stringify({ aditivoId: id, doseMlPorLitro: dose, litrosAplicados: litros })
      );
      onClose();
    } catch {
      setError('Não foi possível salvar o preset.');
    }
  };

  const handleAplicar = async () => {
    const id = Number(selectedId);
    const dose = clampInt(Number(doseMlPorLitro), 1, 100000);
    const litros = clampFloat(Number(litrosAplicados), 0.1, 9999, 2);

    if (!Number.isFinite(id) || id <= 0 || !selected) {
      setError('Selecione um produto do inventário.');
      return;
    }
    if (dose <= 0) {
      setError('Informe uma dose maior que 0.');
      return;
    }
    if (litros <= 0) {
      setError('Informe os litros aplicados.');
      return;
    }
    if (!hasStockEnough) {
      setError('Estoque insuficiente para esse consumo total (mL).');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // persiste preset
      try {
        localStorage.setItem(
          presetKey(plantId),
          JSON.stringify({ aditivoId: id, doseMlPorLitro: dose, litrosAplicados: litros })
        );
      } catch {}

      const safeObs = notes.trim();
      const baseDesc = `${selected.nome} (${selected.marca}) — ${dose} mL/L × ${litros} L = ${totalMl} mL`;
      const descricao = safeObs ? `${baseDesc} | ${safeObs}` : baseDesc;

      await apiService.createPlantaEvento(plantId, {
        tipo: 'INSETICIDA',
        descricao,
        // aqui fica REAL: consumo total em mL
        doseEmML: totalMl,
        idempotencyKey: `insecticide:${plantId}:${id}:${dose}:${litros}:${Date.now()}`,
      });

      onClose();
    } catch {
      setError('Não foi possível registrar a aplicação do inseticida.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[380px] max-w-[92vw] rounded-xl border border-[#f39a5c]/25 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Registrar inseticida"
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">Inseticida</h3>
          <p className="text-xs text-[#9fb0c0] font-normal">Planta: {plantName}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Produto</label>
            <select
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              disabled={!canInteract}
              className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
            >
              <option value="" disabled>
                {isLoading
                  ? 'Carregando...'
                  : selectable.length
                    ? 'Selecione um produto'
                    : 'Nenhum produto com label INSETICIDA'}
              </option>
              {selectable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} — {a.marca}
                </option>
              ))}
            </select>

            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300/80">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f39a5c]" />
                Label: <span className="text-slate-100/90 font-semibold">INSETICIDA</span>
              </span>
              {typeof selectedStockMl === 'number' ? (
                <span className="text-slate-200/80">
                  Estoque:{' '}
                  <span className="font-semibold text-slate-100">
                    {Math.max(0, Math.round(selectedStockMl))} mL
                  </span>
                </span>
              ) : (
                <span className="text-slate-400/70">Estoque: —</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">ML/L</label>
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
                <span className="text-[11px] text-slate-400/80">(aplicados)</span>
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

          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
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

          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Recomendação</label>
            <div className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200/90">
              {selected ? brief(selected.descricao, 240) : 'Selecione um produto para ver a recomendação.'}
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
            disabled={!canInteract}
            title="Salva produto + dose + litros como preset desta planta"
          >
            Salvar
          </button>

          <button
            type="button"
            onClick={handleAplicar}
            className="rounded-lg bg-[#f39a5c] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110 disabled:opacity-60"
            disabled={!canInteract || !selected || !hasStockEnough}
          >
            {isSaving ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}