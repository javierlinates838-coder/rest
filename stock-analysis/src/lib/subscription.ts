/** Pricing & plans — lifetime one-time is the hero offer. */

export const LIFETIME = {
  id: "lifetime",
  name: "Pulse Prime Lifetime",
  shortName: "Lifetime",
  /** Launch price — one payment, forever */
  price: 29,
  /** Anchor for perceived value (shown struck through) */
  compareAt: 79,
  /** What one month of stacked tools roughly costs */
  competitorMonthlyEquiv: 90,
  tagline: "Pay once. Research forever.",
  /** Demo / launch activation code */
  publicCode: "PULSE29",
} as const;

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    analysesPerDay: 8,
  },
  lifetime: LIFETIME,
  /** Optional later — subscription for users who prefer monthly */
  subscription: {
    id: "subscription",
    name: "Pulse Prime Monthly",
    priceMonthly: 5,
    note: "Only if you prefer pay-as-you-go over lifetime",
  },
} as const;

export type PaidFeature =
  | "unlimited_analyses"
  | "screener_advanced"
  | "research_export"
  | "watchlist_digest"
  | "edge_index_full"
  | "price_alerts"
  | "compare_unlimited";

export const PAID_FEATURES: Record<PaidFeature, { title: string; description: string }> = {
  unlimited_analyses: {
    title: "Unlimited Pulse Scans",
    description: "No daily cap on full symbol research",
  },
  screener_advanced: {
    title: "Alpha Forge filters",
    description: "Sector, risk grade, and conviction thresholds",
  },
  research_export: {
    title: "Research Brief exports",
    description: "Download Markdown research for your workflow",
  },
  watchlist_digest: {
    title: "Pulse Watch digest",
    description: "Morning Edge ranking across your tickers",
  },
  edge_index_full: {
    title: "Full Pulse Edge Index",
    description: "Conviction drivers and integrity warnings",
  },
  price_alerts: {
    title: "Signal Wire alerts",
    description: "Research-change notifications (beta)",
  },
  compare_unlimited: {
    title: "Twin Lens compare",
    description: "Side-by-side Edge on up to 4 symbols",
  },
};

/** @deprecated use PAID_FEATURES */
export const PRO_FEATURES = PAID_FEATURES;

export const COMPETITOR_STACK = [
  { name: "TradingView Pro", cost: 180, note: "Charts only" },
  { name: "Seeking Alpha Premium", cost: 240, note: "Articles only" },
  { name: "TipRanks Premium", cost: 360, note: "Scores — no trade plan" },
];

export function competitorStackTotal(): number {
  return COMPETITOR_STACK.reduce((s, c) => s + c.cost, 0);
}

/** Rough years of subscription avoided with lifetime */
export function lifetimeSavingsVsStack(years = 3): number {
  return competitorStackTotal() * years - LIFETIME.price;
}

export function lifetimeVsMonthlyBreakEven(monthly = 12): number {
  return Math.ceil(LIFETIME.price / monthly);
}
