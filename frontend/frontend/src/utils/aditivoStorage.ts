export type AditivoStock = {
  /**
   * Se existe registro de estoque no backend (produto "rastreado").
   * Quando o estoque zera, continua tracked=true (não volta a "não rastreado").
   */
  tracked: boolean;
  tipoProduto: string | null;
  stockMlAtual: number;
  // metadados (não reabastecem automaticamente)
  unidades: number;
  mlFrasco: number;
};

const ICON_PREFIX = 'pokedex:aditivo:icon:';
const STOCK_PREFIX = 'pokedex:produto:estoque:';

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
    // ignore storage quota errors
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

/**
 * Cache local: SEMPRE começa "sem estoque".
 * A fonte real pode ser o backend, mas nós NÃO criamos estoque automaticamente no cliente.
 * Só existe estoque quando o usuário rastrear (tracked=true) via UI.
 */
export function getAditivoStock(id: number): AditivoStock {
  const fallback: AditivoStock = {
    tracked: false,
    tipoProduto: null,
    stockMlAtual: 0,
    unidades: 0,
    mlFrasco: 0,
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(getAditivoStockKey(id));
    const parsed = safeParseJson<Record<string, unknown>>(raw);
    if (!parsed) return fallback;

    const tracked = Boolean(parsed.tracked);

    // ✅ Se não está tracked, tratamos como "não existe estoque"
    if (!tracked) return fallback;

    return {
      tracked: true,
      tipoProduto: (typeof parsed.tipoProduto === 'string' ? parsed.tipoProduto : null) as string | null,
      stockMlAtual: normalizeNumber(parsed.stockMlAtual),
      unidades: normalizeNumber(parsed.unidades),
      mlFrasco: normalizeNumber(parsed.mlFrasco),
    };
  } catch {
    return fallback;
  }
}

/**
 * ✅ Regra do MVP:
 * - tracked=false => NÃO salva no localStorage (remove)
 * - tracked=true  => salva e notifica UI
 */
export function setAditivoStock(id: number, payload: AditivoStock): void {
  if (typeof window === 'undefined') return;

  try {
    if (!payload?.tracked) {
      localStorage.removeItem(getAditivoStockKey(id));
      window.dispatchEvent(new CustomEvent(ADITIVO_STOCK_UPDATED_EVENT, { detail: { id } }));
      return;
    }

    localStorage.setItem(getAditivoStockKey(id), JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(ADITIVO_STOCK_UPDATED_EVENT, { detail: { id } }));
  } catch {
    // ignore storage errors
  }
}

/**
 * ✅ IMPORTANTÍSSIMO:
 * NÃO criar estoque automaticamente ao abrir o app.
 *
 * Esse sync agora só atualiza itens que já estão tracked localmente.
 * Ou seja: se o usuário nunca "ativou estoque" daquele produto,
 * ele continua sem estoque no inventário.
 */
export function syncAditivoStocksFromApi(items: Array<{ id: number; tipo?: string | null; estoque?: any }>): void {
  if (typeof window === 'undefined') return;

  for (const item of items) {
    if (!item || typeof item.id !== 'number') continue;
    const est = item.estoque;
    if (!est) continue;

    // ✅ só sincroniza se já existir local e estiver tracked
    const current = getAditivoStock(item.id);
    if (!current.tracked) continue;

    const payload: AditivoStock = {
      tracked: true,
      tipoProduto:
        (typeof est.tipoProduto === 'string'
          ? est.tipoProduto
          : typeof item.tipo === 'string'
            ? item.tipo
            : current.tipoProduto) ?? null,
      stockMlAtual: normalizeNumber(est.stockMlAtual ?? current.stockMlAtual),
      unidades: normalizeNumber(est.unidades ?? current.unidades),
      mlFrasco: normalizeNumber(est.mlFrasco ?? current.mlFrasco),
    };

    setAditivoStock(item.id, payload);
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
  const hasData = stock.tracked;

  const capacidadeMl = stock.unidades > 0 && stock.mlFrasco > 0 ? stock.unidades * stock.mlFrasco : 0;
  const estoqueMl = stock.stockMlAtual;

  const isEmpty = hasData && estoqueMl <= 0;
  const isLow = hasData && !isEmpty && estoqueMl <= 200;

  return {
    hasData,
    capacidadeMl,
    estoqueMl,
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

  // Só debita se o produto estiver rastreado
  if (!derived.hasData) return stock;

  const next = Math.max(0, derived.estoqueMl - Math.max(0, normalizeNumber(usedMl)));

  const nextStock: AditivoStock = {
    ...stock,
    stockMlAtual: next,
    tracked: true,
  };

  setAditivoStock(id, nextStock);
  return nextStock;
}

/**
 * ✅ Utilitário opcional: limpa TODOS os estoques 1x (pra resetar sujeira antiga)
 * Chame no App.tsx ou InventoryPage, só durante desenvolvimento/migração.
 */
export function resetAllAditivoStocksOnce(version = 'v1'): void {
  if (typeof window === 'undefined') return;

  const flag = `pokedex:stocks-reset:${version}`;
  try {
    if (localStorage.getItem(flag)) return;

    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith(STOCK_PREFIX)) localStorage.removeItem(k);
    }

    localStorage.setItem(flag, '1');
  } catch {
    // ignore
  }
}