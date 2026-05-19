import { NextRequest, NextResponse } from "next/server";
import { fmpSearchStock } from "@/services/fmp-api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const results = await fmpSearchStock(query);
  return NextResponse.json({ results });
}
