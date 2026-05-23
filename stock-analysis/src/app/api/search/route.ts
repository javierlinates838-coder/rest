import { NextRequest, NextResponse } from "next/server";
import { fmpSearchStock } from "@/services/fmp-api";

const FALLBACK_SYMBOLS: { symbol: string; name: string; exchange: string }[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ" },
  { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE" },
];

function fallbackSearch(query: string) {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return FALLBACK_SYMBOLS.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  ).slice(0, 8);
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  let results = await fmpSearchStock(query);
  if (results.length === 0) {
    results = fallbackSearch(query);
  }

  return NextResponse.json({ results });
}
