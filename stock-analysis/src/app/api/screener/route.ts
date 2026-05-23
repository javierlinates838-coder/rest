import { NextRequest, NextResponse } from "next/server";
import { runScreener, type ScreenerFilter } from "@/lib/screener";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filter: ScreenerFilter = {};

  const bias = params.get("bias");
  if (bias === "bullish" || bias === "bearish" || bias === "any") {
    filter.bias = bias === "any" ? undefined : bias;
  }

  const minScore = params.get("minSmartScore");
  if (minScore) filter.minSmartScore = Number(minScore);

  const maxRisk = params.get("maxRiskGrade");
  const sector = params.get("sector");

  if (maxRisk) filter.maxRiskGrade = maxRisk;
  if (sector) filter.sector = sector;

  try {
    const result = await runScreener(filter);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Screener failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
