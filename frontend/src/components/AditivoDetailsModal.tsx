import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Aditivo } from '../types';
import { apiService } from '../services/api';
import {
  getAditivoIcon,
  getAditivoStock,
  setAditivoIcon,
  setAditivoStock,
  syncAditivoStocksFromApi,
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
  const [saving, setSaving] = useState(false);

  const derived = useMemo(() => {
    if (!stock) return null;
    return getDerivedStock(stock);
  }, [stock]);

  const percentRestante = useMemo(() => {
    if (!derived) return null;
    if (!derived.hasData || derived.capacidadeMl <= 0) return null;
    const pct = (derived.estoqueMl / derived.capacidadeMl) * 100;
    return clamp(pct, 0, 100);
  }, [derived]);

  useEffect(() => {
    if (!open || !aditivo) return;
    setError(null);

    // ícone segue localStorage
    setIconDataUrl(getAditivoIcon(aditivo.id));

    // estoque: regra de precedência
    // 1) Se o cache local já está tracked=true, ele é a verdade imediata da UI.
    // 2) Só sobrescrevemos o cache local quando a API retorna tracked=true.
    //    (Isso evita "zerar" estoque ao abrir modal com lista antiga onde tracked=false.)
    const local = getAditivoStock(aditivo.id);
    const apiStock = aditivo.estoque;

    if (apiStock && Boolean(apiStock.tracked)) {
      const payload: AditivoStock = {
        tracked: true,
        tipoProduto: apiStock.tipoProduto ?? (typeof aditivo.tipo === 'string' ? aditivo.tipo : null),
        stockMlAtual: normalizeNumber(apiStock.stockMlAtual),
        unidades: normalizeNumber(apiStock.unidades),
        mlFrasco: normalizeNumber(apiStock.mlFrasco),
      };
      setAditivoStock(aditivo.id, payload);
      setStock(payload);
      return;
    }

    if (local?.tracked) {
      setStock(local);
      return;
    }

    // API sem rastreio (ou sem campo) → modal abre "sem estoque" sem apagar nada.
    if (apiStock) {
      setStock({
        tracked: false,
        tipoProduto: apiStock.tipoProduto ?? (typeof aditivo.tipo === 'string' ? aditivo.tipo : null),
        stockMlAtual: normalizeNumber(apiStock.stockMlAtual),
        unidades: normalizeNumber(apiStock.unidades),
        mlFrasco: normalizeNumber(apiStock.mlFrasco),
      });
    } else {
      setStock(local);
    }
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

  const tipo = String(aditivo.tipo || '').toUpperCase();
  const isEquipment = tipo === 'VASO';

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

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const stockMlAtual = normalizeNumber(currentStock.stockMlAtual);
    const unidades = Math.round(normalizeNumber(currentStock.unidades));
    const mlFrasco = Math.round(normalizeNumber(currentStock.mlFrasco));

    try {
      const updated = await apiService.updateProdutoEstoque(aditivo.id, {
        stockMlAtual,
        unidades,
        mlFrasco,
      });

      const payload: AditivoStock = {
        tracked: true,
        tipoProduto: updated?.tipoProduto ?? (typeof aditivo.tipo === 'string' ? aditivo.tipo : null),
        stockMlAtual: normalizeNumber(updated?.stockMlAtual ?? stockMlAtual),
        unidades: Math.round(normalizeNumber(updated?.unidades ?? unidades)),
        mlFrasco: Math.round(normalizeNumber(updated?.mlFrasco ?? mlFrasco)),
      };

      setAditivoStock(aditivo.id, payload);
      setStock(payload);
      syncAditivoStocksFromApi([{ id: aditivo.id, tipo: aditivo.tipo ?? null, estoque: payload } as any]);

      onUpdated?.();
      onClose();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setError('Você precisa estar logado para editar o estoque.');
      } else {
        setError('Não foi possível salvar o estoque.');
      }
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative w-[640px] max-w-[92vw] rounded-xl border border-[#6fbf86]/25 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_16px_40px_rgba(9,15,25,0.62)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do aditivo"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">Detalhes do produto</div>
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
                  if (e.target) e.target.value = '';
                }}
              />
            </div>

            {derived?.hasData ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">Estoque (mL)</div>
                  <div className="text-[11px] font-mono font-semibold text-white">
                    {Math.round(derived.estoqueMl)}
                    {derived.capacidadeMl > 0 ? ` / ${Math.round(derived.capacidadeMl)}` : ''}
                  </div>
                </div>

                {percentRestante !== null && (
                  <div className="mt-2 h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                      style={{ width: `${percentRestante}%` }}
                    />
                  </div>
                )}

                {derived.isEmpty && (
                  <div className="mt-2 text-[11px] text-red-300 font-semibold">Frasco vazio.</div>
                )}
                {!derived.isEmpty && derived.isLow && (
                  <div className="mt-2 text-[11px] text-amber-200 font-semibold">Baixo estoque.</div>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-[#9fb0c0]">
                  Estoque não rastreado ainda. Configure para o jogo controlar consumo.
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="rounded-xl border border-white/10 bg-gradient-to-b from-[#0f1726] to-[#0B1220] p-4">
              <div className="flex flex-col gap-1">
                <div className="text-base font-semibold text-white leading-tight">{aditivo.nome}</div>
                <div className="text-xs text-[#9fb0c0]">{aditivo.marca}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Classe</div>
                  <div className="text-xs font-semibold text-white">{classeLabel(String(aditivo.classe ?? ''))}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Estágio</div>
                  <div className="text-xs font-semibold text-white">{estagioLabel(String(aditivo.estagio ?? ''))}</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-200/90 leading-relaxed whitespace-pre-wrap">
                {aditivo.descricao || '—'}
              </div>

              {!isEquipment && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Dose padrão</div>
                    <div className="text-xs font-semibold text-white">
                      {typeof aditivo.dosePadraoEmML === 'number' ? `${aditivo.dosePadraoEmML} ml/L` : '—'}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Tipo</div>
                    <div className="text-xs font-semibold text-white">{String(aditivo.tipo ?? '—')}</div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Ativo</div>
                    <div className="text-xs font-semibold text-white">{aditivo.ativo ? 'Sim' : 'Não'}</div>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">Configurar estoque</div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-white/60 uppercase tracking-[0.08em]">Stock atual (mL)</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={currentStock.stockMlAtual}
                      onChange={(e) => setStock({ ...currentStock, stockMlAtual: Number(e.target.value), tracked: true })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/60 uppercase tracking-[0.08em]">Unidades</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={currentStock.unidades}
                      onChange={(e) => setStock({ ...currentStock, unidades: Number(e.target.value), tracked: true })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/60 uppercase tracking-[0.08em]">mL por frasco</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={currentStock.mlFrasco}
                      onChange={(e) => setStock({ ...currentStock, mlFrasco: Number(e.target.value), tracked: true })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                    />
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-[#9fb0c0]">
                  * Unidades e mL/frasco são apenas metadados (barra/UX). O sistema **não** reabastece sozinho.
                </div>

                {error && <div className="mt-2 text-[11px] text-red-300 font-semibold">{error}</div>}

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg border border-[#6fbf86]/30 bg-gradient-to-r from-[#6fbf86] to-[#3f6f57] px-3 py-2 text-xs font-semibold text-[#0B1220] shadow-[0_0_12px_rgba(111,191,134,0.18)] hover:shadow-[0_0_14px_rgba(111,191,134,0.26)] disabled:opacity-60"
                  >
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
