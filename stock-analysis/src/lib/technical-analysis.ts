import { lastWilder, wilderSmooth } from "@/lib/wilder";

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  stochastic: { k: number; d: number };
  adx: number;
  obv: number[];
  vwap: number;
  fibonacciLevels: { level: string; price: number }[];
  supportLevels: number[];
  resistanceLevels: number[];
}

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) {
    const slice = prices.slice(-prices.length);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return calculateSMA(prices, prices.length);
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

/** RSI-14 with Wilder smoothed average gain/loss (industry standard). */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  const macdHistory: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const e12 = calculateEMA(prices.slice(0, i), 12);
    const e26 = calculateEMA(prices.slice(0, i), 26);
    macdHistory.push(e12 - e26);
  }

  const signalLine = macdHistory.length >= 9 ? calculateEMA(macdHistory, 9) : macdLine;
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  multiplier: number = 2
): { upper: number; middle: number; lower: number } {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: sma + multiplier * stdDev,
    middle: sma,
    lower: sma - multiplier * stdDev,
  };
}

/** ATR-14 with Wilder smoothing. */
export function calculateATR(data: PriceData[], period: number = 14): number {
  if (data.length < 2) return 0;
  const trueRanges: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    trueRanges.push(tr);
  }
  if (trueRanges.length < period) {
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
  }
  return lastWilder(trueRanges, period);
}

export function calculateStochastic(
  data: PriceData[],
  period: number = 14
): { k: number; d: number } {
  if (data.length < period) return { k: 50, d: 50 };
  const recent = data.slice(-period);
  const high = Math.max(...recent.map((d) => d.high));
  const low = Math.min(...recent.map((d) => d.low));
  const close = recent[recent.length - 1].close;
  const k = high === low ? 50 : ((close - low) / (high - low)) * 100;

  const kValues: number[] = [];
  for (let i = period; i <= data.length; i++) {
    const slice = data.slice(i - period, i);
    const h = Math.max(...slice.map((d) => d.high));
    const l = Math.min(...slice.map((d) => d.low));
    const c = slice[slice.length - 1].close;
    kValues.push(h === l ? 50 : ((c - l) / (h - l)) * 100);
  }

  const d = kValues.length >= 3
    ? kValues.slice(-3).reduce((a, b) => a + b, 0) / 3
    : k;

  return { k, d };
}

/** ADX-14: Wilder-smoothed +DI, -DI, then smoothed DX. */
export function calculateADX(data: PriceData[], period: number = 14): number {
  if (data.length < period * 2) return 20;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const upMove = data[i].high - data[i - 1].high;
    const downMove = data[i - 1].low - data[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(
      Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      )
    );
  }

  const smoothTR = wilderSmooth(tr, period);
  const smoothPlus = wilderSmooth(plusDM, period);
  const smoothMinus = wilderSmooth(minusDM, period);
  if (smoothTR.length === 0) return 20;

  const dxValues: number[] = [];
  for (let i = 0; i < smoothTR.length; i++) {
    const trVal = smoothTR[i];
    if (trVal <= 0) continue;
    const plusDI = (smoothPlus[i] / trVal) * 100;
    const minusDI = (smoothMinus[i] / trVal) * 100;
    const sum = plusDI + minusDI;
    if (sum > 0) dxValues.push((Math.abs(plusDI - minusDI) / sum) * 100);
  }

  if (dxValues.length < period) {
    return dxValues.length > 0 ? dxValues[dxValues.length - 1] : 20;
  }
  return lastWilder(dxValues, period);
}

export function calculateOBV(data: PriceData[]): number[] {
  const obv: number[] = [0];
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv.push(obv[i - 1] + data[i].volume);
    } else if (data[i].close < data[i - 1].close) {
      obv.push(obv[i - 1] - data[i].volume);
    } else {
      obv.push(obv[i - 1]);
    }
  }
  return obv;
}

export function calculateVWAP(data: PriceData[]): number {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  for (const d of data) {
    const tp = (d.high + d.low + d.close) / 3;
    cumulativeTPV += tp * d.volume;
    cumulativeVolume += d.volume;
  }
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : data[data.length - 1].close;
}

