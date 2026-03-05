import { useEffect, useMemo, useState } from 'react';
import type { Aditivo } from '../types';
import { apiService } from '../services/api';
import { AditivoDetailsModal } from './AditivoDetailsModal';
import { getInventoryLogoSrc } from '../assets/inventary-logo/inventoryLogoMap';
import {
  ADITIVO_STOCK_UPDATED_EVENT,
  getAditivoIcon,
  getAditivoStock,
  getDerivedStock,
  isAditivoOutOfStock,
  syncAditivoStocksFromApi,
  resetAllAditivoStocksOnce,
  type AditivoStock,
} from '../utils/aditivoStorage';

type InventarioViewProps = {
  onCountChange?: (count: number) => void;
};

const inventoryAlphaCache = new Map<string, string>();

function InventoryLogoImage({
  src,
  alt,
  className,
  enableAlphaAssist,
}: {
  src: string;
  alt: string;
  className: string;
  enableAlphaAssist: boolean;
}) {
  const [renderSrc, setRenderSrc] = useState(src);

  useEffect(() => {
    if (!enableAlphaAssist) {
      setRenderSrc(src);
      return;
    }

    const cached = inventoryAlphaCache.get(src);
    if (cached) {
      setRenderSrc(cached);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.src = src;

    image.onload = () => {
      if (cancelled) return;
      try {
        const maxDimension = 192;
        const naturalWidth = image.naturalWidth || image.width;
        const naturalHeight = image.naturalHeight || image.height;
        const scale = Math.min(1, maxDimension / naturalWidth, maxDimension / naturalHeight);
        const width = Math.max(1, Math.round(naturalWidth * scale));
        const height = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          inventoryAlphaCache.set(src, src);
          setRenderSrc(src);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        let opaquePixels = 0;
        let nearWhiteOpaquePixels = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];

          if (alpha <= 245) continue;
          opaquePixels += 1;

          const maxChannel = Math.max(red, green, blue);
          const minChannel = Math.min(red, green, blue);
          const isNearNeutral = maxChannel - minChannel < 24;
          const isNearWhite = red > 228 && green > 228 && blue > 228;

          if (isNearNeutral && isNearWhite) nearWhiteOpaquePixels += 1;
        }

        const whiteRatio = opaquePixels > 0 ? nearWhiteOpaquePixels / opaquePixels : 0;

        if (whiteRatio < 0.06) {
          inventoryAlphaCache.set(src, src);
          setRenderSrc(src);
          return;
        }

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];
          if (alpha === 0) continue;

          const maxChannel = Math.max(red, green, blue);
          const minChannel = Math.min(red, green, blue);
          const isNearNeutral = maxChannel - minChannel < 26;
          const brightness = (red + green + blue) / 3;

          if (isNearNeutral && brightness >= 248) {
            pixels[index + 3] = 0;
          } else if (isNearNeutral && brightness >= 230) {
            const fade = (248 - brightness) / 18;
            pixels[index + 3] = Math.max(0, Math.min(alpha, Math.round(alpha * fade)));
          }
        }

        context.putImageData(imageData, 0, 0);
        const processed = canvas.toDataURL('image/png');
        inventoryAlphaCache.set(src, processed);
        setRenderSrc(processed);
      } catch {
        inventoryAlphaCache.set(src, src);
        setRenderSrc(src);
      }
    };

    image.onerror = () => {
      if (cancelled) return;
      inventoryAlphaCache.set(src, src);
      setRenderSrc(src);
    };

    return () => {
      cancelled = true;
    };
  }, [src, enableAlphaAssist]);

  return <img src={renderSrc} alt={alt} className={className} />;
}

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

function formatMl(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const normalized = Math.max(0, value);
  // Keep decimals only when needed.
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
}

