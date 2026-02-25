export type PlantType =
  | 'GERMINACAO'
  | 'VEGETATIVO'
  | 'FLORACAO_INICIAL'
  | 'FLORACAO_MEDIA'
  | 'FLORACAO_AVANCADA'
  | 'FINALIZACAO';

export type PlantSpecies = 'CANNABIS' | 'ROSEIRA' | 'OUTRA' | string;

export interface Plant {
  id: number;
  name: string;
  type: PlantType;
  species: PlantSpecies;
  heightCm: number;
  widthCm: number;
  stemWidthCm: number;
  variant: string;
  potLiters: number;
  imageUrl: string;
  growerName: string;
  growerPhone?: string;
  germinationDate: string | null;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
  level: number;
}

export interface PokedexStore {
  plants: Plant[];
  selectedPlantId: number | null;
  searchQuery: string;
  selectedType: PlantType | null;
  sortBy: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm';

  hideCannabis: boolean;

  setPlants: (plants: Plant[]) => void;
  setSelectedPlant: (id: number | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: PlantType | null) => void;
  setSortBy: (sort: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm') => void;
  setHideCannabis: (hide: boolean) => void;

  addPlant: (plant: Plant) => void;
  updatePlant: (plant: Plant) => void;
  removePlant: (plantId: number) => void;

  filteredPlants: () => Plant[];
}