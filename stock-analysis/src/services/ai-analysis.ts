import { buildPriceTargets, normalizeRecommendation, normalizePriceTargets } from "@/lib/analysis-coherence";
import {
  deriveSentimentScore,
  deriveTimeHorizon,
  ensureSymbolInBullets,
} from "@/lib/investment-profile";
import type { TechnicalIndicators } from "@/lib/technical-analysis";
import type { StockQuote, CompetitorData } from "./stock-data";

export interface AIAnalysis {
  summary: string;
  recommendation: string;
  confidence: number;
  priceTarget: { low: number; mid: number; high: number };
  riskLevel: string;
  timeHorizon: string;
  timeHorizonRationale?: string;
  keyFactors: string[];
  technicalOutlook: string;
  fundamentalOutlook: string;
  competitorAnalysis: string;
  catalysts: string[];
  risks: string[];
  sentimentScore: number;
}

const AI_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), ms)
    ),
  ]);
}

export async function generateAIAnalysis(
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  competitors: CompetitorData[],
  news: { title: string; sentiment: string }[],
  options?: { dataQualityNote?: string }
): Promise<AIAnalysis> {
  const fallback = () =>
    generateBuiltInAnalysis(quote, indicators, signal, competitors, news, options?.dataQualityNote);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      return await withTimeout(
        callGeminiAnalysis(quote, indicators, signal, competitors, news, geminiKey),
        AI_TIMEOUT_MS
      );
    } catch (e) {
      console.error("Gemini API failed, trying fallback:", e);
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      return await withTimeout(
        callOpenAIAnalysis(quote, indicators, signal, competitors, news, openaiKey),
        AI_TIMEOUT_MS
      );
    } catch (e) {
      console.error("OpenAI API failed, using built-in:", e);
    }
  }

  return fallback();
}

