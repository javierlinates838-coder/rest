/** Subset used by conviction model — stock API may omit optional series like OBV. */
export type ConvictionIndicators = {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  atr: number;
  stochastic: { k: number; d: number };
  adx: number;
  supportLevels: number[];
  resistanceLevels: number[];
};
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";

export type MarketRegime =
  | "Trending Bull"
  | "Trending Bear"
  | "Range-bound"
  | "High Volatility"
  | "Breakout Watch";

export interface ConvictionPillar {
  id: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
  tone: "bull" | "bear" | "neutral";
}

export interface AdvancedConviction {
  composite: number;
  grade: "A+" | "A" | "B+" | "B" | "C" | "D" | "F";
  regime: MarketRegime;
  regimeDetail: string;
  pillars: ConvictionPillar[];
  edgeBlend: { label: string; weight: number; value: number }[];
  alignment: { label: string; bullish: boolean }[];
  mtf: { label: string; changePercent: number; tone: "bull" | "bear" | "neutral" }[];
  tacticalRead: string;
}

export function computeAdvancedConviction(input: {
  price: number;
  changePercent: number;
  indicators: ConvictionIndicators;
  signal: string;
  confidence: number;
  smart: SmartScoreResult;
  edge: EdgeIndexResult;
  riskGrade: string;
  sentimentScore: number;
  researchQualityScore?: number;
  historyCloses?: number[];
}): AdvancedConviction {
  const { indicators: ind, price } = input;
  const closes = input.historyCloses ?? [];
  const maBull =
    (price > ind.sma20 ? 1 : 0) +
    (price > ind.sma50 ? 1 : 0) +
    (price > ind.sma200 ? 1 : 0) +
    (price > ind.ema12 ? 1 : 0) +
    (ind.ema12 > ind.ema26 ? 1 : 0);
  const technical = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        maBull * 14 +
          (ind.macd.histogram > 0 ? 18 : -8) +
          (ind.rsi > 45 && ind.rsi < 65 ? 12 : ind.rsi < 35 ? 20 : ind.rsi > 70 ? -12 : 4) +
          (ind.adx > 22 ? 14 : 0)
      )
    )
  );

  const momentum = Math.round(
    Math.max(0, Math.min(100, 50 + input.changePercent * 4 + (ind.adx > 28 ? 12 : 0)))
  );

  const atrPct = price > 0 ? (ind.atr / price) * 100 : 0;
  const volatility = Math.round(
    Math.max(0, Math.min(100, 100 - Math.min(atrPct * 25, 55) - (input.riskGrade === "D" || input.riskGrade === "F" ? 20 : 0)))
  );

  const sentiment = Math.round(Math.max(0, Math.min(100, 50 + input.sentimentScore * 35)));

  const integrity = Math.round(input.researchQualityScore ?? input.edge.dataIntegrity);

  const structural = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        55 +
          (price > ind.supportLevels[0] ? 15 : -10) +
          (price < ind.resistanceLevels[0] ? 10 : -5) +
          input.edge.riskAsymmetry * 0.2
      )
    )
  );

  const pillars: ConvictionPillar[] = [
    {
      id: "technical",
      label: "Technical stack",
      score: technical,
      weight: 0.22,
      detail: `${maBull}/5 MA checks · MACD ${ind.macd.histogram >= 0 ? "↑" : "↓"} · RSI ${ind.rsi.toFixed(0)}`,
      tone: technical >= 58 ? "bull" : technical <= 42 ? "bear" : "neutral",
    },
    {
      id: "momentum",
      label: "Momentum",
      score: momentum,
      weight: 0.18,
      detail: `Session ${input.changePercent >= 0 ? "+" : ""}${input.changePercent.toFixed(2)}% · ADX ${ind.adx.toFixed(0)}`,
      tone: momentum >= 58 ? "bull" : momentum <= 42 ? "bear" : "neutral",
    },
    {
      id: "volatility",
      label: "Vol / risk",
      score: volatility,
      weight: 0.15,
      detail: `ATR ${atrPct.toFixed(1)}% of price · Risk ${input.riskGrade}`,
      tone: volatility >= 55 ? "bull" : volatility <= 40 ? "bear" : "neutral",
    },
    {
      id: "sentiment",
      label: "Sentiment",
      score: sentiment,
      weight: 0.12,
      detail: `Narrative skew ${input.sentimentScore >= 0 ? "+" : ""}${input.sentimentScore.toFixed(2)}`,
      tone: sentiment >= 58 ? "bull" : sentiment <= 42 ? "bear" : "neutral",
    },
    {
      id: "integrity",
      label: "Data integrity",
      score: integrity,
      weight: 0.13,
      detail: integrity >= 70 ? "Live-grade inputs" : "Thin or estimated feeds",
      tone: integrity >= 65 ? "bull" : integrity < 50 ? "bear" : "neutral",
    },
    {
      id: "structure",
      label: "Structure",
      score: structural,
      weight: 0.2,
      detail: `S/R context · Edge risk asym ${input.edge.riskAsymmetry}`,
      tone: structural >= 58 ? "bull" : structural <= 42 ? "bear" : "neutral",
    },
  ];

  const composite = Math.round(
    pillars.reduce((sum, p) => sum + p.score * p.weight, 0)
  );

  const regime = detectRegime(ind, input.changePercent, price, input.signal);
  const grade = compositeToGrade(composite);

  const edgeBlend = [
    { label: "Conviction Score", weight: 0.45, value: input.smart.score },
    { label: "Model conviction", weight: 0.25, value: input.edge.conviction },
    { label: "Data integrity", weight: 0.15, value: input.edge.dataIntegrity },
    { label: "Risk asymmetry", weight: 0.15, value: input.edge.riskAsymmetry },
  ];

  const alignment = [
    { label: "SMA 20", bullish: price > ind.sma20 },
    { label: "SMA 50", bullish: price > ind.sma50 },
    { label: "SMA 200", bullish: price > ind.sma200 },
    { label: "EMA 12/26", bullish: ind.ema12 > ind.ema26 },
    { label: "MACD hist", bullish: ind.macd.histogram > 0 },
    { label: "Stoch %K", bullish: ind.stochastic.k > 50 },
  ];

  const mtf = computeMtf(closes, price);

  const tacticalRead = buildTacticalRead({
    composite,
    regime,
    signal: input.signal,
    edgeTier: input.edge.tier,
    alignment,
  });

  return {
    composite,
    grade,
    regime,
    regimeDetail: regimeDetail(regime, ind, input.changePercent),
    pillars,
    edgeBlend,
    alignment,
    mtf,
    tacticalRead,
  };
}

