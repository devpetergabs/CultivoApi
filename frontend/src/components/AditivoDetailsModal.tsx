import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Aditivo } from '../types';
import {
  getAditivoIcon,
  getAditivoStock,
  setAditivoIcon,
  setAditivoStock,
  validateIconFile,
  getDerivedStock,
  type AditivoStock,
} from '../utils/aditivoStorage';

type Props = {
  open: boolean;
  aditivo: Aditivo | null;
  onClose: () => void;
  onUpdated?: () => void;
};

function classeLabel(value: string): string {
  switch (value) {
    case 'BASE_NUTRICIONAL':
      return 'Base';
    case 'FORTIFICANTE':
      return 'Fortificante';
    case 'ESTIMULANTE':
      return 'Estimulante';
    case 'BOOSTER':
      return 'Booster';
    case 'PROTECAO':
      return 'Proteção';
    case 'FINALIZADOR':
      return 'Finalizador';
    case 'OUTROS':
      return 'Outros';
    default:
      return value;
  }
}

function estagioLabel(value: string): string {
  switch (value) {
    case 'VEGETATIVA':
      return 'Vegetativa';
    case 'FLORACAO':
      return 'Floração';
    case 'FINALIZACAO':
      return 'Finalização';
    default:
      return value;
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeStars(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return clamp(Math.round(value), 1, 5);
}

function normalizeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

export function AditivoDetailsModal({ open, aditivo, onClose, onUpdated }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [iconDataUrl, setIconDataUrl] = useState<string | null>(null);
  const [stock, setStock] = useState<AditivoStock | null>(null);
  const [error, setError] = useState<string | null>(null);

  const percentRestante = useMemo(() => {
    if (!stock) return null;
    const derived = getDerivedStock(stock);
    if (!derived.hasData || derived.capacidadeMl <= 0) return null;
    const pct = (derived.estoqueMl / derived.capacidadeMl) * 100;
    return clamp(pct, 0, 100);
  }, [stock]);

  useEffect(() => {
    if (!open || !aditivo) return;
    setError(null);
    setIconDataUrl(getAditivoIcon(aditivo.id));
    setStock(getAditivoStock(aditivo.id));
  }, [open, aditivo]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !aditivo || typeof document === 'undefined') return null;

  const currentStock = stock ?? getAditivoStock(aditivo.id);

  const handleUploadClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFilePicked = (file: File | null) => {
    if (!file) return;
    const validationError = validateIconFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        setError('Não foi possível ler a imagem.');
        return;
      }
      setAditivoIcon(aditivo.id, result);
      setIconDataUrl(result);
      onUpdated?.();
    };
    reader.onerror = () => setError('Não foi possível ler a imagem.');
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const mlFrasco = normalizeNumber(currentStock.mlFrasco);
    const unidades = normalizeNumber(currentStock.unidades);

    const hasData = mlFrasco > 0 || unidades > 0 || currentStock.tenhoEmEstoque === false;

    // Total is always computed from bottles.
    const computedTotal = mlFrasco > 0 && unidades > 0 ? mlFrasco * unidades : 0;
    const estoqueMl = currentStock.tenhoEmEstoque === false ? 0 : computedTotal;

    const capacidadeInicialMlRaw =
      typeof currentStock.capacidadeInicialMl === 'number' ? currentStock.capacidadeInicialMl : 0;
    const capacidadeInicialMl = capacidadeInicialMlRaw > 0 ? capacidadeInicialMlRaw : computedTotal > 0 ? computedTotal : undefined;

    const payload: AditivoStock = {
      tenhoEmEstoque: hasData && estoqueMl === 0 ? false : !!currentStock.tenhoEmEstoque,
      mlFrasco,
      unidades,
      estoqueMl,
      capacidadeInicialMl,
      importanceStars: normalizeStars(currentStock.importanceStars ?? 3),
    };

    setAditivoStock(aditivo.id, payload);
    onUpdated?.();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-[640px] max-w-[92vw] rounded-xl border border-[#6fbf86]/25 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_16px_40px_rgba(9,15,25,0.62)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do aditivo"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">Detalhes do aditivo</div>
            <div className="text-xs text-[#9fb0c0]">ID: #{String(aditivo.id).padStart(3, '0')}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl transition-colors font-semibold"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <div>
            <div className="relative flex h-[220px] items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-[#172232] to-[#0B1220] shadow-[0_0_18px_rgba(111,191,134,0.12)]">
              {iconDataUrl ? (
                <img
                  src={iconDataUrl}
                  alt={aditivo.nome}
                  className="h-[140px] w-[140px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                />
              ) : (
                <span className="text-7xl drop-shadow-lg">🧪</span>
              )}

              <button
                type="button"
                onClick={handleUploadClick}
                className="absolute right-3 top-3 h-9 w-9 rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-slate-100 hover:border-[#6fbf86]/40 hover:bg-white/10 transition"
                aria-label="Editar ícone"
              >
                ✎
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  handleFilePicked(file);
                  // Allow selecting the same file again.
                  e.currentTarget.value = '';
                }}
              />
            </div>

            {error && <div className="mt-2 text-xs text-red-300">{error}</div>}
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold text-slate-100 leading-snug">{aditivo.nome}</div>
            <div className="mt-0.5 text-[12px] text-slate-300/80">{aditivo.marca}</div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                {classeLabel(String(aditivo.classe))}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                {estagioLabel(String(aditivo.estagio))}
              </span>
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] font-semibold text-slate-300/80 uppercase tracking-[0.08em]">Descrição</div>
              <div className="mt-1 text-sm text-slate-200/90 whitespace-pre-wrap">
                {String(aditivo.descricao ?? '').trim() || '—'}
              </div>

              <div className="mt-3 text-[11px] text-slate-300/80">
                Dose padrão:{' '}
                {typeof aditivo.dosePadraoEmML === 'number' ? (
                  <span className="font-semibold text-slate-100">{aditivo.dosePadraoEmML} ml/L</span>
                ) : (
                  <span className="font-semibold text-slate-100">—</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] font-semibold text-slate-300/80 uppercase tracking-[0.08em]">Importância</div>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const value = idx + 1;
                    const filled = (currentStock.importanceStars ?? 3) >= value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setStock((prev) => ({
                            ...(prev ?? getAditivoStock(aditivo.id)),
                            importanceStars: value,
                          }))
                        }
                        className={`text-lg leading-none transition-colors ${
                          filled ? 'text-[#e7c35a]' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        aria-label={`Definir importância ${value}`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] font-semibold text-slate-300/80 uppercase tracking-[0.08em]">Estoque</div>

                <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-200 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-slate-600/70 bg-[#0f1726] text-[#6fbf86] focus:ring-1 focus:ring-[#6fbf86]/30"
                    checked={!!currentStock.tenhoEmEstoque}
                    onChange={(e) =>
                      setStock((prev) => ({
                        ...(prev ?? getAditivoStock(aditivo.id)),
                        tenhoEmEstoque: e.target.checked,
                      }))
                    }
                  />
                  <span className="leading-none">Tenho em estoque</span>
                </label>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="block">
                    <div className="min-h-[28px] flex items-end text-[10px] text-slate-300/70 uppercase tracking-[0.06em] leading-tight">Frascos</div>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={currentStock.unidades}
                      onChange={(e) =>
                        setStock((prev) => ({
                          ...(prev ?? getAditivoStock(aditivo.id)),
                          unidades: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full rounded border border-slate-600/70 bg-[#0f1726] px-2 py-1 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                    />
                  </label>

                  <label className="block">
                    <div className="min-h-[28px] flex items-end text-[10px] text-slate-300/70 uppercase tracking-[0.06em] leading-tight">mL por frasco</div>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={currentStock.mlFrasco}
                      onChange={(e) =>
                        setStock((prev) => ({
                          ...(prev ?? getAditivoStock(aditivo.id)),
                          mlFrasco: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full rounded border border-slate-600/70 bg-[#0f1726] px-2 py-1 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                    />
                  </label>
                </div>

                <div className="mt-2 text-[11px] text-slate-200/80">
                  Total: <span className="font-semibold text-slate-100">{Math.round((currentStock.unidades || 0) * (currentStock.mlFrasco || 0))} mL</span>
                </div>

                {percentRestante !== null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-300/70 uppercase tracking-[0.06em]">
                      <span>Restante</span>
                      <span>{Math.round(percentRestante)}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#6fbf86]/60"
                        style={{ width: `${percentRestante}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-600/70 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-[#6fbf86] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
