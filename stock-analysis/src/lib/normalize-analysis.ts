/** Ensures API/analysis payloads are safe to render (no undefined nested crashes). */

import {
  normalizePriceTargets,
  normalizeRecommendation,
  resolveSignal,
  riskLevelFromGrade,
} from "@/lib/analysis-coherence";
import {
  deriveSentimentScore,
  deriveTimeHorizon,
  ensureSymbolInBullets,
} from "@/lib/investment-profile";
import { displayOrDash } from "@/lib/display-labels";

type LooseRecord = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  const raw = typeof v === "string" ? v.trim() : fallback;
  if (!raw || /^unknown$/i.test(raw) || /^n\/a$/i.test(raw)) return "";
  return raw;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? v : [];
}

function normalizeTradingPlan(raw: unknown, price: number) {
  const p = (raw && typeof raw === "object" ? raw : {}) as LooseRecord;
  const entry = (p.entry && typeof p.entry === "object" ? p.entry : {}) as LooseRecord;
  const targets = (p.targets && typeof p.targets === "object" ? p.targets : {}) as LooseRecord;
  const stopLoss = (p.stopLoss && typeof p.stopLoss === "object" ? p.stopLoss : {}) as LooseRecord;
  const riskReward = (p.riskReward && typeof p.riskReward === "object" ? p.riskReward : {}) as LooseRecord;
  const positionSize = (p.positionSize && typeof p.positionSize === "object" ? p.positionSize : {}) as LooseRecord;

  return {
    bias: str(p.bias, "neutral"),
    entry: {
      primary: num(entry.primary, price),
      secondary: num(entry.secondary, price * 0.98),
      aggressive: num(entry.aggressive, price * 1.01),
    },
    targets: {
      conservative: num(targets.conservative, price * 1.05),
      base: num(targets.base, price * 1.08),
      ambitious: num(targets.ambitious, price * 1.12),
    },
    stopLoss: {
      tight: num(stopLoss.tight, price * 0.97),
      standard: num(stopLoss.standard, price * 0.95),
      wide: num(stopLoss.wide, price * 0.92),
    },
    riskReward: {
      conservative: num(riskReward.conservative, 1),
      base: num(riskReward.base, 2),
      ambitious: num(riskReward.ambitious, 3),
    },
    positionSize: {
      percentOfPortfolio: num(positionSize.percentOfPortfolio, 5),
      sharesPer1k: num(positionSize.sharesPer1k, 1),
    },
    timeframe: str(p.timeframe, "Swing (days to weeks)"),
    notes: arr<string>(p.notes),
    invalidationLevel: num(p.invalidationLevel, price * 0.94),
    confidence: num(p.confidence, 50),
  };
}

function normalizeInstitutional(raw: unknown) {
  const d = (raw && typeof raw === "object" ? raw : {}) as LooseRecord;
  return {
    totalInstitutionalPercent: num(d.totalInstitutionalPercent, 60),
    insiderOwnershipPercent: num(d.insiderOwnershipPercent, 5),
    retailPercent: num(d.retailPercent, 35),
    topHolders: arr<LooseRecord>(d.topHolders).map((h) => ({
      name: str(h.name, "Institution"),
      sharesPercent: num(h.sharesPercent),
      trend: str(h.trend, "stable"),
    })),
    recentActivity: arr<LooseRecord>(d.recentActivity).map((a) => ({
      holder: str(a.holder, "Fund"),
      action: str(a.action, "bought"),
      sharesPercent: num(a.sharesPercent),
      date: str(a.date, new Date().toISOString().split("T")[0]),
    })),
    shortInterestPercent: num(d.shortInterestPercent),
    daysToCover: num(d.daysToCover, 2),
    floatPercent: num(d.floatPercent, 90),
  };
}

function normalizePriceAction(raw: unknown) {
  const d = (raw && typeof raw === "object" ? raw : {}) as LooseRecord;
  return {
    intradayMomentum: num(d.intradayMomentum),
    volumeProfile: str(d.volumeProfile, "stable"),
    buyPressure: num(d.buyPressure, 50),
    sellPressure: num(d.sellPressure, 50),
    averageTrueRangePercent: num(d.averageTrueRangePercent, 2),
    trendStrength: str(d.trendStrength, "moderate"),
    marketStructure: str(d.marketStructure, "ranging"),
  };
}

function normalizeKeyEvents(raw: unknown) {
  return arr<LooseRecord>(raw).map((e) => ({
    date: str(e.date, new Date().toISOString().split("T")[0]),
    type: str(e.type, "economic"),
    title: str(e.title, "Market event"),
    importance: ["high", "medium", "low"].includes(str(e.importance)) ? str(e.importance) : "medium",
    description: str(e.description, ""),
    daysAway: num(e.daysAway),
  }));
}

