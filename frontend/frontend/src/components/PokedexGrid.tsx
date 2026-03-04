import { useEffect, useState } from 'react';
import type { Plant, PlantType } from '../types/pokedex';
import { BulkInsecticideModal } from './BulkInsecticideModal';
import { PokedexFiltersBar } from './PokedexFiltersBar';
import { PokedexCardsGrid } from './PokedexCardsGrid';

interface PokedexGridProps {
  plants: Plant[];
  selectedPlantId: number | null;
  onSelectPlant: (id: number) => void;

  searchQuery: string;
  onSearchChange: (query: string) => void;

  selectedType: PlantType | null;
  onTypeChange: (type: PlantType | null) => void;

  sortBy: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm';
  onSortChange: (sort: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm') => void;

  hideCannabis: boolean;
  onHideCannabisChange: (hide: boolean) => void;
}

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
  hideCannabis,
  onHideCannabisChange,
}: PokedexGridProps) {
  const [bulkState, setBulkState] = useState<{
    open: boolean;
    initialTab: 'APPLY' | 'AGENDA';
    focus: any | null;
    sourcePlantId: number | null;
  }>({ open: false, initialTab: 'APPLY', focus: null, sourcePlantId: null });

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail ?? {};
      const tab = detail?.tab === 'AGENDA' ? 'AGENDA' : 'APPLY';
      setBulkState({
        open: true,
        initialTab: tab,
        focus: detail?.focus ?? null,
        sourcePlantId: typeof detail?.sourcePlantId === 'number' ? detail.sourcePlantId : null,
      });
    };

    window.addEventListener('bulk-insecticide:open', handler as any);
    return () => window.removeEventListener('bulk-insecticide:open', handler as any);
  }, []);

  const dispatchNewPlant = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('pokedex:new-plant'));
  };

  return (
    <div className="flex flex-col h-full gap-4 p-6 overflow-y-auto">
      <PokedexFiltersBar
        plantsCount={plants.length}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedType={selectedType}
        onTypeChange={onTypeChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        hideCannabis={hideCannabis}
        onHideCannabisChange={onHideCannabisChange}
        onOpenBulkInsecticide={() => setBulkState({ open: true, initialTab: 'APPLY', focus: null, sourcePlantId: null })}
      />

      <PokedexCardsGrid
        plants={plants}
        selectedPlantId={selectedPlantId}
        onSelectPlant={onSelectPlant}
        onNewPlant={dispatchNewPlant}
      />

      <BulkInsecticideModal
        open={bulkState.open}
        onClose={() => setBulkState((s) => ({ ...s, open: false }))}
        plants={plants}
        initialTab={bulkState.initialTab}
        agendaFocus={bulkState.focus}
        sourcePlantId={bulkState.sourcePlantId}
      />
    </div>
  );
}
