import { useEffect } from 'react';
import { usePokedexStore } from '../store/pokedexStore';
import { PokedexGrid } from './PokedexGrid';
import { PlantDetailDrawer } from './PlantDetailDrawer';

export function PokedexLayout() {
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
    filteredPlants,
  } = usePokedexStore();

  const filtered = filteredPlants();
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  useEffect(() => {
    if (selectedPlantId === null) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [selectedPlantId]);

  return (
    <div className="flex flex-col h-screen bg-[#0B1220] text-white overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER - Pokédex Device Frame
          ═══════════════════════════════════════════════════════════════════════════ */}
      <header className="relative border-b-4 border-[#9BEF00] bg-gradient-to-b from-[#E23A3A] to-[#c92a2a] px-6 py-5 shrink-0 shadow-2xl">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#9BEF00]" />
        
        <div className="flex justify-between items-center gap-4">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-float">🌱</div>
            <div>
              <h1 className="text-2xl font-black tracking-wider text-white drop-shadow-lg">
                POKÉDEX PLANTAS
              </h1>
            </div>
          </div>

          {/* Right: Plant Count Badge */}
          <div className="bg-[#9BEF00] text-black rounded-full px-4 py-2 font-black border-3 border-black shadow-lg">
            <div className="text-center">
              <div className="text-xl font-black">{plants.length}</div>
              <div className="text-xs font-bold uppercase tracking-narrow">PLANTAS</div>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#9BEF00]" />
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════════
          MAIN CONTENT - Grid Area
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#0B1220]">
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          DETAIL DRAWER - Right Side Panel
          ═══════════════════════════════════════════════════════════════════════════ */}
      <PlantDetailDrawer
        plant={selectedPlant}
        allPlants={filtered}
        onClose={() => setSelectedPlant(null)}
      />
    </div>
  );
}
