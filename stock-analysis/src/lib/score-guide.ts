/** Score definitions for the conviction cockpit. */

export type ScoreKey =
  | "composite"
  | "grade"
  | "signal"
  | "smart"
  | "edge"
  | "risk"
  | "alignment"
  | "integrity"
  | "pillar";

export const SCORE_GUIDE: Record<
  ScoreKey,
  { title: string; short: string; detail: string }
> = {
  composite: {
    title: "Overall Pulse Score",
    short: "0–100 headline",
    detail:
      "Weighted average of the six factors below: technicals, momentum, risk, sentiment, data quality, and structure. The number in the ring.",
  },
  grade: {
    title: "Letter grade",
    short: "A+ to F",
    detail: "Shorthand for the overall score. Read it next to the signal and regime, not on its own.",
  },
  signal: {
    title: "Technical signal",
    short: "Indicator read",
    detail:
      "Buy, sell, or hold from RSI, MACD, moving averages, and trend tools. Can diverge from the conviction score when feeds are thin.",
  },
  smart: {
    title: "Conviction Score",
    short: "Signal + risk + tape",
    detail:
      "0–100 score from the technical signal, confidence, risk grade, and today's move. Same scale as the overall score, different formula.",
  },
  edge: {
    title: "Pulse Edge",
    short: "Trade quality",
    detail:
      "Combines conviction score, data integrity, and risk asymmetry. A low edge with a high overall score usually means weak data or risk flags.",
  },
  risk: {
    title: "Risk grade",
    short: "A best → F worst",
    detail: "From the red-flag engine: volatility, flags, financial stress. C is average.",
  },
  alignment: {
    title: "Trend alignment",
    short: "6 checks",
    detail: "How many of six trend tools agree. 6/6 bullish stack, 0/6 bearish.",
  },
  integrity: {
    title: "Data integrity",
    short: "Feed quality",
    detail: "Trust in quotes and chart history. Below 60 means partial or estimated data.",
  },
  pillar: {
    title: "Factor",
    short: "0–100 each",
    detail: "One input to the overall score. Weight shows its share of the total.",
  },
};

export function scoreVerdict(composite: number, signal: string, smartLabel: string): string {
  const tone =
    composite >= 68
      ? "Setup leans constructive"
      : composite >= 52
        ? "Mixed tape. Wait for a cleaner read"
        : "Weak read. Defense first";

  const signalNote = signal.toLowerCase().includes("hold")
    ? "Technicals neutral"
    : signal.toLowerCase().includes("buy")
      ? "Technicals bullish"
      : signal.toLowerCase().includes("sell")
        ? "Technicals bearish"
        : "Technicals mixed";

  const disagree =
    (smartLabel.includes("Buy") && signal.includes("Sell")) ||
    (smartLabel.includes("Sell") && signal.includes("Buy")) ||
    (smartLabel.includes("Strong") && signal === "Hold");

  if (disagree) {
    return `${tone}. ${signalNote}; conviction score says ${smartLabel}.`;
  }
  return `${tone}. ${signalNote}, conviction ${smartLabel}.`;
}

export function gradeFromComposite(composite: number): string {
  if (composite >= 88) return "A+";
  if (composite >= 78) return "A";
  if (composite >= 68) return "B+";
  if (composite >= 58) return "B";
  if (composite >= 48) return "C";
  if (composite >= 35) return "D";
  return "F";
}
