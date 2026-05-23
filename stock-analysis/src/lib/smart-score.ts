/** Composite 0–100 score (TipRanks-style) from signal, risk, and momentum. */

export interface SmartScoreInput {
  signal: string;
  confidence: number;
  riskGrade: string;
  changePercent: number;
  rsi: number;
  researchQualityScore?: number;
}

export interface SmartScoreResult {
  score: number;
  label: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  tone: "bullish" | "neutral" | "bearish";
}

export function computeSmartScore(input: SmartScoreInput): SmartScoreResult {
  let score = 50;

  if (input.signal.includes("Strong Buy")) score += 28;
  else if (input.signal.includes("Buy")) score += 18;
  else if (input.signal.includes("Strong Sell")) score -= 28;
  else if (input.signal.includes("Sell")) score -= 18;

  score += (input.confidence - 50) * 0.25;

  const riskAdj: Record<string, number> = { A: 12, B: 8, C: 0, D: -8, F: -15 };
  score += riskAdj[input.riskGrade] ?? 0;

  score += Math.max(-8, Math.min(8, input.changePercent * 1.5));

  if (input.rsi < 30) score += 6;
  else if (input.rsi > 70) score -= 6;

  if (typeof input.researchQualityScore === "number") {
    score += (input.researchQualityScore - 60) * 0.15;
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  let label: SmartScoreResult["label"];
  let tone: SmartScoreResult["tone"];
  if (score >= 75) {
    label = "Strong Buy";
    tone = "bullish";
  } else if (score >= 58) {
    label = "Buy";
    tone = "bullish";
  } else if (score <= 25) {
    label = "Strong Sell";
    tone = "bearish";
  } else if (score <= 42) {
    label = "Sell";
    tone = "bearish";
  } else {
    label = "Hold";
    tone = "neutral";
  }

  return { score, label, tone };
}

export function smartScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 58) return "text-green-400";
  if (score <= 25) return "text-red-400";
  if (score <= 42) return "text-orange-400";
  return "text-amber-400";
}
