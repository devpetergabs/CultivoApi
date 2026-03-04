import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Plant } from '../types/pokedex';
import type { PlantType } from '../types/pokedex';
import { TypeBadge } from './TypeBadge';
import { PlantQuickActions } from './PlantQuickActions';
import { GrowthModal } from './GrowthModal';
import { apiService } from '../services/api';
import baldeAgua from '../assets/balde-agua.png';
import baldeMistico from '../assets/balde-mistico.png';
import {
  loadLegacyWateringMix,
  loadWateringMix,
  type LegacyWateringMixItem,
  type StoredWateringMixItem,
} from '../utils/wateringMixStorage';
import {
  ADITIVO_STOCK_UPDATED_EVENT,
  deductAditivoStockMl,
  getAditivoStock,
  getDerivedStock,
} from '../utils/aditivoStorage';

interface PlantCardPreviewProps {
  plant: Plant;
  isSelected: boolean;
  onClick: () => void;
}

const calculateAge = (date: string | null) => {
  if (!date) return null;

  const parts = date.split('/');
  if (parts.length !== 3) return null;

  const germinationDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(germinationDate.getTime())) return null;

  const today = new Date();
  const diffMs = today.getTime() - germinationDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
};

const STAGE_ORDER: PlantType[] = [
  'GERMINACAO',
  'VEGETATIVO',
  'FLORACAO_INICIAL',
  'FLORACAO_MEDIA',
  'FLORACAO_AVANCADA',
  'FINALIZACAO',
];

function getNextStage(stage: PlantType): PlantType | null {
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0) return null;
  return STAGE_ORDER[index + 1] ?? null;
}

