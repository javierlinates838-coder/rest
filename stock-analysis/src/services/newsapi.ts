/** NewsAPI.org — https://newsapi.org/docs/endpoints/everything */

const NEWS_API_BASE = "https://newsapi.org/v2";

export interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
  message?: string;
  code?: string;
}

function getKey(): string {
  return process.env.NEWS_API_KEY || "";
}

export async function newsApiFetchForSymbol(
  symbol: string,
  companyName?: string
): Promise<NewsApiArticle[]> {
  const key = getKey();
  if (!key) return [];

  const sym = symbol.toUpperCase();
  const name = companyName?.trim();
  const q = name
    ? `"${sym}" OR "${name}" stock`
    : `"${sym}" stock`;

  const from = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];

  try {
    const params = new URLSearchParams({
      q,
      language: "en",
      sortBy: "publishedAt",
      pageSize: "15",
      from,
      apiKey: key,
    });

    const res = await fetch(`${NEWS_API_BASE}/everything?${params}`, {
      next: { revalidate: 300 },
    });

    const data = (await res.json()) as NewsApiResponse;

    if (data.status !== "ok" || !Array.isArray(data.articles)) {
      if (data.message) console.warn("NewsAPI:", data.message);
      return [];
    }

    return data.articles.filter((a) => a.title && a.title !== "[Removed]");
  } catch (e) {
    console.warn("NewsAPI fetch failed:", e);
    return [];
  }
}
