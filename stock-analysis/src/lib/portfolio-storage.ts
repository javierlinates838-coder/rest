export interface PortfolioEntry {
  symbol: string;
  shares: number;
  avgCost: number;
}

const KEY = "portfolio";

export function readPortfolio(): PortfolioEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((row: PortfolioEntry) => ({
        symbol: String(row.symbol).toUpperCase().replace(/[^A-Z0-9.-]/g, ""),
        shares: Number(row.shares) || 0,
        avgCost: Number(row.avgCost) || 0,
      }))
      .filter((r) => r.symbol && r.shares > 0);
  } catch {
    return null;
  }
}

export function savePortfolio(entries: PortfolioEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function clearPortfolio(): void {
  localStorage.removeItem(KEY);
}
