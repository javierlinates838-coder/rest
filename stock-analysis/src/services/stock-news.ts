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

export type StockNewsSource = "finnhub" | "newsapi" | "generated";

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

function dedupeKey(item: StockNewsItem): string {
  if (item.url && item.url !== "#") return item.url.toLowerCase();
  return item.title.toLowerCase().trim();
}

function mergeNewsItems(lists: StockNewsItem[][]): StockNewsItem[] {
  const seen = new Set<string>();
  const merged: StockNewsItem[] = [];

  for (const list of lists) {
    for (const item of list) {
      const key = dedupeKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
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

/** Stack Finnhub + NewsAPI.org in parallel; generated only when both are empty */
export async function fetchStockNews(
  symbol: string,
  companyName?: string
): Promise<{
  news: StockNewsItem[];
  sources: StockNewsSource[];
  source: string;
  sentimentBreakdown: ReturnType<typeof analyzeSentimentFromNews> | null;
}> {
  const upper = symbol.toUpperCase();

  const [finnhub, newsApi] = await Promise.all([
    finnhubFetchNews(upper),
    newsApiFetchForSymbol(upper, companyName),
  ]);

  const liveSources: StockNewsSource[] = [];
  const lists: StockNewsItem[][] = [];

  if (finnhub.length > 0) {
    liveSources.push("finnhub");
    lists.push(finnhub.map(finnhubToItem));
  }
  if (newsApi.length > 0) {
    liveSources.push("newsapi");
    lists.push(newsApi.map(newsApiToItem));
  }

  const merged = mergeNewsItems(lists);

  if (merged.length > 0) {
    return {
      news: merged,
      sources: liveSources,
      source: liveSources.join("+"),
      sentimentBreakdown: finnhub.length > 0 ? analyzeSentimentFromNews(finnhub) : null,
    };
  }

  return {
    news: generateFallback(upper),
    sources: ["generated"],
    source: "generated",
    sentimentBreakdown: null,
  };
}

export function sentimentBreakdownFromItems(
  news: StockNewsItem[]
): { positive: number; negative: number; neutral: number } {
  const breakdown = { positive: 0, negative: 0, neutral: 0 };
  for (const item of news) {
    if (item.sentiment === "positive") breakdown.positive++;
    else if (item.sentiment === "negative") breakdown.negative++;
    else breakdown.neutral++;
  }
  return breakdown;
}

export function newsProviderLabel(source: string, sources?: StockNewsSource[]): string {
  const list = sources?.length ? sources : source.split("+") as StockNewsSource[];
  const labels = list
    .map((s) => {
      switch (s) {
        case "finnhub":
          return "Finnhub";
        case "newsapi":
          return "NewsAPI.org";
        default:
          return null;
      }
    })
    .filter(Boolean);

  if (labels.length > 0) return `${labels.join(" + ")} Live`;
  return "Generated";
}

/** Headlines for AI — merged from every live provider */
export async function fetchStockNewsForAI(
  symbol: string,
  companyName?: string
): Promise<{
  items: { title: string; sentiment: string }[];
  source: string;
  sources: StockNewsSource[];
  sentimentBreakdown: ReturnType<typeof sentimentBreakdownFromItems> | null;
}> {
  const { news, source, sources, sentimentBreakdown } = await fetchStockNews(symbol, companyName);
  return {
    source,
    sources,
    sentimentBreakdown: sentimentBreakdown ?? (news.length > 0 ? sentimentBreakdownFromItems(news) : null),
    items: news.slice(0, 12).map((n) => ({ title: n.title, sentiment: n.sentiment })),
  };
}
