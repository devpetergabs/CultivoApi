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

const STAGES: PlantType[] = ['GERMINACAO', 'VEGETATIVO', 'FLORACAO_INICIAL', 'FLORACAO_AVANCADA'];

const STAGE_CONFIG: Record<PlantType, { emoji: string; label: string; color: string }> = {
  'GERMINACAO': { emoji: '🌱', label: 'Germinação', color: 'bg-blue-600 border-blue-400' },
  'VEGETATIVO': { emoji: '🌿', label: 'Vegetativo', color: 'bg-green-600 border-green-400' },
  'FLORACAO_INICIAL': { emoji: '🌸', label: 'Floração Inicial', color: 'bg-pink-600 border-pink-400' },
  'FLORACAO_AVANCADA': { emoji: '🌷', label: 'Floração Avançada', color: 'bg-red-600 border-red-400' },
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
  return (
    <div className="flex flex-col h-full gap-4 p-6 overflow-y-auto">
      {/* ═══════════════════════════════════════════════════════════════════════════
          CONTROL PANEL
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 pokedex-card-frame p-5 space-y-4 border-cyan-500/30">
        {/* Search Bar */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-pokedex-neon uppercase tracking-widest">
            🔍 Buscar Pokédex
          </label>
          <input
            type="text"
            placeholder="Nome, ID ou strain..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-pokedex-dark-2 border-2 border-pokedex-dark-2 rounded-lg px-4 py-3 text-white placeholder-slate-500 
              focus:outline-none focus:border-pokedex-neon focus:ring-1 focus:ring-pokedex-neon/50
              font-semibold transition-all duration-200 shadow-neon"
          />
        </div>

        {/* Stage Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-pokedex-neon uppercase tracking-widest">
            🌱 Filtrar por Estágio
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              onClick={() => onTypeChange(null)}
              className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-200 border-2 ${
                selectedType === null
                  ? 'bg-pokedex-neon text-black border-pokedex-neon shadow-neon-strong'
                  : 'bg-pokedex-dark-2 text-slate-300 border-slate-600 hover:border-pokedex-neon/50'
              }`}
            >
              Todos
            </button>
            {STAGES.map((stage) => {
              const config = STAGE_CONFIG[stage];
              return (
                <button
                  key={stage}
                  onClick={() => onTypeChange(selectedType === stage ? null : stage)}
                  title={config.label}
                  className={`py-2 px-2 rounded-lg font-bold text-sm transition-all duration-200 border-2 flex flex-col items-center gap-1 ${
                    selectedType === stage
                      ? `${config.color} text-white shadow-lg`
                      : 'bg-pokedex-dark-2 text-slate-300 border-slate-600 hover:border-slate-400'
                  }`}
                >
                  <span className="text-lg">{config.emoji}</span>
                  <span className="hidden lg:inline text-xs whitespace-nowrap">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-pokedex-neon uppercase tracking-widest">
            📊 Ordenar por
          </label>
          <div className="flex gap-2">
            {(['id', 'widthCm', 'heightCm'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => onSortChange(sort)}
                className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-200 border-2 ${
                  sortBy === sort
                    ? 'bg-pokedex-neon-green text-black border-pokedex-neon-green shadow-lg'
                    : 'bg-pokedex-dark-2 text-slate-300 border-slate-600 hover:border-pokedex-neon-green/50'
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
        <div className="text-center pt-2 border-t border-slate-700">
          <span className="text-sm font-black text-pokedex-neon">
            ENCONTRADO: <span className="text-pokedex-neon-green">{plants.length}</span>
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          CARD GRID
          ═══════════════════════════════════════════════════════════════════════════ */}
      {plants.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-6xl">🌱</div>
          <p className="text-pokedex-neon font-bold text-lg">NENHUMA PLANTA ENCONTRADA</p>
          <p className="text-slate-400 text-sm">Tente ajustar seus filtros</p>
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
        </div>
      )}
    </div>
  );
}