function buildAnalysisPrompt(
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  competitors: CompetitorData[],
  news: { title: string; sentiment: string }[]
): string {
  const financialsBlock = quote.financials
    ? `\nFINANCIALS:
- Revenue: $${(quote.financials.revenue / 1e9).toFixed(2)}B
- Net Income: $${(quote.financials.netIncome / 1e9).toFixed(2)}B
- Profit Margin: ${(quote.financials.profitMargin * 100).toFixed(1)}%
- Operating Margin: ${(quote.financials.operatingMargin * 100).toFixed(1)}%
- ROE: ${(quote.financials.returnOnEquity * 100).toFixed(1)}%
- Debt/Equity: ${quote.financials.debtToEquity.toFixed(2)}
- Current Ratio: ${quote.financials.currentRatio.toFixed(2)}
- Free Cash Flow: $${(quote.financials.freeCashFlow / 1e9).toFixed(2)}B
- Revenue Growth: ${(quote.financials.revenueGrowth * 100).toFixed(1)}%`
    : "";

  return `You are an elite Wall Street quantitative analyst. Provide a comprehensive, data-driven analysis of ${quote.symbol} (${quote.name}).

CURRENT DATA:
- Price: $${quote.price.toFixed(2)} | Change: ${quote.changePercent.toFixed(2)}%
- Market Cap: $${(quote.marketCap / 1e9).toFixed(2)}B | P/E: ${quote.peRatio.toFixed(2)} | EPS: $${quote.eps.toFixed(2)}
- Beta: ${quote.beta.toFixed(2)} | Sector: ${quote.sector} | Industry: ${quote.industry}
- 52W High: $${quote.high52.toFixed(2)} | 52W Low: $${quote.low52.toFixed(2)}
- Dividend Yield: ${quote.dividendYield.toFixed(2)}%
- Volume: ${(quote.volume / 1e6).toFixed(1)}M | Avg Volume: ${(quote.avgVolume / 1e6).toFixed(1)}M
${financialsBlock}

TECHNICAL INDICATORS:
- SMA20: $${indicators.sma20.toFixed(2)} | SMA50: $${indicators.sma50.toFixed(2)} | SMA200: $${indicators.sma200.toFixed(2)}
- EMA12: $${indicators.ema12.toFixed(2)} | EMA26: $${indicators.ema26.toFixed(2)} | VWAP: $${indicators.vwap.toFixed(2)}
- RSI(14): ${indicators.rsi.toFixed(1)} | Stochastic K: ${indicators.stochastic.k.toFixed(1)} D: ${indicators.stochastic.d.toFixed(1)}
- MACD: ${indicators.macd.macd.toFixed(3)} | Signal: ${indicators.macd.signal.toFixed(3)} | Histogram: ${indicators.macd.histogram.toFixed(3)}
- Bollinger: Upper $${indicators.bollingerBands.upper.toFixed(2)} | Mid $${indicators.bollingerBands.middle.toFixed(2)} | Lower $${indicators.bollingerBands.lower.toFixed(2)}
- ADX: ${indicators.adx.toFixed(1)} | ATR: $${indicators.atr.toFixed(2)}

ALGORITHM SIGNAL: ${signal.signal} (${signal.confidence}% confidence)
KEY REASONS: ${signal.reasons.slice(0, 8).join("; ")}

PEER COMPARISON: ${competitors.map((c) => `${c.symbol} ($${c.price.toFixed(2)}, P/E: ${c.peRatio.toFixed(1)}, MCap: $${(c.marketCap / 1e9).toFixed(1)}B, Chg: ${c.changePercent.toFixed(1)}%)`).join(" | ")}

NEWS: ${news.slice(0, 6).map((n) => `[${n.sentiment.toUpperCase()}] ${n.title}`).join(" | ")}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "summary": "3-4 sentence executive summary with specific numbers",
  "recommendation": "Strong Buy|Buy|Hold|Sell|Strong Sell",
  "confidence": 0-100,
  "priceTarget": {"low": number, "mid": number, "high": number},
  "riskLevel": "Low|Medium|High|Very High",
  "timeHorizon": "Pick ONE horizon that fits THIS stock only (examples: Tactical 2-6 weeks, Short-term 1-3 months, Swing 10-22 weeks, Position 6-14 months, Core hold 1-3 years) — must reflect beta, cap, volatility, and signal",
  "keyFactors": ["5-6 specific data-driven factors"],
  "technicalOutlook": "detailed technical paragraph",
  "fundamentalOutlook": "detailed fundamental paragraph",
  "competitorAnalysis": "detailed peer comparison paragraph",
  "catalysts": ["4-5 upside catalysts — each MUST mention ${quote.symbol} or ${quote.name}"],
  "risks": ["4-5 downside risks — each MUST mention ${quote.symbol} or ${quote.sector}"],
  "sentimentScore": -100 to 100
}`;
}

async function callGeminiAnalysis(
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  competitors: CompetitorData[],
  news: { title: string; sentiment: string }[],
  apiKey: string
): Promise<AIAnalysis> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const prompt = buildAnalysisPrompt(quote, indicators, signal, competitors, news);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);

  // Validate required fields
  if (!parsed.summary || !parsed.recommendation) {
    throw new Error("Incomplete Gemini response");
  }

  return enrichAiAnalysis(parsed, quote, indicators, signal, news);
}

