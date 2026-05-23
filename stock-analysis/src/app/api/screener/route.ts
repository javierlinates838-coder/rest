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
  if (minScore != null && minScore !== "") {
    const n = Number(minScore);
    if (Number.isFinite(n) && n > 0) filter.minSmartScore = n;
  }

  const maxRisk = params.get("maxRiskGrade");
  const sector = params.get("sector");

  if (maxRisk) filter.maxRiskGrade = maxRisk;
  if (sector) filter.sector = sector;
  if (params.get("oversold") === "1") filter.oversold = true;
  if (params.get("overbought") === "1") filter.overbought = true;
  if (params.get("strongTrend") === "1") filter.strongTrend = true;

  try {
    if (params.get("refresh") === "1") {
      const { clearScreenerCache } = await import("@/lib/screener");
      clearScreenerCache();
    }
    const result = await runScreener(filter);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Screener failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
