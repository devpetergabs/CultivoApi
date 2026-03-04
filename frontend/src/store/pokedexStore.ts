import { create } from 'zustand';
import type { PokedexStore, Plant } from '../types/pokedex';

const STORAGE_KEY_HIDE_CANNABIS = 'pokedex:hideCannabis';

function readBooleanStorage(key: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function writeBooleanStorage(key: string, value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export const usePokedexStore = create<PokedexStore>((set, get) => ({
  plants: [],
  selectedPlantId: null,
  searchQuery: '',
  selectedType: null,
  sortBy: 'id',

  hideCannabis: readBooleanStorage(STORAGE_KEY_HIDE_CANNABIS, false),

  setPlants: (plants) => set({ plants }),
  setSelectedPlant: (id) => set({ selectedPlantId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedType: (type) => set({ selectedType: type }),
  setSortBy: (sort) => set({ sortBy: sort }),

  setHideCannabis: (hide) => {
    writeBooleanStorage(STORAGE_KEY_HIDE_CANNABIS, hide);
    set({ hideCannabis: hide });
  },

  addPlant: (plant: Plant) =>
    set((state) => ({ plants: [...state.plants, plant] })),

  updatePlant: (plant: Plant) =>
    set((state) => ({
      plants: state.plants.map((p) => (p.id === plant.id ? plant : p)),
    })),

  removePlant: (plantId: number) =>
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== plantId),
      selectedPlantId: state.selectedPlantId === plantId ? null : state.selectedPlantId,
    })),

  filteredPlants: () => {
    const { plants, searchQuery, selectedType, sortBy, hideCannabis } = get();

    let filtered = plants.filter((plant) => {
      const matchesSpecies =
        !hideCannabis || String(plant.species).toUpperCase() !== 'CANNABIS';

      const matchesSearch =
        searchQuery === '' ||
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.id.toString().includes(searchQuery) ||
        plant.variant.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === null || plant.type === selectedType;

      return matchesSpecies && matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'widthCm') return b.widthCm - a.widthCm;
      if (sortBy === 'heightCm') return b.heightCm - a.heightCm;
      if (sortBy === 'stemWidthCm') return b.stemWidthCm - a.stemWidthCm;
      return 0;
    });

    return filtered;
  },
}));