function enrichAiAnalysis(
  parsed: Partial<AIAnalysis>,
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  news: { title: string; sentiment: string }[]
): AIAnalysis {
  const recommendation = normalizeRecommendation(
    parsed.recommendation || signal.signal,
    signal.signal
  );
  const horizon = deriveTimeHorizon({
    symbol: quote.symbol,
    price: quote.price,
    beta: quote.beta,
    marketCap: quote.marketCap,
    peRatio: quote.peRatio,
    dividendYield: quote.dividendYield,
    sector: quote.sector,
    industry: quote.industry,
    changePercent: quote.changePercent,
    rsi: indicators.rsi,
    adx: indicators.adx,
    atr: indicators.atr,
    signal: signal.signal,
    confidence: signal.confidence,
  });

  return {
    summary: parsed.summary || `${quote.name} analysis`,
    recommendation,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : signal.confidence,
    priceTarget: normalizePriceTargets(quote.price, recommendation, parsed.priceTarget, indicators),
    riskLevel: parsed.riskLevel || "Medium",
    timeHorizon: horizon.label,
    timeHorizonRationale: horizon.rationale,
    keyFactors: parsed.keyFactors?.length ? parsed.keyFactors : [],
    technicalOutlook: parsed.technicalOutlook || "",
    fundamentalOutlook: parsed.fundamentalOutlook || "",
    competitorAnalysis: parsed.competitorAnalysis || "",
    catalysts: ensureSymbolInBullets(quote.symbol, parsed.catalysts || [], [
      `${quote.symbol} ${signal.signal} setup (${signal.confidence}% confidence)`,
    ]),
    risks: ensureSymbolInBullets(quote.symbol, parsed.risks || [], [
      `${quote.symbol} volatility (beta ${quote.beta.toFixed(2)})`,
    ]),
    sentimentScore: deriveSentimentScore(parsed.sentimentScore, news, indicators, signal),
  };
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

  const prompt = buildAnalysisPrompt(quote, indicators, signal, competitors, news);
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const parsed = JSON.parse(content) as Partial<AIAnalysis>;
  return enrichAiAnalysis(parsed, quote, indicators, signal, news);
}

