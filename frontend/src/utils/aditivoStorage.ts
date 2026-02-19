export type AditivoStock = {
  tenhoEmEstoque: boolean;
  // mL por frasco
  mlFrasco: number;
  // quantidade de frascos
  unidades: number;
  // estoque total real do produto (mL)
  estoqueMl: number;
  // capacidade inicial (mlFrasco * unidades) usada como denominador estável da barra
  capacidadeInicialMl?: number;
  importanceStars?: number;
};

const ICON_PREFIX = 'pokedex:aditivo:icon:';
const STOCK_PREFIX = 'pokedex:aditivo:stock:';

const MAX_ICON_FILE_BYTES = 300 * 1024;

export const ADITIVO_STOCK_UPDATED_EVENT = 'pokedex:aditivo-stock-updated';

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function getAditivoIconKey(id: number): string {
  return `${ICON_PREFIX}${id}`;
}

export function getAditivoStockKey(id: number): string {
  return `${STOCK_PREFIX}${id}`;
}

export function getAditivoIcon(id: number): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(getAditivoIconKey(id));
  } catch {
    return null;
  }
}

export function setAditivoIcon(id: number, dataUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getAditivoIconKey(id), dataUrl);
  } catch {
    // ignore storage quota errors for now
  }
}

export function validateIconFile(file: File): string | null {
  if (!file) return 'Arquivo inválido.';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return 'Formato inválido. Use PNG, JPG ou WEBP.';
  }
  if (file.size > MAX_ICON_FILE_BYTES) {
    return 'Imagem muito grande. Use até 300KB.';
  }
  return null;
}

export function getAditivoStock(id: number): AditivoStock {
  const fallback: AditivoStock = {
    tenhoEmEstoque: true,
    mlFrasco: 0,
    unidades: 0,
    estoqueMl: 0,
    capacidadeInicialMl: undefined,
    importanceStars: 3,
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(getAditivoStockKey(id));
    const parsed = safeParseJson<Record<string, unknown>>(raw);
    if (!parsed) return fallback;

    // Backward compatibility:
    // - Old fields: quantidadeUnidades, volumeAtualMl, volumeTotalMl
    // - New fields: unidades, mlFrasco, estoqueMl
    const unidades =
      normalizeNumber(parsed.unidades) || normalizeNumber(parsed.quantidadeUnidades);
    const mlFrasco =
      normalizeNumber(parsed.mlFrasco) || normalizeNumber(parsed.volumeAtualMl);

    const manualTotal = normalizeNumber((parsed as any).estoqueMl);
    const legacyTotal = normalizeNumber((parsed as any).volumeTotalMl);
    const computed = unidades > 0 && mlFrasco > 0 ? unidades * mlFrasco : 0;
    const estoqueMl = manualTotal > 0 ? manualTotal : legacyTotal > 0 ? legacyTotal : computed;

    const capacidadeInicialMl = normalizeNumber((parsed as any).capacidadeInicialMl);

    return {
      tenhoEmEstoque: normalizeBoolean(parsed.tenhoEmEstoque, true),
      unidades,
      mlFrasco,
      estoqueMl,
      capacidadeInicialMl: capacidadeInicialMl > 0 ? capacidadeInicialMl : undefined,
      importanceStars: normalizeNumber(parsed.importanceStars) || 3,
    };
  } catch {
    return fallback;
  }
}

export function setAditivoStock(id: number, payload: AditivoStock): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getAditivoStockKey(id), JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(ADITIVO_STOCK_UPDATED_EVENT, { detail: { id } }));
  } catch {
    // ignore storage quota errors for now
  }
}

export type StockDerived = {
  hasData: boolean;
  capacidadeMl: number;
  estoqueMl: number;
  isEmpty: boolean;
  isLow: boolean;
};

export function getDerivedStock(stock: AditivoStock): StockDerived {
  const hasData =
    stock.mlFrasco > 0 || stock.unidades > 0 || stock.estoqueMl > 0 || stock.tenhoEmEstoque === false;

  const capacidadeBase =
    typeof stock.capacidadeInicialMl === 'number' && stock.capacidadeInicialMl > 0
      ? stock.capacidadeInicialMl
      : stock.mlFrasco > 0 && stock.unidades > 0
      ? stock.mlFrasco * stock.unidades
      : 0;

  const estoque = stock.estoqueMl;

  const isEmpty = hasData && (stock.tenhoEmEstoque === false || estoque <= 0);
  const isLow = hasData && !isEmpty && estoque <= 200;

  return {
    hasData,
    capacidadeMl: capacidadeBase,
    estoqueMl: estoque,
    isEmpty,
    isLow,
  };
}

export function isAditivoOutOfStock(id: number): boolean {
  const stock = getAditivoStock(id);
  const derived = getDerivedStock(stock);
  return derived.isEmpty;
}

export function deductAditivoStockMl(id: number, usedMl: number): AditivoStock {
  const stock = getAditivoStock(id);
  const derived = getDerivedStock(stock);

  // If there's no stock data configured yet, we still allow deduction, but treat base as current estoqueMl.
  const current = derived.hasData ? stock.estoqueMl : stock.estoqueMl;
  const next = Math.max(0, current - Math.max(0, normalizeNumber(usedMl)));

  const hasData = derived.hasData || stock.mlFrasco > 0 || stock.unidades > 0 || next > 0;

  const nextStock: AditivoStock = {
    ...stock,
    estoqueMl: next,
    // When it hits 0, mark as not in stock.
    tenhoEmEstoque: hasData && next === 0 ? false : stock.tenhoEmEstoque,
  };

  setAditivoStock(id, nextStock);
  return nextStock;
}
