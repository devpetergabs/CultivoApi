import type { Plant, PlantType } from '../types/pokedex';
import { PlantCardPreview } from './PlantCardPreview';

interface PokedexGridProps {
  plants: Plant[];
  selectedPlantId: number | null;
  onSelectPlant: (id: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: PlantType | null;
  onTypeChange: (type: PlantType | null) => void;
  sortBy: 'id' | 'widthCm' | 'heightCm';
  onSortChange: (sort: 'id' | 'widthCm' | 'heightCm') => void;
}

const STAGES: PlantType[] = ['GERMINACAO', 'VEGETATIVO', 'FLORACAO_INICIAL', 'FLORACAO_MEDIA', 'FLORACAO_AVANCADA', 'FINALIZACAO'];

const STAGE_CONFIG: Record<PlantType, { emoji: string; label: string; selectedClasses: string }> = {
  'GERMINACAO': { emoji: '🌱', label: 'Germinação', selectedClasses: 'bg-blue-500/15 border-blue-300/40 text-blue-100' },
  'VEGETATIVO': { emoji: '🍃', label: 'Vegetativo', selectedClasses: 'bg-emerald-500/15 border-emerald-300/40 text-emerald-100' },
  'FLORACAO_INICIAL': { emoji: '🌸', label: 'Floração Inicial', selectedClasses: 'bg-rose-500/15 border-rose-300/40 text-rose-100' },
  'FLORACAO_MEDIA': { emoji: '🌺', label: 'Floração Média', selectedClasses: 'bg-fuchsia-500/15 border-fuchsia-300/40 text-fuchsia-100' },
  'FLORACAO_AVANCADA': { emoji: '🌼', label: 'Floração Avançada', selectedClasses: 'bg-amber-500/15 border-amber-300/40 text-amber-100' },
  'FINALIZACAO': { emoji: '🧼', label: 'Finalização', selectedClasses: 'bg-slate-500/15 border-slate-300/40 text-slate-100' },
};

export function PokedexGrid({
  plants,
  selectedPlantId,
  onSelectPlant,
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
}: PokedexGridProps) {
  const dispatchNewPlant = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('pokedex:new-plant'));
  };

  return (
    <div className="flex flex-col h-full gap-4 p-6 overflow-y-auto">
      {/* ═══════════════════════════════════════════════════════════════════════════
          CONTROL PANEL
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 pokedex-card-frame p-5 space-y-4 border-cyan-500/20">
        {/* Search Bar */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">
            🔍 Buscar Pokédex
          </label>
          <input
            type="text"
            placeholder="Nome, ID ou strain..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-panel-navy border-2 border-panel-navy rounded-lg px-4 py-3 text-white placeholder-slate-500 
              focus:outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/30
              font-medium transition-all duration-200 shadow-[0_6px_18px_rgba(9,15,25,0.35)]"
          />
        </div>

        {/* Stage Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">
            🌱 Filtrar por Estágio
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onTypeChange(null)}
              aria-pressed={selectedType === null}
              className={`inline-flex items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-navy ${
                selectedType === null
                  ? 'bg-neon-green/20 text-neon-green border-neon-green/50 shadow-neon'
                  : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-neon-green/40'
              }`}
            >
              Todos
            </button>
            {STAGES.map((stage) => {
              const config = STAGE_CONFIG[stage];
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => onTypeChange(selectedType === stage ? null : stage)}
                  title={config.label}
                  aria-label={config.label}
                  aria-pressed={selectedType === stage}
                  className={`inline-flex items-center gap-2 rounded-full border text-sm font-medium transition-colors duration-200 px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-navy ${
                    selectedType === stage
                      ? `${config.selectedClasses} shadow-neon`
                      : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span className="text-base" aria-hidden="true">{config.emoji}</span>
                  <span className="hidden sm:inline text-xs whitespace-nowrap">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">
            📊 Ordenar por
          </label>
          <div className="flex gap-2">
            {(['id', 'widthCm', 'heightCm'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => onSortChange(sort)}
                className={`flex-1 py-2 rounded-lg font-medium text-xs uppercase tracking-[0.06em] transition-all duration-200 border-2 ${
                  sortBy === sort
                    ? 'bg-[#6fbf86] text-[#0B1220] border-[#6fbf86] shadow-[0_6px_18px_rgba(10,16,28,0.3)]'
                    : 'bg-panel-navy text-slate-300 border-slate-700 hover:border-[#6fbf86]/40'
                }`}
              >
                {sort === 'id' && '#ID'}
                {sort === 'widthCm' && 'LARG'}
                {sort === 'heightCm' && 'ALT'}
              </button>
            ))}
          </div>
        </div>

        {/* Result Counter */}
        <div className="text-center pt-2 border-t border-slate-700/70">
          <span className="text-sm font-semibold text-[#8FD6A4]">
            ENCONTRADO: <span className="text-[#7BD389] font-semibold">{plants.length}</span>
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          CARD GRID
          ═══════════════════════════════════════════════════════════════════════════ */}
      {plants.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-6xl">🌱</div>
          <p className="text-[#8FD6A4] font-semibold text-lg">NENHUMA PLANTA ENCONTRADA</p>
          <p className="text-[#9fb0c0] text-sm font-normal">Tente ajustar seus filtros</p>

          <button
            type="button"
            onClick={dispatchNewPlant}
            className="mt-2 w-full max-w-[280px] min-h-[160px] rounded-xl border-2 border-dashed border-slate-700/80 bg-[#0B1220]/60 flex flex-col items-center justify-center text-slate-300 hover:border-[#6fbf86] hover:text-[#6fbf86] transition-all duration-200"
          >
            <div className="flex items-center justify-center h-16 w-16 rounded-full border-2 border-current text-4xl">
              +
            </div>
            <span className="mt-4 text-xs font-medium uppercase tracking-[0.06em]">
              Nova planta
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {plants.map((plant) => (
            <PlantCardPreview
              key={plant.id}
              plant={plant}
              isSelected={selectedPlantId === plant.id}
              onClick={() => onSelectPlant(plant.id)}
            />
          ))}

          {/* Botão de nova planta ao lado da última carta */}
          <button
            type="button"
            onClick={dispatchNewPlant}
            className="h-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-700/80 bg-[#0B1220]/60 flex flex-col items-center justify-center text-slate-300 hover:border-[#6fbf86] hover:text-[#6fbf86] transition-all duration-200"
          >
            <div className="flex items-center justify-center h-16 w-16 rounded-full border-2 border-current text-4xl">
              +
            </div>
            <span className="mt-4 text-xs font-medium uppercase tracking-[0.06em]">
              Nova planta
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
