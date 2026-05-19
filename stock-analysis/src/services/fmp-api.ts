import type { PriceData } from "@/lib/technical-analysis";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

function getKey(): string {
  return process.env.FMP_API_KEY || "";
}

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  sharesOutstanding: number;
}

export interface FMPProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  industry: string;
  sector: string;
  description: string;
  fullTimeEmployees: string;
  beta: number;
  lastDiv: number;
  range: string;
  mktCap: number;
}

export interface FMPFinancials {
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  eps: number;
  revenueGrowth: number;
  netIncomeGrowth: number;
  debtToEquity: number;
  currentRatio: number;
  returnOnEquity: number;
  freeCashFlow: number;
  profitMargin: number;
  operatingMargin: number;
}

export async function fmpFetchQuote(symbol: string): Promise<FMPQuote | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(`${FMP_BASE}/quote/${symbol}?apikey=${key}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export async function fmpFetchProfile(symbol: string): Promise<FMPProfile | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(`${FMP_BASE}/profile/${symbol}?apikey=${key}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export async function fmpFetchHistorical(symbol: string, period: string = "1y"): Promise<PriceData[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const daysMap: Record<string, number> = {
      "1m": 30, "3m": 90, "6m": 180, "1y": 365, "2y": 730, "5y": 1825,
    };
    const days = daysMap[period] || 365;
    const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const to = new Date().toISOString().split("T")[0];

    const res = await fetch(
      `${FMP_BASE}/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${key}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.historical) return [];

    return data.historical
      .reverse()
      .map((d: { date: string; open: number; high: number; low: number; close: number; volume: number }) => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));
  } catch {
    return [];
  }
}

export async function fmpFetchPeers(symbol: string): Promise<string[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const res = await fetch(`${FMP_BASE}/stock_peers?symbol=${symbol}&apikey=${key}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? (data[0].peersList || []).slice(0, 5) : [];
  } catch {
    return [];
  }
}

export async function fmpFetchFinancials(symbol: string): Promise<FMPFinancials | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const [incomeRes, ratiosRes, cashRes] = await Promise.all([
      fetch(`${FMP_BASE}/income-statement/${symbol}?limit=1&apikey=${key}`, { next: { revalidate: 3600 } }),
      fetch(`${FMP_BASE}/ratios/${symbol}?limit=1&apikey=${key}`, { next: { revalidate: 3600 } }),
      fetch(`${FMP_BASE}/cash-flow-statement/${symbol}?limit=1&apikey=${key}`, { next: { revalidate: 3600 } }),
    ]);

    const income = incomeRes.ok ? await incomeRes.json() : [];
    const ratios = ratiosRes.ok ? await ratiosRes.json() : [];
    const cash = cashRes.ok ? await cashRes.json() : [];

    const inc = Array.isArray(income) && income.length > 0 ? income[0] : null;
    const rat = Array.isArray(ratios) && ratios.length > 0 ? ratios[0] : null;
    const cf = Array.isArray(cash) && cash.length > 0 ? cash[0] : null;

    if (!inc) return null;

    return {
      revenue: inc.revenue || 0,
      netIncome: inc.netIncome || 0,
      grossProfit: inc.grossProfit || 0,
      operatingIncome: inc.operatingIncome || 0,
      eps: inc.eps || 0,
      revenueGrowth: rat?.revenueGrowth || 0,
      netIncomeGrowth: rat?.netIncomeGrowth || 0,
      debtToEquity: rat?.debtEquityRatio || 0,
      currentRatio: rat?.currentRatio || 0,
      returnOnEquity: rat?.returnOnEquity || 0,
      freeCashFlow: cf?.freeCashFlow || 0,
      profitMargin: rat?.netProfitMargin || 0,
      operatingMargin: rat?.operatingProfitMargin || 0,
    };
  } catch {
    return null;
  }
}

export async function fmpSearchStock(query: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const res = await fetch(`${FMP_BASE}/search?query=${encodeURIComponent(query)}&limit=8&apikey=${key}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((d: { symbol: string; name: string; exchangeShortName: string }) => ({
      symbol: d.symbol,
      name: d.name,
      exchange: d.exchangeShortName,
    }));
  } catch {
    return [];
  }
}

export async function fmpFetchGainers(): Promise<FMPQuote[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const res = await fetch(`${FMP_BASE}/stock_market/gainers?apikey=${key}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()).slice(0, 5);
  } catch {
    return [];
  }
}

export async function fmpFetchLosers(): Promise<FMPQuote[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const res = await fetch(`${FMP_BASE}/stock_market/losers?apikey=${key}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()).slice(0, 5);
  } catch {
    return [];
  }
}

export async function fmpFetchSectorPerformance(): Promise<{ sector: string; changesPercentage: string }[]> {
  const key = getKey();
  if (!key) return [];
  try {
    const res = await fetch(`${FMP_BASE}/sector-performance?apikey=${key}`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
