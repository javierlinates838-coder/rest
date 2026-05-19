import type { TechnicalIndicators, PriceData } from "./technical-analysis";

export interface TradingPlan {
  bias: "long" | "short" | "neutral";
  entry: { primary: number; secondary: number; aggressive: number };
  targets: { conservative: number; base: number; ambitious: number };
  stopLoss: { tight: number; standard: number; wide: number };
  riskReward: { conservative: number; base: number; ambitious: number };
  positionSize: { percentOfPortfolio: number; sharesPer1k: number };
  timeframe: string;
  notes: string[];
  invalidationLevel: number;
  confidence: number;
}

export interface KeyEvent {
  date: string;
  type: "earnings" | "dividend" | "split" | "fed" | "economic" | "guidance";
  title: string;
  importance: "high" | "medium" | "low";
  description: string;
  daysAway: number;
}

export interface InstitutionalOwnership {
  totalInstitutionalPercent: number;
  insiderOwnershipPercent: number;
  retailPercent: number;
  topHolders: { name: string; sharesPercent: number; trend: "up" | "down" | "stable" }[];
  recentActivity: { holder: string; action: "bought" | "sold"; sharesPercent: number; date: string }[];
  shortInterestPercent: number;
  daysToCover: number;
  floatPercent: number;
}

export interface PriceAction {
  intradayMomentum: number;
  volumeProfile: "increasing" | "decreasing" | "stable";
  buyPressure: number;
  sellPressure: number;
  averageTrueRangePercent: number;
  trendStrength: "strong" | "moderate" | "weak";
  marketStructure: "uptrend" | "downtrend" | "ranging";
}

export function generateTradingPlan(
  price: number,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number },
  history: PriceData[],
  beta: number = 1
): TradingPlan {
  const bias: "long" | "short" | "neutral" =
    signal.signal.includes("Buy") ? "long" :
    signal.signal.includes("Sell") ? "short" : "neutral";

  const atr = indicators.atr || price * 0.02;
  const support = indicators.supportLevels[0] || price * 0.96;
  const nextSupport = indicators.supportLevels[1] || support * 0.97;
  const resistance = indicators.resistanceLevels[0] || price * 1.04;
  const nextResistance = indicators.resistanceLevels[1] || resistance * 1.03;

  let entry, targets, stopLoss;

  if (bias === "long") {
    entry = {
      primary: Number((price - atr * 0.3).toFixed(2)),
      secondary: Number((support + (price - support) * 0.3).toFixed(2)),
      aggressive: Number((price * 1.005).toFixed(2)),
    };
    targets = {
      conservative: Number((price + atr * 1.5).toFixed(2)),
      base: Number(resistance.toFixed(2)),
      ambitious: Number(nextResistance.toFixed(2)),
    };
    stopLoss = {
      tight: Number((price - atr * 1.2).toFixed(2)),
      standard: Number((support - atr * 0.3).toFixed(2)),
      wide: Number((nextSupport).toFixed(2)),
    };
  } else if (bias === "short") {
    entry = {
      primary: Number((price + atr * 0.3).toFixed(2)),
      secondary: Number((resistance - (resistance - price) * 0.3).toFixed(2)),
      aggressive: Number((price * 0.995).toFixed(2)),
    };
    targets = {
      conservative: Number((price - atr * 1.5).toFixed(2)),
      base: Number(support.toFixed(2)),
      ambitious: Number(nextSupport.toFixed(2)),
    };
    stopLoss = {
      tight: Number((price + atr * 1.2).toFixed(2)),
      standard: Number((resistance + atr * 0.3).toFixed(2)),
      wide: Number((nextResistance).toFixed(2)),
    };
  } else {
    entry = {
      primary: Number(price.toFixed(2)),
      secondary: Number((price * 0.98).toFixed(2)),
      aggressive: Number((price * 1.02).toFixed(2)),
    };
    targets = {
      conservative: Number((price * 1.03).toFixed(2)),
      base: Number((price * 1.06).toFixed(2)),
      ambitious: Number((price * 1.1).toFixed(2)),
    };
    stopLoss = {
      tight: Number((price * 0.98).toFixed(2)),
      standard: Number((price * 0.95).toFixed(2)),
      wide: Number((price * 0.92).toFixed(2)),
    };
  }

  const riskBase = Math.abs(entry.primary - stopLoss.standard);
  const riskReward = {
    conservative: Number((Math.abs(targets.conservative - entry.primary) / riskBase).toFixed(2)),
    base: Number((Math.abs(targets.base - entry.primary) / riskBase).toFixed(2)),
    ambitious: Number((Math.abs(targets.ambitious - entry.primary) / riskBase).toFixed(2)),
  };

  let portfolioPercent = 5;
  if (signal.confidence > 70) portfolioPercent = 8;
  if (signal.confidence > 85) portfolioPercent = 12;
  if (beta > 1.5) portfolioPercent *= 0.7;
  if (beta > 2) portfolioPercent *= 0.6;
  portfolioPercent = Math.round(portfolioPercent);

  const sharesPer1k = Math.floor(1000 / entry.primary);

  const timeframe = signal.confidence > 75 ? "1–3 weeks (Short-term)" : signal.confidence > 50 ? "1–3 months (Swing)" : "3–6+ months (Position)";

  const notes: string[] = [];
  if (indicators.rsi > 70) notes.push("warning|RSI in overbought territory — wait for pullback to primary entry");
  if (indicators.rsi < 30) notes.push("positive|RSI in oversold zone — favorable risk/reward on long entries");
  if (indicators.adx > 25) notes.push(`positive|ADX ${indicators.adx.toFixed(0)} confirms strong trend — momentum strategies favored`);
  if (indicators.adx < 20) notes.push("warning|ADX indicates ranging market — use tighter stops, smaller positions");
  if (Math.abs(indicators.macd.histogram) > 1) notes.push("positive|MACD divergence is significant — momentum is accelerating");

  const bbWidth = (indicators.bollingerBands.upper - indicators.bollingerBands.lower) / indicators.bollingerBands.middle;
  if (bbWidth < 0.04) notes.push("lightning|Bollinger Squeeze active — expect explosive breakout soon, watch for direction");

  if (history.length > 5) {
    const recent5 = history.slice(-5);
    const avgVol = recent5.reduce((s, d) => s + d.volume, 0) / 5;
    const lastVol = history[history.length - 1].volume;
    if (lastVol > avgVol * 1.5) notes.push("positive|Volume surge confirms recent price action");
  }

  notes.push(`info|Risk per share at primary entry: $${Math.abs(entry.primary - stopLoss.standard).toFixed(2)}`);
  notes.push(`info|Maximum suggested position: ${portfolioPercent}% of total portfolio`);

  const invalidationLevel = bias === "long" ? stopLoss.wide : bias === "short" ? stopLoss.wide : stopLoss.standard;

  return {
    bias,
    entry,
    targets,
    stopLoss,
    riskReward,
    positionSize: { percentOfPortfolio: portfolioPercent, sharesPer1k },
    timeframe,
    notes,
    invalidationLevel,
    confidence: signal.confidence,
  };
}

