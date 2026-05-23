const STORAGE_KEY = "watchlist";

export const DEFAULT_WATCHLIST = ["AAPL", "TSLA", "NVDA", "GOOGL", "AMD", "MSFT"] as const;

/** Symbols shown when nothing saved yet (always a new array). */
export function getWatchlistSymbols(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_WATCHLIST];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_WATCHLIST];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_WATCHLIST];
    return parsed.map((s) => String(s).toUpperCase());
  } catch {
    return [...DEFAULT_WATCHLIST];
  }
}

export function saveWatchlistSymbols(symbols: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(symbols.map((s) => s.toUpperCase()))
  );
}

export function addWatchlistSymbol(symbol: string): string[] {
  const sym = symbol.trim().toUpperCase();
  const list = getWatchlistSymbols();
  if (list.includes(sym)) return list;
  const next = [...list, sym];
  saveWatchlistSymbols(next);
  return next;
}

export function removeWatchlistSymbol(symbol: string): string[] {
  const sym = symbol.trim().toUpperCase();
  const next = getWatchlistSymbols().filter((s) => s !== sym);
  saveWatchlistSymbols(next);
  return next;
}
