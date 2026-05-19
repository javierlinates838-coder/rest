import { NextRequest, NextResponse } from "next/server";
import { fetchCompetitors } from "@/services/stock-data";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const competitors = await fetchCompetitors(symbol);
    return NextResponse.json({ competitors });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch competitors";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