export function calculateFibonacciLevels(
  high: number,
  low: number
): { level: string; price: number }[] {
  const diff = high - low;
  return [
    { level: "0%", price: low },
    { level: "23.6%", price: low + diff * 0.236 },
    { level: "38.2%", price: low + diff * 0.382 },
    { level: "50%", price: low + diff * 0.5 },
    { level: "61.8%", price: low + diff * 0.618 },
    { level: "78.6%", price: low + diff * 0.786 },
    { level: "100%", price: high },
  ];
}

export function findSupportResistance(data: PriceData[]): {
  support: number[];
  resistance: number[];
} {
  const prices = data.map((d) => d.close);
  const support: number[] = [];
  const resistance: number[] = [];

  for (let i = 2; i < prices.length - 2; i++) {
    if (
      prices[i] < prices[i - 1] &&
      prices[i] < prices[i - 2] &&
      prices[i] < prices[i + 1] &&
      prices[i] < prices[i + 2]
    ) {
      support.push(prices[i]);
    }
    if (
      prices[i] > prices[i - 1] &&
      prices[i] > prices[i - 2] &&
      prices[i] > prices[i + 1] &&
      prices[i] > prices[i + 2]
    ) {
      resistance.push(prices[i]);
    }
  }

  const uniqSupport = [...new Set(support)].sort((a, b) => b - a);
  const uniqResistance = [...new Set(resistance)].sort((a, b) => a - b);

  return {
    support: uniqSupport.slice(0, 5),
    resistance: uniqResistance.slice(0, 5),
  };
}

function defaultIndicators(price: number): TechnicalIndicators {
  return {
    sma20: price,
    sma50: price,
    sma200: price,
    ema12: price,
    ema26: price,
    rsi: 50,
    macd: { macd: 0, signal: 0, histogram: 0 },
    bollingerBands: { upper: price * 1.02, middle: price, lower: price * 0.98 },
    atr: price * 0.02,
    stochastic: { k: 50, d: 50 },
    adx: 25,
    obv: [0],
    vwap: price,
    fibonacciLevels: [
      { level: "0%", price: price * 0.9 },
      { level: "100%", price: price * 1.1 },
    ],
    supportLevels: [price * 0.95],
    resistanceLevels: [price * 1.05],
  };
}

export function computeAllIndicators(data: PriceData[]): TechnicalIndicators {
  if (data.length === 0) {
    return defaultIndicators(0);
  }

  const closes = data.map((d) => d.close);
  const price = closes[closes.length - 1] || 0;
  if (data.length < 2) {
    return defaultIndicators(price);
  }

  const highestHigh = Math.max(...data.map((d) => d.high));
  const lowestLow = Math.min(...data.map((d) => d.low));
  const sr = findSupportResistance(data);

  return {
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200),
    ema12: calculateEMA(closes, 12),
    ema26: calculateEMA(closes, 26),
    rsi: Math.min(100, Math.max(0, calculateRSI(closes))),
    macd: calculateMACD(closes),
    bollingerBands: calculateBollingerBands(closes),
    atr: calculateATR(data),
    stochastic: calculateStochastic(data),
    adx: calculateADX(data),
    obv: calculateOBV(data),
    vwap: calculateVWAP(data),
    fibonacciLevels: calculateFibonacciLevels(highestHigh, lowestLow),
    supportLevels: sr.support,
    resistanceLevels: sr.resistance,
  };
}

