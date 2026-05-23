import { NextResponse } from "next/server";
import { fetchStockQuote } from "@/services/stock-data";
import { fmpFetchGainers, fmpFetchLosers } from "@/services/fmp-api";
import { buildSectorPerformanceBoard } from "@/lib/sector-performance";
import { dedupeBySymbol } from "@/lib/dedupe-by-symbol";
import { TAPE_BENCH } from "@/lib/hub-symbols";

const MARKET_INDICES = ["SPY", "QQQ", "DIA", "IWM", "VTI"];

export async function GET() {
  try {
    const [indexResults, gainersRaw, losersRaw, sectorBoard] = await Promise.all([
      Promise.all(MARKET_INDICES.map(async (symbol) => {
        try {
          const quote = await fetchStockQuote(symbol);
          return { symbol, name: quote.name, price: quote.price, change: quote.change, changePercent: quote.changePercent };
        } catch {
          return { symbol, name: symbol, price: 0, change: 0, changePercent: 0 };
        }
      })),
      fmpFetchGainers(),
      fmpFetchLosers(),
      buildSectorPerformanceBoard(),
    ]);

    const sectorsEstimated = sectorBoard.estimated;
    const sectors = sectorBoard.sectors;

    const parsePct = (v: number | string | undefined) => {
      const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
      return Number.isFinite(n) ? n : 0;
    };

    const topGainers = dedupeBySymbol(
      gainersRaw.map((g) => ({
        symbol: g.symbol,
        name: g.name,
        price: g.price,
        change: g.change,
        changePercent: parsePct(g.changesPercentage),
      }))
    ).slice(0, 8);

    const topLosers = dedupeBySymbol(
      losersRaw.map((l) => ({
        symbol: l.symbol,
        name: l.name,
        price: l.price,
        change: l.change,
        changePercent: parsePct(l.changesPercentage),
      }))
    ).slice(0, 8);

    const moverSymbols = new Set(
      [...topGainers.slice(0, 6), ...topLosers.slice(0, 6)].map((m) => m.symbol.toUpperCase())
    );

    const tapeCandidates = TAPE_BENCH.filter((s) => !moverSymbols.has(s)).slice(0, 12);
    const trendingResults = await Promise.all(
      tapeCandidates.map(async (symbol) => {
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
      })
    );

    return NextResponse.json({
      indices: indexResults,
      trending: dedupeBySymbol(trendingResults.filter(Boolean) as { symbol: string }[]).slice(0, 10),
      sectors,
      sectorsEstimated,
      sectorSource: sectorBoard.source,
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
