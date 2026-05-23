const STORAGE_KEY = "sp_compare";
const MAX = 4;

export function readCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) ? list.map((s) => String(s).toUpperCase()).slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function toggleCompareSymbol(symbol: string): string[] {
  const sym = symbol.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const list = readCompareList();
  const idx = list.indexOf(sym);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else if (list.length < MAX) {
    list.push(sym);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
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
