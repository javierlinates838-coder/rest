import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { fetchStockQuote, fetchHistoricalWithSource } from "@/services/stock-data";
import { applyDataQualityToSignal, assessResearchQuality } from "@/lib/research-quality";
import { fmpFetchGainers } from "@/services/fmp-api";
import { LIQUID_UNIVERSE } from "@/lib/hub-symbols";
import { buildExclusivePickSections } from "@/lib/pick-sections";

export interface StockPick {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  signal: string;
  confidence: number;
  riskGrade: string;
  score: number;
  reason: string;
  category: "top-buy" | "quality" | "momentum";
}

async function scoreSymbol(symbol: string): Promise<StockPick | null> {
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

    let score = 0;
    if (signal.includes("Buy")) score += 40 + confidence * 0.4;
    if (signal === "Hold") score += 20 + confidence * 0.2;
    if (signal.includes("Sell")) score -= 30;

    score += quote.changePercent * 2;
    score -= risk.overall * 0.35;

    if (risk.grade === "A" || risk.grade === "B") score += 12;
    if (risk.grade === "F") score -= 20;

    const reason =
      signal.includes("Buy")
        ? `Technical ${signal} · risk grade ${risk.grade}`
        : signal.includes("Sell")
          ? `Caution: ${signal} · grade ${risk.grade}`
          : `Neutral setup · grade ${risk.grade}`;

    let category: StockPick["category"] = "quality";
    if (signal.includes("Buy") && quote.changePercent > 0) category = "momentum";
    if (signal.includes("Buy") && confidence >= 45) category = "top-buy";

    return {
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      changePercent: quote.changePercent,
      signal,
      confidence,
      riskGrade: risk.grade,
      score,
      reason,
      category,
    };
  } catch {
    return null;
  }
}

export async function getStockRecommendations(): Promise<{
  topBuys: StockPick[];
  qualityPicks: StockPick[];
  momentumPicks: StockPick[];
  updatedAt: string;
}> {
  const gainers = await fmpFetchGainers().catch(() => []);
  const symbols = Array.from(
    new Set([
      ...LIQUID_UNIVERSE,
      ...gainers.slice(0, 6).map((g) => g.symbol),
    ])
  ).slice(0, 18);

  const picks = (
    await Promise.all(symbols.map((s) => scoreSymbol(s)))
  ).filter((p): p is StockPick => p !== null);

  const { topBuys, qualityPicks, momentumPicks } = buildExclusivePickSections(picks);

  return {
    topBuys,
    qualityPicks,
    momentumPicks,
    updatedAt: new Date().toISOString(),
  };
}
