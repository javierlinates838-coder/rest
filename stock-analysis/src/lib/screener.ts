import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { fetchStockQuote, fetchHistoricalWithSource } from "@/services/stock-data";
import { applyDataQualityToSignal, assessResearchQuality } from "@/lib/research-quality";
import { computeSmartScore } from "@/lib/smart-score";
import { fmpFetchGainers, fmpFetchLosers } from "@/services/fmp-api";

const CORE_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AMD",
  "JPM", "V", "NFLX", "AVGO", "COST", "UNH", "XOM", "CRM", "ORCL", "INTC",
];

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
      ...CORE_UNIVERSE,
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
    if (filter.sector && filter.sector !== "all" && r.sector !== filter.sector) return false;
    return true;
  });
}

export async function runScreener(filter: ScreenerFilter = {}): Promise<{
  rows: ScreenerRow[];
  updatedAt: string;
}> {
  const symbols = await buildScreenerUniverse();
  const rows = (await Promise.all(symbols.map(scoreForScreener))).filter(
    (r): r is ScreenerRow => r !== null
  );

  const filtered = filterScreenerRows(rows, filter).sort((a, b) => b.smartScore - a.smartScore);

  return { rows: filtered, updatedAt: new Date().toISOString() };
}
