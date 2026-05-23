import type { PriceData } from "@/lib/technical-analysis";

const FMP_BASE = "https://financialmodelingprep.com/stable";

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

interface FMPStableQuoteRaw {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  volume: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  open: number;
  previousClose: number;
}

interface FMPStableProfileRaw {
  symbol: string;
  price: number;
  marketCap: number;
  beta: number;
  lastDividend: number;
  range: string;
  change: number;
  changePercentage: number;
  volume: number;
  averageVolume: number;
  companyName: string;
  currency: string;
  exchangeFullName: string;
  exchange: string;
  industry: string;
  sector: string;
  website: string;
  description: string;
  ceo: string;
  country: string;
  fullTimeEmployees: string;
}

async function fmpFetch<T>(path: string, options?: { revalidate?: number }): Promise<T | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const separator = path.includes("?") ? "&" : "?";
    const url = `${FMP_BASE}${path}${separator}apikey=${key}`;
    const res = await fetch(url, { next: { revalidate: options?.revalidate ?? 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === "object" && "Error Message" in data) return null;
    return data as T;
  } catch {
    return null;
  }
}

export async function fmpFetchQuote(symbol: string): Promise<FMPQuote | null> {
  const [quoteData, profileData, ratiosData] = await Promise.all([
    fmpFetch<FMPStableQuoteRaw[]>(`/quote?symbol=${symbol}`, { revalidate: 30 }),
    fmpFetch<FMPStableProfileRaw[]>(`/profile?symbol=${symbol}`, { revalidate: 300 }),
    fmpFetch<Record<string, number>[]>(`/ratios-ttm?symbol=${symbol}`, { revalidate: 3600 }),
  ]);

  const q = Array.isArray(quoteData) && quoteData.length > 0 ? quoteData[0] : null;
  const p = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null;
  const r = Array.isArray(ratiosData) && ratiosData.length > 0 ? ratiosData[0] : null;

  if (!q && !p) return null;

  const price = q?.price || p?.price || 0;
  if (price <= 0) return null;

  const pe = r ? (r.priceToEarningsRatioTTM as number) || 0 : 0;
  const eps = pe > 0 && price > 0 ? price / pe : 0;

  // Parse 52W range from profile if /quote endpoint didn't return it (premium fallback)
  let yearHigh = q?.yearHigh ?? 0;
  let yearLow = q?.yearLow ?? 0;
  if ((yearHigh === 0 || yearLow === 0) && p?.range) {
    const match = p.range.match(/^([\d.]+)\s*-\s*([\d.]+)$/);
    if (match) {
      yearLow = parseFloat(match[1]) || yearLow;
      yearHigh = parseFloat(match[2]) || yearHigh;
    }
  }

  // Compute day high/low from price if missing
  const previousClose = q?.previousClose ?? 0;
  const open = q?.open ?? 0;
  const dayHigh = q?.dayHigh ?? (open && price ? Math.max(open, price) : 0);
  const dayLow = q?.dayLow ?? (open && price ? Math.min(open, price) : 0);

  return {
    symbol: q?.symbol || p?.symbol || symbol,
    name: q?.name || p?.companyName || symbol,
    price,
    changesPercentage: q?.changePercentage ?? p?.changePercentage ?? 0,
    change: q?.change ?? p?.change ?? 0,
    dayLow,
    dayHigh,
    yearHigh,
    yearLow,
    marketCap: q?.marketCap || p?.marketCap || 0,
    priceAvg50: q?.priceAvg50 ?? 0,
    priceAvg200: q?.priceAvg200 ?? 0,
    exchange: q?.exchange || p?.exchange || "",
    volume: q?.volume ?? p?.volume ?? 0,
    avgVolume: p?.averageVolume ?? 0,
    open,
    previousClose,
    eps,
    pe,
    sharesOutstanding: 0,
  };
}

export async function fmpFetchProfile(symbol: string): Promise<FMPProfile | null> {
  const data = await fmpFetch<FMPStableProfileRaw[]>(`/profile?symbol=${symbol}`, { revalidate: 300 });
  if (!Array.isArray(data) || data.length === 0) return null;
  const p = data[0];
  return {
    symbol: p.symbol,
    companyName: p.companyName,
    currency: p.currency,
    exchange: p.exchange,
    industry: p.industry,
    sector: p.sector,
    description: p.description,
    fullTimeEmployees: p.fullTimeEmployees,
    beta: p.beta,
    lastDiv: p.lastDividend,
    range: p.range,
    mktCap: p.marketCap,
  };
}

