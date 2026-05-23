import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { fetchStockQuote, fetchHistoricalWithSource } from "@/services/stock-data";
import { applyDataQualityToSignal, assessResearchQuality } from "@/lib/research-quality";
import { computeSmartScore } from "@/lib/smart-score";
import { fmpFetchGainers, fmpFetchLosers } from "@/services/fmp-api";
import { LIQUID_UNIVERSE } from "@/lib/hub-symbols";

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

export async function buildScreenerUniverse(): Promise<string[]> {
  const [gainers, losers] = await Promise.all([
    fmpFetchGainers().catch(() => []),
    fmpFetchLosers().catch(() => []),
  ]);
  return Array.from(
    new Set([
      ...LIQUID_UNIVERSE,
      ...gainers.slice(0, 10).map((g) => g.symbol),
      ...losers.slice(0, 6).map((l) => l.symbol),
    ])
  ).slice(0, 24);
}

export async function scoreForScreener(symbol: string): Promise<ScreenerRow | null> {
  try {
    const quote = await fetchStockQuote(symbol);
    if (quote.price <= 0) return null;

    const { history, source: chartSource } = await fetchHistoricalWithSource(symbol, "3m", quote.price);
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
  } catch {
    return null;
  }
}

const GRADE_ORDER = ["A", "B", "C", "D", "F"];

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

function sectorMatchesRow(filterSector: string, rowSector: string): boolean {
  const row = rowSector.trim().toLowerCase();
  if (!row) return false;
  const aliases = SECTOR_FILTER_ALIASES[filterSector];
  if (!aliases) return row === filterSector.toLowerCase();
  return aliases.some((a) => row === a || row.includes(a) || a.includes(row));
}

export function filterScreenerRows(rows: ScreenerRow[], filter: ScreenerFilter): ScreenerRow[] {
  return rows.filter((r) => {
    if (filter.bias === "bullish" && !r.signal.includes("Buy")) return false;
    if (filter.bias === "bearish" && !r.signal.includes("Sell")) return false;
    if (filter.minSmartScore != null && r.smartScore < filter.minSmartScore) return false;
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
  concurrency = 5
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
const SCORE_CACHE_MS = 90_000;

export async function runScreener(filter: ScreenerFilter = {}): Promise<{
  rows: ScreenerRow[];
  updatedAt: string;
  universeSize: number;
  maxSmartScore: number;
}> {
  const now = Date.now();
  let baseRows: ScreenerRow[];
  let updatedAt: string;

  if (scoredUniverseCache && now - scoredUniverseCache.scoredAt < SCORE_CACHE_MS) {
    baseRows = scoredUniverseCache.rows;
    updatedAt = scoredUniverseCache.updatedAt;
  } else {
    const symbols = await buildScreenerUniverse();
    const scored = await mapWithConcurrency(symbols, scoreForScreener, 5);
    baseRows = scored.filter((r): r is ScreenerRow => r !== null);
    updatedAt = new Date().toISOString();
    scoredUniverseCache = { rows: baseRows, updatedAt, scoredAt: now };
  }

  const filtered = filterScreenerRows(baseRows, filter).sort((a, b) => b.smartScore - a.smartScore);
  const maxSmartScore = baseRows.reduce((m, r) => Math.max(m, r.smartScore), 0);

  return {
    rows: filtered,
    updatedAt,
    universeSize: baseRows.length,
    maxSmartScore,
  };
}
