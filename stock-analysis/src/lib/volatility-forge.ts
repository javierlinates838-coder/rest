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
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

function rr(entry: number, stop: number, target: number): number {
  const risk = Math.abs(entry - stop);
  if (risk < 0.01) return 0;
  return Number((Math.abs(target - entry) / risk).toFixed(2));
}

export function buildVolatilityForge(
  price: number,
  indicators: Pick<TechnicalIndicators, "atr" | "supportLevels" | "resistanceLevels">,
  signal: { signal: string; confidence: number }
): VolatilityForge {
  const atr = indicators.atr > 0 ? indicators.atr : price * 0.02;
  const support = indicators.supportLevels[0] ?? price - atr * 2;
  const nextSupport = indicators.supportLevels[1] ?? support - atr;
  const resistance = indicators.resistanceLevels[0] ?? price + atr * 2;
  const nextResistance = indicators.resistanceLevels[1] ?? resistance + atr;

  const longEntry = round2(Math.min(price - atr * 0.35, support + (price - support) * 0.4));
  const longStop = round2(Math.min(support - atr * 0.4, longEntry - atr * 1.2));
  const longTargets: [number, number, number] = [
    round2(price + atr * 1.2),
    round2(Math.max(resistance, price + atr * 2)),
    round2(Math.max(nextResistance, resistance + atr * 0.8)),
  ];
  const longRisk = Math.abs(longEntry - longStop);
  const longReward = Math.abs(longTargets[1] - longEntry);

  const shortEntry = round2(Math.max(price + atr * 0.35, resistance - (resistance - price) * 0.4));
  const shortStop = round2(Math.max(resistance + atr * 0.4, shortEntry + atr * 1.2));
  const shortTargets: [number, number, number] = [
    round2(price - atr * 1.2),
    round2(Math.min(support, price - atr * 2)),
    round2(Math.min(nextSupport, support - atr * 0.8)),
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
    trigger: `Pullback toward ${formatLevel(support)} support`,
  };

  const short: ForgeScenario = {
    bias: "short",
    entry: shortEntry,
    stop: shortStop,
    targets: shortTargets,
    riskReward: rr(shortEntry, shortStop, shortTargets[1]),
    riskPerShare: round2(shortRisk),
    rewardPerShare: round2(shortReward),
    trigger: `Rejection near ${formatLevel(resistance)} resistance`,
  };

  let recommended: VolatilityForge["recommended"] = "wait";
  if (signal.signal.includes("Buy") && signal.confidence >= 35) recommended = "long";
  else if (signal.signal.includes("Sell") && signal.confidence >= 35) recommended = "short";
  else if (signal.signal.includes("Buy")) recommended = "long";
  else if (signal.signal.includes("Sell")) recommended = "short";

  return {
    support: round2(support),
    resistance: round2(resistance),
    atr: round2(atr),
    atrPercent: round2((atr / price) * 100),
    long,
    short,
    recommended,
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
