import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchHistoricalData, fetchCompetitors } from "@/services/stock-data";
import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { generateAIAnalysis } from "@/services/ai-analysis";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { generateTradingPlan, generateKeyEvents, generateInstitutionalOwnership, generatePriceAction } from "@/lib/trading-plan";
import { finnhubFetchNews, finnhubFetchRecommendations, finnhubFetchSentiment, analyzeSentimentFromNews } from "@/services/finnhub-api";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const upperSymbol = symbol.toUpperCase();

  try {
    const [quote, history, competitors, finnhubNews, analystRecs, finnhubSentiment] = await Promise.all([
      fetchStockQuote(upperSymbol),
      fetchHistoricalData(upperSymbol, "1y"),
      fetchCompetitors(upperSymbol),
      finnhubFetchNews(upperSymbol),
      finnhubFetchRecommendations(upperSymbol),
      finnhubFetchSentiment(upperSymbol),
    ]);

    const indicators = computeAllIndicators(history);
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

    const redFlags = detectRedFlags(history, indicators, quote);
    const riskScore = calculateRiskScore(indicators, quote, redFlags);
    const tradingPlan = generateTradingPlan(quote.price, indicators, signal, history, quote.beta);
    const keyEvents = generateKeyEvents(upperSymbol);
    const institutional = generateInstitutionalOwnership(upperSymbol, quote.marketCap);
    const priceAction = generatePriceAction(history, indicators);

    const newsSentimentBreakdown = finnhubNews.length > 0
      ? analyzeSentimentFromNews(finnhubNews)
      : null;

    return NextResponse.json({
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
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
