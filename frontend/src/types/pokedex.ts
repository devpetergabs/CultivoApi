export type PlantType = 'GERMINACAO' | 'VEGETATIVO' | 'FLORACAO_INICIAL' | 'FLORACAO_MEDIA' | 'FLORACAO_AVANCADA' | 'FINALIZACAO';

export interface Plant {
  id: number;
  name: string;
  type: PlantType;
  heightCm: number;       // altura (cm)
  widthCm: number;        // largura (cm)
  stemWidthCm: number;    // largura do caule (cm)
  variant: string;        // strain/variety name
  potLiters: number;      // tamanho do vaso (liters)
  imageUrl: string;       // emoji or URL
  growerName: string;     // nome do cultivador
  growerPhone?: string;   // telefone do cultivador (opcional)
  germinationDate: string | null; // data de germinação (dd/mm/yyyy)
  sexo?: string | null;   // sexo da planta (FEMEA, MACHO, HERMAFRODITA)
  dataSexagem?: string | null; // data da sexagem (dd/mm/yyyy)
  dataFloracao?: string | null; // data de início da floração (dd/mm/yyyy)
}

export interface PokedexStore {
  plants: Plant[];
  selectedPlantId: number | null;
  searchQuery: string;
  selectedType: PlantType | null;
  sortBy: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm';

  setPlants: (plants: Plant[]) => void;
  setSelectedPlant: (id: number | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: PlantType | null) => void;
  setSortBy: (sort: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm') => void;
  addPlant: (plant: Plant) => void;
  updatePlant: (plant: Plant) => void;
  removePlant: (plantId: number) => void;

  filteredPlants: () => Plant[];
}
