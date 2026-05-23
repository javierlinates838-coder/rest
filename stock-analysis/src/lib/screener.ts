import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { fetchStockQuote, fetchHistoricalWithSource, type StockQuote } from "@/services/stock-data";
import { applyDataQualityToSignal, assessResearchQuality } from "@/lib/research-quality";
import { computeSmartScore } from "@/lib/smart-score";
import { fmpFetchGainers, fmpFetchLosers } from "@/services/fmp-api";
import { LIQUID_UNIVERSE } from "@/lib/hub-symbols";
import { cleanDisplayLabel } from "@/lib/display-labels";
import { normalizeSectorLabel, sectorMatchesRow, symbolsForSectorFilter } from "@/lib/sectors";

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
  tone: "bullish" | "neutral" | "bearish";
  /** Tape + technical direction for Alpha Forge long/short filters */
  forgeBias: "bullish" | "neutral" | "bearish";
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

const FORGE_UNIVERSE_CAP = 18;
const SCORE_TIMEOUT_MS = 14_000;
const SCORE_CACHE_MS = 90_000;

const GRADE_ORDER = ["A", "B", "C", "D", "F"];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function isBuyLabel(signal: string, label: string): boolean {
  return signal === "Strong Buy" || signal === "Buy" || label === "Strong Buy" || label === "Buy";
}

function isSellLabel(signal: string, label: string): boolean {
  return signal === "Strong Sell" || signal === "Sell" || label === "Strong Sell" || label === "Sell";
}

/** Symmetric long/short classification — session % change weighted like bear path */
export function deriveForgeBias(input: {
  changePercent: number;
  signal: string;
  smartLabel: string;
  tone: ScreenerRow["tone"];
  smartScore: number;
  technicalSignal?: string;
}): ScreenerRow["forgeBias"] {
  const tech = input.technicalSignal ?? input.signal;

  if (input.changePercent >= 0.35) return "bullish";
  if (input.changePercent <= -0.35) return "bearish";

  if (isBuyLabel(tech, input.smartLabel) || input.tone === "bullish") return "bullish";
  if (isSellLabel(tech, input.smartLabel) || input.tone === "bearish") return "bearish";

  if (input.changePercent > 0 && input.smartScore >= 48) return "bullish";
  if (input.changePercent < 0 && input.smartScore <= 52) return "bearish";

  return "neutral";
}

function rowFromQuote(quote: StockQuote, partial?: Partial<ScreenerRow>): ScreenerRow {
  const change = quote.changePercent;
  const signal = change > 0.8 ? "Buy" : change < -0.8 ? "Sell" : "Hold";
  const smartScore = Math.round(
    Math.max(20, Math.min(80, 50 + change * 2.5 + (quote.beta > 1.5 ? -4 : 3)))
  );
  const smartLabel =
    smartScore >= 58 ? "Buy" : smartScore <= 42 ? "Sell" : "Hold";
  const tone: ScreenerRow["tone"] = isBuyLabel(signal, smartLabel)
    ? "bullish"
    : isSellLabel(signal, smartLabel)
      ? "bearish"
      : "neutral";
  const forgeBias = deriveForgeBias({
    changePercent: change,
    signal,
    smartLabel,
    tone,
    smartScore,
    technicalSignal: signal,
  });

  return {
    symbol: quote.symbol,
    name: quote.name,
    price: quote.price,
    changePercent: change,
    signal,
    confidence: 35,
    riskGrade: quote.beta > 1.4 ? "C" : "B",
    smartScore,
    smartLabel,
    tone,
    forgeBias,
    rsi: 50,
    sector: normalizeSectorLabel(quote.sector) || cleanDisplayLabel(quote.sector) || "",
    peRatio: quote.peRatio,
    ...partial,
  };
}

