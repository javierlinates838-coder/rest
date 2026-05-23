/** Shared symbol lists for Pulse Hub — one source, no repeated mega-cap spam. */

/** Chips under search (compact, diverse sectors). */
export const HUB_QUICK_PICKS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "JPM",
  "XOM",
  "UNH",
] as const;

/** Liquid names scored for Meridian picks & forge universe. */
export const LIQUID_UNIVERSE = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "TSLA",
  "AMD",
  "JPM",
  "V",
  "NFLX",
  "AVGO",
  "COST",
  "UNH",
  "XOM",
  "CRM",
  "ORCL",
  "INTC",
] as const;

/** Bench for Active Tape when movers are stripped out. */
export const TAPE_BENCH = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "AMD",
  "JPM",
  "V",
  "NFLX",
  "COST",
  "UNH",
  "CRM",
  "ORCL",
  "INTC",
  "BA",
  "DIS",
] as const;
