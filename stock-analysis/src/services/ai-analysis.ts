import type { TechnicalIndicators } from "@/lib/technical-analysis";
import type { StockQuote, CompetitorData } from "./stock-data";

export interface AIAnalysis {
  summary: string;
  recommendation: string;
  confidence: number;
  priceTarget: { low: number; mid: number; high: number };
  riskLevel: string;
  timeHorizon: string;
  keyFactors: string[];
  technicalOutlook: string;
  fundamentalOutlook: string;
  competitorAnalysis: string;
  catalysts: string[];
  risks: string[];
  sentimentScore: number;
}

export async function generateAIAnalysis(
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  competitors: CompetitorData[],
  news: { title: string; sentiment: string }[]
): Promise<AIAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      return await callOpenAIAnalysis(quote, indicators, signal, competitors, news, apiKey);
    } catch (e) {
      console.error("OpenAI API call failed, using built-in analysis:", e);
    }
  }

  return generateBuiltInAnalysis(quote, indicators, signal, competitors, news);
}

async function callOpenAIAnalysis(
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  competitors: CompetitorData[],
  news: { title: string; sentiment: string }[],
  apiKey: string
): Promise<AIAnalysis> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey });

  const prompt = `You are an expert stock analyst. Analyze ${quote.symbol} (${quote.name}) with the following data and provide a detailed analysis.

CURRENT PRICE: $${quote.price.toFixed(2)}
CHANGE: ${quote.changePercent.toFixed(2)}%
MARKET CAP: $${(quote.marketCap / 1e9).toFixed(2)}B
P/E RATIO: ${quote.peRatio.toFixed(2)}
EPS: $${quote.eps.toFixed(2)}
BETA: ${quote.beta.toFixed(2)}
SECTOR: ${quote.sector}
52W HIGH: $${quote.high52.toFixed(2)} | 52W LOW: $${quote.low52.toFixed(2)}
DIVIDEND YIELD: ${quote.dividendYield.toFixed(2)}%

TECHNICAL INDICATORS:
- SMA20: $${indicators.sma20.toFixed(2)} | SMA50: $${indicators.sma50.toFixed(2)} | SMA200: $${indicators.sma200.toFixed(2)}
- RSI(14): ${indicators.rsi.toFixed(1)}
- MACD: ${indicators.macd.macd.toFixed(3)} (Signal: ${indicators.macd.signal.toFixed(3)})
- Bollinger Bands: $${indicators.bollingerBands.lower.toFixed(2)} - $${indicators.bollingerBands.upper.toFixed(2)}
- Stochastic: K=${indicators.stochastic.k.toFixed(1)} D=${indicators.stochastic.d.toFixed(1)}
- ADX: ${indicators.adx.toFixed(1)}
- ATR: ${indicators.atr.toFixed(2)}
- VWAP: $${indicators.vwap.toFixed(2)}

TECHNICAL SIGNAL: ${signal.signal} (${signal.confidence}% confidence)
SIGNAL REASONS: ${signal.reasons.join("; ")}

COMPETITORS: ${competitors.map((c) => `${c.symbol} ($${c.price.toFixed(2)}, P/E: ${c.peRatio.toFixed(1)}, MCap: $${(c.marketCap / 1e9).toFixed(1)}B)`).join("; ")}

RECENT NEWS SENTIMENT: ${news.map((n) => `"${n.title}" [${n.sentiment}]`).join("; ")}

Respond in this JSON format:
{
  "summary": "2-3 sentence executive summary",
  "recommendation": "Strong Buy|Buy|Hold|Sell|Strong Sell",
  "confidence": 0-100,
  "priceTarget": {"low": number, "mid": number, "high": number},
  "riskLevel": "Low|Medium|High|Very High",
  "timeHorizon": "Short-term (1-3 months)|Medium-term (3-12 months)|Long-term (1-3 years)",
  "keyFactors": ["factor1", "factor2", ...],
  "technicalOutlook": "paragraph",
  "fundamentalOutlook": "paragraph",
  "competitorAnalysis": "paragraph comparing to competitors",
  "catalysts": ["catalyst1", "catalyst2", ...],
  "risks": ["risk1", "risk2", ...],
  "sentimentScore": -100 to 100
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  return JSON.parse(content) as AIAnalysis;
}

function generateBuiltInAnalysis(
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  competitors: CompetitorData[],
  news: { title: string; sentiment: string }[]
): AIAnalysis {
  const bullishCount = signal.reasons.filter((r) => r.includes("bullish") || r.includes("buy") || r.includes("oversold")).length;
  const bearishCount = signal.reasons.filter((r) => r.includes("bearish") || r.includes("sell") || r.includes("overbought")).length;
  const sentimentScore = ((bullishCount - bearishCount) / Math.max(signal.reasons.length, 1)) * 100;

  const newsSentiment = news.reduce((acc, n) => {
    if (n.sentiment === "positive") return acc + 1;
    if (n.sentiment === "negative") return acc - 1;
    return acc;
  }, 0);

  const priceFromSMA200 = ((quote.price - indicators.sma200) / indicators.sma200) * 100;
  const priceMomentum = quote.changePercent;

  let riskLevel = "Medium";
  if (quote.beta > 1.5 || indicators.atr / quote.price > 0.03) riskLevel = "High";
  if (quote.beta > 2 || indicators.atr / quote.price > 0.05) riskLevel = "Very High";
  if (quote.beta < 0.8 && indicators.atr / quote.price < 0.015) riskLevel = "Low";

  const avgCompetitorPE = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.peRatio, 0) / competitors.length
    : quote.peRatio;

  const isUndervalued = quote.peRatio < avgCompetitorPE * 0.8;
  const isOvervalued = quote.peRatio > avgCompetitorPE * 1.3;

  const priceTargetBase = quote.price;
  const targetMultiplier = signal.signal.includes("Buy") ? 1.15 : signal.signal.includes("Sell") ? 0.9 : 1.05;

  return {
    summary: `${quote.name} (${quote.symbol}) is currently trading at $${quote.price.toFixed(2)} with a ${signal.signal} signal at ${signal.confidence}% confidence. ${priceFromSMA200 > 0 ? `The stock is ${priceFromSMA200.toFixed(1)}% above` : `The stock is ${Math.abs(priceFromSMA200).toFixed(1)}% below`} its 200-day moving average. ${isUndervalued ? "The stock appears undervalued relative to peers." : isOvervalued ? "The stock appears overvalued relative to peers." : "Valuation is in line with peers."} ${newsSentiment > 0 ? "Recent news sentiment is positive." : newsSentiment < 0 ? "Recent news sentiment is concerning." : "News sentiment is mixed."}`,

    recommendation: signal.signal,
    confidence: signal.confidence,

    priceTarget: {
      low: Number((priceTargetBase * (targetMultiplier - 0.1)).toFixed(2)),
      mid: Number((priceTargetBase * targetMultiplier).toFixed(2)),
      high: Number((priceTargetBase * (targetMultiplier + 0.1)).toFixed(2)),
    },

    riskLevel,

    timeHorizon: signal.confidence > 70 ? "Short-term (1-3 months)" : signal.confidence > 40 ? "Medium-term (3-12 months)" : "Long-term (1-3 years)",

    keyFactors: [
      `Technical signal: ${signal.signal} with ${signal.confidence}% confidence`,
      `RSI at ${indicators.rsi.toFixed(1)} - ${indicators.rsi < 30 ? "oversold territory" : indicators.rsi > 70 ? "overbought territory" : "neutral zone"}`,
      `${priceFromSMA200 > 0 ? "Trading above" : "Trading below"} the 200-day moving average by ${Math.abs(priceFromSMA200).toFixed(1)}%`,
      `P/E ratio of ${quote.peRatio.toFixed(1)} vs sector average of ${avgCompetitorPE.toFixed(1)}`,
      `Market cap: $${(quote.marketCap / 1e9).toFixed(1)}B in the ${quote.sector} sector`,
      `Beta of ${quote.beta.toFixed(2)} indicates ${quote.beta > 1.2 ? "higher" : quote.beta < 0.8 ? "lower" : "average"} volatility`,
    ],

    technicalOutlook: `The technical picture for ${quote.symbol} shows ${signal.signal.includes("Buy") ? "bullish" : signal.signal.includes("Sell") ? "bearish" : "mixed"} conditions. The RSI is at ${indicators.rsi.toFixed(1)}, ${indicators.rsi < 30 ? "indicating oversold conditions which often precede a bounce" : indicators.rsi > 70 ? "indicating overbought conditions suggesting a potential pullback" : "in neutral territory"}. MACD ${indicators.macd.histogram > 0 ? "is showing positive momentum with the histogram above zero" : "is showing weakening momentum with the histogram below zero"}. The stock is trading ${quote.price > indicators.bollingerBands.middle ? "above" : "below"} the middle Bollinger Band, and the ATR of $${indicators.atr.toFixed(2)} suggests ${indicators.atr / quote.price > 0.02 ? "elevated" : "moderate"} daily volatility. ${indicators.adx > 25 ? `The ADX at ${indicators.adx.toFixed(1)} confirms a strong trend is in place.` : `The ADX at ${indicators.adx.toFixed(1)} suggests the market is ranging without a clear trend.`} Support levels are near $${indicators.supportLevels[0]?.toFixed(2) || (quote.price * 0.95).toFixed(2)} and resistance near $${indicators.resistanceLevels[0]?.toFixed(2) || (quote.price * 1.05).toFixed(2)}.`,

    fundamentalOutlook: `From a fundamental perspective, ${quote.symbol} has a P/E ratio of ${quote.peRatio.toFixed(1)}, which is ${isUndervalued ? "below" : isOvervalued ? "above" : "in line with"} the peer average of ${avgCompetitorPE.toFixed(1)}. ${isUndervalued ? "This suggests potential undervaluation and room for upside." : isOvervalued ? "This premium valuation needs to be justified by superior growth." : "The valuation appears fair relative to competitors."} The company has an EPS of $${quote.eps.toFixed(2)} and a market capitalization of $${(quote.marketCap / 1e9).toFixed(1)}B. ${quote.dividendYield > 0 ? `The dividend yield of ${quote.dividendYield.toFixed(2)}% provides additional returns for investors.` : "The company does not currently pay a dividend, focusing on growth reinvestment."} With a beta of ${quote.beta.toFixed(2)}, the stock ${quote.beta > 1.2 ? "tends to amplify market movements" : quote.beta < 0.8 ? "offers defensive characteristics" : "moves roughly in line with the broader market"}.`,

    competitorAnalysis: competitors.length > 0
      ? `In the ${quote.sector} sector, ${quote.symbol} faces competition from ${competitors.map((c) => c.symbol).join(", ")}. ${competitors.filter((c) => c.marketCap > quote.marketCap).length > 0 ? `Larger competitors include ${competitors.filter((c) => c.marketCap > quote.marketCap).map((c) => `${c.symbol} ($${(c.marketCap / 1e9).toFixed(1)}B)`).join(", ")}. ` : `${quote.symbol} is the market cap leader among its peer group. `}Comparing valuations, ${quote.symbol}'s P/E of ${quote.peRatio.toFixed(1)} ${quote.peRatio < avgCompetitorPE ? "is more attractive than" : "commands a premium over"} the peer average of ${avgCompetitorPE.toFixed(1)}. In terms of recent performance, ${competitors.filter((c) => c.changePercent > quote.changePercent).length > Math.floor(competitors.length / 2) ? `${quote.symbol} has underperformed most peers recently` : `${quote.symbol} has outperformed most peers recently`}, suggesting ${priceMomentum > 0 ? "relative strength" : "potential catch-up opportunity"}.`
      : "Competitor data is currently unavailable for deeper peer comparison.",

    catalysts: [
      signal.signal.includes("Buy") ? "Technical momentum supporting further upside" : "Potential for mean reversion if oversold",
      isUndervalued ? "Undervaluation relative to peers could drive re-rating" : "Market position justifies current valuation",
      newsSentiment > 0 ? "Positive news flow could attract more buyers" : "Improving sentiment could provide a tailwind",
      `${quote.sector} sector ${priceMomentum > 0 ? "tailwinds" : "rotation potential"}`,
      "Upcoming earnings could serve as a catalyst",
    ],

    risks: [
      riskLevel === "High" || riskLevel === "Very High" ? "Elevated volatility increases downside risk" : "Market-wide selloff could drag the stock lower",
      isOvervalued ? "Premium valuation leaves little room for disappointing results" : "Sector rotation could impact relative performance",
      `Beta of ${quote.beta.toFixed(2)} means ${quote.beta > 1 ? "amplified losses in market downturns" : "limited upside in strong rallies"}`,
      "Macroeconomic headwinds (interest rates, inflation) remain a concern",
      `Key support at $${(quote.price * 0.92).toFixed(2)} - a break below could accelerate selling`,
    ],

    sentimentScore: Math.round(sentimentScore + newsSentiment * 10),
  };
}