export async function buildScreenerUniverse(sectorFilter?: string): Promise<string[]> {
  const [gainers, losers] = await Promise.all([
    fmpFetchGainers().catch(() => []),
    fmpFetchLosers().catch(() => []),
  ]);
  const sectorSyms =
    sectorFilter && sectorFilter !== "all" ? symbolsForSectorFilter(sectorFilter) : [];
  const cap = sectorSyms.length > 0 ? Math.max(FORGE_UNIVERSE_CAP, 22) : FORGE_UNIVERSE_CAP;

  return Array.from(
    new Set([
      ...LIQUID_UNIVERSE,
      ...sectorSyms,
      ...gainers.slice(0, 8).map((g) => g.symbol),
      ...losers.slice(0, 8).map((l) => l.symbol),
    ])
  ).slice(0, cap);
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
  const forgeBias = deriveForgeBias({
    changePercent: quote.changePercent,
    signal,
    smartLabel: smart.label,
    tone: smart.tone,
    smartScore: smart.score,
    technicalSignal: adjusted.signal,
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
    tone: smart.tone,
    forgeBias,
    rsi: Math.round(indicators.rsi),
    sector: normalizeSectorLabel(quote.sector) || quote.sector,
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

export function rowMatchesBias(row: ScreenerRow, bias: "bullish" | "bearish"): boolean {
  if (row.forgeBias === bias) return true;
  if (bias === "bullish") {
    return row.changePercent > 0.15 && row.smartScore >= 47;
  }
  return row.changePercent < -0.15 && row.smartScore <= 53;
}

export function sortScreenerRows(rows: ScreenerRow[], bias?: ScreenerFilter["bias"]): ScreenerRow[] {
  const copy = [...rows];
  if (bias === "bearish") {
    return copy.sort((a, b) => {
      const chg = a.changePercent - b.changePercent;
      if (chg !== 0) return chg;
      return a.smartScore - b.smartScore;
    });
  }
  if (bias === "bullish") {
    return copy.sort((a, b) => {
      const chg = b.changePercent - a.changePercent;
      if (chg !== 0) return chg;
      return b.smartScore - a.smartScore;
    });
  }
  return copy.sort((a, b) => b.smartScore - a.smartScore);
}

export function filterScreenerRows(rows: ScreenerRow[], filter: ScreenerFilter): ScreenerRow[] {
  const minScore = filter.minSmartScore;
  const hasMin = minScore != null && minScore > 0;

  return rows.filter((r) => {
    if (filter.bias === "bullish" && !rowMatchesBias(r, "bullish")) return false;
    if (filter.bias === "bearish" && !rowMatchesBias(r, "bearish")) return false;
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

type ScreenerCache = { rows: ScreenerRow[]; updatedAt: string; scoredAt: number; symbolsKey: string };
let scoredUniverseCache: ScreenerCache | null = null;

export function clearScreenerCache(): void {
  scoredUniverseCache = null;
}

function applySectorPool(rows: ScreenerRow[], sector?: string): ScreenerRow[] {
  if (!sector || sector === "all") return rows;
  return rows.filter((r) => sectorMatchesRow(sector, r.sector));
}

export async function runScreener(filter: ScreenerFilter = {}): Promise<{
  rows: ScreenerRow[];
  updatedAt: string;
  universeSize: number;
  maxSmartScore: number;
  relaxedFilters?: boolean;
  biasEmpty?: boolean;
  partialData?: boolean;
  sectorKept?: boolean;
}> {
  const now = Date.now();
  let baseRows: ScreenerRow[];
  let updatedAt: string;
  let partialData = false;

  const symbols = await buildScreenerUniverse(filter.sector);
  const symbolsKey = symbols.join(",");

  if (
    scoredUniverseCache &&
    now - scoredUniverseCache.scoredAt < SCORE_CACHE_MS &&
    scoredUniverseCache.symbolsKey === symbolsKey
  ) {
    baseRows = scoredUniverseCache.rows;
    updatedAt = scoredUniverseCache.updatedAt;
  } else {
    const scored = await mapWithConcurrency(symbols, scoreForScreener, 4);
    baseRows = scored.filter((r): r is ScreenerRow => r !== null);

    if (baseRows.length === 0) {
      partialData = true;
      const emergency = await mapWithConcurrency(
        symbols.slice(0, 12),
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
      scoredUniverseCache = { rows: baseRows, updatedAt, scoredAt: now, symbolsKey };
    } else {
      scoredUniverseCache = null;
    }
  }

  const maxSmartScore = baseRows.reduce((m, r) => Math.max(m, r.smartScore), 0);
  const sectorActive = Boolean(filter.sector && filter.sector !== "all");
  let filtered = sortScreenerRows(filterScreenerRows(baseRows, filter), filter.bias);
  let relaxedFilters = false;
  let biasEmpty = false;
  let sectorKept = sectorActive;

  const hasScoreOrRisk =
    (filter.minSmartScore != null && filter.minSmartScore > 0) || Boolean(filter.maxRiskGrade);

  if (filtered.length === 0 && baseRows.length > 0 && hasScoreOrRisk) {
    const scoreRelaxed: ScreenerFilter = {
      bias: filter.bias,
      sector: filter.sector,
    };
    filtered = sortScreenerRows(filterScreenerRows(baseRows, scoreRelaxed), filter.bias);
    if (filtered.length > 0) relaxedFilters = true;
  }

  if (filtered.length === 0 && baseRows.length > 0 && sectorActive) {
    const sectorOnly = applySectorPool(baseRows, filter.sector);
    if (sectorOnly.length > 0) {
      filtered = sortScreenerRows(sectorOnly, filter.bias);
      relaxedFilters = true;
    }
  }

  if (filtered.length === 0 && baseRows.length > 0 && filter.bias === "bullish") {
    let pool = baseRows.filter((r) => r.changePercent > 0 && rowMatchesBias(r, "bullish"));
    if (pool.length === 0) {
      pool = baseRows.filter((r) => r.changePercent > 0);
    }
    pool = applySectorPool(pool, filter.sector);
    if (pool.length > 0) {
      filtered = sortScreenerRows(pool, "bullish");
      relaxedFilters = true;
    } else {
      biasEmpty = true;
    }
  } else if (filtered.length === 0 && baseRows.length > 0 && filter.bias === "bearish") {
    let pool = baseRows.filter((r) => rowMatchesBias(r, "bearish"));
    if (pool.length === 0) {
      pool = baseRows.filter((r) => r.changePercent < 0);
    }
    pool = applySectorPool(pool, filter.sector);
    if (pool.length > 0) {
      filtered = sortScreenerRows(pool, "bearish");
      relaxedFilters = true;
    } else {
      biasEmpty = true;
    }
  } else if (
    filtered.length === 0 &&
    baseRows.length > 0 &&
    filter.bias !== "bullish" &&
    filter.bias !== "bearish" &&
    sectorActive
  ) {
    const sectorOnly = applySectorPool(baseRows, filter.sector);
    if (sectorOnly.length > 0) {
      filtered = sortScreenerRows(sectorOnly, filter.bias);
      relaxedFilters = true;
    }
  }

  return {
    rows: filtered,
    updatedAt,
    universeSize: baseRows.length,
    maxSmartScore,
    relaxedFilters,
    biasEmpty,
    sectorKept: sectorActive ? sectorKept : undefined,
    partialData: partialData || undefined,
  };
}