export function InventarioView({ onCountChange }: InventarioViewProps) {
  const [aditivos, setAditivos] = useState<Aditivo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAditivoId, setSelectedAditivoId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [mostrarColecionaveis, setMostrarColecionaveis] = useState(false);

  // ✅ força começar SEM estoque (limpa localStorage antigo 1x)
  useEffect(() => {
    resetAllAditivoStocksOnce('v2');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setRefreshKey((x) => x + 1);
    window.addEventListener(ADITIVO_STOCK_UPDATED_EVENT, handler as any);
    return () => window.removeEventListener(ADITIVO_STOCK_UPDATED_EVENT, handler as any);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getAditivos(0, 500);
        const list = (response as any)?.content ?? response;
        const items = Array.isArray(list) ? (list as Aditivo[]) : [];
        // cache local (somente espelho) do estoque vindo do backend
        // OBS: sync não cria estoque novo; só atualiza se já estiver tracked localmente.
        try {
          syncAditivoStocksFromApi(items as any);
        } catch {}
        setAditivos(items);
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setError('Você precisa estar logado para ver o inventário.');
        } else {
          setError('Não foi possível carregar o inventário.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const visible = useMemo(() => {
    let base: Aditivo[];
    if (mostrarColecionaveis) {
      base = aditivos;
    } else {
      // Mostra todos com estoque, independente do status ativo
      base = aditivos.filter((a) => {
        const tipo = String(a.tipo || "").toUpperCase();
        if (tipo === "VASO") return true;

        const stock = getAditivoStock(a.id);
        const derived = getDerivedStock(stock);
        return !derived.isEmpty;
      });
    }

    // Stable sort: in-stock first, out-of-stock last. Collectibles always last.
    return base
      .map((item, index) => ({ item, index }))
      .sort((x, y) => {
        const ax = x.item;
        const ay = y.item;

        const xCollectible = !ax.ativo;
        const yCollectible = !ay.ativo;
        if (xCollectible !== yCollectible) return xCollectible ? 1 : -1;

        const xOut = String((ax as any).tipo || '').toUpperCase() === 'VASO' ? false : isAditivoOutOfStock(ax.id);
        const yOut = String((ay as any).tipo || '').toUpperCase() === 'VASO' ? false : isAditivoOutOfStock(ay.id);
        if (xOut !== yOut) return xOut ? 1 : -1;

        return x.index - y.index;
      })
      .map((x) => x.item);
  }, [aditivos, mostrarColecionaveis, refreshKey]);

  const selectedAditivo = useMemo(() => {
    if (!selectedAditivoId) return null;
    return aditivos.find((a) => a.id === selectedAditivoId) ?? null;
  }, [aditivos, selectedAditivoId]);

  const handleStockSaved = (aditivoId: number, payload: AditivoStock) => {
    setAditivos((prev) =>
      prev.map((item) =>
        item.id === aditivoId
          ? {
              ...item,
              estoque: {
                tracked: payload.tracked,
                tipoProduto: payload.tipoProduto,
                stockMlAtual: payload.stockMlAtual,
                unidades: payload.unidades,
                mlFrasco: payload.mlFrasco,
              },
            }
          : item
      )
    );
    setRefreshKey((x) => x + 1);
  };

  useEffect(() => {
    onCountChange?.(visible.length);
  }, [onCountChange, visible.length]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0B1220]">
      <div className="shrink-0 px-6 pt-4">
        <div className="pokedex-card-frame rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Inventário</h2>
              <p className="text-xs text-[#9fb0c0]">Aditivos disponíveis para uso</p>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-200 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600/70 bg-[#0f1726] text-[#6fbf86] focus:ring-1 focus:ring-[#6fbf86]/30"
                checked={mostrarColecionaveis}
                onChange={(e) => setMostrarColecionaveis(e.target.checked)}
              />
              Mostrar colecionáveis
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
        {isLoading ? (
          <div className="text-sm text-[#9fb0c0]">Carregando aditivos…</div>
        ) : error ? (
          <div className="text-sm text-red-300">{error}</div>
        ) : visible.length === 0 ? (
          <div className="text-sm text-[#9fb0c0]">
            {mostrarColecionaveis
              ? 'Nenhum aditivo cadastrado.'
              : 'Nenhum aditivo ativo disponível no inventário.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((a) => {
              const isCollectible = !a.ativo;
              const tipo = String(a.tipo || "").toUpperCase();
              const isEquipment = tipo === "VASO";
              const customIcon = getAditivoIcon(a.id);
              const mappedLogo = getInventoryLogoSrc(a);
              const cardIconSrc = mappedLogo || customIcon;
              const stock = getAditivoStock(a.id);
              const derived = getDerivedStock(stock);
              const isOutOfStock = isEquipment ? false : derived.isEmpty;
              const isLowStock = isEquipment ? false : derived.isLow;

              const estoqueMl = derived.hasData ? derived.estoqueMl : 0;
              const capacityMl = derived.capacidadeMl;

              const percent =
                derived.hasData && capacityMl > 0
                  ? Math.max(0, Math.min(100, (estoqueMl / capacityMl) * 100))
                  : null;

              const isEmptyStock = isOutOfStock;

              const stockPillClass = isEmptyStock
                ? 'border-white/10 bg-white/5 text-slate-300/80'
                : isLowStock
                ? 'border-[#e7c35a]/30 bg-[#e7c35a]/10 text-[#f2dd9b]'
                : 'border-[#6fbf86]/30 bg-[#6fbf86]/10 text-[#A7E5B2]';

              const stockBarClass = isEmptyStock
                ? 'bg-white/15'
                : isLowStock
                ? 'bg-[#e7c35a]/70'
                : 'bg-[#6fbf86]/60';

              const lowGlowClass = isLowStock && !isEmptyStock
                ? 'opacity-80 shadow-[0_0_10px_rgba(231,195,90,0.16)]'
                : '';
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAditivoId(a.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAditivoId(a.id);
                    }
                  }}
                  aria-label={`Detalhes do aditivo: ${a.nome}`}
                  className={`relative group h-full rounded-xl overflow-hidden transition-all duration-200 text-left border-2 cursor-pointer
                    ${
                      isCollectible
                        ? 'border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[#111A2E]/70 to-[#0B1220]/70'
                        : isOutOfStock
                        ? 'border-[rgba(255,255,255,0.10)] bg-gradient-to-br from-[#111A2E]/70 to-[#0B1220]/70'
                        : 'border-[rgba(255,255,255,0.12)] hover:border-[#6fbf86]/70 hover:shadow-[0_0_10px_rgba(111,191,134,0.18)] bg-gradient-to-br from-[#111A2E]/80 to-[#0B1220]/80'
                    }
                    ${isOutOfStock ? 'opacity-50 grayscale-[0.2] hover:opacity-80' : ''}
                    ${lowGlowClass}
                  `}
                >
                  <div className="p-4 h-full flex flex-col pb-6">
                    <div className="absolute top-3 left-3 bg-black/50 rounded px-2.5 py-1 border border-[#7BD389]/50 backdrop-blur-sm">
                      <span className="text-xs font-semibold text-[#A7E5B2] font-mono">#{a.id.toString().padStart(3, '0')}</span>
                    </div>

                    {isCollectible && (
                      <div className="absolute top-3 right-3 bg-black/55 rounded px-2.5 py-1 border border-white/15 backdrop-blur-sm">
                        <span className="text-[11px] font-semibold text-slate-200 font-mono tracking-wide">COLECIONÁVEL</span>
                      </div>
                    )}

                    <div className="flex items-center justify-center h-32 mb-3 bg-gradient-to-b from-[#172232] to-[#0B1220] rounded-lg border border-[#6fbf86]/15 group-hover:border-[#6fbf86]/30 transition-colors">
                      {cardIconSrc ? (
                        <InventoryLogoImage
                          src={cardIconSrc}
                          alt={a.nome}
                          className="h-20 w-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                          enableAlphaAssist={Boolean(mappedLogo)}
                        />
                      ) : (
                        <span className="text-5xl drop-shadow-lg">🧪</span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-100 mb-0.5 text-base line-clamp-2 group-hover:text-[#A7E5B2] transition-colors">
                      {a.nome}
                    </h3>

                    <p className="text-[11px] text-slate-300/80 mb-3 font-normal group-hover:text-[#A7E5B2]/80 transition-colors">
                      {a.marca}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {isEquipment ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                            Equipamento
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                            {(a.capacidadeLitros ?? 0)}L
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                            {classeLabel(a.classe)}
                          </span>
                          {a.estagio && ['VEGETATIVA', 'FLORACAO', 'FINALIZACAO'].includes(String(a.estagio)) && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                              {estagioLabel(a.estagio)}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex-1 pt-3 border-t border-[rgba(255,255,255,0.12)]">
                      <div className="text-[11px] text-slate-300/80">
                        {isEquipment ? (
                          <span>
                            Capacidade: <span className="font-semibold text-slate-100">{(a.capacidadeLitros ?? 0)} L</span>
                          </span>
                        ) : typeof a.dosePadraoEmML === 'number' ? (
                          <span>
                            Dose padrão: <span className="font-semibold text-slate-100">{a.dosePadraoEmML} ml/L</span>
                          </span>
                        ) : (
                          <span>Dose padrão: <span className="font-semibold text-slate-100">—</span></span>
                        )}
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${stockPillClass}`}
                          >
                            <span aria-hidden="true">{isEquipment ? '🪴' : isEmptyStock ? '⛔' : '🧪'}</span>
                            <span>
                              {isEquipment ? (
                                <>
                                  Item: <span className="font-semibold text-slate-100">VASO</span>
                                </>
                              ) : (
                                <>
                                  Estoque:{' '}
                                  {derived.hasData ? (
                                    <>{formatMl(estoqueMl)} ml</>
                                  ) : (
                                    <span className="opacity-80">—</span>
                                  )}
                                </>
                              )}
                            </span>
                            {!isEquipment && isLowStock && <span className="opacity-80">(baixo)</span>}
                          </span>
                          {isEquipment ? (
                            <span className="text-[10px] text-slate-300/70 font-mono">{(a.capacidadeLitros ?? 0)}L</span>
                          ) : derived.hasData && capacityMl > 0 ? (
                            <span className="text-[10px] text-slate-300/70 font-mono">{formatMl(estoqueMl)}/{formatMl(capacityMl)} ml</span>
                          ) : (
                            <span className="text-[10px] text-slate-300/60">&nbsp;</span>
                          )}
                        </div>

                        {percent !== null && (
                          <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${stockBarClass}`} style={{ width: `${percent}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 0%, rgba(123, 211, 137, 0.05) 0%, transparent 70%)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AditivoDetailsModal
        open={!!selectedAditivoId}
        aditivo={selectedAditivo}
        onClose={() => setSelectedAditivoId(null)}
        onUpdated={() => setRefreshKey((x) => x + 1)}
        onStockSaved={handleStockSaved}
      />
    </div>
  );
}