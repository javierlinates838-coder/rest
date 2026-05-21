import { NextResponse } from "next/server";
import { fetchStockQuote } from "@/services/stock-data";
import { fmpFetchGainers, fmpFetchLosers, fmpFetchSectorPerformance } from "@/services/fmp-api";

const MARKET_INDICES = ["SPY", "QQQ", "DIA", "IWM", "VTI"];
const TRENDING_STOCKS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "JPM", "V", "JNJ", "BA", "DIS", "INTC"];

export async function GET() {
  try {
    const [indexResults, trendingResults, gainers, losers, sectorPerf] = await Promise.all([
      Promise.all(MARKET_INDICES.map(async (symbol) => {
        try {
          const quote = await fetchStockQuote(symbol);
          return { symbol, name: quote.name, price: quote.price, change: quote.change, changePercent: quote.changePercent };
        } catch {
          return { symbol, name: symbol, price: 0, change: 0, changePercent: 0 };
        }
      })),
      Promise.all(TRENDING_STOCKS.slice(0, 10).map(async (symbol) => {
        try {
          const quote = await fetchStockQuote(symbol);
          return {
            symbol, name: quote.name, price: quote.price,
            change: quote.change, changePercent: quote.changePercent,
            volume: quote.volume, marketCap: quote.marketCap, sector: quote.sector,
          };
        } catch {
          return null;
        }
      })),
      fmpFetchGainers(),
      fmpFetchLosers(),
      fmpFetchSectorPerformance(),
    ]);

    // Use FMP sector data if available, otherwise fallback
    const sectorsEstimated = sectorPerf.length === 0;
    const sectors = sectorPerf.length > 0
      ? sectorPerf.map((s) => ({
          name: s.sector.replace("sector", "").trim(),
          change: parseFloat(s.changesPercentage) || 0,
        }))
      : [
          { name: "Technology", change: 1.2 },
          { name: "Healthcare", change: -0.5 },
          { name: "Financial Services", change: 0.8 },
          { name: "Consumer Cyclical", change: -0.3 },
          { name: "Energy", change: 1.5 },
          { name: "Industrials", change: 0.2 },
        ];

    const topGainers = gainers.map((g) => ({
      symbol: g.symbol, name: g.name, price: g.price,
      change: g.change, changePercent: g.changesPercentage,
    }));

    const topLosers = losers.map((l) => ({
      symbol: l.symbol, name: l.name, price: l.price,
      change: l.change, changePercent: l.changesPercentage,
    }));

    return NextResponse.json({
      indices: indexResults,
      trending: trendingResults.filter(Boolean),
      sectors,
      sectorsEstimated,
      topGainers,
      topLosers,
      dataSources: {
        quotes: process.env.FMP_API_KEY ? "FMP" : "Yahoo Finance",
        news: [
          process.env.FINNHUB_API_KEY && "Finnhub",
          process.env.NEWS_API_KEY && "NewsAPI.org",
        ]
          .filter(Boolean)
          .join(" + ") || "Generated",
        ai: process.env.GEMINI_API_KEY ? "Google Gemini" : process.env.OPENAI_API_KEY ? "OpenAI" : "Built-in",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch market data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
