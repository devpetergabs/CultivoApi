import { useEffect, useMemo, useRef, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
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
  onStockSaved?: (aditivoId: number, payload: AditivoStock) => void;
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

function formatDoseRecomendada(min: number | null | undefined, max: number | null | undefined): string {
  const hasMin = typeof min === 'number' && Number.isFinite(min);
  const hasMax = typeof max === 'number' && Number.isFinite(max);

  if (hasMin && hasMax) return `${min}–${max} ml/L`;
  if (hasMin) return `${min} ml/L`;
  if (hasMax) return `${max} ml/L`;
  return '—';
}

function pestLabel(code: string): string {
  switch (code) {
    case 'TRIPES':
      return 'Tripes';
    case 'LAGARTAS':
      return 'Lagartas';
    case 'PULGOES':
      return 'Pulgões';
    default:
      return code;
  }
}

export function AditivoDetailsModal({ open, aditivo, onClose, onUpdated, onStockSaved }: Props) {
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

    if (local?.tracked) {
      setStock(local);
      return;
    }

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

  if (!aditivo) return null;

  const currentStock = stock ?? getAditivoStock(aditivo.id);

  const tipo = String(aditivo.tipo || '').toUpperCase();
  const isEquipment = tipo === 'VASO';
  const isInsecticide = tipo === 'INSETICIDA';
  const doseRecomendada = formatDoseRecomendada(aditivo.doseMinEmML, aditivo.doseMaxEmML);

  const pragasEfetivas = (() => {
    if (!isInsecticide) return [] as string[];
    const raw = String(aditivo.pragasEfetivas ?? '');
    if (!raw.trim()) return [] as string[];

    const unique = new Set<string>();
    raw.split(',').forEach((item) => {
      const normalized = item.trim().toUpperCase();
      if (!normalized) return;
      unique.add(normalized);
    });

    return Array.from(unique).map(pestLabel);
  })();

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
      onStockSaved?.(aditivo.id, payload);

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

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Detalhes do produto"
      subtitle={`ID: #${String(aditivo.id).padStart(3, '0')}`}
      widthClass="w-[640px] max-w-[92vw]"
    >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <div>
            <div className="relative flex h-[220px] items-center justify-center rounded-xl border border-white/10 bg-[#101726]">
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

            {isEquipment ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                {currentStock.tracked ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">Quantidade</div>
                      <div className="text-[11px] font-mono font-semibold text-white">{currentStock.unidades} un.</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">Tamanho</div>
                      <div className="text-[11px] font-mono font-semibold text-white">{currentStock.mlFrasco || 5} L</div>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-[#9fb0c0]">
                    Quantidade não configurada ainda.
                  </div>
                )}
              </div>
            ) : derived?.hasData ? (
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
            <div className="rounded-xl border border-white/10 bg-[#101726] p-4">
              <div className="flex flex-col gap-1">
                <div className="text-base font-semibold text-white leading-tight">{aditivo.nome}</div>
                <div className="text-xs text-[#9fb0c0]">{aditivo.marca}</div>
              </div>

{(() => {
                  const hasEstagio = aditivo.estagio && ['VEGETATIVA', 'FLORACAO', 'FINALIZACAO'].includes(String(aditivo.estagio));
                  return !isEquipment ? (
                    <div className={`mt-3 grid gap-2 ${hasEstagio ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Classe</div>
                        <div className="text-xs font-semibold text-white">{classeLabel(String(aditivo.classe ?? ''))}</div>
                      </div>
                      {hasEstagio && (
                        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                          <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Estágio</div>
                          <div className="text-xs font-semibold text-white">{estagioLabel(String(aditivo.estagio ?? ''))}</div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

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

              {!isEquipment && (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Dose recomendada</div>
                  <div className="text-xs font-semibold text-white">{doseRecomendada}</div>
                </div>
              )}

              {!isEquipment && isInsecticide && (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-[10px] text-white/60 uppercase tracking-[0.08em]">Pragas efetivas</div>
                  {pragasEfetivas.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pragasEfetivas.map((praga) => (
                        <span
                          key={praga}
                          className="inline-flex items-center rounded-full border border-[#f39a5c]/25 bg-[#f39a5c]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ffd9bf]"
                        >
                          {praga}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs font-semibold text-white">—</div>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">Configurar estoque</div>

                {isEquipment ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Quantidade</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={currentStock.unidades}
                        onChange={(e) => setStock({ ...currentStock, unidades: Number(e.target.value), tracked: true })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Stock atual (mL)</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={currentStock.stockMlAtual}
                        onChange={(e) => setStock({ ...currentStock, stockMlAtual: Number(e.target.value), tracked: true })}
                        className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Unidades</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={currentStock.unidades}
                          onChange={(e) => setStock({ ...currentStock, unidades: Number(e.target.value), tracked: true })}
                          className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">mL por frasco</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={currentStock.mlFrasco}
                          onChange={(e) => setStock({ ...currentStock, mlFrasco: Number(e.target.value), tracked: true })}
                          className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!isEquipment && (
                  <div className="mt-2 text-[11px] text-[#9fb0c0]">
                    * Unidades e mL/frasco são apenas metadados (barra/UX). O sistema **não** reabastece sozinho.
                  </div>
                )}

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
                    className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-[#080B14] hover:bg-emerald-300 transition disabled:opacity-60"
                  >
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </PokedexModal>
  );
}
