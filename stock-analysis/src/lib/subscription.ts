/** Feature gates and plan metadata — single source for Free vs Pro. */

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    analysesPerDay: 8,
  },
  pro: {
    id: "pro",
    name: "Pulse Prime",
    priceMonthly: 12,
    priceAnnual: 99,
    analysesPerDay: Infinity,
  },
} as const;

export type ProFeature =
  | "unlimited_analyses"
  | "screener_advanced"
  | "research_export"
  | "watchlist_digest"
  | "edge_index_full"
  | "price_alerts"
  | "compare_unlimited";

export const PRO_FEATURES: Record<ProFeature, { title: string; description: string }> = {
  unlimited_analyses: {
    title: "Unlimited AI deep dives",
    description: "No daily cap on full Gemini-powered research reports",
  },
  screener_advanced: {
    title: "Advanced screener",
    description: "Sector, max risk grade, and min Smart Score filters",
  },
  research_export: {
    title: "Export research briefs",
    description: "Download institutional Markdown briefs for your notes or clients",
  },
  watchlist_digest: {
    title: "Watchlist morning digest",
    description: "One-screen summary of every ticker you track",
  },
  edge_index_full: {
    title: "Full Edge Index breakdown",
    description: "Proprietary conviction + data-integrity score competitors don't publish",
  },
  price_alerts: {
    title: "Smart price alerts",
    description: "Signal-change and risk-grade alerts (beta)",
  },
  compare_unlimited: {
    title: "Extended compare",
    description: "Compare workspace with full Edge metrics per symbol",
  },
};

export const COMPETITOR_STACK = [
  { name: "TradingView Pro", cost: 180, note: "Charts only — no AI brief" },
  { name: "Seeking Alpha Premium", cost: 240, note: "Articles — no unified screener" },
  { name: "TipRanks Premium", cost: 360, note: "Analyst scores — no trade plan" },
  { name: "Finviz Elite", cost: 300, note: "Screeners — no AI narrative" },
];

export function competitorStackTotal(): number {
  return COMPETITOR_STACK.reduce((s, c) => s + c.cost, 0);
}

export function stockPulseAnnualSavings(): number {
  return competitorStackTotal() - PLANS.pro.priceAnnual;
}
