/** Keeps signals, price targets, and AI copy aligned so the UI does not contradict itself. */

import type { TechnicalIndicators } from "@/lib/technical-analysis";

const VALID_SIGNALS = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"] as const;

function round2(n: number): number {
  return Number(n.toFixed(2));
}

export function normalizeRecommendation(raw: string, fallback = "Hold"): string {
  const s = raw?.trim() || fallback;
  const match = VALID_SIGNALS.find((v) => v.toLowerCase() === s.toLowerCase());
  if (match) return match;
  if (/strong\s*buy/i.test(s)) return "Strong Buy";
  if (/strong\s*sell/i.test(s)) return "Strong Sell";
  if (/buy/i.test(s)) return "Buy";
  if (/sell/i.test(s)) return "Sell";
  return "Hold";
}

/** Weak Buy/Sell → Hold so we do not show SELL at 23% confidence. */
export function resolveSignal(
  rawSignal: string,
  confidence: number
): { signal: string; confidence: number; weakConviction: boolean } {
  const signal = normalizeRecommendation(rawSignal, "Hold");
  const conf = Math.max(0, Math.min(100, Math.round(confidence)));

  const isDirectional =
    signal === "Buy" || signal === "Strong Buy" || signal === "Sell" || signal === "Strong Sell";

  if (isDirectional && conf < 35) {
    return { signal: "Hold", confidence: conf, weakConviction: true };
  }

  return { signal, confidence: conf, weakConviction: false };
}

function nearestLevel(levels: number[], price: number, direction: "below" | "above"): number | null {
  const filtered =
    direction === "below"
      ? levels.filter((l) => l < price * 0.998).sort((a, b) => b - a)
      : levels.filter((l) => l > price * 1.002).sort((a, b) => a - b);
  return filtered.length > 0 ? filtered[0] : null;
}

/** Price targets from ATR multiples and support/resistance when available. */
export function buildPriceTargets(
  price: number,
  recommendation: string,
  indicators?: Pick<TechnicalIndicators, "atr" | "supportLevels" | "resistanceLevels" | "bollingerBands">
): { low: number; mid: number; high: number } {
  if (price <= 0) return { low: 0, mid: 0, high: 0 };

  const rec = normalizeRecommendation(recommendation, "Hold");
  const atr = indicators?.atr && indicators.atr > 0 ? indicators.atr : price * 0.025;
  const supports = indicators?.supportLevels ?? [];
  const resistances = indicators?.resistanceLevels ?? [];
  const support = nearestLevel(supports, price, "below");
  const resistance = nearestLevel(resistances, price, "above");

  if (rec.includes("Sell")) {
    const high = round2(resistance ?? price + atr * 0.5);
    const mid = round2(price - atr * 1.2);
    const low = round2(support ?? price - atr * 2.5);
    return { low: Math.min(low, mid), mid, high: Math.max(high, price) };
  }

  if (rec.includes("Buy")) {
    const low = round2(support ?? price - atr * 1.5);
    const mid = round2(price + atr * 1.5);
    const high = round2(resistance ?? price + atr * 3);
    return { low: Math.min(low, price), mid, high: Math.max(high, mid) };
  }

  const bb = indicators?.bollingerBands;
  if (bb && bb.upper > bb.lower) {
    return {
      low: round2(bb.lower),
      mid: round2(price),
      high: round2(bb.upper),
    };
  }

  return {
    low: round2(price - atr * 1.2),
    mid: round2(price),
    high: round2(price + atr * 1.2),
  };
}

export function normalizePriceTargets(
  price: number,
  recommendation: string,
  raw?: { low?: number; mid?: number; high?: number },
  indicators?: Pick<TechnicalIndicators, "atr" | "supportLevels" | "resistanceLevels" | "bollingerBands">
): { low: number; mid: number; high: number } {
  const defaults = buildPriceTargets(price, recommendation, indicators);
  if (price <= 0) return defaults;

  const values = [
    typeof raw?.low === "number" && Number.isFinite(raw.low) ? raw.low : defaults.low,
    typeof raw?.mid === "number" && Number.isFinite(raw.mid) ? raw.mid : defaults.mid,
    typeof raw?.high === "number" && Number.isFinite(raw.high) ? raw.high : defaults.high,
  ].sort((a, b) => a - b);

  let [low, mid, high] = values;

  if (high - low < price * 0.015) {
    return defaults;
  }

  const rec = normalizeRecommendation(recommendation, "Hold");
  if (rec.includes("Buy")) {
    low = Math.min(low, price * 0.995);
    high = Math.max(high, price * 1.01);
    mid = Math.max(mid, price * 0.995);
  } else if (rec.includes("Sell")) {
    high = Math.min(high, price * 1.04);
    low = Math.min(low, price * 0.98);
    mid = Math.min(mid, price * 1.01);
  }

  return { low: round2(low), mid: round2(mid), high: round2(high) };
}

export function priceChangePercent(target: number, current: number): string {
  if (current <= 0) return "—";
  return formatSignedPercent(((target - current) / current) * 100);
}

export function formatSignedPercent(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

/** Map algorithmic risk grade to AI risk level label. */
export function riskLevelFromGrade(grade: string): string {
  switch (grade) {
    case "A":
    case "B":
      return "Low";
    case "C":
      return "Medium";
    case "D":
      return "High";
    default:
      return "Very High";
  }
}
