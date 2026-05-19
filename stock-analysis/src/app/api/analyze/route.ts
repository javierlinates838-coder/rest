import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchHistoricalData, fetchCompetitors } from "@/services/stock-data";
import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { generateAIAnalysis } from "@/services/ai-analysis";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const [quote, history, competitors] = await Promise.all([
      fetchStockQuote(symbol),
      fetchHistoricalData(symbol, "1y"),
      fetchCompetitors(symbol),
    ]);

    const indicators = computeAllIndicators(history);
    const signal = generateSignal(indicators, quote.price);

    const mockNews = [
      { title: `${quote.name} reports strong quarterly results`, sentiment: "positive" },
      { title: `Analyst upgrades ${symbol} stock rating`, sentiment: "positive" },
      { title: `${quote.sector} sector faces regulatory scrutiny`, sentiment: "negative" },
      { title: `${quote.name} announces new product line`, sentiment: "positive" },
      { title: `Market volatility impacts ${quote.sector} stocks`, sentiment: "neutral" },
    ];

    const aiAnalysis = await generateAIAnalysis(quote, indicators, signal, competitors, mockNews);

    return NextResponse.json({
      quote,
      indicators,
      signal,
      competitors,
      aiAnalysis,
      news: mockNews,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
