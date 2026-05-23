import type { TechnicalIndicators, PriceData } from "./technical-analysis";
import { deriveTimeHorizon } from "./investment-profile";

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
  beta: number = 1,
  profile?: {
    symbol: string;
    marketCap: number;
    peRatio: number;
    dividendYield: number;
    sector: string;
    industry: string;
    changePercent: number;
  }
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

  const timeframe = profile
    ? deriveTimeHorizon({
        symbol: profile.symbol,
        price,
        beta,
        marketCap: profile.marketCap,
        peRatio: profile.peRatio,
        dividendYield: profile.dividendYield,
        sector: profile.sector,
        industry: profile.industry,
        changePercent: profile.changePercent,
        rsi: indicators.rsi,
        adx: indicators.adx,
        atr,
        signal: signal.signal,
        confidence: signal.confidence,
      }).tradingTimeframe
    : signal.confidence > 75
      ? "2–6 weeks · momentum trade"
      : signal.confidence > 50
        ? "4–12 weeks · swing trade"
        : "6–14 months · position";

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

const SECTOR_EVENTS: Record<string, { title: string; description: string; type: KeyEvent["type"] }[]> = {
  Technology: [
    { type: "guidance", title: "Product / platform update", description: "Major release or roadmap update — can move sentiment on growth names." },
    { type: "guidance", title: "Developer / AI conference", description: "Sector keynote risk — competitors often trade in sympathy." },
  ],
  Healthcare: [
    { type: "guidance", title: "Clinical / regulatory milestone", description: "FDA or trial readout window — binary risk for biotech-heavy names." },
  ],
  Financial: [
    { type: "economic", title: "Bank stress / rate outlook", description: "Rate path and credit quality drive multiples for financials." },
  ],
  Energy: [
    { type: "economic", title: "OPEC / inventory snapshot", description: "Commodity supply headlines often lead sector moves." },
  ],
  "Consumer Cyclical": [
    { type: "guidance", title: "Holiday / demand preview", description: "Consumer spending data can re-rate retail and e-commerce names." },
  ],
};

export function generateKeyEvents(
  symbol: string,
  sector: string = "",
  companyName?: string
): KeyEvent[] {
  const hash = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const events: KeyEvent[] = [];
  const label = companyName?.trim() || symbol;

  const earningsDaysAway = (hash % 58) + 12;
  const earningsDate = new Date(Date.now() + earningsDaysAway * 86400000);
  const q = Math.ceil((earningsDate.getMonth() + 1) / 3);
  events.push({
    date: earningsDate.toISOString().split("T")[0],
    type: "earnings",
    title: `${symbol} Q${q} ${earningsDate.getFullYear()} earnings`,
    importance: "high",
    description: `${label} reports quarterly results — implied volatility often rises into the print.`,
    daysAway: earningsDaysAway,
  });

  const sectorKey = Object.keys(SECTOR_EVENTS).find((k) =>
    sector.toLowerCase().includes(k.toLowerCase())
  );
  const sectorPool = sectorKey ? SECTOR_EVENTS[sectorKey] : SECTOR_EVENTS.Technology;
  const sectorPick = sectorPool[hash % sectorPool.length];
  const sectorDays = (hash % 25) + 8;
  events.push({
    date: new Date(Date.now() + sectorDays * 86400000).toISOString().split("T")[0],
    type: sectorPick.type,
    title: `${symbol}: ${sectorPick.title}`,
    importance: "medium",
    description: sectorPick.description,
    daysAway: sectorDays,
  });

  if (hash % 3 !== 1) {
    const dividendDays = (hash % 28) + 14;
    events.push({
      date: new Date(Date.now() + dividendDays * 86400000).toISOString().split("T")[0],
      type: "dividend",
      title: `${symbol} ex-dividend (est.)`,
      importance: "medium",
      description: `Estimated payout window for ${label} — confirm with official filings.`,
      daysAway: dividendDays,
    });
  }

  if (hash % 2 === 0) {
    const macroDays = (hash % 18) + 6;
    events.push({
      date: new Date(Date.now() + macroDays * 86400000).toISOString().split("T")[0],
      type: "economic",
      title: "CPI / inflation print",
      importance: "medium",
      description: `Macro rates narrative — affects ${sector || "this sector"} and ${symbol} multiples.`,
      daysAway: macroDays,
    });
  } else {
    const macroDays = (hash % 22) + 4;
    events.push({
      date: new Date(Date.now() + macroDays * 86400000).toISOString().split("T")[0],
      type: "fed",
      title: "FOMC / rates decision",
      importance: "high",
      description: `Policy surprise risk for ${symbol} (beta-sensitive names move more).`,
      daysAway: macroDays,
    });
  }

  const guidanceDays = (hash % 40) + 20;
  events.push({
    date: new Date(Date.now() + guidanceDays * 86400000).toISOString().split("T")[0],
    type: "guidance",
    title: `${symbol} investor / analyst day (est.)`,
    importance: hash % 4 === 0 ? "high" : "medium",
    description: `Management commentary can reset expectations for ${label}.`,
    daysAway: guidanceDays,
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
    "Norges Bank", "Goldman Sachs AM", "Invesco Ltd.",
  ];

  const order = institutionNames
    .map((name, i) => ({ name, sort: (hash * (i + 3)) % institutionNames.length }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.name);

  const topHolders = [];
  let remaining = institutional;
  for (let i = 0; i < 5; i++) {
    const share = i === 0
      ? remaining * (0.14 + ((hash + i * 2) % 10) / 100)
      : remaining * (0.06 + ((hash + i * 5) % 9) / 100);
    const trends: ("up" | "down" | "stable")[] = ["up", "stable", "down", "up", "stable"];
    topHolders.push({
      name: order[(hash + i * 2) % order.length],
      sharesPercent: Number(Math.min(share, remaining).toFixed(2)),
      trend: trends[(hash + i * 3) % trends.length],
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
