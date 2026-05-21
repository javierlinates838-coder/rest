import { classifyNewsSentiment } from "@/lib/news-sentiment";
import { finnhubFetchNews, analyzeSentimentFromNews, type FinnhubNews } from "@/services/finnhub-api";
import { newsApiFetchForSymbol, type NewsApiArticle } from "@/services/newsapi";

export interface StockNewsItem {
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

export type StockNewsProvider = "finnhub" | "newsapi" | "generated";

function finnhubToItem(item: FinnhubNews, index: number): StockNewsItem {
  return {
    id: `finnhub-${item.id}`,
    title: item.headline,
    source: item.source,
    url: item.url,
    image: item.image,
    publishedAt: new Date(item.datetime * 1000).toISOString(),
    sentiment: classifyNewsSentiment(item.headline, item.summary),
    summary: item.summary,
    relevance: Math.max(95 - index * 3, 50),
  };
}

function newsApiToItem(item: NewsApiArticle, index: number): StockNewsItem {
  const summary = item.description || item.content?.slice(0, 280) || "";
  return {
    id: `newsapi-${item.url}`,
    title: item.title,
    source: item.source?.name || "NewsAPI",
    url: item.url,
    image: item.urlToImage || "",
    publishedAt: item.publishedAt,
    sentiment: classifyNewsSentiment(item.title, summary),
    summary,
    relevance: Math.max(90 - index * 3, 50),
  };
}

function generateFallback(symbol: string): StockNewsItem[] {
  const templates = [
    { title: `${symbol} Surpasses Analyst Expectations in Latest Quarter`, source: "Financial Times", sentiment: "positive" as const, summary: `${symbol} reported earnings that beat Wall Street estimates.` },
    { title: `Institutional Investors Increase Stakes in ${symbol}`, source: "Bloomberg", sentiment: "positive" as const, summary: `Major funds have been accumulating shares of ${symbol}.` },
    { title: `${symbol} Faces Regulatory Headwinds in Key Markets`, source: "Reuters", sentiment: "negative" as const, summary: `New regulatory proposals could impact ${symbol}'s operations.` },
    { title: `Analyst Roundup: Mixed Views on ${symbol}'s Valuation`, source: "MarketWatch", sentiment: "neutral" as const, summary: `Wall Street analysts are divided on ${symbol}'s valuation.` },
    { title: `${symbol} Announces Strategic Partnership`, source: "CNBC", sentiment: "positive" as const, summary: `${symbol} entered a new strategic partnership.` },
    { title: `Market Volatility: How ${symbol} Is Positioned`, source: "Wall Street Journal", sentiment: "neutral" as const, summary: `Analysts evaluate how ${symbol} can weather economic headwinds.` },
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

/** Finnhub → NewsAPI.org → generated templates */
export async function fetchStockNews(
  symbol: string,
  companyName?: string
): Promise<{ news: StockNewsItem[]; provider: StockNewsProvider; sentimentBreakdown: ReturnType<typeof analyzeSentimentFromNews> | null }> {
  const upper = symbol.toUpperCase();

  const finnhub = await finnhubFetchNews(upper);
  if (finnhub.length > 0) {
    return {
      news: finnhub.map(finnhubToItem),
      provider: "finnhub",
      sentimentBreakdown: analyzeSentimentFromNews(finnhub),
    };
  }

  const newsApi = await newsApiFetchForSymbol(upper, companyName);
  if (newsApi.length > 0) {
    return {
      news: newsApi.map(newsApiToItem),
      provider: "newsapi",
      sentimentBreakdown: null,
    };
  }

  return {
    news: generateFallback(upper),
    provider: "generated",
    sentimentBreakdown: null,
  };
}

export function newsProviderLabel(provider: StockNewsProvider): string {
  switch (provider) {
    case "finnhub":
      return "Finnhub Live";
    case "newsapi":
      return "NewsAPI.org Live";
    default:
      return "Generated";
  }
}

/** Headlines for AI analysis (title + sentiment only) */
export async function fetchStockNewsForAI(
  symbol: string,
  companyName?: string
): Promise<{ items: { title: string; sentiment: string }[]; provider: StockNewsProvider }> {
  const { news, provider } = await fetchStockNews(symbol, companyName);
  return {
    provider,
    items: news.slice(0, 8).map((n) => ({ title: n.title, sentiment: n.sentiment })),
  };
}
