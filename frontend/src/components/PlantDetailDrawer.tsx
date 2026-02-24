import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import type { Plant } from '../types/pokedex';
import { TypeBadge } from './TypeBadge';
import { StatBar } from './StatBar';
import { usePokedexStore } from '../store/pokedexStore';

// ✅ NOVO: eventos (visão de estado por timeline)
import { usePlantEvents } from '../hooks/usePlantEvents';
import { EventTimeline } from './EventTimeline';
import { PlantStateSummary } from './PlantStateSummary';

interface PlantDetailDrawerProps {
  plant: Plant | null;
  allPlants: Plant[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PlantDetailDrawer({ plant, allPlants, onClose, onEdit, onDelete }: PlantDetailDrawerProps) {
  const { setSelectedPlant } = usePokedexStore();

  // ✅ Hooks precisam ser chamados SEMPRE, mesmo quando plant == null
  const plantId = plant?.id ?? null;

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refresh: refreshEvents,
  } = usePlantEvents(plantId, {
    pageSize: 80,
    enabled: !!plantId,
  });

  // Keyboard navigation
  useEffect(() => {
    if (!plant) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        const currentIndex = allPlants.findIndex((p) => p.id === plant.id);
        if (currentIndex < allPlants.length - 1) {
          setSelectedPlant(allPlants[currentIndex + 1].id);
        }
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = allPlants.findIndex((p) => p.id === plant.id);
        if (currentIndex > 0) {
          setSelectedPlant(allPlants[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [plant, allPlants, setSelectedPlant, onClose]);

  // ✅ Agora pode retornar; os hooks já foram chamados
  if (!plant) return null;

  const currentIndex = allPlants.findIndex((p) => p.id === plant.id);
  const canGoNext = currentIndex < allPlants.length - 1;
  const canGoPrev = currentIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setSelectedPlant(allPlants[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setSelectedPlant(allPlants[currentIndex - 1].id);
    }
  };

  // Calculate age in days from germination date
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

  // Format date - converts DD/MM/YYYY to valid Date
  const formatDate = (date: string | null) => {
    if (!date) return '⚠️ UNDEF';

    const parts = date.split('/');
    if (parts.length !== 3) return '⚠️ INVÁLIDA';

    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (isNaN(d.getTime())) return '⚠️ INVÁLIDA';

    return d.toLocaleDateString('pt-BR');
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      {/* Drawer - slides from right with Pokédex styling */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full md:w-[520px] z-50 overflow-y-auto border-l-4 border-[#7BD389]/35 bg-gradient-to-b from-[#111A2E] to-[#0B1220] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-[#2b0f0f] to-[#3a1212] border-b-4 border-[#6fbf86] px-6 py-4 flex justify-between items-center shadow-lg">
          <h2 className="text-lg font-semibold text-white uppercase tracking-tight">📊 POKÉDEX</h2>
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
              onClick={onDelete}
              className="h-9 w-9 rounded-lg border-2 border-slate-500/60 bg-transparent text-slate-100/90 transition-all hover:text-red-300 hover:border-red-500/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.18)] disabled:opacity-50"
              aria-label="Excluir"
              disabled={!onDelete}
              type="button"
            >
              ✕
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg border-2 border-slate-500/60 bg-transparent text-slate-100/90 transition-all hover:text-[#6fbf86] hover:border-[#6fbf86]/60 hover:shadow-[0_0_12px_rgba(111,191,134,0.18)] disabled:opacity-50"
              aria-label="Minimizar"
              type="button"
            >
              <span className="block text-xl leading-none -mt-1">—</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ID and Name */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-[#6fbf86]/70 font-mono uppercase tracking-[0.06em]">
              #{plant.id.toString().padStart(3, '0')} — POKÉDEX
            </div>
            <h1 className="text-4xl font-semibold text-white tracking-tight">{plant.name}</h1>
            <TypeBadge type={plant.type} size="lg" />
          </div>

          {/* Image Area - Large display */}
          <div className="rounded-xl p-8 border-2 border-[#6fbf86]/25 bg-gradient-to-b from-[#1a1f2e] to-[#0B1220] text-center shadow-[0_0_16px_rgba(111,191,134,0.10)]">
            <div className="text-8xl animate-float drop-shadow-xl" style={{ textShadow: '0 0 18px rgba(123, 211, 137, 0.25)' }}>
              {plant.imageUrl}
            </div>
          </div>

          {/* Stats Section */}
          <div
            className={`space-y-4 rounded-xl p-5 border-2 backdrop-blur-sm ${
              plant.heightCm > 180
                ? 'border-[#e7c35a] bg-gradient-to-br from-[#1f1a0f]/70 to-[#111A2E]/60 shadow-[0_0_12px_rgba(231,195,90,0.16)]'
                : 'border-[#6fbf86]/25 bg-[#111A2E]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-medium uppercase tracking-[0.06em] ${plant.heightCm > 180 ? 'text-[#e7c35a]' : 'text-[#6fbf86]'}`}>
                📏 DIMENSÕES {plant.heightCm > 180 && '⭐'}
              </h3>
              {plant.heightCm > 180 && (
                <span className="text-[10px] font-semibold text-[#e7c35a] bg-[#1f1a0f] px-2 py-1 rounded-full border border-[#e7c35a]">
                  PLANTA ÉPICA
                </span>
              )}
            </div>
            <div className="space-y-3">
              <StatBar label="ALTURA" value={plant.heightCm} max={180} color="blue" />
              <StatBar label="LARGURA" value={plant.widthCm} max={120} color="green" />
              <StatBar label="CAULE" value={plant.stemWidthCm} max={25} color="yellow" />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3 rounded-xl p-5 border-2 border-[#7BD389]/20 bg-[#111A2E]/60 backdrop-blur-sm">
            <h3 className="text-xs font-medium text-[#7BD389] uppercase tracking-wider">📋 DETALHES</h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(123,211,137,0.2)]">
                <div className="text-xs text-[#6fbf86]/60 font-medium uppercase tracking-[0.06em]">VARIANTE</div>
                <div className="font-semibold text-white mt-2">{plant.variant}</div>
              </div>
              <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(123,211,137,0.2)]">
                <div className="text-xs text-[#6fbf86]/60 font-medium uppercase tracking-[0.06em]">VASO</div>
                <div className="font-semibold text-white mt-2">{plant.potLiters}L</div>
              </div>
              <div className="col-span-2 p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(123,211,137,0.2)]">
                <div className="text-xs text-[#6fbf86]/60 font-medium uppercase tracking-[0.06em]">GERMINAÇÃO</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="font-mono text-[#6fbf86] font-semibold">{formatDate(plant.germinationDate)}</div>
                  <div className="text-right">
                    <div className="text-xs text-[#6fbf86]/60 font-medium uppercase tracking-[0.06em]">IDADE</div>
                    <div className="font-semibold text-white text-lg">
                      {calculateAge(plant.germinationDate) !== null ? `${calculateAge(plant.germinationDate)}d` : '⚠️'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Breeding Info */}
              {(plant.sexo || plant.dataSexagem || plant.dataFloracao) && (
                <>
                  {plant.sexo && (
                    <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(123,211,137,0.2)]">
                      <div className="text-xs text-[#6fbf86]/60 font-medium uppercase tracking-[0.06em]">SEXO</div>
                      <div
                        className={`font-semibold mt-2 ${
                          plant.sexo === 'FEMEA'
                            ? 'text-pink-400'
                            : plant.sexo === 'MACHO'
                              ? 'text-blue-400'
                              : 'text-yellow-400'
                        }`}
                      >
                        {plant.sexo === 'FEMEA' ? '♀ Fêmea' : plant.sexo === 'MACHO' ? '♂ Macho' : '⚥ Hermafrodita'}
                      </div>
                    </div>
                  )}
                  {plant.dataSexagem && (
                    <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(123,211,137,0.2)]">
                      <div className="text-xs text-[#6fbf86]/60 font-medium uppercase tracking-[0.06em]">SEXAGEM</div>
                      <div className="font-mono text-white font-semibold mt-2 text-sm">{formatDate(plant.dataSexagem)}</div>
                    </div>
                  )}
                  {plant.dataFloracao && (
                    <div className="col-span-2 p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(123,211,137,0.2)]">
                      <div className="text-xs text-[#6fbf86]/60 font-medium uppercase tracking-[0.06em]">🌸 INÍCIO DA FLORAÇÃO</div>
                      <div className="font-mono text-[#6fbf86] font-semibold mt-2">{formatDate(plant.dataFloracao)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ✅ NOVO: Estado derivado de eventos + Timeline */}
          <div className="space-y-3">
            {eventsError && (
              <div className="rounded-xl p-3 border border-red-500/30 bg-red-500/10 text-red-200 text-xs">
                Falha ao carregar eventos: {eventsError}
              </div>
            )}

            <PlantStateSummary events={events as any} />

            <EventTimeline
              events={events as any}
              loading={eventsLoading}
              onRefresh={refreshEvents}
              title="Registro de Eventos"
            />
          </div>

          {/* Grower Card */}
          <div className="space-y-3 rounded-xl p-5 border-2 border-[#6fbf86]/35 bg-gradient-to-br from-[#111A2E]/80 to-[#0B1220]/50 shadow-[0_0_12px_rgba(111,191,134,0.10)]">
            <h3 className="text-xs font-medium text-[#6fbf86] uppercase tracking-[0.06em]">👨‍🌾 CULTIVADOR</h3>
            <div className="space-y-2">
              <div className="font-semibold text-white text-lg">{plant.growerName}</div>
              {plant.growerPhone && <div className="text-[#6fbf86] font-mono text-sm font-medium">📱 {plant.growerPhone}</div>}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,255,255,0.12)] pt-5">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`py-3 rounded-lg font-semibold uppercase tracking-[0.06em] transition-all text-sm border-2 ${
                canGoPrev
                  ? 'bg-[#7a1f1f] text-white border-[#7a1f1f] hover:bg-[#8c2626] shadow-[0_0_10px_rgba(122,31,31,0.22)]'
                  : 'bg-[#0B1220]/60 text-slate-500 border-slate-600 cursor-not-allowed opacity-50'
              }`}
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
            >
              PRÓX →
            </button>
          </div>

          {/* Keyboard hints */}
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