interface FMPHistoricalRaw {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  vwap: number;
}

export async function fmpFetchHistorical(symbol: string, period: string = "1y"): Promise<PriceData[]> {
  const daysMap: Record<string, number> = {
    "1m": 30, "3m": 90, "6m": 180, "1y": 365, "2y": 730, "5y": 1825,
  };
  const days = daysMap[period] || 365;
  const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const to = new Date().toISOString().split("T")[0];

  const data = await fmpFetch<FMPHistoricalRaw[]>(
    `/historical-price-eod/full?symbol=${symbol}&from=${from}&to=${to}`,
    { revalidate: 60 }
  );

  if (!Array.isArray(data)) return [];

  return data
    .slice()
    .reverse()
    .map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
}

interface FMPPeerRaw {
  symbol: string;
  companyName: string;
  price: number;
  mktCap: number;
}

export async function fmpFetchPeers(symbol: string): Promise<string[]> {
  const data = await fmpFetch<FMPPeerRaw[]>(`/stock-peers?symbol=${symbol}`, { revalidate: 3600 });
  if (!Array.isArray(data)) return [];
  return data.map((p) => p.symbol).filter((s) => s && s !== symbol).slice(0, 5);
}

export async function fmpFetchFinancials(symbol: string): Promise<FMPFinancials | null> {
  const [incomeData, ratiosData, cashData, keyMetricsData] = await Promise.all([
    fmpFetch<Record<string, number>[]>(`/income-statement?symbol=${symbol}&limit=2`, { revalidate: 3600 }),
    fmpFetch<Record<string, number>[]>(`/ratios-ttm?symbol=${symbol}`, { revalidate: 3600 }),
    fmpFetch<Record<string, number>[]>(`/cash-flow-statement?symbol=${symbol}&limit=1`, { revalidate: 3600 }),
    fmpFetch<Record<string, number>[]>(`/key-metrics-ttm?symbol=${symbol}`, { revalidate: 3600 }),
  ]);

  const incRows = Array.isArray(incomeData) ? incomeData : [];
  const inc = incRows.length > 0 ? incRows[0] : null;
  const incPrior = incRows.length > 1 ? incRows[1] : null;
  const rat = Array.isArray(ratiosData) && ratiosData.length > 0 ? ratiosData[0] : null;
  const cf = Array.isArray(cashData) && cashData.length > 0 ? cashData[0] : null;
  const km = Array.isArray(keyMetricsData) && keyMetricsData.length > 0 ? keyMetricsData[0] : null;

  if (!inc && !rat && !km) return null;

  const rev0 = (inc?.revenue as number) || 0;
  const rev1 = (incPrior?.revenue as number) || 0;
  let revenueGrowth = 0;
  if (rev1 > 0 && rev0 > 0) {
    revenueGrowth = (rev0 - rev1) / rev1;
  } else if (typeof km?.revenueGrowth === "number") {
    revenueGrowth = km.revenueGrowth as number;
  }

  return {
    revenue: rev0,
    netIncome: (inc?.netIncome as number) || 0,
    grossProfit: (inc?.grossProfit as number) || 0,
    operatingIncome: (inc?.operatingIncome as number) || 0,
    eps: (inc?.eps as number) || (inc?.epsDiluted as number) || 0,
    revenueGrowth,
    netIncomeGrowth: 0,
    debtToEquity: (rat?.debtToEquityRatioTTM as number) || 0,
    currentRatio: (rat?.currentRatioTTM as number) || 0,
    returnOnEquity: (rat?.returnOnEquityTTM as number) || (km?.returnOnEquityTTM as number) || 0,
    freeCashFlow: (cf?.freeCashFlow as number) || 0,
    profitMargin: (rat?.netProfitMarginTTM as number) || 0,
    operatingMargin: (rat?.operatingProfitMarginTTM as number) || 0,
  };
}