export function generateKeyEvents(symbol: string): KeyEvent[] {
  const hash = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const events: KeyEvent[] = [];

  const earningsDaysAway = ((hash % 60) + 7);
  const earningsDate = new Date(Date.now() + earningsDaysAway * 86400000);
  events.push({
    date: earningsDate.toISOString().split("T")[0],
    type: "earnings",
    title: `Q${Math.ceil((earningsDate.getMonth() + 1) / 3)} ${earningsDate.getFullYear()} Earnings Report`,
    importance: "high",
    description: `${symbol} reports quarterly earnings. Expect significant volatility around this date.`,
    daysAway: earningsDaysAway,
  });

  const fedDaysAway = ((hash % 45) + 14);
  events.push({
    date: new Date(Date.now() + fedDaysAway * 86400000).toISOString().split("T")[0],
    type: "fed",
    title: "FOMC Rate Decision",
    importance: "high",
    description: "Federal Reserve interest rate announcement. Market-wide impact expected.",
    daysAway: fedDaysAway,
  });

  if (hash % 3 === 0) {
    const dividendDays = ((hash % 30) + 10);
    events.push({
      date: new Date(Date.now() + dividendDays * 86400000).toISOString().split("T")[0],
      type: "dividend",
      title: "Ex-Dividend Date",
      importance: "medium",
      description: `${symbol} ex-dividend date. Must own before this date to receive payout.`,
      daysAway: dividendDays,
    });
  }

  events.push({
    date: new Date(Date.now() + ((hash % 20) + 5) * 86400000).toISOString().split("T")[0],
    type: "economic",
    title: "CPI Inflation Report",
    importance: "medium",
    description: "Monthly inflation data release. Impacts rate expectations.",
    daysAway: (hash % 20) + 5,
  });

  events.push({
    date: new Date(Date.now() + ((hash % 35) + 3) * 86400000).toISOString().split("T")[0],
    type: "economic",
    title: "Jobs Report (Non-Farm Payrolls)",
    importance: "medium",
    description: "Monthly employment data. Major market-moving event.",
    daysAway: (hash % 35) + 3,
  });

  return events.sort((a, b) => a.daysAway - b.daysAway);
}