export function generateSignal(indicators: TechnicalIndicators, currentPrice: number): {
  signal: string;
  confidence: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Moving average analysis
  if (currentPrice > indicators.sma20) { score += 1; reasons.push("Price above SMA20 (bullish)"); }
  else { score -= 1; reasons.push("Price below SMA20 (bearish)"); }

  if (currentPrice > indicators.sma50) { score += 1; reasons.push("Price above SMA50 (bullish)"); }
  else { score -= 1; reasons.push("Price below SMA50 (bearish)"); }

  if (currentPrice > indicators.sma200) { score += 1.5; reasons.push("Price above SMA200 (long-term bullish)"); }
  else { score -= 1.5; reasons.push("Price below SMA200 (long-term bearish)"); }

  if (indicators.sma20 > indicators.sma50) { score += 1; reasons.push("SMA20 above SMA50 (bullish alignment)"); }
  else { score -= 1; reasons.push("SMA20 below SMA50 (bearish alignment)"); }

  // RSI analysis
  if (indicators.rsi < 30) { score += 2; reasons.push(`RSI oversold at ${indicators.rsi.toFixed(1)} (buy signal)`); }
  else if (indicators.rsi > 70) { score -= 2; reasons.push(`RSI overbought at ${indicators.rsi.toFixed(1)} (sell signal)`); }
  else if (indicators.rsi < 45) { score -= 0.5; reasons.push(`RSI soft at ${indicators.rsi.toFixed(1)} (mild bearish)`); }
  else if (indicators.rsi > 55) { score += 0.5; reasons.push(`RSI firm at ${indicators.rsi.toFixed(1)} (mild bullish)`); }

  // MACD analysis
  if (indicators.macd.histogram > 0) { score += 1; reasons.push("MACD histogram positive (bullish momentum)"); }
  else { score -= 1; reasons.push("MACD histogram negative (bearish momentum)"); }

  if (indicators.macd.macd > indicators.macd.signal) { score += 1; reasons.push("MACD above signal line (bullish)"); }
  else { score -= 1; reasons.push("MACD below signal line (bearish)"); }

  // Bollinger Bands
  if (currentPrice < indicators.bollingerBands.lower) {
    score += 1.5; reasons.push("Price below lower Bollinger Band (potential reversal up)");
  } else if (currentPrice > indicators.bollingerBands.upper) {
    score -= 1.5; reasons.push("Price above upper Bollinger Band (potential reversal down)");
  }

  // Stochastic
  if (indicators.stochastic.k < 20) { score += 1; reasons.push("Stochastic oversold (buy signal)"); }
  else if (indicators.stochastic.k > 80) { score -= 1; reasons.push("Stochastic overbought (sell signal)"); }

  // ADX trend strength — scale conviction in trending markets
  const trendMultiplier = indicators.adx >= 25 ? 1.15 : indicators.adx < 18 ? 0.75 : 1;
  if (indicators.adx >= 25) {
    score *= trendMultiplier;
    reasons.push(`Trending market (ADX ${indicators.adx.toFixed(1)}) — signals weighted higher`);
  } else if (indicators.adx < 18) {
    score *= trendMultiplier;
    reasons.push(`Choppy/ranging market (ADX ${indicators.adx.toFixed(1)}) — signals discounted`);
  } else {
    reasons.push(`Moderate trend strength (ADX ${indicators.adx.toFixed(1)})`);
  }

  // VWAP
  if (currentPrice > indicators.vwap) { score += 0.5; reasons.push("Price above VWAP (bullish)"); }
  else { score -= 0.5; reasons.push("Price below VWAP (bearish)"); }

  const maxScore = 12.5;
  const normalizedScore = Math.max(-1, Math.min(1, score / maxScore));
  const agreement = Math.abs(normalizedScore);
  const confidence = Math.min(Math.round(agreement * 85 + (indicators.adx >= 22 ? 10 : 0)), 92);

  let signal: string;
  if (normalizedScore > 0.4) signal = "Strong Buy";
  else if (normalizedScore > 0.15) signal = "Buy";
  else if (normalizedScore > -0.15) signal = "Hold";
  else if (normalizedScore > -0.4) signal = "Sell";
  else signal = "Strong Sell";

  const roundedConf = Math.round(confidence);
  const isDirectional =
    signal === "Buy" || signal === "Strong Buy" || signal === "Sell" || signal === "Strong Sell";

  if (isDirectional && roundedConf < 35) {
    reasons.push(`Low conviction (${roundedConf}%) — displayed as Hold`);
    return { signal: "Hold", confidence: roundedConf, reasons };
  }

  return { signal, confidence: roundedConf, reasons };
}