interface FMPSearchRaw {
  symbol: string;
  name: string;
  currency: string;
  exchangeFullName: string;
  exchange: string;
}

export async function fmpSearchStock(query: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
  const [byName, bySymbol] = await Promise.all([
    fmpFetch<FMPSearchRaw[]>(`/search-name?query=${encodeURIComponent(query)}&limit=5`),
    fmpFetch<FMPSearchRaw[]>(`/search-symbol?query=${encodeURIComponent(query)}&limit=5`),
  ]);
  const combined: FMPSearchRaw[] = [];
  if (Array.isArray(bySymbol)) combined.push(...bySymbol);
  if (Array.isArray(byName)) combined.push(...byName);

  const seen = new Set<string>();
  const usExchanges = new Set(["NASDAQ", "NYSE", "AMEX", "BATS"]);
  const results = combined
    .filter((d) => {
      if (seen.has(d.symbol)) return false;
      seen.add(d.symbol);
      return true;
    })
    .sort((a, b) => {
      // Prefer US-listed stocks
      const aUs = usExchanges.has(a.exchange) ? 0 : 1;
      const bUs = usExchanges.has(b.exchange) ? 0 : 1;
      return aUs - bUs;
    })
    .slice(0, 8)
    .map((d) => ({ symbol: d.symbol, name: d.name, exchange: d.exchange || "" }));
  return results;
}

interface FMPMoverRaw {
  symbol: string;
  price: number;
  name: string;
  change: number;
  changesPercentage: number;
  exchange: string;
}

export async function fmpFetchGainers(): Promise<FMPQuote[]> {
  const data = await fmpFetch<FMPMoverRaw[]>(`/biggest-gainers`, { revalidate: 60 });
  if (!Array.isArray(data)) return [];
  return data.slice(0, 5).map((d) => ({
    symbol: d.symbol,
    name: d.name,
    price: d.price,
    changesPercentage: d.changesPercentage,
    change: d.change,
    dayLow: 0, dayHigh: 0, yearHigh: 0, yearLow: 0,
    marketCap: 0, priceAvg50: 0, priceAvg200: 0,
    exchange: d.exchange,
    volume: 0, avgVolume: 0,
    open: 0, previousClose: 0,
    eps: 0, pe: 0, sharesOutstanding: 0,
  }));
}

export async function fmpFetchLosers(): Promise<FMPQuote[]> {
  const data = await fmpFetch<FMPMoverRaw[]>(`/biggest-losers`, { revalidate: 60 });
  if (!Array.isArray(data)) return [];
  return data.slice(0, 5).map((d) => ({
    symbol: d.symbol,
    name: d.name,
    price: d.price,
    changesPercentage: d.changesPercentage,
    change: d.change,
    dayLow: 0, dayHigh: 0, yearHigh: 0, yearLow: 0,
    marketCap: 0, priceAvg50: 0, priceAvg200: 0,
    exchange: d.exchange,
    volume: 0, avgVolume: 0,
    open: 0, previousClose: 0,
    eps: 0, pe: 0, sharesOutstanding: 0,
  }));
}

interface FMPSectorRaw {
  date: string;
  sector: string;
  exchange: string;
  averageChange: number;
}

export async function fmpFetchSectorPerformance(): Promise<{ sector: string; changesPercentage: string }[]> {
  const today = new Date().toISOString().split("T")[0];
  let data = await fmpFetch<FMPSectorRaw[]>(`/sector-performance-snapshot?date=${today}`, { revalidate: 300 });
  if (!Array.isArray(data) || data.length === 0) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    data = await fmpFetch<FMPSectorRaw[]>(`/sector-performance-snapshot?date=${yesterday}`, { revalidate: 300 });
  }
  if (!Array.isArray(data)) return [];

  // Aggregate across exchanges (average)
  const aggregated = new Map<string, { sum: number; count: number }>();
  for (const item of data) {
    if (!aggregated.has(item.sector)) {
      aggregated.set(item.sector, { sum: 0, count: 0 });
    }
    const entry = aggregated.get(item.sector)!;
    entry.sum += item.averageChange;
    entry.count += 1;
  }

  return Array.from(aggregated.entries()).map(([sector, { sum, count }]) => ({
    sector,
    changesPercentage: (sum / count).toFixed(2),
  }));
}
