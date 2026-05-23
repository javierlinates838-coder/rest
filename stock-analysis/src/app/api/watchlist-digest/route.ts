import { NextRequest, NextResponse } from "next/server";
import { getAnalysisUsage } from "@/lib/usage-limit";
import { computeEdgeIndex } from "@/lib/edge-index";
import { fetchStockQuote, fetchHistoricalWithSource } from "@/services/stock-data";
import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { applyDataQualityToSignal, assessResearchQuality } from "@/lib/research-quality";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";

export const maxDuration = 45;

export async function GET(request: NextRequest) {
  const usage = await getAnalysisUsage();
  if (!usage.isPro) {
    return NextResponse.json(
      {
        error: "Watchlist digest is a Pro feature.",
        code: "PRO_REQUIRED",
      },
      { status: 403 }
    );
  }

  const symbolsParam = request.nextUrl.searchParams.get("symbols");
  const symbols = (symbolsParam || "AAPL,MSFT,NVDA")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 12);

  const rows = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await fetchStockQuote(symbol);
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
        const resolved = resolveSignal(adjusted.signal, adjusted.confidence);
        const redFlags = detectRedFlags(history, indicators, quote);
        const risk = calculateRiskScore(indicators, quote, redFlags);
        const edge = computeEdgeIndex({
          signal: resolved.signal,
          confidence: resolved.confidence,
          riskGrade: risk.grade,
          changePercent: quote.changePercent,
          rsi: indicators.rsi,
          researchQualityScore: quality.score,
        });
        return {
          symbol,
          name: quote.name,
          price: quote.price,
          changePercent: quote.changePercent,
          signal: resolved.signal,
          edgeScore: edge.edgeScore,
          edgeTier: edge.tier,
        };
      } catch {
        return null;
      }
    })
  );

  const valid = rows.filter((r): r is NonNullable<typeof r> => r !== null);
  valid.sort((a, b) => b.edgeScore - a.edgeScore);

  const bullish = valid.filter((r) => r.signal.includes("Buy")).length;
  const bearish = valid.filter((r) => r.signal.includes("Sell")).length;

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    summary: {
      tracked: valid.length,
      bullish,
      bearish,
      topPick: valid[0]?.symbol ?? null,
      avgEdge: valid.length
        ? Math.round(valid.reduce((s, r) => s + r.edgeScore, 0) / valid.length)
        : 0,
    },
    rows: valid,
  });
}
