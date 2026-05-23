import { NextResponse } from "next/server";
import { OPEN_ACCESS } from "@/lib/product-phase";
import { FREE_DAILY_ANALYSES, getAnalysisUsage } from "@/lib/usage-limit";

export async function GET() {
  const usage = await getAnalysisUsage();
  return NextResponse.json({
    ...usage,
    limit: OPEN_ACCESS ? null : FREE_DAILY_ANALYSES,
    openAccess: OPEN_ACCESS,
  });
}