export function PlantCardPreview({ plant, isSelected, onClick }: PlantCardPreviewProps) {
  const [growthModalOpen, setGrowthModalOpen] = useState(false);
  const [bucketFx, setBucketFx] = useState<{ variant: 'A' | 'B'; key: number } | null>(null);

  const age = calculateAge(plant.germinationDate);
  const isEpic = plant.heightCm > 180;
  const nextStage = getNextStage(plant.type);

  // ✅ STRAIN / GENÉTICA (apenas 1x — como no print)
  const strainLabel = ((plant as any).strain ?? plant.variant ?? 'Strain') as string;

  // ✅ Glow só quando estiver em FLORAÇÃO (não veg/germa)
  const isFloweringStage = String(plant.type).startsWith('FLORACAO');

  // ☣ Estado de praga ativo (flag simples do backend)
  const pestActive = Boolean((plant as any).pestActive);

  const [nextWaterType, setNextWaterType] = useState<'A' | 'B'>('A');
  const [stockVersion, setStockVersion] = useState(0);

  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'error' | 'warning';
  } | null>(null);

  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setStockVersion((v) => v + 1);
    window.addEventListener(ADITIVO_STOCK_UPDATED_EVENT, handler as EventListener);
    return () => window.removeEventListener(ADITIVO_STOCK_UPDATED_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = `plant-${plant.id}-next-watering`;
      const saved = localStorage.getItem(key);
      setNextWaterType(saved === 'B' ? 'B' : 'A');
    } catch {
      setNextWaterType('A');
    }
  }, [plant.id]);

  const persistNextWaterType = (value: 'A' | 'B') => {
    if (typeof window === 'undefined') return;
    try {
      const key = `plant-${plant.id}-next-watering`;
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  };

  const showToast = (message: string, tone: 'success' | 'error' | 'warning') => {
    setToast({ message, tone });
    if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 1600);
  };

  const getStoredVolumeMl = () => {
    if (typeof window === 'undefined') return 1000;
    try {
      const key = `plant:${plant.id}:watering-volume-ml`;
      const stored = localStorage.getItem(key);
      const parsed = stored ? Number(stored) : NaN;
      if (!Number.isFinite(parsed) || parsed <= 0) return 1000;
      return Math.round(parsed);
    } catch {
      return 1000;
    }
  };

  const getStoredMix = ():
    | { kind: 'v2'; items: StoredWateringMixItem[] }
    | { kind: 'legacy'; items: LegacyWateringMixItem[] }
    | { kind: 'empty' } => {
    const v2 = loadWateringMix(plant.id).filter((x) => x.doseMl > 0);
    if (v2.length > 0) return { kind: 'v2', items: v2 };

    const legacy = loadLegacyWateringMix(plant.id).filter((x) => x.doseMl > 0);
    if (legacy.length > 0) return { kind: 'legacy', items: legacy };

    return { kind: 'empty' };
  };

  const isActivationKey = (key: string) => key === 'Enter' || key === ' ';

  // ✅ Guard: evita registrar rega duas vezes por clique acidental (double-click)
  const WATERING_GUARD_WINDOW_MS = 2000;
  const lastWateringAtRef = useRef<{ A: number; B: number }>({ A: 0, B: 0 });

  const [wateringConfirmOpen, setWateringConfirmOpen] = useState(false);
  const [wateringConfirmInfo, setWateringConfirmInfo] = useState<{
    variant: 'A' | 'B';
    ml: number;
    title: string;
    subtitle?: string;
  } | null>(null);

  const pendingWateringActionRef = useRef<null | (() => Promise<void>)>(null);

  const closeWateringConfirm = () => {
    setWateringConfirmOpen(false);
    setWateringConfirmInfo(null);
    pendingWateringActionRef.current = null;
  };

  const confirmWateringProceed = async () => {
    const action = pendingWateringActionRef.current;
    closeWateringConfirm();
    await action?.();
  };

  useEffect(() => {
    if (!wateringConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWateringConfirm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [wateringConfirmOpen]);

  const openWateringConfirm = (
    variant: 'A' | 'B',
    ml: number,
    action: () => Promise<void>,
    subtitle?: string
  ) => {
    pendingWateringActionRef.current = action;

    setWateringConfirmInfo({
      variant,
      ml,
      title: variant === 'A' ? 'Rega normal repetida' : 'Rega aditivada repetida',
      subtitle,
    });

    setWateringConfirmOpen(true);
  };

  const canProceedWatering = (
    variant: 'A' | 'B',
    ml: number,
    actionIfConfirmed: () => Promise<void>,
    subtitle?: string
  ) => {
    const now = Date.now();
    const last = lastWateringAtRef.current[variant];

    // 1º clique (ou fora da janela) → segue normalmente
    if (now - last > WATERING_GUARD_WINDOW_MS) {
      lastWateringAtRef.current[variant] = now;
      return true;
    }

    // clique repetido rápido → pede confirmação em modal (estilo RPG)
    lastWateringAtRef.current[variant] = now;
    openWateringConfirm(variant, ml, actionIfConfirmed, subtitle);
    return false;
  };

  const registerWateringEvent = async (variant: 'A' | 'B') => {
    const ml = getStoredVolumeMl();

    // Aura arcana (feedback imediato)
    try {
      const k = Date.now();
      setBucketFx({ variant, key: k });
      window.setTimeout(() => setBucketFx((cur) => (cur?.key === k ? null : cur)), 720);
    } catch {}

    const doWaterNormal = async () => {
      try {
        await apiService.createPlantaEvento(plant.id, {
          tipo: 'REGA_NORMAL',
          descricao: `Rega (água pura): ${ml}mL`,
          doseEmML: ml,
        });

        showToast('Rega registrada', 'success');
        setNextWaterType('B');
        persistNextWaterType('B');
      } catch (err) {
        console.error('[ERRO REGISTRO REGA]', err);
        const status = (err as any)?.response?.status;
        if (status === 403 || status === 404) return; // toast global (não-proprietário)
        showToast('Falha ao registrar rega', 'error');
      }
    };

    if (variant === 'B') {
      const mix = getStoredMix();
      if (mix.kind === 'empty') {
        showToast('Nenhum aditivo selecionado no inventário', 'warning');
        return;
      }

      const mixDescription =
        mix.kind === 'v2'
          ? mix.items
              .map((item) => {
                const volumeLiters = ml / 1000;
                const totalMl = Math.round(item.doseMl * volumeLiters);
                return `${item.nome} ${totalMl}ml`;
              })
              .join(', ')
          : mix.items
              .map((item) => {
                const volumeLiters = ml / 1000;
                const totalMl = Math.round(item.doseMl * volumeLiters);
                return `Aditivo ${item.id} ${totalMl}ml`;
              })
              .join(', ');

      const doWaterAditivada = async () => {
        try {
          const itemsToConsume = mix.items as Array<{ id: number; doseMl: number }>;
          const consumos = itemsToConsume
            .map((item) => {
              const volumeLiters = ml / 1000;
              const totalMl = Math.round(item.doseMl * volumeLiters);
              return { produtoId: item.id, consumoEmML: totalMl };
            })
            .filter((c) => Number.isFinite(c.consumoEmML) && c.consumoEmML > 0);

          await apiService.createPlantaEvento(plant.id, {
            tipo: 'REGA_ADITIVADA',
            descricao: `Rega (água aditivada): ${ml}mL + ${mixDescription}`,
            doseEmML: ml,
            consumos,
          });

          // Deduz cache local (somente espelho) após sucesso da API
          for (const item of itemsToConsume) {
            if (Number.isFinite(item.doseMl) && item.doseMl > 0) {
              const volumeLiters = ml / 1000;
              const totalMl = Math.round(item.doseMl * volumeLiters);
              deductAditivoStockMl(item.id, totalMl);
            }
          }

          // Força outras telas/modais a recarregarem estoque do backend.
          try {
            window.dispatchEvent(new Event('PRODUTO_ESTOQUE_UPDATED'));
          } catch {}

          showToast('Rega aditivada registrada', 'success');
          setNextWaterType('A');
          persistNextWaterType('A');
        } catch (err) {
          console.error('[ERRO REGISTRO REGA]', err);
          const status = (err as any)?.response?.status;
          if (status === 403 || status === 404) return; // toast global (não-proprietário)
          showToast('Falha ao registrar rega', 'error');
        }
      };

      const proceed = canProceedWatering(
        'B',
        ml,
        doWaterAditivada,
        `Volume: ${ml}mL\nAditivos: ${mixDescription}`
      );
      if (!proceed) return;

      await doWaterAditivada();
      return;
    }

    const proceed = canProceedWatering('A', ml, doWaterNormal, `Volume: ${ml}mL`);
    if (!proceed) return;

    await doWaterNormal();
  };

  const mixStockFlags = (() => {
    void stockVersion;
    if (typeof window === 'undefined') return { hasLow: false, hasEmpty: false };

    const v2 = loadWateringMix(plant.id).filter((x) => x.doseMl > 0);
    const legacy = loadLegacyWateringMix(plant.id).filter((x) => x.doseMl > 0);
    const ids = (v2.length > 0 ? v2 : legacy).map((x) => x.id);

    let hasLow = false;
    let hasEmpty = false;

    for (const id of ids) {
      const derived = getDerivedStock(getAditivoStock(id));
      if (derived.isEmpty) {
        hasEmpty = true;
        break;
      }
      if (derived.isLow) hasLow = true;
    }

    return { hasLow, hasEmpty };
  })();

  const handleCardClick = () => {
    if (growthModalOpen) return;
    onClick();
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isActivationKey(event.key)) return;
    event.preventDefault();
    if (growthModalOpen) return;
    onClick();
  };

  return (
    <>
      <motion.div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        whileHover={growthModalOpen ? {} : { y: -8 }}
        whileTap={growthModalOpen ? {} : { scale: 0.98 }}
        className={`relative group h-full rounded-xl overflow-hidden transition-all duration-200 text-left border-2 outline-none
          ${
            isEpic
              ? 'border-[#e7c35a] shadow-epic-halo ring-1 ring-[#e7c35a]/25 bg-gradient-to-br from-[#1b180f] to-[#0B1220]'
              : pestActive
              ? 'border-lime-300/70 shadow-[0_0_18px_rgba(163,230,53,0.18)] ring-1 ring-lime-300/20 bg-gradient-to-br from-[#0f1f18] to-[#0B1220]'
              : isSelected
              ? 'border-[#6fbf86] shadow-[0_0_14px_rgba(111,191,134,0.22)] ring-1 ring-[#6fbf86]/28 bg-gradient-to-br from-[#111A2E] to-[#0B1220]'
              : 'border-[rgba(255,255,255,0.12)] hover:border-[#6fbf86]/70 hover:shadow-[0_0_14px_rgba(111,191,134,0.18)] bg-gradient-to-br from-[#111A2E]/80 to-[#0B1220]/80'
          }
          ${pestActive && isSelected ? 'outline outline-1 outline-emerald-300/20' : ''}
          ${growthModalOpen ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        {/* ☣ overlay radioativo (sutil) */}
        {pestActive && !isEpic && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-lime-400/10 via-emerald-400/5 to-transparent" />
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-lime-400/10 blur-2xl opacity-60 animate-[pulse_3.6s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-400/8 blur-2xl opacity-60 animate-[pulse_4.2s_ease-in-out_infinite]" />
          </>
        )}

        <div className="p-4 h-full flex flex-col pb-6">
          {/* ID */}
          <div className="absolute top-3 left-3 z-40 bg-black/50 rounded px-2.5 py-1 border border-[#7BD389]/50 backdrop-blur-sm">
            <span className="text-xs font-semibold text-[#A7E5B2] font-mono">
              #{plant.id.toString().padStart(3, '0')}
            </span>
          </div>

          {/* Age */}
          {age !== null && (
            <div className="absolute top-3 right-3 z-40 bg-gradient-to-r from-[#5aa6ff] to-[#3b7bdd] rounded px-2.5 py-1 border border-[#9fc5ff] backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-[#e6f1ff] font-mono tracking-wide">
                ⏰ {age}d
              </span>
            </div>
          )}

          {/* ☣ Badge de praga (estado ativo) */}
          {pestActive && !isEpic && (
            <div
              className={`absolute ${age !== null ? 'top-10' : 'top-3'} right-3 z-40 rounded px-2.5 py-1 border border-lime-300/40 bg-black/55 backdrop-blur-sm`}
              title="Sinal de praga ativo"
            >
              <span className="text-[11px] font-semibold text-lime-200 font-mono tracking-wide">☣ PRAGA</span>
            </div>
          )}

          {/* HERO */}
          <div className="relative flex items-center justify-center h-32 mb-4 rounded-lg border border-white/10 bg-gradient-to-b from-[#172232] to-[#0B1220] overflow-hidden group-hover:border-[#6fbf86]/25 transition-colors">
            {/* specular highlight */}
            <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-white/10 blur-2xl opacity-25 group-hover:opacity-35 transition-opacity" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-25" />

            {/* ✅ STRAIN 1x (como no print): pill no HERO */}
            <div className="absolute bottom-2 left-2 z-30 max-w-[78%]">
              {/* brilho “dos deuses” só na floração */}
              {isFloweringStage && !isEpic && (
                <span className="pointer-events-none absolute -inset-[3px] rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/15 to-rose-500/25 blur-[1px] opacity-80 animate-[pulse_4.5s_ease-in-out_infinite]" />
              )}

              <span
                className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border backdrop-blur-md bg-black/25
                  ${
                    isEpic
                      ? 'border-[#e7c35a]/40 text-[#f7e7b3] shadow-[0_0_12px_rgba(231,195,90,0.18)]'
                      : isFloweringStage
                      ? 'border-fuchsia-400/30 text-fuchsia-100 shadow-[0_0_12px_rgba(217,70,239,0.14)]'
                      : 'border-emerald-400/30 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.12)]'
                  }`}
                title={`Strain: ${strainLabel}`}
              >
                {/* borda dupla (selo) */}
                <span className="absolute inset-0 rounded-full ring-1 ring-white/10" />
                <span className="text-[12px] leading-none">🧬</span>
                <span className="text-[11px] font-semibold tracking-wide truncate">{strainLabel}</span>
              </span>
            </div>

            {/* “quadrado tipo card” + animação */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute inset-0 -m-4 rounded-xl bg-emerald-400/5 blur-xl opacity-50" />
              <span className="relative text-5xl drop-shadow-lg opacity-90">{plant.imageUrl}</span>
            </motion.div>
          </div>

          {/* Header */}
          <div className="mb-3">
            <h3 className="font-semibold text-slate-100 text-base tracking-wide line-clamp-2 group-hover:text-[#A7E5B2] transition-colors">
              {plant.name}
            </h3>
            {/* ✅ sem repetir strain aqui — fica só no HERO */}
          </div>

          {/* Type + Actions */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <TypeBadge
                type={plant.type}
                size="md"
                action={
                  nextStage ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Evoluir estágio"
                      title="Evoluir"
                      className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/15 bg-white/5 text-white/70 hover:text-white hover:border-white/30 transition-colors leading-none"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        window.dispatchEvent(
                          new CustomEvent('pokedex:level-up', {
                            detail: {
                              plantId: plant.id,
                              plantName: plant.name,
                              currentStage: plant.type,
                              nextStage,
                            },
                          })
                        );
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        event.stopPropagation();
                        window.dispatchEvent(
                          new CustomEvent('pokedex:level-up', {
                            detail: {
                              plantId: plant.id,
                              plantName: plant.name,
                              currentStage: plant.type,
                              nextStage,
                            },
                          })
                        );
                      }}
                    >
                      ↑
                    </span>
                  ) : null
                }
              />
            </div>

            <div className="relative flex flex-col items-center gap-2 ml-2 pl-3">
              <div className="absolute left-0 top-1 bottom-1 bg-gradient-to-b from-transparent via-white/10 to-transparent w-[1px]" />

              <span className="text-[10px] tracking-wide uppercase text-emerald-200 bg-white/5 border border-white/10 rounded-md px-2 py-0.5">
                PRÓXIMA: {nextWaterType === 'A' ? 'ÁGUA' : 'ADITIVADA'}
              </span>

              <div className="flex items-center gap-2">
                {/* BALDE A */}
                <button
                  type="button"
                  aria-label="Regar A: água pura"
                  title="Regar A (água pura)"
                  className={`relative overflow-hidden w-12 h-12 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${
                    nextWaterType === 'A'
                      ? 'ring-2 ring-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,.28)] animate-[pulse_3s_ease-in-out_infinite]'
                      : 'opacity-50 grayscale-[0.2] hover:opacity-80'
                  }`}
                  onClick={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    await registerWateringEvent('A');
                  }}
                >
                  {bucketFx?.variant === 'A' && (
                    <motion.span
                      key={`fxA:${bucketFx.key}`}
                      className="pointer-events-none absolute inset-0 rounded-full"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: [0, 0.85, 0], scale: [0.6, 1.25, 1.55] }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{
                        background:
                          'radial-gradient(circle at 35% 30%, rgba(16,185,129,0.55) 0%, rgba(16,185,129,0.18) 35%, rgba(0,0,0,0) 70%)',
                      }}
                    />
                  )}
                  <img src={baldeAgua} alt="" className="h-10 w-10 object-contain" />
                </button>

                {/* BALDE B */}
                <button
                  type="button"
                  aria-label="Regar B: água aditivada"
                  title="Regar B (água aditivada)"
                  className={`relative overflow-hidden w-12 h-12 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40 ${
                    nextWaterType === 'B'
                      ? mixStockFlags.hasEmpty
                        ? 'ring-2 ring-red-400 bg-red-500/10 shadow-[0_0_12px_rgba(248,113,113,.24)] animate-[pulse_3s_ease-in-out_infinite] opacity-60 cursor-not-allowed'
                        : mixStockFlags.hasLow
                        ? 'ring-2 ring-amber-300 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,.20)] animate-[pulse_3s_ease-in-out_infinite]'
                        : 'ring-2 ring-purple-400 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,.30)] animate-[pulse_3s_ease-in-out_infinite]'
                      : 'opacity-50 grayscale-[0.2] hover:opacity-80'
                  }`}
                  onClick={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (mixStockFlags.hasEmpty) return;
                    await registerWateringEvent('B');
                  }}
                  disabled={mixStockFlags.hasEmpty}
                >
                  {bucketFx?.variant === 'B' && (
                    <motion.span
                      key={`fxB:${bucketFx.key}`}
                      className="pointer-events-none absolute inset-0 rounded-full"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.28, 1.6] }}
                      transition={{ duration: 0.75, ease: 'easeOut' }}
                      style={{
                        background:
                          'radial-gradient(circle at 40% 35%, rgba(168,85,247,0.55) 0%, rgba(236,72,153,0.18) 40%, rgba(0,0,0,0) 72%)',
                      }}
                    />
                  )}
                  <img src={baldeMistico} alt="" className="h-10 w-10 object-contain" />
                </button>

                {/* CRESCER */}
                <button
                  type="button"
                  className="ml-1 px-3 py-2 rounded bg-[#232d3a] text-[#e7c35a] text-xs font-bold border border-[#e7c35a]/30 hover:bg-[#e7c35a] hover:text-[#232d3a] transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGrowthModalOpen(true);
                  }}
                >
                  Crescer
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-2 pt-3 border-t border-white/10">
            {/* ALTURA */}
            <div className="flex items-center text-[11px]">
              <span className="w-10 text-slate-400 font-medium tracking-[0.08em]">ALT</span>
              <div className="flex-1 mx-2 max-w-[225px] h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    plant.heightCm > 180
                      ? 'bg-gradient-to-r from-[#e7c35a] via-[#f2dd9b] to-[#d9a441] shadow-[0_0_7px_rgba(231,195,90,0.25)]'
                      : 'bg-gradient-to-r from-[#6fbf86] to-[#3f6f57] shadow-[0_0_6px_rgba(111,191,134,0.18)]'
                  }`}
                  style={{ width: `${Math.min((plant.heightCm / 180) * 100, 100) * 0.75}%` }}
                />
              </div>
              <div
                className={`w-16 text-right font-semibold ${
                  plant.heightCm > 180 ? 'text-[#e7c35a]' : 'text-emerald-200'
                }`}
              >
                {plant.heightCm}cm
              </div>
            </div>

            {/* LARGURA */}
            <div className="flex items-center text-[11px]">
              <span className="w-10 text-slate-400 font-medium tracking-[0.08em]">LAR</span>
              <div className="flex-1 mx-2 max-w-[225px] h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#6fbf86] to-[#3f6f57] shadow-[0_0_6px_rgba(111,191,134,0.18)] transition-all duration-300"
                  style={{ width: `${Math.min((plant.widthCm / 120) * 100, 100) * 0.75}%` }}
                />
              </div>
              <div className="w-16 text-right text-emerald-200 font-semibold">{plant.widthCm}cm</div>
            </div>

            {/* CAULE */}
            <div className="flex items-center text-[11px]">
              <span className="w-10 text-slate-400 font-medium tracking-[0.08em]">CAULE</span>
              <div className="flex-1 mx-2 max-w-[225px] h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#6fbf86] to-[#3f6f57] shadow-[0_0_6px_rgba(111,191,134,0.18)] transition-all duration-300"
                  style={{ width: `${Math.min(((plant.stemWidthCm ?? 0) / 20) * 100, 100) * 0.75}%` }}
                />
              </div>
              <div className="w-16 text-right text-emerald-200 font-semibold">
                {plant.stemWidthCm ? `${plant.stemWidthCm}cm` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: isEpic
              ? 'radial-gradient(circle at 50% 0%, rgba(231, 195, 90, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle at 50% 0%, rgba(123, 211, 137, 0.06) 0%, transparent 70%)',
          }}
        />

        {isEpic && (
          <div
            className="absolute inset-0 opacity-30 animate-pulse transition-opacity duration-1000 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(231, 195, 90, 0.06) 0%, transparent 70%)',
            }}
          />
        )}

        {/* QuickActions */}
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (!isActivationKey(e.key)) return;
            e.stopPropagation();
          }}
        >
          <PlantQuickActions plant={plant} />
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-4 left-4 z-40 pointer-events-none">
            <div
              className={`rounded-lg border px-3 py-2 text-xs font-semibold backdrop-blur-sm shadow-[0_10px_20px_rgba(0,0,0,0.25)] bg-black/70 ${
                toast.tone === 'success'
                  ? 'border-[#6fbf86]/50 text-[#A7E5B2]'
                  : toast.tone === 'warning'
                  ? 'border-amber-400/40 text-amber-100'
                  : 'border-red-500/40 text-red-200'
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}
      </motion.div>

      {/* Confirm Rega (anti-clique acidental) */}
      {wateringConfirmOpen && wateringConfirmInfo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button
            type="button"
            aria-label="Fechar confirmação de rega"
            onClick={closeWateringConfirm}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-[92%] max-w-[420px] rounded-xl border border-white/10 bg-gradient-to-b from-[#111A2E] to-[#0B1220] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white tracking-tight">{wateringConfirmInfo.title}</div>
                <div className="mt-1 text-xs text-white/60">
                  Você clicou de novo muito rápido. Isso evita registrar evento duplicado sem querer.
                </div>
              </div>

              <div
                className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md border backdrop-blur-sm ${
                  wateringConfirmInfo.variant === 'A'
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-purple-400/30 bg-purple-500/10 text-purple-200'
                }`}
              >
                {wateringConfirmInfo.variant === 'A' ? 'ÁGUA' : 'ADITIVADA'}
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/50">Volume</div>
                <div className="text-sm font-mono font-semibold text-white">{wateringConfirmInfo.ml}mL</div>
              </div>

              {wateringConfirmInfo.subtitle && (
                <div className="mt-2 max-h-24 overflow-auto text-xs text-white/70 whitespace-pre-wrap break-words pr-1">
                  {wateringConfirmInfo.subtitle}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeWateringConfirm}
                className="rounded-lg px-3 py-2 text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmWateringProceed}
                className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-all ${
                  wateringConfirmInfo.variant === 'A'
                    ? 'border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100'
                    : 'border-purple-400/30 bg-purple-500/15 hover:bg-purple-500/25 text-purple-100'
                }`}
              >
                Confirmar
              </button>
            </div>

            <div className="mt-2 text-[10px] text-white/40 font-mono">Dica: aperte ESC para fechar</div>
          </div>
        </div>
      )}

      {/* Modal fora do card */}
      <GrowthModal open={growthModalOpen} onClose={() => setGrowthModalOpen(false)} plantId={plant.id} />
    </>
  );
}