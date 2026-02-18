export const DEFAULT_STRAINS = ['Rubi OG Kush', 'Lemon Haze'] as const;

export const CUSTOM_STRAINS_STORAGE_KEY = 'pokedex:customStrains';

export function normalizeStrain(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function loadCustomStrains(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STRAINS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => typeof s === 'string').map(normalizeStrain).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveCustomStrains(strains: string[]): void {
  const normalized = Array.from(new Set(strains.map(normalizeStrain).filter(Boolean)));
  localStorage.setItem(CUSTOM_STRAINS_STORAGE_KEY, JSON.stringify(normalized));
}

export function mergeStrains(...strainLists: Array<Array<string | null | undefined>>): string[] {
  const all = strainLists.flat().filter((s): s is string => typeof s === 'string');
  const normalized = all.map(normalizeStrain).filter(Boolean);
  return Array.from(new Set(normalized));
}

export function brDateToIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  const d = day.padStart(2, '0');
  const m = month.padStart(2, '0');
  const y = year;
  if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return null;
  return `${y}-${m}-${d}`;
}

export function isoDateToBr(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

export type PotEnum = 'CINCO_L' | 'VINTE_E_UM_L' | 'TRINTA_L';

export function potLitersToEnum(value: number): PotEnum {
  if (value === 5) return 'CINCO_L';
  if (value === 21) return 'VINTE_E_UM_L';
  if (value === 30) return 'TRINTA_L';
  return 'CINCO_L';
}

export function potEnumToLiters(value: string): number {
  if (value === 'CINCO_L') return 5;
  if (value === 'VINTE_E_UM_L') return 21;
  if (value === 'TRINTA_L') return 30;
  return 0;
}
