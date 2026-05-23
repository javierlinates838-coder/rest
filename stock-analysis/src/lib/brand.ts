/**
 * StockPulse brand system — single source for copy, nav labels, and product language.
 * URLs stay stable; everything users read is uniquely ours.
 */

export const BRAND = {
  name: "StockPulse",
  terminal: "Pulse Terminal",
  tagline: "Where conviction meets the tape",
  shortTag: "Pulse · Edge · Truth",
  metaTitle: "StockPulse — Pulse Terminal for Stock Research",
  metaDescription:
    "Institutional-grade stock research terminal — Pulse Edge Index, Meridian Briefs, Alpha Forge screeners, and integrity grades on every chart.",
} as const;

/** User-facing nav labels (routes unchanged) */
export const NAV = [
  { href: "/", label: "Pulse Hub", match: (p: string) => p === "/" },
  { href: "/screener", label: "Alpha Forge", match: (p: string) => p.startsWith("/screener") },
  { href: "/watchlist", label: "Pulse Watch", match: (p: string) => p.startsWith("/watchlist") },
] as const;

export const MOBILE_NAV = [
  { href: "/", label: "Hub", match: (p: string) => p === "/" },
  { href: "/watchlist", label: "Watch", match: (p: string) => p.startsWith("/watchlist") },
  { href: "/screener", label: "Forge", match: (p: string) => p.startsWith("/screener") },
  { href: "/?search=1", label: "Scan", match: () => false },
] as const;

/** Proprietary product terms — never say "AI stock analysis" generically */
export const TERMS = {
  pulseScan: "Pulse Scan",
  pulseScanVerb: "Run Pulse Scan",
  edgeIndex: "Pulse Edge Index",
  edgeShort: "Pulse Edge",
  smartScore: "Conviction Score",
  meridianBrief: "Meridian Brief",
  alphaForge: "Alpha Forge",
  twinLens: "Twin Lens",
  pulseWatch: "Pulse Watch",
  theLedger: "The Ledger",
  signalWire: "Signal Wire",
  pulsePrime: "Pulse Prime",
  pulseLifetime: "Pulse Prime Lifetime",
  pulseHub: "Pulse Hub",
  dataGrade: "Integrity Grade",
  liveTape: "Live Tape",
} as const;

export const HERO = {
  eyebrow: "Pulse Terminal · Live market data",
  titleLead: "Research with",
  titleAccent: "conviction",
  titleTail: "built in",
  subtitleDesktop:
    "Pulse Edge, Meridian Briefs, and Wilder-native signals — with integrity grades on quotes and charts.",
  subtitleMobile: "Edge · Brief · Forge · Scan",
} as const;

export const FOOTER = {
  legal: `${BRAND.name} Pulse Terminal — Research tooling, not investment advice.`,
  feeds: ["Pulse Feed", "Sentiment", "Meridian Brief"],
} as const;
