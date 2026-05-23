import { NextRequest, NextResponse } from "next/server";
import { fmpSearchStock } from "@/services/fmp-api";
import { dedupeBySymbol } from "@/lib/dedupe-by-symbol";
import { HUB_QUICK_PICKS, LIQUID_UNIVERSE } from "@/lib/hub-symbols";

const FALLBACK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corp.",
  META: "Meta Platforms Inc.",
  AMD: "Advanced Micro Devices",
  JPM: "JPMorgan Chase",
  V: "Visa Inc.",
  UNH: "UnitedHealth Group",
  LLY: "Eli Lilly",
  XOM: "Exxon Mobil",
  COST: "Costco Wholesale",
  WMT: "Walmart Inc.",
  NFLX: "Netflix Inc.",
  BA: "Boeing Co.",
  DIS: "Walt Disney Co.",
  PLTR: "Palantir Technologies",
  COIN: "Coinbase Global",
  BAC: "Bank of America",
  WFC: "Wells Fargo",
  GS: "Goldman Sachs",
  MA: "Mastercard Inc.",
  JNJ: "Johnson & Johnson",
  PFE: "Pfizer Inc.",
  HD: "Home Depot",
  MCD: "McDonald's Corp.",
  NKE: "Nike Inc.",
  PG: "Procter & Gamble",
  KO: "Coca-Cola Co.",
  PEP: "PepsiCo Inc.",
  CVX: "Chevron Corp.",
  CAT: "Caterpillar Inc.",
  AVGO: "Broadcom Inc.",
  CRM: "Salesforce Inc.",
  ORCL: "Oracle Corp.",
  INTC: "Intel Corp.",
  QCOM: "Qualcomm Inc.",
  MU: "Micron Technology",
  SHOP: "Shopify Inc.",
};

const FALLBACK_SYMBOLS = Array.from(new Set([...HUB_QUICK_PICKS, ...LIQUID_UNIVERSE])).map(
  (symbol) => ({
    symbol,
    name: FALLBACK_NAMES[symbol] ?? symbol,
    exchange: "US",
  })
);

function fallbackSearch(query: string) {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return FALLBACK_SYMBOLS.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  ).slice(0, 12);
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results = await fmpSearchStock(query);
    if (results.length === 0) {
      results = fallbackSearch(query);
    }
    return NextResponse.json({ results: dedupeBySymbol(results).slice(0, 12) });
  } catch (e) {
    console.error("[search] FMP failed, using fallback:", e);
    return NextResponse.json({ results: dedupeBySymbol(fallbackSearch(query)) });
  }
}
