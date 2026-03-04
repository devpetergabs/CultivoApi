import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Plant } from '../types/pokedex';
import { apiService } from '../services/api';
import { usePokedexStore } from '../store/pokedexStore';

import { TypeBadge } from './TypeBadge';
import { StatBar } from './StatBar';

import { usePlantEvents } from '../hooks/usePlantEvents';
import { EventTimeline } from './EventTimeline';
import { PlantStateSummary } from './PlantStateSummary';
import { useInseticidaAgenda } from '../hooks/useInseticidaAgenda';
import { InsecticideAgendaPanel } from './InsecticideAgendaPanel';

type DrawerTab = 'RESUMO' | 'AGENDA' | 'EVENTOS';

interface PlantDetailDrawerProps {
  plant: Plant | null;
  allPlants: Plant[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function calcAgeDays(dateBr: string | null) {
  if (!dateBr) return null;
  const parts = dateBr.split('/');
  if (parts.length !== 3) return null;
  const germinationDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(germinationDate.getTime())) return null;
  const today = new Date();
  const diffMs = today.getTime() - germinationDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatDateBr(dateBr: string | null) {
  if (!dateBr) return '—';
  const parts = dateBr.split('/');
  if (parts.length !== 3) return '—';
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

export function PlantDetailDrawer({ plant, allPlants, onClose, onEdit, onDelete }: PlantDetailDrawerProps) {
  const { setSelectedPlant } = usePokedexStore();

  const plantId = plant?.id ?? null;
  const pestActive = Boolean(plant?.pestActive);

  const [tab, setTab] = useState<DrawerTab>('RESUMO');
  const [owner, setOwner] = useState<{ name?: string | null; login?: string | null; phone?: string | null } | null>(
    null
  );
  const [ownerLoading, setOwnerLoading] = useState(false);

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refresh: refreshEvents,
  } = usePlantEvents(plantId, {
    pageSize: 80,
    enabled: !!plantId,
  });

  const {
    agenda,
    loading: agendaLoading,
    error: agendaError,
    refresh: refreshAgenda,
  } = useInseticidaAgenda(plantId, { enabled: !!plantId });

  // Reset visual state ao trocar planta + carrega dono (nome/email) do endpoint /completa
  useEffect(() => {
    if (!plantId) return;

    setTab('RESUMO');

    let cancelled = false;
    setOwnerLoading(true);
    setOwner(null);

    apiService
      .getPlantaCompleta(plantId)
      .then((data) => {
        if (cancelled) return;
        setOwner({
          name: data.cultivadorNome ?? null,
          login: data.cultivadorLogin ?? null,
          phone: data.cultivadorTelefone ?? null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // fallback: usa o que veio na lista (quando existir)
        setOwner({ name: plant?.growerName ?? null, login: null, phone: plant?.growerPhone ?? null });
      })
      .finally(() => {
        if (cancelled) return;
        setOwnerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plantId, plant?.growerName, plant?.growerPhone]);

  // Atualiza eventos em tempo real
  useEffect(() => {
    if (!plantId) return;

    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ plantId?: number }>;
      if (custom?.detail?.plantId === plantId) {
        refreshEvents();
      }
    };

    window.addEventListener('plant:event-created', handler as EventListener);
    return () => window.removeEventListener('plant:event-created', handler as EventListener);
  }, [plantId, refreshEvents]);

  const currentIndex = useMemo(() => {
    if (!plant) return -1;
    return allPlants.findIndex((p) => p.id === plant.id);
  }, [allPlants, plant]);

  if (!plant) return null;

  const canGoNext = currentIndex >= 0 && currentIndex < allPlants.length - 1;
  const canGoPrev = currentIndex > 0;

  const handleNext = () => {
    if (canGoNext) setSelectedPlant(allPlants[currentIndex + 1].id);
  };

  const handlePrev = () => {
    if (canGoPrev) setSelectedPlant(allPlants[currentIndex - 1].id);
  };

  const ownerLabel = owner?.login || owner?.name || plant.growerName || '—';
  const germinationDateBr = plant.germinationDate;
  const ageDays = calcAgeDays(germinationDateBr);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed right-0 top-0 h-full w-full md:w-[520px] z-50 overflow-y-auto border-l-4 bg-gradient-to-b from-[#111A2E] to-[#0B1220] shadow-2xl ${
          pestActive ? 'border-emerald-400/35' : 'border-[#7BD389]/35'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className={`sticky top-0 z-50 border-b-4 px-6 py-4 flex items-center justify-between shadow-lg ${
            pestActive
              ? 'bg-gradient-to-r from-[#0f2a22] to-[#0b1f18] border-emerald-400/40'
              : 'bg-gradient-to-r from-[#2b0f0f] to-[#3a1212] border-[#6fbf86]'
          }`}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-white/70 uppercase tracking-[0.18em]">
              #{plant.id.toString().padStart(3, '0')} — Pokédex
            </div>
            <div className="mt-1 flex items-center gap-2 min-w-0">
              <h2 className="text-lg font-semibold text-white tracking-tight truncate">{plant.name}</h2>
              {pestActive && (
                <span className="shrink-0 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
                  ☣ Praga
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-white/60">
              <span className="text-white/40">Dono:</span>{' '}
              <span className="text-white/80 font-medium">{ownerLoading ? 'carregando…' : ownerLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="h-9 w-9 rounded-lg border-2 border-slate-500/60 bg-transparent text-slate-100/90 transition-all hover:border-slate-200/70 hover:shadow-[0_0_12px_rgba(148,163,184,0.18)] disabled:opacity-50"
              aria-label="Editar"
              disabled={!onEdit}
              type="button"
            >
              ✎
            </button>

            <button
              type="button"
              onClick={() => {
                if (onDelete) {
                  onDelete();
                  return;
                }
                window.dispatchEvent(new CustomEvent('pokedex:request-delete', { detail: { plantId: plant.id } }));
              }}
              className="h-9 w-9 rounded-lg border-2 border-slate-500/60 bg-transparent text-slate-100/90 transition-all hover:text-red-300 hover:border-red-500/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.18)]"
              aria-label="Excluir"
            >
              ✕
            </button>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg border-2 border-slate-500/60 bg-transparent text-slate-100/90 transition-all hover:text-[#6fbf86] hover:border-[#6fbf86]/60 hover:shadow-[0_0_12px_rgba(111,191,134,0.18)]"
              aria-label="Fechar"
              type="button"
            >
              <span className="block text-xl leading-none -mt-1">—</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5">
          {/* HERO */}
          <div
            className={`relative pokedex-card-frame border rounded-2xl p-4 overflow-hidden ${
              pestActive
                ? 'border-emerald-300/25 shadow-[0_0_18px_rgba(16,185,129,0.16)]'
                : 'border-white/10'
            }`}
          >
            {pestActive && (
              <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_60%)]" />
            )}

            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={plant.type} size="md" />

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/60">Idade</span>
                    <span className="text-xs font-semibold text-white">
                      {ageDays !== null ? `${ageDays}d` : '—'}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/60">Vaso</span>
                    <span className="text-xs font-semibold text-white">{plant.potLiters}L</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">Variante</div>
                    <div className="mt-1 font-semibold text-white truncate">{plant.variant || '—'}</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">Germinação</div>
                    <div className="mt-1 font-semibold text-white">{formatDateBr(germinationDateBr)}</div>
                  </div>
                </div>
              </div>

              <div
                className={`relative shrink-0 w-[110px] h-[110px] rounded-2xl border flex items-center justify-center text-6xl shadow-[0_0_14px_rgba(0,0,0,0.35)] ${
                  pestActive
                    ? 'border-emerald-300/25 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5'
                }`}
                aria-hidden="true"
              >
                <span className="drop-shadow-xl">{plant.imageUrl}</span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
            <TabButton active={tab === 'RESUMO'} onClick={() => setTab('RESUMO')}>
              Resumo
            </TabButton>
            <TabButton active={tab === 'AGENDA'} onClick={() => setTab('AGENDA')}>
              Agenda
            </TabButton>
            <TabButton active={tab === 'EVENTOS'} onClick={() => setTab('EVENTOS')}>
              Eventos
            </TabButton>
          </div>

          {/* TAB CONTENT */}
          {tab === 'RESUMO' && (
            <div className="space-y-4">
              <div className="pokedex-card-frame border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-medium text-[#6fbf86]/80 uppercase tracking-[0.12em]">Status rápido</div>
                <div className="mt-3">
                  <PlantStateSummary events={events as any} />
                </div>
              </div>

              {(plant.heightCm > 0 || plant.widthCm > 0 || plant.stemWidthCm > 0) && (
              <div
                className={`pokedex-card-frame border rounded-2xl p-4 ${
                  plant.heightCm > 180
                    ? 'border-[#e7c35a]/25 shadow-[0_0_12px_rgba(231,195,90,0.16)]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-medium uppercase tracking-[0.12em] ${plant.heightCm > 180 ? 'text-[#e7c35a]' : 'text-[#6fbf86]/80'}`}>
                    Dimensões
                  </div>
                  {plant.heightCm > 180 && (
                    <span className="text-[10px] font-semibold text-[#e7c35a] bg-[#1f1a0f] px-2 py-1 rounded-full border border-[#e7c35a]/60">
                      ⭐ ÉPICA
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {plant.heightCm > 0 && <StatBar label="ALTURA" value={plant.heightCm} max={180} color="blue" />}
                  {plant.widthCm > 0 && <StatBar label="LARGURA" value={plant.widthCm} max={120} color="green" />}
                  {plant.stemWidthCm > 0 && <StatBar label="CAULE" value={plant.stemWidthCm} max={25} color="yellow" />}
                </div>
              </div>
              )}

              {(plant.sexo || plant.dataSexagem || plant.dataFloracao) && (
              <div className="pokedex-card-frame border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-medium text-[#6fbf86]/80 uppercase tracking-[0.12em]">Detalhes</div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {plant.sexo && <InfoCard label="Sexo" value={formatSexo(plant.sexo)} />}
                  {plant.dataSexagem && <InfoCard label="Sexagem" value={formatDateBr(plant.dataSexagem)} mono />}
                  {plant.dataFloracao && (
                    <InfoCard
                      label="Início da floração"
                      value={formatDateBr(plant.dataFloracao)}
                      mono
                      full
                    />
                  )}
                </div>
              </div>
              )}
            </div>
          )}

          {tab === 'AGENDA' && (
            <div className="space-y-4">
              <InsecticideAgendaPanel
                plantId={plant.id}
                agenda={agenda}
                loading={agendaLoading}
                error={agendaError}
                onRefresh={refreshAgenda}
                onEventCreated={() => {
                  refreshEvents();
                  refreshAgenda();
                }}
              />
            </div>
          )}

          {tab === 'EVENTOS' && (
            <div className="space-y-4">
              {eventsError && (
                <div className="rounded-2xl p-3 border border-red-500/30 bg-red-500/10 text-red-200 text-xs">
                  Falha ao carregar eventos: {eventsError}
                </div>
              )}

              <EventTimeline
                plantId={plantId}
                events={events as any}
                loading={eventsLoading}
                onRefresh={refreshEvents}
                title="Registro de Eventos"
              />
            </div>
          )}

          {/* NAV */}
          <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,255,255,0.12)] pt-5">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`py-3 rounded-lg font-semibold uppercase tracking-[0.06em] transition-all text-sm border-2 ${
                canGoPrev
                  ? 'bg-[#7a1f1f] text-white border-[#7a1f1f] hover:bg-[#8c2626] shadow-[0_0_10px_rgba(122,31,31,0.22)]'
                  : 'bg-[#0B1220]/60 text-slate-500 border-slate-600 cursor-not-allowed opacity-50'
              }`}
              type="button"
            >
              ← ANTE
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`py-3 rounded-lg font-semibold uppercase tracking-[0.06em] transition-all text-sm border-2 ${
                canGoNext
                  ? 'bg-[#7a1f1f] text-white border-[#7a1f1f] hover:bg-[#8c2626] shadow-[0_0_10px_rgba(122,31,31,0.22)]'
                  : 'bg-[#0B1220]/60 text-slate-500 border-slate-600 cursor-not-allowed opacity-50'
              }`}
              type="button"
            >
              PRÓX →
            </button>
          </div>

          <div className="text-xs text-[#7BD389]/45 text-center space-y-1 pb-4 font-mono border-t border-[rgba(255,255,255,0.12)] pt-4">
            <div className="font-medium text-[#7BD389]/65">[ESC] FECHAR | [←→] NAVEGAR</div>
            <div className="text-[#7BD389]/35">
              {currentIndex + 1} / {allPlants.length}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3 rounded-xl text-xs font-semibold uppercase tracking-[0.10em] transition-colors flex-1 ${
        active
          ? 'bg-[#6fbf86]/20 text-white border border-[#6fbf86]/30 shadow-[0_0_10px_rgba(111,191,134,0.18)]'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function InfoCard({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={`${full ? 'col-span-2' : ''} rounded-xl border border-white/10 bg-black/20 px-3 py-2`}>
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">{label}</div>
      <div className={`mt-1 font-semibold text-white ${mono ? 'font-mono text-sm' : ''}`}>{value}</div>
    </div>
  );
}

function formatSexo(sexo?: string | null) {
  if (!sexo) return '—';
  if (sexo === 'FEMEA') return '♀ Fêmea';
  if (sexo === 'MACHO') return '♂ Macho';
  if (sexo === 'HERMAFRODITA') return '⚥ Hermafrodita';
  return sexo;
}
