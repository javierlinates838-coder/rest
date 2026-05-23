/** Plain-language definitions so scores are not confused on the stock page. */

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
    short: "0–100 · master read",
    detail:
      "Weighted blend of six factors below (technicals, momentum, risk, sentiment, data quality, structure). This is the number in the ring — your headline strength score.",
  },
  grade: {
    title: "Letter grade",
    short: "A+ to F",
    detail: "Letter shorthand for the Overall Pulse Score. B = solid but not elite; use with the trade signal and regime.",
  },
  signal: {
    title: "Technical signal",
    short: "From indicators",
    detail:
      "Classic buy/sell/hold from RSI, MACD, moving averages, and trend tools on live or estimated price history. Can differ from the model tilt when data is thin.",
  },
  smart: {
    title: "Conviction Score",
    short: "Signal + risk + tape",
    detail:
      "TipRanks-style 0–100 score combining the technical signal, confidence %, risk grade, and today’s price move. Often close to the Overall Pulse Score but calculated on a different formula.",
  },
  edge: {
    title: "Pulse Edge",
    short: "Fused quality",
    detail:
      "Proprietary fusion of Conviction Score, model confidence, data integrity, and risk asymmetry. Low edge with a high composite usually means weak data or risk flags.",
  },
  risk: {
    title: "Risk grade",
    short: "A best → F worst",
    detail: "Letter from the red-flag engine (volatility, flags, financial stress). C = average risk; size positions accordingly.",
  },
  alignment: {
    title: "Trend alignment",
    short: "6 checks",
    detail: "How many of six trend tools agree (moving averages, MACD, stochastic). 6/6 = full bullish alignment; 0/6 = bearish stack.",
  },
  integrity: {
    title: "Data integrity",
    short: "Feed quality",
    detail: "How trustworthy quotes and chart history are. Below 60 = partial or estimated data — verify before acting on levels.",
  },
  pillar: {
    title: "Factor pillar",
    short: "0–100 each",
    detail: "One ingredient of the Overall Pulse Score. Weight % shows how much it moves the master score.",
  },
};

export function scoreVerdict(composite: number, signal: string, smartLabel: string): string {
  const tone =
    composite >= 68
      ? "Favorable setup if risk is acceptable"
      : composite >= 52
        ? "Mixed — wait for confirmation"
        : "Weak setup — prioritize defense";

  const signalNote = signal.toLowerCase().includes("hold")
    ? "Technicals are neutral"
    : signal.toLowerCase().includes("buy")
      ? "Technicals lean bullish"
      : signal.toLowerCase().includes("sell")
        ? "Technicals lean bearish"
        : "Technicals are mixed";

  const disagree =
    (smartLabel.includes("Buy") && signal.includes("Sell")) ||
    (smartLabel.includes("Sell") && signal.includes("Buy")) ||
    (smartLabel.includes("Strong") && signal === "Hold");

  if (disagree) {
    return `${tone}. ${signalNote}, but the Conviction Score tilts ${smartLabel} — read both before sizing.`;
  }
  return `${tone}. ${signalNote} · model tilt ${smartLabel}.`;
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
