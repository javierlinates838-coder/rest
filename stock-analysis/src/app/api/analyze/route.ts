import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchHistoricalWithSource, fetchCompetitors } from "@/services/stock-data";
import { computeAllIndicators, generateSignal } from "@/lib/technical-analysis";
import { generateAIAnalysis } from "@/services/ai-analysis";
import { detectRedFlags, calculateRiskScore } from "@/lib/red-flags";
import { generateTradingPlan, generateKeyEvents, generateInstitutionalOwnership, generatePriceAction } from "@/lib/trading-plan";
import { finnhubFetchRecommendations, finnhubFetchSentiment } from "@/services/finnhub-api";
import { fetchStockNewsForAI, newsProviderLabel } from "@/services/stock-news";
import { normalizeAnalysisPayload } from "@/lib/normalize-analysis";
import { assessResearchQuality, applyDataQualityToSignal } from "@/lib/research-quality";
import { resolveSignal } from "@/lib/analysis-coherence";

export const maxDuration = 60;

function resolveQuoteSourceLabel(quoteSource?: string): string {
  switch (quoteSource) {
    case "fmp":
      return "FMP Live";
    case "finnhub":
      return "Finnhub Live";
    case "yahoo":
      return "Yahoo Finance";
    case "mock":
      return "Estimated quote";
    default:
      return process.env.FMP_API_KEY ? "FMP Live" : process.env.FINNHUB_API_KEY ? "Finnhub Live" : "Yahoo Finance";
  }
}

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

    const priceHistory =
      history.length > 0
        ? history
        : [
            {
              date: new Date().toISOString().split("T")[0],
              open: quote.price,
              high: quote.price,
              low: quote.price,
              close: quote.price,
              volume: quote.volume || 0,
            },
          ];

    const indicators = computeAllIndicators(priceHistory);
    const rawSignal = generateSignal(indicators, quote.price);

    const researchQuality = assessResearchQuality({
      chartSource,
      historyBars: priceHistory.length,
      newsCount: newsBundle.items.length,
      newsSource: newsBundle.source,
      quoteIsMock: quote.quoteSource === "mock",
      hasFinnhubKey: Boolean(process.env.FINNHUB_API_KEY),
      hasFmpKey: Boolean(process.env.FMP_API_KEY),
    });

    const adjustedSignal = applyDataQualityToSignal(rawSignal, researchQuality);
    const resolved = resolveSignal(adjustedSignal.signal, adjustedSignal.confidence);
    const signal = {
      signal: resolved.signal,
      confidence: resolved.confidence,
      reasons: adjustedSignal.reasons,
    };

    const newsForAI = newsBundle.items.map((n) => ({
      title: n.title,
      sentiment: n.sentiment,
    }));

    const aiAnalysis = await generateAIAnalysis(
      quote,
      indicators,
      signal,
      competitors,
      newsForAI,
      { dataQualityNote: researchQuality.issues.slice(0, 2).join(" ") || undefined }
    );

    const redFlags = detectRedFlags(priceHistory, indicators, quote);
    const riskScore = calculateRiskScore(indicators, quote, redFlags, {
      finnhubSentiment,
      newsBreakdown: newsBundle.sentimentBreakdown,
    });
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
      newsSentimentBreakdown: newsBundle.sentimentBreakdown,
      researchQuality,
      analyzedAt: new Date().toISOString(),
      dataSources: {
        quotes: resolveQuoteSourceLabel(quote.quoteSource),
        chart:
          chartSource === "fmp"
            ? "FMP Live"
            : chartSource === "yahoo"
              ? "Yahoo Finance"
              : "Simulated chart",
        news: newsProviderLabel(newsBundle.source, newsBundle.sources),
        ai: process.env.GEMINI_API_KEY
          ? "Google Gemini 2.0 Flash"
          : process.env.OPENAI_API_KEY
            ? "OpenAI GPT-4o-mini"
            : "Built-in rules engine",
        tradingPlan: "ATR & support/resistance model",
        institutional: "Estimated — not SEC 13F data",
        keyEvents: "Estimated calendar — verify dates",
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
