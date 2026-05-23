import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { fetchStockQuote, fetchHistoricalWithSource, type StockQuote } from "@/services/stock-data";
import { applyDataQualityToSignal, assessResearchQuality } from "@/lib/research-quality";
import { computeSmartScore } from "@/lib/smart-score";
import { fmpFetchGainers, fmpFetchLosers } from "@/services/fmp-api";
import { LIQUID_UNIVERSE } from "@/lib/hub-symbols";
import { cleanDisplayLabel } from "@/lib/display-labels";

export interface ScreenerRow {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  signal: string;
  confidence: number;
  riskGrade: string;
  smartScore: number;
  smartLabel: string;
  rsi: number;
  sector: string;
  peRatio: number;
}

export type ScreenerFilter = {
  bias?: "bullish" | "bearish" | "any";
  minSmartScore?: number;
  maxRiskGrade?: string;
  sector?: string;
};

const FORGE_UNIVERSE_CAP = 14;
const SCORE_TIMEOUT_MS = 14_000;
const SCORE_CACHE_MS = 90_000;

/** Map filter label → row sector strings from FMP/profile data */
const SECTOR_FILTER_ALIASES: Record<string, string[]> = {
  Technology: ["technology", "communication"],
  Communication: ["communication", "media"],
  Financial: ["financial", "financial services", "financials"],
  "Consumer Cyclical": ["consumer cyclical", "consumer discretionary"],
  Automotive: ["automotive", "consumer cyclical"],
  Healthcare: ["healthcare", "health care"],
  Energy: ["energy"],
};

const GRADE_ORDER = ["A", "B", "C", "D", "F"];

