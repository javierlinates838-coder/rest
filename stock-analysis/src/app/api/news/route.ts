import { NextRequest, NextResponse } from "next/server";
import { fetchStockNews, newsProviderLabel } from "@/services/stock-news";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") || "AAPL";
  const companyName = request.nextUrl.searchParams.get("name") || undefined;

  const { news, source, sources, sentimentBreakdown } = await fetchStockNews(
    symbol.toUpperCase(),
    companyName
  );

  return NextResponse.json({
    news,
    symbol: symbol.toUpperCase(),
    sentimentBreakdown,
    source,
    sources,
    sourceLabel: newsProviderLabel(source, sources),
  });
}
