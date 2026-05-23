const STORAGE_KEY = "sp_compare";

export const MAX_COMPARE_SYMBOLS = 4;

export function readCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list)
      ? list.map((s) => String(s).toUpperCase()).slice(0, MAX_COMPARE_SYMBOLS)
      : [];
  } catch {
    return [];
  }
}

export function toggleCompareSymbol(symbol: string): { list: string[]; added: boolean } {
  const sym = symbol.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const list = readCompareList();
  const idx = list.indexOf(sym);
  if (idx >= 0) {
    const next = list.filter((s) => s !== sym);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { list: next, added: false };
  }
  if (list.length >= MAX_COMPARE_SYMBOLS) {
    return { list, added: false };
  }
  const next = [...list, sym];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return { list: next, added: true };
}

export function removeCompareSymbol(symbol: string): string[] {
  const sym = symbol.toUpperCase();
  const list = readCompareList().filter((s) => s !== sym);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function clearCompareList(): void {
  localStorage.removeItem(STORAGE_KEY);
}
