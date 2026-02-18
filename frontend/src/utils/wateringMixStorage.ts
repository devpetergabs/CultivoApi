import type { Aditivo } from '../types';

export type StoredWateringMixItem = Pick<
  Aditivo,
  'id' | 'nome' | 'marca' | 'classe' | 'estagio' | 'dosePadraoEmML'
> & {
  doseMl: number;
};

export type LegacyWateringMixItem = {
  id: number;
  doseMl: number;
};

export function wateringMixStorageKey(plantId: number): string {
  return `plant:${plantId}:watering-mix`;
}

export function legacyWateringMixStorageKey(plantId: number): string {
  return `plant-${plantId}-watering-mix`;
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function normalizeDoseMl(value: unknown): number {
  const dose = Number(value);
  if (!Number.isFinite(dose) || dose <= 0) return 0;
  return Math.round(dose);
}

export function loadWateringMix(plantId: number): StoredWateringMixItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(wateringMixStorageKey(plantId));
    if (!raw) return [];
    const parsed = safeParseJson(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const id = Number(record.id);
        const doseMl = normalizeDoseMl(record.doseMl);
        if (!Number.isFinite(id) || id <= 0 || doseMl <= 0) return null;

        const nome = typeof record.nome === 'string' ? record.nome : '';
        const marca = typeof record.marca === 'string' ? record.marca : '';
        const classe = typeof record.classe === 'string' ? record.classe : 'OUTROS';
        const estagio = typeof record.estagio === 'string' ? record.estagio : '';
        const dosePadraoEmML =
          record.dosePadraoEmML === null || typeof record.dosePadraoEmML === 'number'
            ? (record.dosePadraoEmML as number | null)
            : null;

        return {
          id: Math.round(id),
          nome,
          marca,
          classe,
          estagio,
          dosePadraoEmML,
          doseMl,
        } satisfies StoredWateringMixItem;
      })
      .filter((x): x is StoredWateringMixItem => x !== null);
  } catch {
    return [];
  }
}

export function saveWateringMix(plantId: number, mix: StoredWateringMixItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = mix
      .map((item) => ({
        ...item,
        id: Math.round(Number(item.id)),
        doseMl: normalizeDoseMl(item.doseMl),
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.doseMl > 0);

    localStorage.setItem(wateringMixStorageKey(plantId), JSON.stringify(normalized));
  } catch {
    // ignore
  }
}

export function clearWateringMix(plantId: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(wateringMixStorageKey(plantId));
  } catch {
    // ignore
  }
}

export function loadLegacyWateringMix(plantId: number): LegacyWateringMixItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(legacyWateringMixStorageKey(plantId));
    if (!raw) return [];
    const parsed = safeParseJson(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const id = Number(record.id);
        const doseMl = normalizeDoseMl(record.doseMl);
        if (!Number.isFinite(id) || id <= 0 || doseMl <= 0) return null;
        return { id: Math.round(id), doseMl };
      })
      .filter((x): x is LegacyWateringMixItem => x !== null);
  } catch {
    return [];
  }
}
