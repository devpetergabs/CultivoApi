import { create } from 'zustand';
import type { PokedexStore, PlantType, Plant } from '../types/pokedex';

export const usePokedexStore = create<PokedexStore>((set, get) => ({
  plants: [],
  selectedPlantId: null,
  searchQuery: '',
  selectedType: null,
  sortBy: 'id',

  setPlants: (plants) => set({ plants }),
  setSelectedPlant: (id) => set({ selectedPlantId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedType: (type) => set({ selectedType: type }),
  setSortBy: (sort) => set({ sortBy: sort }),

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
    const { plants, searchQuery, selectedType, sortBy } = get();

    let filtered = plants.filter((plant) => {
      const matchesSearch =
        searchQuery === '' ||
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.id.toString().includes(searchQuery) ||
        plant.variant.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === null || plant.type === selectedType;

      return matchesSearch && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'widthCm') return b.widthCm - a.widthCm;
      if (sortBy === 'heightCm') return b.heightCm - a.heightCm;
      return 0;
    });

    return filtered;
  },
}));

