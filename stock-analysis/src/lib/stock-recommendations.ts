import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { calculateRiskScore } from "@/lib/red-flags";
import { fetchStockQuote, fetchHistoricalData } from "@/services/stock-data";
import { fmpFetchGainers } from "@/services/fmp-api";

const CORE_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AMD",
  "JPM", "V", "NFLX", "AVGO", "COST", "UNH", "XOM",
];

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

    const history = await fetchHistoricalData(symbol, "3m", quote.price);
    const indicators = computeAllIndicators(history);
    const raw = generateSignal(indicators, quote.price);
    const { signal, confidence } = resolveSignal(raw.signal, raw.confidence);
    const risk = calculateRiskScore(indicators, quote, []);

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
      ...CORE_UNIVERSE,
      ...gainers.slice(0, 8).map((g) => g.symbol),
    ])
  ).slice(0, 18);

  const picks = (
    await Promise.all(symbols.map((s) => scoreSymbol(s)))
  ).filter((p): p is StockPick => p !== null);

  const topBuys = picks
    .filter((p) => p.signal.includes("Buy") && p.confidence >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const momentumPicks = picks
    .filter((p) => p.changePercent > 0.5 && !p.signal.includes("Sell"))
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);

  const qualityPicks = picks
    .filter((p) => (p.riskGrade === "A" || p.riskGrade === "B") && !p.signal.includes("Sell"))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    topBuys: topBuys.length > 0 ? topBuys : picks.sort((a, b) => b.score - a.score).slice(0, 3),
    qualityPicks: qualityPicks.length > 0 ? qualityPicks : picks.filter((p) => p.riskGrade === "C").slice(0, 3),
    momentumPicks: momentumPicks.length > 0 ? momentumPicks : picks.sort((a, b) => b.changePercent - a.changePercent).slice(0, 3),
    updatedAt: new Date().toISOString(),
  };
}
