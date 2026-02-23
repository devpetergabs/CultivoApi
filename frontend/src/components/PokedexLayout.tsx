import { useEffect, useState } from 'react';
import WeatherBox from './WeatherBox';
import { useAuth } from '../hooks/useAuth';
import { usePokedexStore } from '../store/pokedexStore';
import { PokedexGrid } from './PokedexGrid';
import { PlantDetailDrawer } from './PlantDetailDrawer';
import { InventarioView } from './InventarioView';
import type { Plant } from '../types/pokedex';
import { apiService } from '../services/api';
import { mapPlantaToPokedexPlant } from '../utils/mapPlantaToPokedex';
import { PlantFormModal } from './PlantFormModal';
import type { PlantType } from '../types/pokedex';
import { getPlantStageLabel } from './TypeBadge';
import { potLitersToEnum } from '../utils/plantFormUtils';
import chestClosed from '../assets/bau.png';
import chestOpen from '../assets/bau-aberto.png';

export function PokedexLayout() {
  const { cultivador } = useAuth();
  const {
    plants,
    selectedPlantId,
    setSelectedPlant,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    addPlant,
    updatePlant,
    removePlant,
    setPlants,
    filteredPlants,
  } = usePokedexStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editPlant, setEditPlant] = useState<Plant | null>(null);
  const [deletePlant, setDeletePlant] = useState<Plant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [levelUpPlant, setLevelUpPlant] = useState<Plant | null>(null);
  const [levelUpCurrentStage, setLevelUpCurrentStage] = useState<PlantType | null>(null);
  const [levelUpNextStage, setLevelUpNextStage] = useState<PlantType | null>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [levelUpError, setLevelUpError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'POKEDEX' | 'INVENTARIO'>('POKEDEX');
  const [inventoryCount, setInventoryCount] = useState(0);

  const filtered = filteredPlants();
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  const availableStrains = plants
    .map((p) => p.variant)
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  useEffect(() => {
    if (selectedPlantId === null) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [selectedPlantId]);

  useEffect(() => {
    const handler = () => setIsCreateModalOpen(true);
    window.addEventListener('pokedex:new-plant', handler as EventListener);
    return () => window.removeEventListener('pokedex:new-plant', handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        plantId: number;
        plantName: string;
        currentStage: PlantType;
        nextStage: PlantType;
      }>;

      const id = custom.detail?.plantId;
      if (typeof id !== 'number') return;

      const plant = plants.find((p) => p.id === id) || null;
      if (!plant) return;

      setLevelUpPlant(plant);
      setLevelUpCurrentStage(custom.detail.currentStage);
      setLevelUpNextStage(custom.detail.nextStage);
      setLevelUpError(null);
      setIsLevelingUp(false);
    };

    window.addEventListener('pokedex:level-up', handler as EventListener);
    return () => window.removeEventListener('pokedex:level-up', handler as EventListener);
  }, [plants]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.getPlantasListagem(0, 500);
        const list = response?.content ?? response;
        const plantas = Array.isArray(list) ? list : [];
        const mapped = plantas.map((planta: any) =>
          mapPlantaToPokedexPlant(planta, {
            name: cultivador?.usuarioNome ?? null,
            phone: cultivador?.telefone ?? null,
          })
        );
        setPlants(mapped);
      } catch (error) {
        console.error('Erro ao carregar plantas do banco:', error);
      }
    };

    load();
  }, [setPlants, cultivador?.usuarioNome, cultivador?.telefone]);

  const handlePlantCreated = (plant: Plant) => {
    addPlant(plant);
    setSelectedPlant(plant.id);
  };

  const handlePlantEdited = (plant: Plant) => {
    updatePlant(plant);
    setSelectedPlant(plant.id);
  };

  const confirmDelete = async () => {
    if (!deletePlant) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiService.deletePlanta(deletePlant.id);
      removePlant(deletePlant.id);
      setDeletePlant(null);
    } catch {
      setDeleteError('Não foi possível excluir a planta.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmLevelUp = async () => {
    if (!levelUpPlant || !levelUpCurrentStage || !levelUpNextStage) return;
    setIsLevelingUp(true);
    setLevelUpError(null);

    try {
      const updated = await apiService.updatePlanta(levelUpPlant.id, {
        nome: levelUpPlant.name,
        tamanhoVaso: potLitersToEnum(levelUpPlant.potLiters),
        estagio: levelUpNextStage,
      });

      const fromLabel = getPlantStageLabel(levelUpCurrentStage);
      const toLabel = getPlantStageLabel(levelUpNextStage);
      await apiService.createPlantaEvento(levelUpPlant.id, {
        tipo: 'EVOLUCAO',
        descricao: `Evolução: ${fromLabel} → ${toLabel}`,
      });

      const mapped = mapPlantaToPokedexPlant(updated as any, {
        name: cultivador?.usuarioNome ?? null,
        phone: cultivador?.telefone ?? null,
      });
      updatePlant(mapped);
      setLevelUpPlant(null);
      setLevelUpCurrentStage(null);
      setLevelUpNextStage(null);
    } catch {
      setLevelUpError('Não foi possível evoluir a planta.');
    } finally {
      setIsLevelingUp(false);
    }
  };

  const switchView = (next: 'POKEDEX' | 'INVENTARIO') => {
    if (next === activeView) return;

    if (next === 'INVENTARIO') {
      setSelectedPlant(null);
      setIsCreateModalOpen(false);
      setEditPlant(null);
      setDeletePlant(null);
      setDeleteError(null);
      setIsDeleting(false);

      setLevelUpPlant(null);
      setLevelUpCurrentStage(null);
      setLevelUpNextStage(null);
      setIsLevelingUp(false);
      setLevelUpError(null);
    }

    setActiveView(next);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B1220] text-white overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER - Pokédex Device Frame
          ═══════════════════════════════════════════════════════════════════════════ */}
      <header className="relative border-b-4 border-[#6fbf86] bg-gradient-to-b from-[#2b0f0f] to-[#3a1212] px-6 py-5 shrink-0 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#6fbf86]" />

        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <WeatherBox />
            <div className="text-3xl animate-float">🌱</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg">POKÉDEX PLANTAS</h1>
                <button
                  type="button"
                  onClick={() => switchView(activeView === 'POKEDEX' ? 'INVENTARIO' : 'POKEDEX')}
                  className="group relative h-10 w-10 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label={activeView === 'POKEDEX' ? 'Abrir inventário' : 'Voltar para pokédex'}
                  title={activeView === 'POKEDEX' ? 'Inventário' : 'Pokédex'}
                >
                  <img
                    src={activeView === 'POKEDEX' ? chestClosed : chestOpen}
                    alt=""
                    className="h-6 w-6 object-contain mx-auto"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(111,191,134,0.22)]" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#6fbf86] text-[#0B1220] rounded-full px-4 py-2 font-semibold border-2 border-[#0B1220]/80 shadow-lg">
            <div className="text-center">
              <div className="text-xl font-semibold">{activeView === 'POKEDEX' ? plants.length : inventoryCount}</div>
              <div className="text-xs font-medium uppercase tracking-[0.12em]">{activeView === 'POKEDEX' ? 'PLANTAS' : 'ADITIVOS'}</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#6fbf86]" />
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════════
          MAIN CONTENT - Grid Area
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#0B1220]">
        {activeView === 'POKEDEX' ? (
          <PokedexGrid
            plants={filtered}
            selectedPlantId={selectedPlantId}
            onSelectPlant={setSelectedPlant}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        ) : (
          <InventarioView onCountChange={setInventoryCount} />
        )}
      </div>

      {activeView === 'POKEDEX' && (
        <PlantDetailDrawer
          plant={selectedPlant}
          allPlants={filtered}
          onClose={() => setSelectedPlant(null)}
          onEdit={() => {
            if (selectedPlant) setEditPlant(selectedPlant);
          }}
          onDelete={() => {
            if (selectedPlant) setDeletePlant(selectedPlant);
          }}
        />
      )}

      {activeView === 'POKEDEX' && isCreateModalOpen && (
        <PlantFormModal
          mode="create"
          availableStrains={availableStrains}
          grower={{ name: cultivador?.usuarioNome ?? null, phone: cultivador?.telefone ?? null }}
          onClose={() => setIsCreateModalOpen(false)}
          onSaved={handlePlantCreated}
        />
      )}

      {activeView === 'POKEDEX' && editPlant && (
        <PlantFormModal
          mode="edit"
          initialPlant={editPlant}
          availableStrains={availableStrains}
          grower={{ name: cultivador?.usuarioNome ?? null, phone: cultivador?.telefone ?? null }}
          onClose={() => setEditPlant(null)}
          onSaved={(p) => {
            handlePlantEdited(p);
            setEditPlant(null);
          }}
        />
      )}

      {activeView === 'POKEDEX' && deletePlant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            if (!isDeleting) setDeletePlant(null);
          }}
        >
          <div
            className="w-[420px] max-w-[92vw] rounded-xl border border-[#6fbf86]/20 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Excluir planta</h3>
                <p className="text-xs text-[#9fb0c0] font-normal">
                  Confirme para excluir <span className="font-semibold text-white">{deletePlant.name}</span>.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isDeleting) setDeletePlant(null);
                }}
                className="text-white/80 hover:text-white text-xl transition-colors font-semibold"
                aria-label="Fechar"
                type="button"
              >
                ✕
              </button>
            </div>

            {deleteError && <div className="mb-3 text-xs text-red-300">{deleteError}</div>}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeletePlant(null)}
                disabled={isDeleting}
                className="py-2 rounded-lg font-semibold uppercase tracking-[0.06em] transition-all text-xs border-2 bg-[#0B1220]/60 text-slate-200 border-slate-600 hover:border-[#6fbf86]/60 disabled:opacity-60"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`py-2 rounded-lg font-semibold uppercase tracking-[0.06em] transition-all text-xs border-2 ${
                  isDeleting
                    ? 'bg-[#0B1220]/60 text-slate-400 border-slate-700 cursor-not-allowed opacity-70'
                    : 'bg-[#0f1726] text-slate-200 border-slate-500/70 hover:text-red-300 hover:border-red-500/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.14)]'
                }`}
                type="button"
              >
                {isDeleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'POKEDEX' && levelUpPlant && levelUpCurrentStage && levelUpNextStage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            if (!isLevelingUp) {
              setLevelUpPlant(null);
              setLevelUpCurrentStage(null);
              setLevelUpNextStage(null);
            }
          }}
        >
          <div
            className="w-[460px] max-w-[92vw] rounded-xl border border-[#6fbf86]/20 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white tracking-tight">Evoluir planta</h3>
              <p className="text-xs text-[#9fb0c0] font-normal">
                Deseja avançar a planta{' '}
                <span className="font-semibold text-white">{levelUpPlant.name}</span> de{' '}
                <span className="font-semibold text-white">{getPlantStageLabel(levelUpCurrentStage)}</span> para{' '}
                <span className="font-semibold text-white">{getPlantStageLabel(levelUpNextStage)}</span>?
              </p>
            </div>

            {levelUpError && <p className="mb-2 text-xs text-red-400">{levelUpError}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isLevelingUp) return;
                  setLevelUpPlant(null);
                  setLevelUpCurrentStage(null);
                  setLevelUpNextStage(null);
                }}
                className="rounded-lg border border-slate-600/70 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-400"
                disabled={isLevelingUp}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmLevelUp}
                className="rounded-lg bg-[#6fbf86] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110"
                disabled={isLevelingUp}
              >
                {isLevelingUp ? 'Evoluindo...' : 'Evoluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
