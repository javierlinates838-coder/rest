/**
 * StockPulse brand system — single source for copy, nav labels, and product language.
 * URLs stay stable; everything users read is uniquely ours.
 */

export const BRAND = {
  name: "StockPulse",
  terminal: "Pulse Terminal",
  tagline: "Research on one screen",
  shortTag: "Live · Research · Charts",
  metaTitle: "StockPulse — Pulse Terminal",
  metaDescription:
    "Live quotes, conviction scores, screeners, and research briefs on every ticker. Built for people who read charts before they click buy.",
} as const;

/** User-facing nav labels (routes unchanged) */
export const NAV = [
  { href: "/", label: "Pulse Hub", match: (p: string) => p === "/" },
  { href: "/screener", label: "Alpha Forge", match: (p: string) => p.startsWith("/screener") },
  { href: "/compare", label: "Twin Lens", match: (p: string) => p.startsWith("/compare") },
  { href: "/watchlist", label: "Pulse Watch", match: (p: string) => p.startsWith("/watchlist") },
] as const;

export const MOBILE_NAV = [
  { href: "/", label: "Hub", match: (p: string) => p === "/" },
  { href: "/watchlist", label: "Watch", match: (p: string) => p.startsWith("/watchlist") },
  { href: "/screener", label: "Forge", match: (p: string) => p.startsWith("/screener") },
  { href: "/?search=1", label: "Scan", match: () => false },
] as const;

/** Product terms — short labels, no hype */
export const TERMS = {
  pulseScan: "Pulse Scan",
  pulseScanVerb: "Open Pulse Scan",
  edgeIndex: "Pulse Edge",
  edgeShort: "Pulse Edge",
  smartScore: "Conviction Score",
  meridianBrief: "Research Brief",
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
  eyebrow: "Markets · Live",
  titleLead: "Open a symbol.",
  titleAccent: "Read the setup.",
  titleTail: "",
  subtitleDesktop:
    "Screen by bias and risk, compare two names side by side, and pull entry, stop, and target on any ticker.",
  subtitleMobile: "Screen · Compare · Research",
} as const;

export const FOOTER = {
  legal: `${BRAND.name} — Research tooling, not investment advice.`,
  feeds: ["Quotes", "News", "Research Brief"],
} as const;