function compositeToGrade(score: number): AdvancedConviction["grade"] {
  if (score >= 88) return "A+";
  if (score >= 78) return "A";
  if (score >= 68) return "B+";
  if (score >= 58) return "B";
  if (score >= 48) return "C";
  if (score >= 35) return "D";
  return "F";
}

function detectRegime(
  ind: ConvictionIndicators,
  changePercent: number,
  price: number,
  signal: string
): MarketRegime {
  const atrPct = price > 0 ? (ind.atr / price) * 100 : 0;
  if (atrPct > 3.2) return "High Volatility";
  if (ind.adx < 18 && Math.abs(changePercent) < 0.6) return "Range-bound";
  const bullStack = price > ind.sma50 && ind.ema12 > ind.ema26 && ind.macd.histogram > 0;
  const bearStack = price < ind.sma50 && ind.ema12 < ind.ema26 && ind.macd.histogram < 0;
  if (ind.adx >= 25 && bullStack) return "Trending Bull";
  if (ind.adx >= 25 && bearStack) return "Trending Bear";
  if (signal.includes("Buy") && ind.rsi < 45) return "Breakout Watch";
  if (signal.includes("Sell") && ind.rsi > 55) return "Breakout Watch";
  return changePercent >= 0 ? "Trending Bull" : "Trending Bear";
}

function regimeDetail(regime: MarketRegime, ind: ConvictionIndicators, changePercent: number): string {
  switch (regime) {
    case "High Volatility":
      return `Wide ATR band — size down and widen stops.`;
    case "Range-bound":
      return `ADX ${ind.adx.toFixed(0)} — mean-reversion favored over trend chase.`;
    case "Breakout Watch":
      return `Compression resolving — wait for volume confirmation.`;
    case "Trending Bull":
      return `Trend tools align bullish · tape ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%.`;
    case "Trending Bear":
      return `Trend tools align bearish · tape ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%.`;
    default:
      return "";
  }
}

function computeMtf(
  closes: number[],
  price: number
): AdvancedConviction["mtf"] {
  const pct = (from: number) => {
    if (from <= 0 || !Number.isFinite(from)) return 0;
    return ((price - from) / from) * 100;
  };
  const pick = (n: number) => (closes.length > n ? closes[closes.length - 1 - n] : closes[0] ?? price);
  const windows = [
    { label: "5D", n: 5 },
    { label: "20D", n: 20 },
    { label: "60D", n: 60 },
  ];
  return windows.map(({ label, n }) => {
    const ch = pct(pick(n));
    return {
      label,
      changePercent: ch,
      tone: ch > 0.5 ? "bull" : ch < -0.5 ? "bear" : ("neutral" as const),
    };
  });
}

function buildTacticalRead(input: {
  composite: number;
  regime: MarketRegime;
  signal: string;
  edgeTier: EdgeIndexResult["tier"];
  alignment: { label: string; bullish: boolean }[];
}): string {
  const bullAlign = input.alignment.filter((a) => a.bullish).length;
  if (input.edgeTier === "Avoid" || input.composite < 40) {
    return "Model favors capital preservation — no asymmetric edge until structure improves.";
  }
  if (input.regime === "High Volatility") {
    return "Volatility regime: reduce size, use wider stops, and avoid chasing extensions.";
  }
  if (input.regime === "Range-bound") {
    return "Range regime: fade extremes toward VWAP/mid-band unless ADX breaks above 22.";
  }
  if (bullAlign >= 5 && input.signal.includes("Buy")) {
    return "Multi-factor alignment supports long bias — trail stops under last support cluster.";
  }
  if (bullAlign <= 2 && input.signal.includes("Sell")) {
    return "Alignment supports defensive posture — rallies are sell-the-bounce candidates.";
  }
  return `${input.regime} with ${bullAlign}/6 bullish checks — trade with the ${input.signal} signal, not against it.`;
}
