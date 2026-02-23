import type { Planta } from '../types';
import type { Plant, PlantType } from '../types/pokedex';

const VASO_LITERS: Record<string, number> = {
  CINCO_L: 5,
  VINTE_E_UM_L: 21,
  TRINTA_L: 30,
};

const DEFAULT_GROWER_NAME = 'Cultivador Demo';
const DEFAULT_GROWER_PHONE = '(11) 98765-4321';

function formatIsoDateToBr(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

export function mapPlantaToPokedexPlant(
  planta: Planta,
  grower?: { name?: string | null; phone?: string | null }
): Plant {
  const type = (planta.estagio || 'GERMINACAO') as PlantType;
  const potLiters = VASO_LITERS[planta.tamanhoVaso] ?? 0;

  return {
    id: planta.id,
    name: planta.nome,
    type,
    heightCm: planta.altura,
    widthCm: planta.largura,
    stemWidthCm: planta.larguraCaule,
    variant: planta.strain ?? '',
    potLiters,
    imageUrl: '🌿',
    growerName: grower?.name || DEFAULT_GROWER_NAME,
    growerPhone: grower?.phone || DEFAULT_GROWER_PHONE,
    germinationDate: formatIsoDateToBr((planta as any).dataGerminacao),
    sexo: planta.sexo ?? null,
    dataSexagem: formatIsoDateToBr((planta as any).dataSexagem),
    dataFloracao: formatIsoDateToBr((planta as any).dataFloracao),
    level: planta.level ?? 0,
  };
}