function normalizeRiskScore(raw: unknown) {
  const r = (raw && typeof raw === "object" ? raw : {}) as LooseRecord;
  const overall = num(r.overall, 50);
  let grade = str(r.grade, "C");
  if (!["A", "B", "C", "D", "F"].includes(grade)) grade = "C";
  return {
    overall,
    technical: num(r.technical, overall),
    fundamental: num(r.fundamental, overall),
    sentiment: num(r.sentiment, overall),
    manipulation: num(r.manipulation, 10),
    volatility: num(r.volatility, overall),
    grade,
    verdict: str(r.verdict, "Risk assessment based on available data"),
  };
}

function resolveQuotePrice(quote: LooseRecord, raw: LooseRecord): number {
  let price = num(quote.price, 0);
  if (price > 0) return price;

  price = num(quote.previousClose, 0);
  if (price > 0) return price;

  const history = arr<LooseRecord>(raw.history);
  for (let i = history.length - 1; i >= 0; i--) {
    const close = num(history[i].close, 0);
    if (close > 0) return close;
  }

  return 0;
}

function normalizeRedFlags(raw: unknown) {
  return arr<LooseRecord>(raw).map((f, i) => ({
    id: str(f.id, `flag-${i}`),
    severity: ["critical", "warning", "info"].includes(str(f.severity)) ? str(f.severity) : "info",
    category: str(f.category, "technical"),
    title: str(f.title, "Alert"),
    description: str(f.description, ""),
    detectedAt: str(f.detectedAt, new Date().toISOString()),
    dataPoints: arr<string>(f.dataPoints),
  }));
}

