import type { PriceData, TechnicalIndicators } from "./technical-analysis";

export interface RedFlag {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "insider" | "volume" | "price" | "pattern" | "fundamental" | "manipulation";
  title: string;
  description: string;
  detectedAt: string;
  dataPoints: string[];
}

export interface UnusualActivity {
  volumeSpike: boolean;
  volumeSpikeRatio: number;
  priceGap: boolean;
  gapPercent: number;
  afterHoursMove: boolean;
  unusualOptions: boolean;
  insiderSelling: boolean;
  insiderSellingAmount: number;
  shortInterestSpike: boolean;
  shortInterestPercent: number;
  darkPoolActivity: boolean;
  darkPoolPercent: number;
}

export interface RiskScore {
  overall: number;
  technical: number;
  fundamental: number;
  sentiment: number;
  manipulation: number;
  volatility: number;
  grade: string;
  verdict: string;
}

export function detectRedFlags(
  data: PriceData[],
  indicators: TechnicalIndicators,
  quote: {
    price: number;
    volume: number;
    avgVolume: number;
    peRatio: number;
    eps: number;
    marketCap: number;
    beta: number;
    changePercent: number;
    high52: number;
    low52: number;
    symbol: string;
  }
): RedFlag[] {
  const flags: RedFlag[] = [];
  const now = new Date().toISOString();

  // Volume anomaly detection
  if (quote.avgVolume > 0) {
    const volumeRatio = quote.volume / quote.avgVolume;
    if (volumeRatio > 3) {
      flags.push({
        id: "vol-spike-extreme",
        severity: "critical",
        category: "volume",
        title: "Extreme Volume Spike Detected",
        description: `Trading volume is ${volumeRatio.toFixed(1)}x the average — a ${volumeRatio > 5 ? "massive" : "significant"} anomaly that often precedes major news or indicates institutional activity. This level of volume surge has historically been associated with insider knowledge or coordinated trading.`,
        detectedAt: now,
        dataPoints: [
          `Current volume: ${(quote.volume / 1e6).toFixed(1)}M`,
          `Average volume: ${(quote.avgVolume / 1e6).toFixed(1)}M`,
          `Ratio: ${volumeRatio.toFixed(1)}x normal`,
        ],
      });
    } else if (volumeRatio > 1.8) {
      flags.push({
        id: "vol-spike-elevated",
        severity: "warning",
        category: "volume",
        title: "Elevated Trading Volume",
        description: `Volume is ${volumeRatio.toFixed(1)}x above average. Elevated volume can signal accumulation by large players or distribution before a move.`,
        detectedAt: now,
        dataPoints: [
          `Current: ${(quote.volume / 1e6).toFixed(1)}M`,
          `Average: ${(quote.avgVolume / 1e6).toFixed(1)}M`,
        ],
      });
    } else if (volumeRatio < 0.3 && quote.volume > 0) {
      flags.push({
        id: "vol-dry",
        severity: "info",
        category: "volume",
        title: "Unusually Low Volume",
        description: `Volume is only ${(volumeRatio * 100).toFixed(0)}% of normal. Low volume can indicate lack of interest or a calm before a storm. Be cautious of illiquid conditions.`,
        detectedAt: now,
        dataPoints: [`Volume ratio: ${(volumeRatio * 100).toFixed(0)}%`],
      });
    }
  }

  // Price gap detection
  if (data.length >= 2) {
    const lastTwo = data.slice(-2);
    const gapPercent = ((lastTwo[1].open - lastTwo[0].close) / lastTwo[0].close) * 100;
    if (Math.abs(gapPercent) > 3) {
      flags.push({
        id: "price-gap",
        severity: Math.abs(gapPercent) > 5 ? "critical" : "warning",
        category: "price",
        title: `${gapPercent > 0 ? "Bullish" : "Bearish"} Price Gap: ${Math.abs(gapPercent).toFixed(1)}%`,
        description: `The stock opened ${gapPercent > 0 ? "significantly higher" : "significantly lower"} than the previous close. Large gaps often indicate after-hours news, earnings surprises, or institutional pre-market activity that retail traders miss.`,
        detectedAt: now,
        dataPoints: [
          `Previous close: $${lastTwo[0].close.toFixed(2)}`,
          `Today's open: $${lastTwo[1].open.toFixed(2)}`,
          `Gap: ${gapPercent.toFixed(2)}%`,
        ],
      });
    }
  }

  // Sudden price crash or spike detection
  if (Math.abs(quote.changePercent) > 5) {
    flags.push({
      id: "price-extreme-move",
      severity: "critical",
      category: "price",
      title: `Extreme ${quote.changePercent > 0 ? "Rally" : "Selloff"}: ${Math.abs(quote.changePercent).toFixed(1)}%`,
      description: `A ${Math.abs(quote.changePercent).toFixed(1)}% move in a single session is highly unusual. This could be driven by earnings, M&A activity, regulatory action, or potential market manipulation. Exercise extreme caution.`,
      detectedAt: now,
      dataPoints: [
        `Today's change: ${quote.changePercent.toFixed(2)}%`,
        `Beta: ${quote.beta.toFixed(2)}`,
      ],
    });
  }

  // RSI extremes with volume = potential manipulation
  if (indicators.rsi > 85 && quote.avgVolume > 0 && quote.volume / quote.avgVolume > 2) {
    flags.push({
      id: "rsi-vol-combo",
      severity: "critical",
      category: "manipulation",
      title: "Potential Pump Activity Detected",
      description: `RSI at ${indicators.rsi.toFixed(1)} combined with ${(quote.volume / quote.avgVolume).toFixed(1)}x volume is a classic pump pattern. The stock may be artificially inflated. Be extremely cautious — a sharp reversal is likely.`,
      detectedAt: now,
      dataPoints: [
        `RSI: ${indicators.rsi.toFixed(1)} (extreme overbought)`,
        `Volume spike: ${(quote.volume / quote.avgVolume).toFixed(1)}x`,
      ],
    });
  } else if (indicators.rsi < 15) {
    flags.push({
      id: "rsi-capitulation",
      severity: "warning",
      category: "pattern",
      title: "Capitulation Signal",
      description: `RSI at ${indicators.rsi.toFixed(1)} indicates extreme selling pressure, often seen during panic selling or forced liquidation. Could signal a bottom — or further downside if fundamentals are broken.`,
      detectedAt: now,
      dataPoints: [`RSI: ${indicators.rsi.toFixed(1)}`],
    });
  }

  // Near 52-week extremes
  if (quote.high52 > 0) {
    const pctFrom52High = ((quote.price - quote.high52) / quote.high52) * 100;
    const pctFrom52Low = ((quote.price - quote.low52) / quote.low52) * 100;

    if (pctFrom52High > -2) {
      flags.push({
        id: "near-52w-high",
        severity: "info",
        category: "price",
        title: "Trading Near 52-Week High",
        description: `The stock is within ${Math.abs(pctFrom52High).toFixed(1)}% of its 52-week high. Breakouts above this level can trigger momentum buying, but failed breakouts often lead to sharp reversals.`,
        detectedAt: now,
        dataPoints: [`Current: $${quote.price.toFixed(2)}`, `52W High: $${quote.high52.toFixed(2)}`],
      });
    } else if (pctFrom52Low < 5) {
      flags.push({
        id: "near-52w-low",
        severity: "warning",
        category: "price",
        title: "Trading Near 52-Week Low",
        description: `Only ${pctFrom52Low.toFixed(1)}% above the 52-week low. This could be a value opportunity or a value trap — check if fundamentals support the current price.`,
        detectedAt: now,
        dataPoints: [`Current: $${quote.price.toFixed(2)}`, `52W Low: $${quote.low52.toFixed(2)}`],
      });
    }
  }

  // Negative earnings
  if (quote.eps < 0) {
    flags.push({
      id: "negative-eps",
      severity: "warning",
      category: "fundamental",
      title: "Company Is Losing Money",
      description: `EPS of $${quote.eps.toFixed(2)} means the company is unprofitable. While growth stocks sometimes operate at a loss, this increases bankruptcy risk and dilution potential.`,
      detectedAt: now,
      dataPoints: [`EPS: $${quote.eps.toFixed(2)}`, `P/E: — (negative earnings)`],
    });
  }

  // Extremely high P/E
  if (quote.peRatio > 100 && quote.peRatio < 10000) {
    flags.push({
      id: "extreme-pe",
      severity: "warning",
      category: "fundamental",
      title: `Extreme Valuation: P/E of ${quote.peRatio.toFixed(0)}`,
      description: `A P/E ratio of ${quote.peRatio.toFixed(0)} means investors are paying $${quote.peRatio.toFixed(0)} for every $1 of earnings. This level of premium requires exceptional growth to justify. Any disappointment could trigger a severe correction.`,
      detectedAt: now,
      dataPoints: [`P/E: ${quote.peRatio.toFixed(1)}`, `EPS: $${quote.eps.toFixed(2)}`],
    });
  }

  // High beta = volatile
  if (quote.beta > 2) {
    flags.push({
      id: "high-beta",
      severity: "warning",
      category: "pattern",
      title: `High Volatility Stock (Beta: ${quote.beta.toFixed(2)})`,
      description: `With a beta of ${quote.beta.toFixed(2)}, this stock moves ${(quote.beta * 100).toFixed(0)}% for every 100% the market moves. This amplifies both gains AND losses. Position sizing is critical.`,
      detectedAt: now,
      dataPoints: [`Beta: ${quote.beta.toFixed(2)}`],
    });
  }

  // Bollinger squeeze
  const bbWidth = (indicators.bollingerBands.upper - indicators.bollingerBands.lower) / indicators.bollingerBands.middle;
  if (bbWidth < 0.03) {
    flags.push({
      id: "bb-squeeze",
      severity: "info",
      category: "pattern",
      title: "Bollinger Band Squeeze — Breakout Imminent",
      description: `Bollinger Bands are extremely tight (width: ${(bbWidth * 100).toFixed(1)}%), indicating very low volatility. Historically, squeezes precede explosive moves in either direction. Watch for a breakout signal.`,
      detectedAt: now,
      dataPoints: [
        `BB Width: ${(bbWidth * 100).toFixed(1)}%`,
        `Upper: $${indicators.bollingerBands.upper.toFixed(2)}`,
        `Lower: $${indicators.bollingerBands.lower.toFixed(2)}`,
      ],
    });
  }

  // MACD divergence hint
  if (data.length > 5) {
    const recentPrices = data.slice(-5).map((d) => d.close);
    const priceRising = recentPrices[recentPrices.length - 1] > recentPrices[0];
    const macdFalling = indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal;

    if (priceRising && macdFalling) {
      flags.push({
        id: "bearish-divergence",
        severity: "warning",
        category: "pattern",
        title: "Bearish Divergence Detected",
        description: `Price is making higher highs but MACD is weakening — a classic bearish divergence. This often precedes a trend reversal. Smart money may already be selling into strength.`,
        detectedAt: now,
        dataPoints: [
          `MACD Histogram: ${indicators.macd.histogram.toFixed(3)}`,
          `Price trend: Rising`,
          `MACD trend: Falling`,
        ],
      });
    }

    const priceFalling = recentPrices[recentPrices.length - 1] < recentPrices[0];
    const macdRising = indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal;

    if (priceFalling && macdRising) {
      flags.push({
        id: "bullish-divergence",
        severity: "info",
        category: "pattern",
        title: "Bullish Divergence Detected",
        description: `Price is making lower lows but MACD is strengthening — a bullish divergence. This suggests selling pressure is fading and a reversal could be forming.`,
        detectedAt: now,
        dataPoints: [
          `MACD Histogram: ${indicators.macd.histogram.toFixed(3)}`,
          `Price trend: Falling`,
          `MACD trend: Rising`,
        ],
      });
    }
  }

  const volumeAnomaly = detectVolumeOwnershipAnomaly(quote.volume, quote.avgVolume, quote.changePercent);
  if (volumeAnomaly) {
    flags.push(volumeAnomaly);
  }

  return flags.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/** Volume spike with price direction — real OHLCV only, not random insider simulation. */
function detectVolumeOwnershipAnomaly(
  volume: number,
  avgVolume: number,
  changePercent: number
): RedFlag | null {
  if (avgVolume <= 0 || volume < avgVolume * 2.5) return null;

  const ratio = volume / avgVolume;
  const now = new Date().toISOString();

  if (changePercent <= -3) {
    return {
      id: "volume-selloff",
      severity: "warning",
      category: "volume",
      title: "Heavy Volume on Down Day",
      description:
        "Trading volume is well above average while price is falling — often associated with distribution or forced selling. Verify with news and filings; this is not insider transaction data.",
      detectedAt: now,
      dataPoints: [
        `Volume: ${ratio.toFixed(1)}× 20-day average`,
        `Day change: ${changePercent.toFixed(2)}%`,
      ],
    };
  }

  if (changePercent >= 3) {
    return {
      id: "volume-breakout",
      severity: "info",
      category: "volume",
      title: "Heavy Volume on Up Day",
      description:
        "Unusually high volume with a positive price move may indicate institutional accumulation or a news-driven breakout. Confirm catalysts before acting.",
      detectedAt: now,
      dataPoints: [
        `Volume: ${ratio.toFixed(1)}× average`,
        `Day change: +${changePercent.toFixed(2)}%`,
      ],
    };
  }

  return null;
}

export function calculateRiskScore(
  indicators: TechnicalIndicators,
  quote: {
    price: number;
    volume: number;
    avgVolume: number;
    peRatio: number;
    beta: number;
    changePercent: number;
    eps: number;
  },
  redFlags: RedFlag[],
  options?: {
    finnhubSentiment?: { sentiment?: { bullishPercent?: number; bearishPercent?: number } } | null;
    newsBreakdown?: { positive: number; negative: number; neutral: number } | null;
  }
): RiskScore {
  let technical = 35;
  let fundamental = 35;
  let sentiment = 30;
  let manipulation = 5;
  let volatility = 30;

  // Technical risk
  if (indicators.rsi > 78 || indicators.rsi < 22) technical += 22;
  else if (indicators.rsi > 70 || indicators.rsi < 30) technical += 12;
  if (indicators.adx > 45) technical += 8;
  const bbWidth =
    indicators.bollingerBands.middle > 0
      ? (indicators.bollingerBands.upper - indicators.bollingerBands.lower) / indicators.bollingerBands.middle
      : 0;
  if (bbWidth > 0.1) technical += 18;
  else if (bbWidth > 0.06) technical += 8;

  // Fundamental risk
  if (quote.eps < 0) fundamental += 28;
  if (quote.peRatio > 80) fundamental += 22;
  else if (quote.peRatio > 50) fundamental += 12;
  else if (quote.peRatio > 0 && quote.peRatio < 8) fundamental += 6;

  // Volatility
  volatility = Math.min(Math.max(quote.beta * 28, 15), 95);
  if (quote.price > 0 && indicators.atr / quote.price > 0.04) volatility += 18;
  else if (quote.price > 0 && indicators.atr / quote.price > 0.025) volatility += 8;

  // Red flags
  const criticalFlags = redFlags.filter((f) => f.severity === "critical");
  const warningFlags = redFlags.filter((f) => f.severity === "warning");
  manipulation += criticalFlags.length * 18 + warningFlags.length * 7;
  if (redFlags.some((f) => f.category === "manipulation")) manipulation += 22;

  // Sentiment: volume + Finnhub + headline mix
  if (quote.avgVolume > 0 && quote.volume / quote.avgVolume > 3) sentiment += 16;
  if (Math.abs(quote.changePercent) > 6) sentiment += 14;
  else if (Math.abs(quote.changePercent) > 3) sentiment += 6;

  const finn = options?.finnhubSentiment?.sentiment;
  if (finn) {
    const skew = (finn.bearishPercent ?? 0) - (finn.bullishPercent ?? 0);
    if (skew > 15) sentiment += 12;
    if (skew < -15) sentiment -= 8;
  }

  const nb = options?.newsBreakdown;
  if (nb) {
    const total = nb.positive + nb.negative + nb.neutral;
    if (total >= 3 && nb.negative > nb.positive * 1.5) sentiment += 14;
    if (total >= 3 && nb.positive > nb.negative * 1.5) sentiment = Math.max(10, sentiment - 6);
  }

  technical = Math.min(Math.max(technical, 0), 100);
  fundamental = Math.min(Math.max(fundamental, 0), 100);
  sentiment = Math.min(Math.max(sentiment, 0), 100);
  manipulation = Math.min(Math.max(manipulation, 0), 100);
  volatility = Math.min(Math.max(volatility, 0), 100);

  const overall = Math.round(
    technical * 0.28 + fundamental * 0.22 + sentiment * 0.18 + manipulation * 0.17 + volatility * 0.15
  );

  let grade: string;
  let verdict: string;
  if (overall <= 25) { grade = "A"; verdict = "Low Risk — Safe for most investors"; }
  else if (overall <= 40) { grade = "B"; verdict = "Moderate Risk — Suitable with proper position sizing"; }
  else if (overall <= 55) { grade = "C"; verdict = "Elevated Risk — Requires active monitoring"; }
  else if (overall <= 70) { grade = "D"; verdict = "High Risk — Only for experienced traders"; }
  else { grade = "F"; verdict = "Extreme Risk — Proceed with extreme caution"; }

  return { overall, technical, fundamental, sentiment, manipulation, volatility, grade, verdict };
}
