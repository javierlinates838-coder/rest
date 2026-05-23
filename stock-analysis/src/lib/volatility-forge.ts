import type { TechnicalIndicators } from "./technical-analysis";

export interface ForgeScenario {
  bias: "long" | "short";
  entry: number;
  stop: number;
  targets: [number, number, number];
  riskReward: number;
  riskPerShare: number;
  rewardPerShare: number;
  trigger: string;
}

export interface VolatilityForge {
  support: number;
  resistance: number;
  atr: number;
  atrPercent: number;
  long: ForgeScenario;
  short: ForgeScenario;
  recommended: "long" | "short" | "wait";
  /** True when S/R pivots did not bracket live price — ATR bands used */
  levelsEstimated: boolean;
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

function rr(entry: number, stop: number, target: number): number {
  const risk = Math.abs(entry - stop);
  if (risk < 0.01) return 0;
  return Number((Math.abs(target - entry) / risk).toFixed(2));
}

/** Nearest support must be below price; nearest resistance must be above */
export function resolveNearestSr(
  price: number,
  supportLevels: number[],
  resistanceLevels: number[],
  atr: number,
  bollinger?: { lower: number; upper: number }
): {
  support: number;
  nextSupport: number;
  resistance: number;
  nextResistance: number;
  levelsEstimated: boolean;
} {
  const below = supportLevels
    .filter((s) => Number.isFinite(s) && s > 0 && s < price * 0.998)
    .sort((a, b) => b - a);
  const above = resistanceLevels
    .filter((r) => Number.isFinite(r) && r > 0 && r > price * 1.002)
    .sort((a, b) => a - b);

  let levelsEstimated = below.length === 0 || above.length === 0;

  let support = below[0];
  let resistance = above[0];

  if (support == null) {
    support = bollinger?.lower && bollinger.lower < price ? bollinger.lower : price - atr * 2;
    levelsEstimated = true;
  }
  if (resistance == null) {
    resistance =
      bollinger?.upper && bollinger.upper > price ? bollinger.upper : price + atr * 2;
    levelsEstimated = true;
  }

  const nextSupport = below[1] ?? round2(Math.min(support - atr, price - atr * 3));
  const nextResistance = above[1] ?? round2(Math.max(resistance + atr, price + atr * 3));

  return {
    support: round2(support),
    nextSupport: round2(nextSupport),
    resistance: round2(resistance),
    nextResistance: round2(nextResistance),
    levelsEstimated,
  };
}

export function buildVolatilityForge(
  price: number,
  indicators: Pick<
    TechnicalIndicators,
    "atr" | "supportLevels" | "resistanceLevels" | "bollingerBands"
  >,
  signal: { signal: string; confidence: number }
): VolatilityForge {
  const atr = indicators.atr > 0 ? indicators.atr : price * 0.02;
  const { support, nextSupport, resistance, nextResistance, levelsEstimated } =
    resolveNearestSr(
      price,
      indicators.supportLevels,
      indicators.resistanceLevels,
      atr,
      indicators.bollingerBands
    );

  const longEntry = round2(Math.min(price - atr * 0.35, support + Math.max(0, price - support) * 0.35));
  const longStop = round2(Math.min(support - atr * 0.4, longEntry - atr * 1.2));
  const longTargets: [number, number, number] = [
    round2(price + atr * 1.2),
    round2(Math.min(resistance, price + atr * 2.2)),
    round2(Math.min(nextResistance, resistance + atr * 0.6)),
  ];
  const longRisk = Math.abs(longEntry - longStop);
  const longReward = Math.abs(longTargets[1] - longEntry);

  const shortEntry = round2(Math.max(price + atr * 0.35, resistance - Math.max(0, resistance - price) * 0.35));
  const shortStop = round2(Math.max(resistance + atr * 0.4, shortEntry + atr * 1.2));
  const shortTargets: [number, number, number] = [
    round2(price - atr * 1.2),
    round2(Math.max(support, price - atr * 2.2)),
    round2(Math.max(nextSupport, support - atr * 0.6)),
  ];
  const shortRisk = Math.abs(shortStop - shortEntry);
  const shortReward = Math.abs(shortEntry - shortTargets[1]);

  const long: ForgeScenario = {
    bias: "long",
    entry: longEntry,
    stop: longStop,
    targets: longTargets,
    riskReward: rr(longEntry, longStop, longTargets[1]),
    riskPerShare: round2(longRisk),
    rewardPerShare: round2(longReward),
    trigger: `Pullback toward ${formatLevel(support)} (support below spot)`,
  };

  const short: ForgeScenario = {
    bias: "short",
    entry: shortEntry,
    stop: shortStop,
    targets: shortTargets,
    riskReward: rr(shortEntry, shortStop, shortTargets[1]),
    riskPerShare: round2(shortRisk),
    rewardPerShare: round2(shortReward),
    trigger: `Rejection near ${formatLevel(resistance)} (resistance above spot)`,
  };

  let recommended: VolatilityForge["recommended"] = "wait";
  const hold = signal.signal === "Hold";
  if (!hold && signal.signal.includes("Buy") && signal.confidence >= 35) recommended = "long";
  else if (!hold && signal.signal.includes("Sell") && signal.confidence >= 35) recommended = "short";

  return {
    support,
    resistance,
    atr: round2(atr),
    atrPercent: round2((atr / price) * 100),
    long,
    short,
    recommended,
    levelsEstimated,
  };
}

function formatLevel(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function pctFromPrice(level: number, current: number): string {
  if (current <= 0) return "—";
  const pct = ((level - current) / current) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}
