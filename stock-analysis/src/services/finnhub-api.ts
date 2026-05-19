function getKey(): string {
  return process.env.FINNHUB_API_KEY || "";
}

const FINNHUB_BASE = "https://finnhub.io/api/v1";

export interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

export interface FinnhubNews {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubRecommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

export interface FinnhubSentiment {
  buzz: { articlesInLastWeek: number; weeklyAverage: number; buzz: number };
  companyNewsScore: number;
  sectorAverageBullishPercent: number;
  sectorAverageNewsScore: number;
  sentiment: { bearishPercent: number; bullishPercent: number };
}

export async function finnhubFetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${key}`, { next: { revalidate: 15 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.c === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export async function finnhubFetchNews(symbol: string): Promise<FinnhubNews[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const res = await fetch(
      `${FINNHUB_BASE}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${key}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 15) : [];
  } catch {
    return [];
  }
}

export async function finnhubFetchRecommendations(symbol: string): Promise<FinnhubRecommendation[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/stock/recommendation?symbol=${symbol}&token=${key}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export async function finnhubFetchSentiment(symbol: string): Promise<FinnhubSentiment | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/news-sentiment?symbol=${symbol}&token=${key}`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function finnhubFetchPeers(symbol: string): Promise<string[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/stock/peers?symbol=${symbol}&token=${key}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((s: string) => s !== symbol).slice(0, 6) : [];
  } catch {
    return [];
  }
}

export async function finnhubFetchBasicFinancials(symbol: string): Promise<Record<string, number> | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${key}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.metric || null;
  } catch {
    return null;
  }
}

export function analyzeSentimentFromNews(news: FinnhubNews[]): { positive: number; negative: number; neutral: number } {
  const positiveKeywords = ["surge", "jump", "gain", "rally", "beat", "upgrade", "record", "growth", "strong", "profit", "rises", "soar", "bull", "outperform", "exceeds"];
  const negativeKeywords = ["fall", "drop", "decline", "loss", "miss", "downgrade", "cut", "weak", "crash", "slump", "bear", "risk", "warning", "plunge", "lawsuit"];

  let positive = 0, negative = 0, neutral = 0;

  for (const item of news) {
    const text = (item.headline + " " + item.summary).toLowerCase();
    const posHits = positiveKeywords.filter((kw) => text.includes(kw)).length;
    const negHits = negativeKeywords.filter((kw) => text.includes(kw)).length;

    if (posHits > negHits) positive++;
    else if (negHits > posHits) negative++;
    else neutral++;
  }

  return { positive, negative, neutral };
}
