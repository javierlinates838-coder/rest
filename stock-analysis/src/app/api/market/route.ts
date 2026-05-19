import { NextResponse } from "next/server";
import { fetchStockQuote } from "@/services/stock-data";

const MARKET_INDICES = ["SPY", "QQQ", "DIA", "IWM", "VTI"];
const TRENDING_STOCKS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "JPM", "V", "JNJ", "BA", "DIS", "INTC"];

export async function GET() {
  try {
    const indexPromises = MARKET_INDICES.map(async (symbol) => {
      try {
        const quote = await fetchStockQuote(symbol);
        return {
          symbol,
          name: quote.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
        };
      } catch {
        return {
          symbol,
          name: symbol,
          price: 0,
          change: 0,
          changePercent: 0,
        };
      }
    });

    const trendingPromises = TRENDING_STOCKS.slice(0, 8).map(async (symbol) => {
      try {
        const quote = await fetchStockQuote(symbol);
        return {
          symbol,
          name: quote.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          marketCap: quote.marketCap,
          sector: quote.sector,
        };
      } catch {
        return null;
      }
    });

    const [indices, trending] = await Promise.all([
      Promise.all(indexPromises),
      Promise.all(trendingPromises),
    ]);

    return NextResponse.json({
      indices,
      trending: trending.filter(Boolean),
      sectors: [
        { name: "Technology", change: 1.2 },
        { name: "Healthcare", change: -0.5 },
        { name: "Financial", change: 0.8 },
        { name: "Consumer", change: -0.3 },
        { name: "Energy", change: 1.5 },
        { name: "Industrial", change: 0.2 },
      ],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch market data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
