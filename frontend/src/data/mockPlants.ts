import type { Plant } from '../types/pokedex';

export const MOCK_PLANTS: Plant[] = [
  {
    id: 1,
    name: 'P1',
    type: 'FLORACAO_AVANCADA',
    heightCm: 170,
    widthCm: 90,
    stemWidthCm: 9.5,
    variant: 'Rubi OG Kush',
    potLiters: 21,
    imageUrl: '🌿',
    growerName: 'Gabriel',
    growerPhone: '+55 11 99999999',
    germinationDate: '28/09/2025',
    sexo: 'FEMEA',
    dataSexagem: '18/10/2025',
    dataFloracao: '30/10/2025',
  },
  {
    id: 2,
    name: 'P2',
    type: 'VEGETATIVO',
    heightCm: 75,
    widthCm: 48,
    stemWidthCm: 10,
    variant: 'Blue Dream',
    potLiters: 30,
    imageUrl: '🌸',
    growerName: 'Maria Silva',
    growerPhone: '+55 21 98888888',
    germinationDate: '10/12/2024',
  }
];
