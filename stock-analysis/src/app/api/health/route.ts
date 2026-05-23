import { NextResponse } from "next/server";

/** Deploy smoke check — no external API calls. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "stockpulse",
    openAccess: true,
    keys: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      fmp: Boolean(process.env.FMP_API_KEY),
      finnhub: Boolean(process.env.FINNHUB_API_KEY),
      news: Boolean(process.env.NEWS_API_KEY),
    },
    timestamp: new Date().toISOString(),
  });
}
