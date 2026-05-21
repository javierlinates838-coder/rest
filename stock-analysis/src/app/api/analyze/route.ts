import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchHistoricalWithSource, fetchCompetitors } from "@/services/stock-data";
import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { generateAIAnalysis } from "@/services/ai-analysis";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { generateTradingPlan, generateKeyEvents, generateInstitutionalOwnership, generatePriceAction } from "@/lib/trading-plan";
import { finnhubFetchRecommendations, finnhubFetchSentiment } from "@/services/finnhub-api";
import { fetchStockNewsForAI, newsProviderLabel } from "@/services/stock-news";
import { normalizeAnalysisPayload } from "@/lib/normalize-analysis";

// Vercel Pro allows up to 60s; Hobby caps at 10s regardless of this value.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const upperSymbol = symbol.toUpperCase();

  try {
    const quote = await fetchStockQuote(upperSymbol);
    const { history, source: chartSource } = await fetchHistoricalWithSource(
      upperSymbol,
      "1y",
      quote.price
    );

    const [competitors, newsBundle, analystRecs, finnhubSentiment] = await Promise.all([
      fetchCompetitors(upperSymbol).catch((e) => {
        console.error("Competitors fetch failed:", e);
        return [];
      }),
      fetchStockNewsForAI(upperSymbol, quote.name),
      finnhubFetchRecommendations(upperSymbol).catch(() => []),
      finnhubFetchSentiment(upperSymbol).catch(() => null),
    ]);

    const priceHistory = history.length > 0 ? history : [{ date: new Date().toISOString().split("T")[0], open: quote.price, high: quote.price, low: quote.price, close: quote.price, volume: quote.volume || 0 }];
    const indicators = computeAllIndicators(priceHistory);
    const signal = generateSignal(indicators, quote.price);

    const newsForAI =
      newsBundle.items.length > 0
        ? newsBundle.items
        : [
            { title: `${quote.name} reports strong quarterly results`, sentiment: "positive" },
            { title: `Analyst upgrades ${upperSymbol} stock rating`, sentiment: "positive" },
            { title: `${quote.sector} sector faces regulatory scrutiny`, sentiment: "negative" },
            { title: `${quote.name} announces new product line`, sentiment: "positive" },
            { title: `Market volatility impacts ${quote.sector} stocks`, sentiment: "neutral" },
          ];

    const aiAnalysis = await generateAIAnalysis(quote, indicators, signal, competitors, newsForAI);

    const redFlags = detectRedFlags(priceHistory, indicators, quote);
    const riskScore = calculateRiskScore(indicators, quote, redFlags);
    const tradingPlan = generateTradingPlan(quote.price, indicators, signal, priceHistory, quote.beta, {
      symbol: upperSymbol,
      marketCap: quote.marketCap,
      peRatio: quote.peRatio,
      dividendYield: quote.dividendYield,
      sector: quote.sector,
      industry: quote.industry,
      changePercent: quote.changePercent,
    });
    const keyEvents = generateKeyEvents(upperSymbol, quote.sector, quote.name);
    const institutional = generateInstitutionalOwnership(upperSymbol, quote.marketCap);
    const priceAction = generatePriceAction(priceHistory, indicators);

    const newsSentimentBreakdown = newsBundle.sentimentBreakdown;

    const payload = normalizeAnalysisPayload({
      quote,
      indicators,
      signal,
      competitors,
      aiAnalysis,
      redFlags,
      riskScore,
      tradingPlan,
      keyEvents,
      institutional,
      priceAction,
      history,
      news: newsForAI,
      analystRecommendations: analystRecs,
      finnhubSentiment,
      newsSentimentBreakdown,
      analyzedAt: new Date().toISOString(),
      dataSources: {
        quotes: process.env.FMP_API_KEY ? "FMP Live" : "Yahoo Finance",
        chart:
          chartSource === "fmp"
            ? "FMP Live"
            : chartSource === "yahoo"
              ? "Yahoo Finance"
              : "Simulated chart",
        news: newsProviderLabel(newsBundle.source, newsBundle.sources),
        ai: process.env.GEMINI_API_KEY ? "Google Gemini 2.0 Flash" : process.env.OPENAI_API_KEY ? "OpenAI GPT-4o-mini" : "Built-in Engine",
        tradingPlan: "Model estimates",
        institutional: "Model estimates",
        keyEvents: "Estimated calendar",
      },
    });

    if (!payload) {
      return NextResponse.json({ error: "Failed to build analysis response" }, { status: 500 });
    }

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
