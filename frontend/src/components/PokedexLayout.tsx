import { useEffect, useState } from 'react';
import WeatherBox from './WeatherBox';
import { useAuth } from '../hooks/useAuth';
import { usePokedexStore } from '../store/pokedexStore';
import { PokedexGrid } from './PokedexGrid';
import { PlantDetailDrawer } from './PlantDetailDrawer';
import { InventarioView } from './InventarioView';
import { StageCodexView } from './StageCodexView';
import type { Plant } from '../types/pokedex';
import { apiService } from '../services/api';
import { mapPlantaToPokedexPlant } from '../utils/mapPlantaToPokedex';
import { PlantFormModal } from './PlantFormModal';
import { StageCodexModal } from './StageCodexModal';
import type { CodexEstagio } from '../types';
import type { PlantType } from '../types/pokedex';
import { getPlantStageLabel } from './TypeBadge';
import { potLitersToEnum } from '../utils/plantFormUtils';

export function PokedexLayout() {
  const { cultivador, usuario, logout } = useAuth();
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
    hideCannabis,
    setHideCannabis,
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

  const [activeView, setActiveView] = useState<'POKEDEX' | 'INVENTARIO' | 'CODEX'>('POKEDEX');
  const [inventoryCount, setInventoryCount] = useState(0);
  const [stageReveal, setStageReveal] = useState<{
    plant: Plant;
    entry: CodexEstagio;
    reason: 'create' | 'level-up';
  } | null>(null);

  const filtered = filteredPlants();
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  const availableStrains = plants
    .map((p) => p.variant)
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  useEffect(() => {
    if (selectedPlantId === null) document.body.style.overflow = 'auto';
    else document.body.style.overflow = 'hidden';
  }, [selectedPlantId]);

  useEffect(() => {
    const handler = () => setIsCreateModalOpen(true);
    window.addEventListener('pokedex:new-plant', handler as EventListener);
    return () => window.removeEventListener('pokedex:new-plant', handler as EventListener);
  }, []);

  // Estado simples de praga (flag): atualiza o card imediatamente sem precisar recarregar lista.
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ plantId?: number; praga?: boolean } | undefined>;
      const plantId = custom?.detail?.plantId;
      if (typeof plantId !== 'number') return;
      const praga = Boolean(custom?.detail?.praga);

      const existing = plants.find((p) => p.id === plantId);
      if (!existing) return;
      updatePlant({ ...existing, pestActive: praga });
    };

    window.addEventListener('plant:praga-changed', handler as EventListener);
    return () => window.removeEventListener('plant:praga-changed', handler as EventListener);
  }, [plants, updatePlant]);

  // Navegação global (ex: BAÚ vindo do menu radial da planta)
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ view?: 'POKEDEX' | 'INVENTARIO' | 'CODEX' } | undefined>;
      const view = custom?.detail?.view;
      if (!view) return;
      switchView(view);
    };

    window.addEventListener('pokedex:switch-view', handler as EventListener);
    return () => window.removeEventListener('pokedex:switch-view', handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // Fallback: caso algum lugar dispare pedido de delete via evento (deixa robusto)
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ plantId?: number }>;
      const plantId = custom?.detail?.plantId;
      if (!plantId) return;

      const plant = plants.find((p) => p.id === plantId) || null;
      if (plant) setDeletePlant(plant);
    };

    window.addEventListener('pokedex:request-delete', handler as EventListener);
    return () => window.removeEventListener('pokedex:request-delete', handler as EventListener);
  }, [plants]);

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
        const list = (response as any)?.content ?? response;
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

  const openStageReveal = async (plant: Plant, reason: 'create' | 'level-up') => {
    try {
      const entry = await apiService.getPlantaCodexEstagioAtual(plant.id);
      setStageReveal({ plant, entry, reason });
    } catch (error) {
      console.error('Erro ao carregar codex do estágio atual:', error);
    }
  };

  const handlePlantCreated = (plant: Plant) => {
    addPlant(plant);
    setSelectedPlant(plant.id);
    void openStageReveal(plant, 'create');
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
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 403 || status === 404) setDeleteError('Você não é o proprietário desta planta.');
      else setDeleteError('Não foi possível excluir a planta.');
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
      void openStageReveal(mapped, 'level-up');
      setLevelUpPlant(null);
      setLevelUpCurrentStage(null);
      setLevelUpNextStage(null);
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 403 || status === 404) setLevelUpError('Você não é o proprietário desta planta.');
      else setLevelUpError('Não foi possível evoluir a planta.');
    } finally {
      setIsLevelingUp(false);
    }
  };

  const switchView = (next: 'POKEDEX' | 'INVENTARIO' | 'CODEX') => {
    if (next === activeView) return;

    if (next !== 'POKEDEX') {
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
      <header className="relative border-b-2 border-[#6fbf86]/60 bg-gradient-to-b from-[#2b0f0f] to-[#3a1212] px-4 sm:px-6 shrink-0 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#6fbf86]" />

        {/* ── Mobile: 2 linhas ── Desktop: grid 3 colunas ── */}

        {/* Desktop: grid-cols-3 → logo | tabs (centro) | perfil */}
        {/* Mobile: flex-col → linha 1 (logo+sair) | linha 2 (tabs) */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 sm:items-center sm:h-16 py-2 sm:py-0 gap-1.5 sm:gap-0">

          {/* Coluna 1 / Linha 1 mobile: Logo + botão Sair (mobile only) */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xl animate-float">🌱</span>
              <span className="text-sm sm:text-base font-semibold tracking-tight text-white leading-none">
                POKÉDEX<span className="hidden sm:inline"> PLANTAS</span>
              </span>
            </div>
            {/* Olá + Sair — visível só no mobile, no canto direito da linha 1 */}
            <div className="sm:hidden flex items-center gap-2 text-[12px] text-white/60">
              <span>Olá, <span className="font-semibold text-white">{usuario?.nome ?? cultivador?.usuarioNome ?? '—'}</span></span>
              <button
                type="button"
                onClick={logout}
                title="Sair da conta"
                className="flex items-center gap-1 text-white/40 hover:text-red-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-[11px]">Sair</span>
              </button>
            </div>
          </div>

          {/* Coluna 2 (centro) / Linha 2 mobile: Tabs */}
          <div className="flex justify-center sm:justify-center">
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5 backdrop-blur-md w-full sm:w-auto">
              <button
                type="button"
                onClick={() => switchView('POKEDEX')}
                className={`flex-1 sm:flex-none h-8 px-4 rounded-lg text-xs font-semibold uppercase tracking-[0.10em] transition-colors ${
                  activeView === 'POKEDEX'
                    ? 'bg-[#6fbf86]/20 text-white border border-[#6fbf86]/30 shadow-[0_0_10px_rgba(111,191,134,0.18)]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Pokédex
              </button>
              <button
                type="button"
                onClick={() => switchView('INVENTARIO')}
                className={`flex-1 sm:flex-none h-8 px-4 rounded-lg text-xs font-semibold uppercase tracking-[0.10em] transition-colors ${
                  activeView === 'INVENTARIO'
                    ? 'bg-[#e7c35a]/15 text-white border border-[#e7c35a]/25 shadow-[0_0_10px_rgba(231,195,90,0.14)]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Inventário
              </button>
              <button
                type="button"
                onClick={() => switchView('CODEX')}
                className={`flex-1 sm:flex-none h-8 px-4 rounded-lg text-xs font-semibold uppercase tracking-[0.10em] transition-colors ${
                  activeView === 'CODEX'
                    ? 'bg-sky-300/15 text-white border border-sky-300/25 shadow-[0_0_10px_rgba(125,211,252,0.14)]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Estágios
              </button>
            </div>
          </div>

          {/* Coluna 3 (direita) — só desktop */}
          <div className="hidden sm:flex items-center justify-end gap-3 text-[12px] text-white/70">
            <WeatherBox variant="strip" />
            <div className="h-4 w-px bg-white/15" />
            <span>
              Olá, <span className="font-semibold text-white">{usuario?.nome ?? cultivador?.usuarioNome ?? '—'}</span>
            </span>
            <span className="text-white/20">·</span>
            <button
              type="button"
              onClick={logout}
              title="Sair da conta"
              className="flex items-center gap-1 text-white/40 hover:text-red-400 transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="text-[11px]">Sair</span>
            </button>
          </div>

        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6fbf86]/40" />
      </header>

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
            hideCannabis={hideCannabis}
            onHideCannabisChange={setHideCannabis}
          />
        ) : activeView === 'INVENTARIO' ? (
          <InventarioView onCountChange={setInventoryCount} />
        ) : (
          <StageCodexView plant={selectedPlant ?? filtered[0] ?? plants[0] ?? null} />
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

      {/* ✅ MODAL DELETE (isso aqui estava faltando no seu arquivo atual) */}
      {activeView === 'POKEDEX' && deletePlant && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
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

      {/* ✅ MODAL EVOLUIR (também estava faltando) */}
      {activeView === 'POKEDEX' && levelUpPlant && levelUpCurrentStage && levelUpNextStage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
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

      <StageCodexModal
        open={Boolean(stageReveal)}
        onClose={() => setStageReveal(null)}
        plant={stageReveal?.plant ?? null}
        entry={stageReveal?.entry ?? null}
        reason={stageReveal?.reason ?? 'create'}
      />
    </div>
  );
}