function normalizeFibLevels(raw: unknown, price: number) {
  const levels = arr<LooseRecord>(raw);
  if (levels.length === 0) {
    return [
      { level: "0%", price: price * 0.95 },
      { level: "100%", price: price * 1.05 },
    ];
  }
  return levels.map((f) => ({
    level: str(f.level, ""),
    price: num(f.price, price),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAnalysisPayload(raw: any): any {
  if (!raw || typeof raw !== "object" || raw.error) {
    return null;
  }

  const quote = raw.quote;
  if (!quote || !str(quote.symbol)) return null;

  const price = resolveQuotePrice(quote as LooseRecord, raw as LooseRecord);
  if (price <= 0) return null;

  const indicators = raw.indicators || {};
  const macd = indicators.macd || {};
  const bb = indicators.bollingerBands || {};
  const stoch = indicators.stochastic || {};
  const ai = raw.aiAnalysis || {};
  const signalRaw = raw.signal || {};
  const resolved = resolveSignal(str(signalRaw.signal, "Hold"), num(signalRaw.confidence, 50));
  const recommendation = normalizeRecommendation(
    str(ai.recommendation, resolved.signal),
    resolved.signal
  );
  const indicatorsNorm = {
    atr: num(indicators.atr, price * 0.02),
    supportLevels: arr<number>(indicators.supportLevels),
    resistanceLevels: arr<number>(indicators.resistanceLevels),
    bollingerBands: {
      upper: num(bb.upper, price * 1.02),
      middle: num(bb.middle, price),
      lower: num(bb.lower, price * 0.98),
    },
  };
  const priceTarget = normalizePriceTargets(price, recommendation, ai.priceTarget, indicatorsNorm);
  const riskScoreNorm = raw.riskScore ? normalizeRiskScore(raw.riskScore) : null;

  const tradingPlan = normalizeTradingPlan(raw.tradingPlan, price);

  const horizon = deriveTimeHorizon({
    symbol: str(quote.symbol).toUpperCase(),
    price,
    beta: num(quote.beta),
    marketCap: num(quote.marketCap),
    peRatio: num(quote.peRatio),
    dividendYield: num(quote.dividendYield),
    sector: str(quote.sector),
    industry: str(quote.industry),
    changePercent: num(quote.changePercent),
    rsi: num(indicators.rsi, 50),
    adx: num(indicators.adx, 25),
    atr: num(indicators.atr, price * 0.02),
    signal: resolved.signal,
    confidence: resolved.confidence,
  });

  const newsItems = arr<{ sentiment: string }>(raw.news);
  const sentimentScore = deriveSentimentScore(
    typeof ai.sentimentScore === "number" ? ai.sentimentScore : undefined,
    newsItems,
    { rsi: num(indicators.rsi, 50) },
    { signal: resolved.signal, confidence: resolved.confidence },
    raw.finnhubSentiment as { sentiment?: { bullishPercent?: number; bearishPercent?: number }; companyNewsScore?: number } | null,
    raw.newsSentimentBreakdown as { positive: number; negative: number; neutral: number } | null
  );

  const catalystFallback = [
    `${str(quote.symbol).toUpperCase()} technical signal: ${resolved.signal}`,
    `${str(quote.sector) || "Market"} sector drivers for ${str(quote.symbol).toUpperCase()}`,
    `Volatility (beta ${num(quote.beta).toFixed(2)}) shapes ${str(quote.symbol).toUpperCase()} risk/reward`,
  ];
  const riskFallback = [
    `${str(quote.symbol).toUpperCase()} breaks key support — momentum could accelerate`,
    `Sector or macro shock hits ${str(quote.sector) || "related"} names including ${str(quote.symbol).toUpperCase()}`,
    `Valuation compression if growth disappoints at ${str(quote.symbol).toUpperCase()}`,
  ];

  return {
    quote: {
      symbol: str(quote.symbol).toUpperCase(),
      name: str(quote.name, quote.symbol),
      price,
      change: num(quote.change),
      changePercent: num(quote.changePercent),
      volume: num(quote.volume),
      avgVolume: num(quote.avgVolume, num(quote.volume)),
      marketCap: num(quote.marketCap),
      peRatio: num(quote.peRatio),
      eps: num(quote.eps),
      high52: num(quote.high52),
      low52: num(quote.low52),
      dayHigh: num(quote.dayHigh),
      dayLow: num(quote.dayLow),
      open: num(quote.open),
      previousClose: num(quote.previousClose, price),
      dividendYield: num(quote.dividendYield),
      beta: num(quote.beta),
      sector: str(quote.sector),
      industry: str(quote.industry),
      exchange: str(quote.exchange, "NASDAQ"),
      description: str(quote.description),
    },
    indicators: {
      sma20: num(indicators.sma20, price),
      sma50: num(indicators.sma50, price),
      sma200: num(indicators.sma200, price),
      ema12: num(indicators.ema12, price),
      ema26: num(indicators.ema26, price),
      rsi: num(indicators.rsi, 50),
      macd: {
        macd: num(macd.macd),
        signal: num(macd.signal),
        histogram: num(macd.histogram),
      },
      bollingerBands: {
        upper: num(bb.upper, price * 1.02),
        middle: num(bb.middle, price),
        lower: num(bb.lower, price * 0.98),
      },
      atr: num(indicators.atr, price * 0.02),
      stochastic: {
        k: num(stoch.k, 50),
        d: num(stoch.d, 50),
      },
      adx: num(indicators.adx, 25),
      obv: arr<number>(indicators.obv),
      vwap: num(indicators.vwap, price),
      fibonacciLevels: normalizeFibLevels(indicators.fibonacciLevels, price),
      supportLevels: arr<number>(indicators.supportLevels),
      resistanceLevels: arr<number>(indicators.resistanceLevels),
    },
    signal: {
      signal: resolved.signal,
      confidence: resolved.confidence,
      reasons: arr<string>(signalRaw.reasons).length
        ? arr<string>(signalRaw.reasons)
        : ["Analysis based on available market data"],
    },
    competitors: arr<LooseRecord>(raw.competitors).map((c) => ({
      symbol: str(c.symbol),
      name: str(c.name, c.symbol as string),
      price: num(c.price),
      marketCap: num(c.marketCap),
      peRatio: num(c.peRatio),
      changePercent: num(c.changePercent),
      revenue: num(c.revenue),
      sector: str(c.sector),
    })),
    aiAnalysis: {
      summary: str(ai.summary, "Analysis summary unavailable."),
      recommendation,
      confidence: num(ai.confidence, resolved.confidence),
      priceTarget,
      riskLevel: riskScoreNorm
        ? riskLevelFromGrade(riskScoreNorm.grade)
        : str(ai.riskLevel, "Medium"),
      timeHorizon: horizon.label,
      timeHorizonRationale: horizon.rationale,
      keyFactors: arr<string>(ai.keyFactors).length
        ? arr<string>(ai.keyFactors)
        : [
            `${str(quote.symbol).toUpperCase()} at $${price.toFixed(2)} — ${resolved.signal} (${resolved.confidence}%)`,
            `RSI ${num(indicators.rsi, 50).toFixed(1)} · ADX ${num(indicators.adx, 25).toFixed(1)}`,
            `Beta ${num(quote.beta).toFixed(2)} · ${displayOrDash(str(quote.sector))} / ${displayOrDash(str(quote.industry))}`,
          ],
      technicalOutlook: str(ai.technicalOutlook, "Technical outlook unavailable."),
      fundamentalOutlook: str(ai.fundamentalOutlook, "Fundamental outlook unavailable."),
      competitorAnalysis: str(ai.competitorAnalysis, ""),
      catalysts: ensureSymbolInBullets(
        str(quote.symbol),
        arr<string>(ai.catalysts),
        catalystFallback
      ),
      risks: ensureSymbolInBullets(str(quote.symbol), arr<string>(ai.risks), riskFallback),
      sentimentScore,
    },
    redFlags: normalizeRedFlags(raw.redFlags),
    news: arr(raw.news),
    history: arr(raw.history),
    analystRecommendations: arr(raw.analystRecommendations),
    tradingPlan: { ...tradingPlan, timeframe: horizon.tradingTimeframe },
    keyEvents: normalizeKeyEvents(raw.keyEvents),
    institutional: normalizeInstitutional(raw.institutional),
    priceAction: normalizePriceAction(raw.priceAction),
    riskScore: riskScoreNorm,
    dataSources: raw.dataSources || {},
    analyzedAt: str(raw.analyzedAt, new Date().toISOString()),
    finnhubSentiment: raw.finnhubSentiment ?? null,
    newsSentimentBreakdown: raw.newsSentimentBreakdown ?? null,
    researchQuality: raw.researchQuality ?? null,
  };
}
