const STORAGE_KEY = "watchlist";
const META_KEY = "watchlist_meta";

export const DEFAULT_WATCHLIST = [
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "AMD",
  "JPM",
  "UNH",
] as const;

type WatchlistMeta = Record<string, string>;

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

function readMeta(): WatchlistMeta {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as WatchlistMeta) : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: WatchlistMeta): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/** Demo list on first visit; empty array when user cleared the list. */
export function getWatchlistSymbols(): string[] {
  const stored = readStoredWatchlist();
  if (stored === null) return [...DEFAULT_WATCHLIST];
  return stored;
}

export function getWatchlistAddedAt(symbol: string): string | undefined {
  return readMeta()[symbol.toUpperCase()];
}

export function saveWatchlistSymbols(symbols: string[]): void {
  if (typeof window === "undefined") return;
  const upper = symbols.map((s) => s.toUpperCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(upper));
  const meta = readMeta();
  const now = new Date().toISOString();
  for (const sym of upper) {
    if (!meta[sym]) meta[sym] = now;
  }
  for (const key of Object.keys(meta)) {
    if (!upper.includes(key)) delete meta[key];
  }
  writeMeta(meta);
}

export function addWatchlistSymbol(symbol: string): string[] {
  const sym = symbol.trim().toUpperCase();
  const stored = readStoredWatchlist();
  const visible = stored === null ? [...DEFAULT_WATCHLIST] : stored;
  if (visible.includes(sym)) return visible;
  const base = stored === null ? [...DEFAULT_WATCHLIST] : stored;
  const next = [...base, sym];
  const meta = readMeta();
  meta[sym] = new Date().toISOString();
  writeMeta(meta);
  saveWatchlistSymbols(next);
  return next;
}

export function removeWatchlistSymbol(symbol: string): string[] {
  const sym = symbol.trim().toUpperCase();
  const next = getWatchlistSymbols().filter((s) => s !== sym);
  saveWatchlistSymbols(next);
  return next;
}
