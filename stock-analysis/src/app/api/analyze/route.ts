import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchHistoricalData, fetchCompetitors } from "@/services/stock-data";
import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { generateAIAnalysis } from "@/services/ai-analysis";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { generateTradingPlan, generateKeyEvents, generateInstitutionalOwnership, generatePriceAction } from "@/lib/trading-plan";
import { finnhubFetchNews, finnhubFetchRecommendations, finnhubFetchSentiment, analyzeSentimentFromNews } from "@/services/finnhub-api";
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
    const [quote, history] = await Promise.all([
      fetchStockQuote(upperSymbol),
      fetchHistoricalData(upperSymbol, "1y"),
    ]);

    const [competitors, finnhubNews, analystRecs, finnhubSentiment] = await Promise.all([
      fetchCompetitors(upperSymbol).catch((e) => {
        console.error("Competitors fetch failed:", e);
        return [];
      }),
      finnhubFetchNews(upperSymbol).catch(() => []),
      finnhubFetchRecommendations(upperSymbol).catch(() => []),
      finnhubFetchSentiment(upperSymbol).catch(() => null),
    ]);

    const priceHistory = history.length > 0 ? history : [{ date: new Date().toISOString().split("T")[0], open: quote.price, high: quote.price, low: quote.price, close: quote.price, volume: quote.volume || 0 }];
    const indicators = computeAllIndicators(priceHistory);
    const signal = generateSignal(indicators, quote.price);

    // Build news array for AI — prefer real Finnhub news
    const newsForAI = finnhubNews.length > 0
      ? finnhubNews.slice(0, 8).map((n) => {
          const text = (n.headline + " " + n.summary).toLowerCase();
          const posKw = ["surge", "gain", "beat", "upgrade", "growth", "strong", "profit", "rally"];
          const negKw = ["fall", "drop", "decline", "miss", "downgrade", "weak", "crash", "risk"];
          const pos = posKw.filter((k) => text.includes(k)).length;
          const neg = negKw.filter((k) => text.includes(k)).length;
          return { title: n.headline, sentiment: pos > neg ? "positive" : neg > pos ? "negative" : "neutral" };
        })
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
    const tradingPlan = generateTradingPlan(quote.price, indicators, signal, priceHistory, quote.beta);
    const keyEvents = generateKeyEvents(upperSymbol);
    const institutional = generateInstitutionalOwnership(upperSymbol, quote.marketCap);
    const priceAction = generatePriceAction(priceHistory, indicators);

    const newsSentimentBreakdown = finnhubNews.length > 0
      ? analyzeSentimentFromNews(finnhubNews)
      : null;

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
      history: history.slice(-30),
      news: newsForAI,
      analystRecommendations: analystRecs,
      finnhubSentiment,
      newsSentimentBreakdown,
      analyzedAt: new Date().toISOString(),
      dataSources: {
        quotes: process.env.FMP_API_KEY ? "FMP Live" : "Yahoo Finance",
        news: finnhubNews.length > 0 ? "Finnhub Live" : "Generated",
        ai: process.env.GEMINI_API_KEY ? "Google Gemini 2.0 Flash" : process.env.OPENAI_API_KEY ? "OpenAI GPT-4o-mini" : "Built-in Engine",
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
