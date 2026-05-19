import { NextRequest, NextResponse } from "next/server";
import { finnhubFetchNews, analyzeSentimentFromNews, type FinnhubNews } from "@/services/finnhub-api";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  image: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
  relevance: number;
}

const positiveKeywords = ["surge", "jump", "gain", "rally", "beat", "upgrade", "record", "growth", "strong", "profit", "rises", "soar", "bull", "outperform", "exceeds", "positive"];
const negativeKeywords = ["fall", "drop", "decline", "loss", "miss", "downgrade", "cut", "weak", "crash", "slump", "bear", "risk", "warning", "plunge", "lawsuit", "negative"];

function classifySentiment(headline: string, summary: string): "positive" | "negative" | "neutral" {
  const text = (headline + " " + summary).toLowerCase();
  const posHits = positiveKeywords.filter((kw) => text.includes(kw)).length;
  const negHits = negativeKeywords.filter((kw) => text.includes(kw)).length;
  if (posHits > negHits) return "positive";
  if (negHits > posHits) return "negative";
  return "neutral";
}

function finnhubToNewsItem(item: FinnhubNews, index: number): NewsItem {
  return {
    id: `finnhub-${item.id}`,
    title: item.headline,
    source: item.source,
    url: item.url,
    image: item.image,
    publishedAt: new Date(item.datetime * 1000).toISOString(),
    sentiment: classifySentiment(item.headline, item.summary),
    summary: item.summary,
    relevance: Math.max(95 - index * 3, 50),
  };
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") || "AAPL";

  // Try Finnhub real news first
  const finnhubNews = await finnhubFetchNews(symbol.toUpperCase());

  if (finnhubNews.length > 0) {
    const news = finnhubNews.map(finnhubToNewsItem);
    const sentimentBreakdown = analyzeSentimentFromNews(finnhubNews);
    return NextResponse.json({ news, symbol, sentimentBreakdown, source: "finnhub" });
  }

  // Fallback to generated news
  const news = generateNewsForSymbol(symbol.toUpperCase());
  return NextResponse.json({ news, symbol, source: "generated" });
}

function generateNewsForSymbol(symbol: string): NewsItem[] {
  const templates = [
    { title: `${symbol} Surpasses Analyst Expectations in Latest Quarter`, source: "Financial Times", sentiment: "positive" as const, summary: `${symbol} reported earnings that beat Wall Street estimates, driven by strong revenue growth and margin expansion.` },
    { title: `Institutional Investors Increase Stakes in ${symbol}`, source: "Bloomberg", sentiment: "positive" as const, summary: `Major hedge funds have been accumulating shares of ${symbol}, signaling confidence in long-term growth.` },
    { title: `${symbol} Faces Regulatory Headwinds in Key Markets`, source: "Reuters", sentiment: "negative" as const, summary: `New regulatory proposals could impact ${symbol}'s operations. Analysts are assessing the potential revenue impact.` },
    { title: `Analyst Roundup: Mixed Views on ${symbol}'s Valuation`, source: "MarketWatch", sentiment: "neutral" as const, summary: `Wall Street analysts are divided on ${symbol}'s valuation. Some see upside, others caution about premium pricing.` },
    { title: `${symbol} Announces Strategic Partnership to Drive Innovation`, source: "CNBC", sentiment: "positive" as const, summary: `${symbol} entered a new strategic partnership aimed at accelerating product development.` },
    { title: `Market Volatility: How ${symbol} Is Positioned`, source: "Wall Street Journal", sentiment: "neutral" as const, summary: `Analysts evaluate how ${symbol}'s business model can weather economic headwinds.` },
    { title: `${symbol} Expands AI Capabilities with Major Investment`, source: "TechCrunch", sentiment: "positive" as const, summary: `${symbol} is investing heavily in AI, with plans to integrate it across the product suite.` },
    { title: `Supply Chain Disruptions May Impact ${symbol}`, source: "Bloomberg", sentiment: "negative" as const, summary: `Ongoing supply chain challenges could affect ${symbol}'s ability to meet near-term demand.` },
  ];

  const now = Date.now();
  return templates.map((t, i) => ({
    id: `gen-${symbol}-${i}`,
    title: t.title,
    source: t.source,
    url: "#",
    image: "",
    publishedAt: new Date(now - i * 3600000 * (i + 1)).toISOString(),
    sentiment: t.sentiment,
    summary: t.summary,
    relevance: Math.round(95 - i * 5),
  }));
}
