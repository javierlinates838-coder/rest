import { NextResponse } from "next/server";
import { LIFETIME } from "@/lib/subscription";
import { FREE_DAILY_ANALYSES, getAnalysisUsage } from "@/lib/usage-limit";

export async function GET() {
  const usage = await getAnalysisUsage();
  return NextResponse.json({
    ...usage,
    limit: FREE_DAILY_ANALYSES,
    lifetimePrice: LIFETIME.price,
  });
}
