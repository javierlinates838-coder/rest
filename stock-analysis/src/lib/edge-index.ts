/**
 * StockPulse Edge Index — proprietary 0–100 score.
 * Combines Smart Score with conviction, data integrity, and risk asymmetry.
 * This is our differentiator vs generic "buy/sell" apps.
 */

import { computeSmartScore, type SmartScoreInput } from "@/lib/smart-score";

export interface EdgeIndexInput extends SmartScoreInput {
  aiAlignsWithSignal?: boolean;
  redFlagCount?: number;
  criticalFlagCount?: number;
  analystBuyRatio?: number; // 0–1
  sentimentScore?: number; // -1 to 1
}

export interface EdgeIndexResult {
  edgeScore: number;
  tier: "Elite" | "Strong" | "Moderate" | "Weak" | "Avoid";
  conviction: number;
  dataIntegrity: number;
  riskAsymmetry: number;
  smartScore: number;
  drivers: string[];
  warnings: string[];
}

export function computeEdgeIndex(input: EdgeIndexInput): EdgeIndexResult {
  const smart = computeSmartScore(input);
  const drivers: string[] = [];
  const warnings: string[] = [];

  // Conviction: signal strength + AI alignment
  let conviction = smart.score * 0.6 + (input.confidence - 50) * 0.4;
  if (input.aiAlignsWithSignal) {
    conviction += 8;
    drivers.push("AI narrative aligns with technical signal");
  } else if (input.aiAlignsWithSignal === false) {
    conviction -= 10;
    warnings.push("AI view diverges from technical signal — lower conviction");
  }
  conviction = Math.max(0, Math.min(100, conviction));

  // Data integrity from research quality
  const dq = input.researchQualityScore ?? 55;
  const dataIntegrity = dq;
  if (dq >= 80) drivers.push("High-quality live data feed");
  else if (dq < 60) warnings.push("Thin or simulated data — verify before trading");

  // Risk asymmetry: good signal + low risk grade
  const riskMap: Record<string, number> = { A: 90, B: 75, C: 55, D: 35, F: 15 };
  let riskAsymmetry = riskMap[input.riskGrade] ?? 50;
  if (input.riskGrade === "A" || input.riskGrade === "B") {
    drivers.push(`Favorable risk grade (${input.riskGrade})`);
  }
  if (input.criticalFlagCount && input.criticalFlagCount > 0) {
    riskAsymmetry -= input.criticalFlagCount * 15;
    warnings.push(`${input.criticalFlagCount} critical risk flag(s) detected`);
  }
  if (input.redFlagCount && input.redFlagCount > 2) {
    riskAsymmetry -= 8;
  }

  if (typeof input.analystBuyRatio === "number" && input.analystBuyRatio > 0.6) {
    riskAsymmetry += 6;
    drivers.push("Street consensus skews bullish");
  }

  if (typeof input.sentimentScore === "number") {
    if (input.sentimentScore > 0.3) conviction += 4;
    if (input.sentimentScore < -0.3) conviction -= 4;
  }

  const edgeScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        smart.score * 0.45 + conviction * 0.25 + dataIntegrity * 0.15 + riskAsymmetry * 0.15
      )
    )
  );

  let tier: EdgeIndexResult["tier"];
  if (edgeScore >= 82) tier = "Elite";
  else if (edgeScore >= 68) tier = "Strong";
  else if (edgeScore >= 48) tier = "Moderate";
  else if (edgeScore >= 32) tier = "Weak";
  else tier = "Avoid";

  return {
    edgeScore,
    tier,
    conviction: Math.round(conviction),
    dataIntegrity: Math.round(dataIntegrity),
    riskAsymmetry: Math.round(riskAsymmetry),
    smartScore: smart.score,
    drivers: drivers.slice(0, 4),
    warnings: warnings.slice(0, 3),
  };
}

export function edgeTierColor(tier: EdgeIndexResult["tier"]): string {
  switch (tier) {
    case "Elite":
      return "text-emerald-300";
    case "Strong":
      return "text-green-400";
    case "Moderate":
      return "text-amber-400";
    case "Weak":
      return "text-orange-400";
    default:
      return "text-red-400";
  }
}
