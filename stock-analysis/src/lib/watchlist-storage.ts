const STORAGE_KEY = "watchlist";

export const DEFAULT_WATCHLIST = ["AAPL", "TSLA", "NVDA", "GOOGL", "AMD", "MSFT"] as const;

function readStoredWatchlist(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((s) => String(s).toUpperCase());
  } catch {
    return null;
  }
}

/** Demo list on first visit; empty array when user cleared the list. */
export function getWatchlistSymbols(): string[] {
  const stored = readStoredWatchlist();
  if (stored === null) return [...DEFAULT_WATCHLIST];
  return stored;
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
  const stored = readStoredWatchlist();
  const visible = stored === null ? [...DEFAULT_WATCHLIST] : stored;
  if (visible.includes(sym)) return visible;
  const base = stored === null ? [...DEFAULT_WATCHLIST] : stored;
  const next = [...base, sym];
  saveWatchlistSymbols(next);
  return next;
}

export function removeWatchlistSymbol(symbol: string): string[] {
  const sym = symbol.trim().toUpperCase();
  const next = getWatchlistSymbols().filter((s) => s !== sym);
  saveWatchlistSymbols(next);
  return next;
}