function sectorMatchesRow(filterSector: string, rowSector: string): boolean {
  const row = rowSector.trim().toLowerCase();
  if (!row) return false;
  const aliases = SECTOR_FILTER_ALIASES[filterSector];
  if (!aliases) return row === filterSector.toLowerCase();
  return aliases.some((a) => row === a || row.includes(a) || a.includes(row));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function rowFromQuote(quote: StockQuote, partial?: Partial<ScreenerRow>): ScreenerRow {
  const change = quote.changePercent;
  const smartScore = Math.round(
    Math.max(25, Math.min(55, 42 + change * 1.2 + (quote.beta > 1.5 ? -3 : 2)))
  );
  return {
    symbol: quote.symbol,
    name: quote.name,
    price: quote.price,
    changePercent: change,
    signal: change > 1.5 ? "Buy" : change < -1.5 ? "Sell" : "Hold",
    confidence: 35,
    riskGrade: quote.beta > 1.4 ? "C" : "B",
    smartScore,
    smartLabel: smartScore >= 58 ? "Buy" : smartScore <= 42 ? "Sell" : "Hold",
    rsi: 50,
    sector: cleanDisplayLabel(quote.sector) || "",
    peRatio: quote.peRatio,
    ...partial,
  };
}

export async function buildScreenerUniverse(): Promise<string[]> {
  const [gainers, losers] = await Promise.all([
    fmpFetchGainers().catch(() => []),
    fmpFetchLosers().catch(() => []),
  ]);
  return Array.from(
    new Set([
      ...LIQUID_UNIVERSE,
      ...gainers.slice(0, 4).map((g) => g.symbol),
      ...losers.slice(0, 3).map((l) => l.symbol),
    ])
  ).slice(0, FORGE_UNIVERSE_CAP);
}

async function scoreForScreenerFull(symbol: string): Promise<ScreenerRow | null> {
  const quote = await fetchStockQuote(symbol);
  if (quote.price <= 0) return null;

  const { history, source: chartSource } = await fetchHistoricalWithSource(symbol, "1m", quote.price);
  const indicators = computeAllIndicators(history);
  const raw = generateSignal(indicators, quote.price);
  const quality = assessResearchQuality({
    chartSource,
    historyBars: history.length,
    newsCount: 0,
    newsSource: "none",
    quoteIsMock: quote.quoteSource === "mock",
    hasFinnhubKey: Boolean(process.env.FINNHUB_API_KEY),
    hasFmpKey: Boolean(process.env.FMP_API_KEY),
  });
  const adjusted = applyDataQualityToSignal(raw, quality);
  const { signal, confidence } = resolveSignal(adjusted.signal, adjusted.confidence);
  const redFlags = detectRedFlags(history, indicators, quote);
  const risk = calculateRiskScore(indicators, quote, redFlags);
  const smart = computeSmartScore({
    signal,
    confidence,
    riskGrade: risk.grade,
    changePercent: quote.changePercent,
    rsi: indicators.rsi,
    researchQualityScore: quality.score,
  });

  return {
    symbol: quote.symbol,
    name: quote.name,
    price: quote.price,
    changePercent: quote.changePercent,
    signal,
    confidence,
    riskGrade: risk.grade,
    smartScore: smart.score,
    smartLabel: smart.label,
    rsi: Math.round(indicators.rsi),
    sector: quote.sector,
    peRatio: quote.peRatio,
  };
}

export async function scoreForScreener(symbol: string): Promise<ScreenerRow | null> {
  try {
    const full = await withTimeout(scoreForScreenerFull(symbol), SCORE_TIMEOUT_MS);
    if (full) return full;
  } catch {
    /* try quote fallback */
  }

  try {
    const quote = await fetchStockQuote(symbol);
    if (quote.price <= 0) return null;
    return rowFromQuote(quote);
  } catch {
    return null;
  }
}

export function filterScreenerRows(rows: ScreenerRow[], filter: ScreenerFilter): ScreenerRow[] {
  const minScore = filter.minSmartScore;
  const hasMin = minScore != null && minScore > 0;

  return rows.filter((r) => {
    if (filter.bias === "bullish" && !r.signal.includes("Buy")) return false;
    if (filter.bias === "bearish" && !r.signal.includes("Sell")) return false;
    if (hasMin && r.smartScore < minScore) return false;
    if (filter.maxRiskGrade) {
      const maxIdx = GRADE_ORDER.indexOf(filter.maxRiskGrade);
      const rowIdx = GRADE_ORDER.indexOf(r.riskGrade);
      if (maxIdx >= 0 && rowIdx > maxIdx) return false;
    }
    if (filter.sector && filter.sector !== "all" && !sectorMatchesRow(filter.sector, r.sector)) {
      return false;
    }
    return true;
  });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 4
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

type ScreenerCache = { rows: ScreenerRow[]; updatedAt: string; scoredAt: number };
let scoredUniverseCache: ScreenerCache | null = null;

export function clearScreenerCache(): void {
  scoredUniverseCache = null;
}

export async function runScreener(filter: ScreenerFilter = {}): Promise<{
  rows: ScreenerRow[];
  updatedAt: string;
  universeSize: number;
  maxSmartScore: number;
  relaxedFilters?: boolean;
  partialData?: boolean;
}> {
  const now = Date.now();
  let baseRows: ScreenerRow[];
  let updatedAt: string;
  let partialData = false;

  if (scoredUniverseCache && now - scoredUniverseCache.scoredAt < SCORE_CACHE_MS) {
    baseRows = scoredUniverseCache.rows;
    updatedAt = scoredUniverseCache.updatedAt;
  } else {
    const symbols = await buildScreenerUniverse();
    const scored = await mapWithConcurrency(symbols, scoreForScreener, 4);
    baseRows = scored.filter((r): r is ScreenerRow => r !== null);

    if (baseRows.length === 0) {
      partialData = true;
      const emergency = await mapWithConcurrency(
        LIQUID_UNIVERSE.slice(0, 10),
        async (sym) => {
          try {
            const quote = await fetchStockQuote(sym);
            return quote.price > 0 ? rowFromQuote(quote) : null;
          } catch {
            return null;
          }
        },
        5
      );
      baseRows = emergency.filter((r): r is ScreenerRow => r !== null);
    }

    updatedAt = new Date().toISOString();
    if (baseRows.length > 0) {
      scoredUniverseCache = { rows: baseRows, updatedAt, scoredAt: now };
    } else {
      scoredUniverseCache = null;
    }
  }

  const maxSmartScore = baseRows.reduce((m, r) => Math.max(m, r.smartScore), 0);
  let filtered = filterScreenerRows(baseRows, filter).sort((a, b) => b.smartScore - a.smartScore);
  let relaxedFilters = false;

  if (filtered.length === 0 && baseRows.length > 0) {
    filtered = [...baseRows].sort((a, b) => b.smartScore - a.smartScore);
    relaxedFilters = true;
  }

  return {
    rows: filtered,
    updatedAt,
    universeSize: baseRows.length,
    maxSmartScore,
    relaxedFilters,
    partialData: partialData || undefined,
  };
}
