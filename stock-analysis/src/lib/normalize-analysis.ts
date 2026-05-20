/** Ensures API/analysis payloads are safe to render (no undefined nested crashes). */

type LooseRecord = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? v : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAnalysisPayload(raw: any): any {
  if (!raw || typeof raw !== "object" || raw.error) {
    return null;
  }

  const quote = raw.quote;
  if (!quote || !str(quote.symbol)) return null;

  const price = num(quote.price, 0);
  const indicators = raw.indicators || {};
  const macd = indicators.macd || {};
  const bb = indicators.bollingerBands || {};
  const stoch = indicators.stochastic || {};

  const ai = raw.aiAnalysis || {};
  const pt = ai.priceTarget || {};
  const low = num(pt.low, price * 0.9);
  const high = num(pt.high, price * 1.1);
  const mid = num(pt.mid, price);

  const signal = raw.signal || {};

  return {
    ...raw,
    quote: {
      ...quote,
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
      sector: str(quote.sector, "Unknown"),
      industry: str(quote.industry, "Unknown"),
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
      fibonacciLevels: arr(indicators.fibonacciLevels),
      supportLevels: arr<number>(indicators.supportLevels),
      resistanceLevels: arr<number>(indicators.resistanceLevels),
    },
    signal: {
      signal: str(signal.signal, "Hold"),
      confidence: num(signal.confidence, 50),
      reasons: arr<string>(signal.reasons).length
        ? arr<string>(signal.reasons)
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
      sector: str(c.sector, "Unknown"),
    })),
    aiAnalysis: {
      summary: str(ai.summary, "Analysis summary unavailable."),
      recommendation: str(ai.recommendation, str(signal.signal, "Hold")),
      confidence: num(ai.confidence, num(signal.confidence, 50)),
      priceTarget: { low, mid, high },
      riskLevel: str(ai.riskLevel, "Medium"),
      timeHorizon: str(ai.timeHorizon, "Medium-term (3-12 months)"),
      keyFactors: arr<string>(ai.keyFactors).length
        ? arr<string>(ai.keyFactors)
        : ["Review technical and fundamental data before trading"],
      technicalOutlook: str(ai.technicalOutlook, "Technical outlook unavailable."),
      fundamentalOutlook: str(ai.fundamentalOutlook, "Fundamental outlook unavailable."),
      competitorAnalysis: str(ai.competitorAnalysis, ""),
      catalysts: arr<string>(ai.catalysts),
      risks: arr<string>(ai.risks),
      sentimentScore: num(ai.sentimentScore),
    },
    redFlags: arr(raw.redFlags),
    news: arr(raw.news),
    history: arr(raw.history),
    analystRecommendations: arr(raw.analystRecommendations),
    dataSources: raw.dataSources || {},
  };
}