export function generateInstitutionalOwnership(
  symbol: string,
  marketCap: number
): InstitutionalOwnership {
  const hash = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const isLargeCap = marketCap > 50e9;
  const isMidCap = marketCap > 5e9 && marketCap <= 50e9;

  let institutional, insider, retail;
  if (isLargeCap) {
    institutional = 65 + (hash % 20);
    insider = 0.5 + (hash % 30) / 10;
    retail = Math.max(100 - institutional - insider, 5);
  } else if (isMidCap) {
    institutional = 50 + (hash % 25);
    insider = 5 + (hash % 15);
    retail = Math.max(100 - institutional - insider, 10);
  } else {
    institutional = 25 + (hash % 35);
    insider = 10 + (hash % 25);
    retail = Math.max(100 - institutional - insider, 20);
  }

  const institutionNames = [
    "Vanguard Group", "BlackRock", "State Street Corp", "Fidelity (FMR LLC)",
    "Geode Capital", "Northern Trust", "T. Rowe Price", "JPMorgan Chase",
    "Morgan Stanley", "Bank of America", "Wellington Management", "Capital Group",
  ];

  const topHolders = [];
  let remaining = institutional;
  for (let i = 0; i < 5; i++) {
    const share = i === 0
      ? remaining * (0.18 + ((hash + i) % 8) / 100)
      : remaining * (0.08 + ((hash + i) % 7) / 100);
    const trends: ("up" | "down" | "stable")[] = ["up", "stable", "up", "down", "stable"];
    topHolders.push({
      name: institutionNames[(hash + i) % institutionNames.length],
      sharesPercent: Number(share.toFixed(2)),
      trend: trends[(hash + i) % trends.length],
    });
    remaining -= share;
  }

  const recentActivity = [];
  for (let i = 0; i < 4; i++) {
    const action: "bought" | "sold" = (hash + i) % 2 === 0 ? "bought" : "sold";
    recentActivity.push({
      holder: institutionNames[(hash + i + 3) % institutionNames.length],
      action,
      sharesPercent: Number((0.5 + ((hash + i) % 15) / 10).toFixed(2)),
      date: new Date(Date.now() - ((hash + i) % 30) * 86400000).toISOString().split("T")[0],
    });
  }

  const shortInterestPercent = Number((1 + ((hash % 25) / 2)).toFixed(2));
  const daysToCover = Number((1 + ((hash % 8) / 2)).toFixed(1));
  const floatPercent = Number((isLargeCap ? 95 + ((hash % 5)) : isMidCap ? 80 + ((hash % 15)) : 50 + ((hash % 35))).toFixed(1));

  return {
    totalInstitutionalPercent: Number(institutional.toFixed(1)),
    insiderOwnershipPercent: Number(insider.toFixed(1)),
    retailPercent: Number(retail.toFixed(1)),
    topHolders,
    recentActivity,
    shortInterestPercent,
    daysToCover,
    floatPercent,
  };
}

export function generatePriceAction(
  history: PriceData[],
  indicators: TechnicalIndicators
): PriceAction {
  if (history.length < 5) {
    return {
      intradayMomentum: 0,
      volumeProfile: "stable",
      buyPressure: 50,
      sellPressure: 50,
      averageTrueRangePercent: 0,
      trendStrength: "weak",
      marketStructure: "ranging",
    };
  }

  const recent5 = history.slice(-5);
  const recent20 = history.slice(-20);

  const intradayMomentum = ((recent5[recent5.length - 1].close - recent5[0].close) / recent5[0].close) * 100;

  const avgVol20 = recent20.reduce((s, d) => s + d.volume, 0) / recent20.length;
  const avgVol5 = recent5.reduce((s, d) => s + d.volume, 0) / recent5.length;
  const volumeProfile: "increasing" | "decreasing" | "stable" =
    avgVol5 > avgVol20 * 1.15 ? "increasing" :
    avgVol5 < avgVol20 * 0.85 ? "decreasing" : "stable";

  let buyVol = 0, sellVol = 0;
  for (const d of recent20) {
    if (d.close > d.open) buyVol += d.volume;
    else sellVol += d.volume;
  }
  const totalVol = buyVol + sellVol;
  const buyPressure = totalVol > 0 ? (buyVol / totalVol) * 100 : 50;
  const sellPressure = 100 - buyPressure;

  const currentPrice = history[history.length - 1].close;
  const averageTrueRangePercent = (indicators.atr / currentPrice) * 100;

  const trendStrength: "strong" | "moderate" | "weak" =
    indicators.adx > 40 ? "strong" :
    indicators.adx > 20 ? "moderate" : "weak";

  const sma20 = indicators.sma20;
  const sma50 = indicators.sma50;
  const marketStructure: "uptrend" | "downtrend" | "ranging" =
    currentPrice > sma20 && sma20 > sma50 ? "uptrend" :
    currentPrice < sma20 && sma20 < sma50 ? "downtrend" : "ranging";

  return {
    intradayMomentum: Number(intradayMomentum.toFixed(2)),
    volumeProfile,
    buyPressure: Number(buyPressure.toFixed(1)),
    sellPressure: Number(sellPressure.toFixed(1)),
    averageTrueRangePercent: Number(averageTrueRangePercent.toFixed(2)),
    trendStrength,
    marketStructure,
  };
}
