import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchHistoricalWithSource } from "@/services/stock-data";
import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { resolveSignal } from "@/lib/analysis-coherence";
import { applyDataQualityToSignal, assessResearchQuality } from "@/lib/research-quality";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";

/** Lightweight quote + technical signal (no AI, news, or competitors). */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const upper = symbol.toUpperCase();

  try {
    const quote = await fetchStockQuote(upper);
    const { history, source: chartSource } = await fetchHistoricalWithSource(upper, "3m", quote.price);
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

    return NextResponse.json({
      quote: {
        name: quote.name,
        price: quote.price,
        changePercent: quote.changePercent,
      },
      signal: {
        signal: resolved.signal,
        confidence: resolved.confidence,
      },
      riskGrade: risk.grade,
      rsi: Math.round(indicators.rsi),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Quote fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
