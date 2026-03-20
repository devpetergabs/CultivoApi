import type { Plant } from '../types/pokedex';
import { PlantCardPreview } from './PlantCardPreview';

interface PokedexCardsGridProps {
  plants: Plant[];
  selectedPlantId: number | null;
  onSelectPlant: (id: number) => void;
  onNewPlant: () => void;
}

export function PokedexCardsGrid({ plants, selectedPlantId, onSelectPlant, onNewPlant }: PokedexCardsGridProps) {
  if (plants.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🌱</div>
        <p className="text-[#8FD6A4] font-semibold text-lg">NENHUMA PLANTA ENCONTRADA</p>
        <p className="text-[#9fb0c0] text-sm font-normal">Tente ajustar seus filtros</p>

        <button
          type="button"
          onClick={onNewPlant}
          className="mt-2 w-full max-w-[280px] min-h-[160px] rounded-xl border-2 border-dashed border-slate-700/80 bg-[#0B1220]/60 flex flex-col items-center justify-center text-slate-300 hover:border-[#6fbf86] hover:text-[#6fbf86] transition-all duration-200"
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-full border-2 border-current text-3xl">+</div>
          <span className="mt-3 text-xs font-medium uppercase tracking-[0.06em]">Nova planta</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-4">
      {plants.map((plant) => (
        <PlantCardPreview
          key={plant.id}
          plant={plant}
          isSelected={selectedPlantId === plant.id}
          onClick={() => onSelectPlant(plant.id)}
        />
      ))}

      <button
        type="button"
        onClick={onNewPlant}
        className="h-full min-h-[160px] rounded-xl border-2 border-dashed border-slate-700/80 bg-[#0B1220]/60 flex flex-col items-center justify-center text-slate-300 hover:border-[#6fbf86] hover:text-[#6fbf86] transition-all duration-200"
      >
        <div className="flex items-center justify-center h-12 w-12 rounded-full border-2 border-current text-3xl">+</div>
        <span className="mt-3 text-xs font-medium uppercase tracking-[0.06em]">Nova planta</span>
      </button>
    </div>
  );
}
