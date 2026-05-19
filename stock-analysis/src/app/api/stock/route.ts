import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchHistoricalData } from "@/services/stock-data";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const period = request.nextUrl.searchParams.get("period") || "1y";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const [quote, history] = await Promise.all([
      fetchStockQuote(symbol),
      fetchHistoricalData(symbol, period),
    ]);

    return NextResponse.json({ quote, history });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch stock data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