function generateBuiltInAnalysis(
  quote: StockQuote,
  indicators: TechnicalIndicators,
  signal: { signal: string; confidence: number; reasons: string[] },
  competitors: CompetitorData[],
  news: { title: string; sentiment: string }[],
  dataQualityNote?: string
): AIAnalysis {
  const bullishCount = signal.reasons.filter((r) => r.includes("bullish") || r.includes("buy") || r.includes("oversold")).length;
  const bearishCount = signal.reasons.filter((r) => r.includes("bearish") || r.includes("sell") || r.includes("overbought")).length;
  const newsSentiment = news.reduce((acc, n) => n.sentiment === "positive" ? acc + 1 : n.sentiment === "negative" ? acc - 1 : acc, 0);
  const priceFromSMA200 = ((quote.price - indicators.sma200) / indicators.sma200) * 100;

  let riskLevel = "Medium";
  if (quote.beta > 1.5 || indicators.atr / quote.price > 0.03) riskLevel = "High";
  if (quote.beta > 2 || indicators.atr / quote.price > 0.05) riskLevel = "Very High";
  if (quote.beta < 0.8 && indicators.atr / quote.price < 0.015) riskLevel = "Low";

  const avgCompetitorPE = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.peRatio, 0) / competitors.length : quote.peRatio;
  const isUndervalued = quote.peRatio > 0 && quote.peRatio < avgCompetitorPE * 0.8;
  const isOvervalued = quote.peRatio > avgCompetitorPE * 1.3;

  const recommendation = normalizeRecommendation(signal.signal, "Hold");
  const priceTarget = buildPriceTargets(quote.price, recommendation, indicators);

  const financialsInfo = quote.financials
    ? ` Revenue is $${(quote.financials.revenue / 1e9).toFixed(1)}B with a ${(quote.financials.profitMargin * 100).toFixed(1)}% profit margin and ${(quote.financials.returnOnEquity * 100).toFixed(1)}% ROE.`
    : "";

  return {
    summary: `${quote.name} (${quote.symbol}) trades at $${quote.price.toFixed(2)} with a ${signal.signal} signal at ${signal.confidence}% confidence (Wilder RSI ${indicators.rsi.toFixed(1)}, ADX ${indicators.adx.toFixed(1)}). The stock is ${priceFromSMA200 > 0 ? `${priceFromSMA200.toFixed(1)}% above` : `${Math.abs(priceFromSMA200).toFixed(1)}% below`} its 200-day moving average. ${isUndervalued ? "Valuation appears attractive relative to peers." : isOvervalued ? "Premium valuation relative to peers." : "Valuation is in line with peers."}${financialsInfo} ${news.length === 0 ? "No live headlines were available for this run." : newsSentiment > 0 ? "News sentiment is positive." : newsSentiment < 0 ? "News sentiment is concerning." : "Sentiment is mixed."}${dataQualityNote ? ` Note: ${dataQualityNote}` : ""}`,

    recommendation,
    confidence: signal.confidence,
    priceTarget,

    riskLevel,
    ...(() => {
      const h = deriveTimeHorizon({
        symbol: quote.symbol,
        price: quote.price,
        beta: quote.beta,
        marketCap: quote.marketCap,
        peRatio: quote.peRatio,
        dividendYield: quote.dividendYield,
        sector: quote.sector,
        industry: quote.industry,
        changePercent: quote.changePercent,
        rsi: indicators.rsi,
        adx: indicators.adx,
        atr: indicators.atr,
        signal: signal.signal,
        confidence: signal.confidence,
      });
      return { timeHorizon: h.label, timeHorizonRationale: h.rationale };
    })(),

    keyFactors: [
      `Technical signal: ${signal.signal} with ${signal.confidence}% confidence`,
      `RSI at ${indicators.rsi.toFixed(1)} — ${indicators.rsi < 30 ? "oversold territory" : indicators.rsi > 70 ? "overbought territory" : "neutral zone"}`,
      `${priceFromSMA200 > 0 ? "Trading above" : "Trading below"} 200-day MA by ${Math.abs(priceFromSMA200).toFixed(1)}%`,
      `P/E of ${quote.peRatio.toFixed(1)} vs peer avg of ${avgCompetitorPE.toFixed(1)}`,
      `Market cap $${(quote.marketCap / 1e9).toFixed(1)}B in ${quote.sector}`,
      `Beta ${quote.beta.toFixed(2)} — ${quote.beta > 1.2 ? "higher" : quote.beta < 0.8 ? "lower" : "average"} volatility`,
      ...(quote.financials ? [`Profit margin: ${(quote.financials.profitMargin * 100).toFixed(1)}%, ROE: ${(quote.financials.returnOnEquity * 100).toFixed(1)}%`] : []),
    ],

    technicalOutlook: `${quote.symbol} shows ${signal.signal.includes("Buy") ? "bullish" : signal.signal.includes("Sell") ? "bearish" : "mixed"} technical conditions. RSI at ${indicators.rsi.toFixed(1)} ${indicators.rsi < 30 ? "signals oversold conditions" : indicators.rsi > 70 ? "signals overbought conditions" : "is neutral"}. MACD histogram is ${indicators.macd.histogram > 0 ? "positive, indicating bullish momentum" : "negative, suggesting weakening momentum"}. Price trades ${quote.price > indicators.bollingerBands.middle ? "above" : "below"} the Bollinger midline with ATR of $${indicators.atr.toFixed(2)} (${((indicators.atr / quote.price) * 100).toFixed(1)}% volatility). ${indicators.adx > 25 ? `ADX at ${indicators.adx.toFixed(1)} confirms a strong trend.` : `ADX at ${indicators.adx.toFixed(1)} suggests a ranging market.`} Key support near $${indicators.supportLevels[0]?.toFixed(2) || (quote.price * 0.95).toFixed(2)}, resistance near $${indicators.resistanceLevels[0]?.toFixed(2) || (quote.price * 1.05).toFixed(2)}.`,

    fundamentalOutlook: `${quote.symbol} has a P/E of ${quote.peRatio.toFixed(1)}, ${isUndervalued ? "below" : isOvervalued ? "above" : "in line with"} the peer average of ${avgCompetitorPE.toFixed(1)}. ${isUndervalued ? "This discount suggests potential upside." : isOvervalued ? "Premium pricing requires sustained growth." : "Fair valuation relative to peers."}${quote.financials ? ` Revenue stands at $${(quote.financials.revenue / 1e9).toFixed(1)}B with ${(quote.financials.profitMargin * 100).toFixed(1)}% profit margin and ${(quote.financials.returnOnEquity * 100).toFixed(1)}% ROE. Free cash flow of $${(quote.financials.freeCashFlow / 1e9).toFixed(1)}B supports ongoing operations. Debt-to-equity ratio is ${quote.financials.debtToEquity.toFixed(2)}.` : ` EPS of $${quote.eps.toFixed(2)} with market cap of $${(quote.marketCap / 1e9).toFixed(1)}B.`} ${quote.dividendYield > 0 ? `Dividend yield of ${quote.dividendYield.toFixed(2)}% provides income.` : "No dividend — growth-focused."} Beta of ${quote.beta.toFixed(2)} indicates ${quote.beta > 1.2 ? "amplified market sensitivity" : quote.beta < 0.8 ? "defensive characteristics" : "market-aligned volatility"}.`,

    competitorAnalysis: competitors.length > 0
      ? `In ${quote.sector}, ${quote.symbol} competes with ${competitors.map((c) => c.symbol).join(", ")}. ${competitors.filter((c) => c.marketCap > quote.marketCap).length > 0 ? `Larger peers: ${competitors.filter((c) => c.marketCap > quote.marketCap).map((c) => `${c.symbol} ($${(c.marketCap / 1e9).toFixed(1)}B)`).join(", ")}. ` : `${quote.symbol} leads its peer group by market cap. `}${quote.symbol}'s P/E of ${quote.peRatio.toFixed(1)} ${quote.peRatio < avgCompetitorPE ? "undercuts" : "exceeds"} the peer avg of ${avgCompetitorPE.toFixed(1)}. Recent performance: ${competitors.filter((c) => c.changePercent > quote.changePercent).length > Math.floor(competitors.length / 2) ? `${quote.symbol} trails most peers` : `${quote.symbol} outpaces most peers`}.`
      : "Peer data unavailable for comparison.",

    catalysts: ensureSymbolInBullets(quote.symbol, [], [
      signal.signal.includes("Buy")
        ? `${quote.symbol} technical momentum — ${signal.confidence}% ${signal.signal} signal`
        : signal.signal.includes("Sell")
          ? `${quote.symbol} faces pressure; ${quote.sector} headwinds`
          : `${quote.symbol} range-bound until a ${quote.sector} catalyst`,
      isUndervalued
        ? `${quote.symbol} trades below peer P/E — re-rating potential`
        : `${quote.symbol} premium vs peers requires execution`,
      newsSentiment > 0
        ? `${quote.symbol} positive news flow supports sentiment`
        : `${quote.symbol} sentiment could improve on guidance`,
      `${quote.sector}: ${quote.changePercent >= 0 ? "sector tailwind" : "sector rotation risk"} for ${quote.symbol}`,
      `${quote.symbol} earnings / guidance as near-term catalyst`,
    ]),

    risks: ensureSymbolInBullets(quote.symbol, [], [
      riskLevel === "High" || riskLevel === "Very High"
        ? `${quote.symbol} high volatility (beta ${quote.beta.toFixed(2)}) — wide swings`
        : `${quote.symbol} exposed to broad market drawdowns`,
      isOvervalued
        ? `${quote.symbol} rich valuation — disappointment risk`
        : `${quote.symbol} could lag if ${quote.sector} rotates out`,
      `${quote.symbol} support near $${(indicators.supportLevels[0] || quote.price * 0.92).toFixed(2)} — break triggers stops`,
      `Macro (rates/inflation) may compress ${quote.sector} multiples including ${quote.symbol}`,
      `${quote.symbol} volume/liquidity spikes can exaggerate moves`,
    ]),

    sentimentScore: deriveSentimentScore(undefined, news, indicators, signal),
  };
}
