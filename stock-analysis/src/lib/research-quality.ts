import type { PriceHistorySource } from "@/services/stock-data";

export interface ResearchQuality {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  issues: string[];
  historyBars: number;
  chartSource: PriceHistorySource | "unknown";
  hasLiveNews: boolean;
  hasAiKey: boolean;
}

export function assessResearchQuality(input: {
  chartSource: PriceHistorySource | "unknown";
  historyBars: number;
  newsCount: number;
  newsSource: string;
  quoteIsMock: boolean;
  hasFinnhubKey: boolean;
  hasFmpKey: boolean;
}): ResearchQuality {
  let score = 100;
  const issues: string[] = [];

  if (input.chartSource === "simulated") {
    score -= 45;
    issues.push("Price history is simulated — technical signals are not based on real OHLCV.");
  } else if (input.chartSource === "yahoo") {
    score -= 8;
  }

  if (input.historyBars < 50) {
    score -= 20;
    issues.push(`Only ${input.historyBars} trading days available — long-term indicators may be unreliable.`);
  } else if (input.historyBars < 120) {
    score -= 10;
    issues.push("Limited history — SMA200 and some indicators use partial windows.");
  }

  if (input.newsCount === 0) {
    score -= 15;
    issues.push("No live headlines — sentiment and AI context rely on price data only.");
  } else if (input.newsSource === "generated") {
    score -= 25;
    issues.push("News is illustrative only, not from live headline providers.");
  }

  if (input.quoteIsMock) {
    score -= 40;
    issues.push("Quote data is estimated, not from a live market feed.");
  }

  if (!input.hasFmpKey && !input.hasFinnhubKey) {
    score -= 12;
    issues.push("Limited live market feeds — some quotes and history use fallback sources.");
  }

  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    score -= 18;
    issues.push("Narrative brief uses the built-in rules engine instead of full AI synthesis.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade: ResearchQuality["grade"];
  let label: string;
  if (score >= 85) {
    grade = "A";
    label = "High-confidence research";
  } else if (score >= 70) {
    grade = "B";
    label = "Solid research — minor data gaps";
  } else if (score >= 55) {
    grade = "C";
    label = "Mixed quality — verify key numbers";
  } else if (score >= 40) {
    grade = "D";
    label = "Limited data — use for orientation only";
  } else {
    grade = "F";
    label = "Low data quality — not investment-grade";
  }

  return {
    score,
    grade,
    label,
    issues,
    historyBars: input.historyBars,
    chartSource: input.chartSource,
    hasLiveNews: input.newsCount > 0 && input.newsSource !== "generated",
    hasAiKey: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
  };
}

/** Cap signal confidence when underlying data is weak. */
export function applyDataQualityToSignal(
  signal: { signal: string; confidence: number; reasons: string[] },
  quality: ResearchQuality
): { signal: string; confidence: number; reasons: string[] } {
  const reasons = [...signal.reasons];
  let confidence = signal.confidence;
  let outSignal = signal.signal;

  if (quality.chartSource === "simulated") {
    confidence = Math.min(confidence, 40);
    reasons.unshift("Estimated price history — signal confidence capped");
    if (outSignal === "Strong Buy" || outSignal === "Strong Sell") {
      outSignal = "Hold";
      reasons.push("Strong directional signal suppressed on estimated prices");
    }
  }

  if (quality.score < 55) {
    confidence = Math.min(confidence, 50);
    reasons.push(`Research quality ${quality.grade} (${quality.score}/100) — conviction capped`);
  }

  if (quality.score < 40 && (outSignal === "Buy" || outSignal === "Sell" || outSignal === "Strong Buy" || outSignal === "Strong Sell")) {
    outSignal = "Hold";
    reasons.push("Insufficient live data for a directional rating");
  }

  return { signal: outSignal, confidence: Math.round(confidence), reasons };
}
