import type { PriceData } from "@/lib/technical-analysis";
import { fmpFetchQuote, fmpFetchProfile, fmpFetchHistorical, fmpFetchPeers, fmpFetchFinancials, type FMPFinancials } from "./fmp-api";
import { finnhubFetchQuote, finnhubFetchPeers } from "./finnhub-api";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  high52: number;
  low52: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  dividendYield: number;
  beta: number;
  sector: string;
  industry: string;
  exchange: string;
  description: string;
  financials?: FMPFinancials;
}

export interface CompetitorData {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  peRatio: number;
  changePercent: number;
  revenue: number;
  sector: string;
}

const POPULAR_STOCKS: Record<string, { name: string; sector: string; competitors: string[] }> = {
  AAPL: { name: "Apple Inc.", sector: "Technology", competitors: ["MSFT", "GOOGL", "SAMSUNG", "DELL"] },
  MSFT: { name: "Microsoft Corp.", sector: "Technology", competitors: ["AAPL", "GOOGL", "AMZN", "ORCL"] },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology", competitors: ["META", "MSFT", "AMZN", "AAPL"] },
  AMZN: { name: "Amazon.com Inc.", sector: "Consumer Cyclical", competitors: ["WMT", "SHOP", "BABA", "EBAY"] },
  TSLA: { name: "Tesla Inc.", sector: "Automotive", competitors: ["F", "GM", "RIVN", "NIO"] },
  META: { name: "Meta Platforms Inc.", sector: "Technology", competitors: ["GOOGL", "SNAP", "PINS", "TWTR"] },
  NVDA: { name: "NVIDIA Corp.", sector: "Technology", competitors: ["AMD", "INTC", "QCOM", "AVGO"] },
  JPM: { name: "JPMorgan Chase", sector: "Financial", competitors: ["BAC", "GS", "MS", "WFC"] },
  V: { name: "Visa Inc.", sector: "Financial", competitors: ["MA", "PYPL", "SQ", "AXP"] },
  JNJ: { name: "Johnson & Johnson", sector: "Healthcare", competitors: ["PFE", "UNH", "MRK", "ABBV"] },
  AMD: { name: "Advanced Micro Devices", sector: "Technology", competitors: ["NVDA", "INTC", "QCOM", "AVGO"] },
  NFLX: { name: "Netflix Inc.", sector: "Communication", competitors: ["DIS", "WBD", "PARA", "CMCSA"] },
  DIS: { name: "Walt Disney Co.", sector: "Communication", competitors: ["NFLX", "CMCSA", "WBD", "PARA"] },
  BA: { name: "Boeing Co.", sector: "Industrials", competitors: ["LMT", "RTX", "GD", "NOC"] },
  INTC: { name: "Intel Corp.", sector: "Technology", competitors: ["AMD", "NVDA", "QCOM", "TSM"] },
};

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const upperSymbol = symbol.toUpperCase();

  // Strategy 1: FMP API (primary — most complete data)
  const [fmpQuote, fmpProfile, fmpFinancials] = await Promise.all([
    fmpFetchQuote(upperSymbol),
    fmpFetchProfile(upperSymbol),
    fmpFetchFinancials(upperSymbol),
  ]);

  if (fmpQuote && fmpQuote.price > 0) {
    return {
      symbol: upperSymbol,
      name: fmpQuote.name || fmpProfile?.companyName || upperSymbol,
      price: fmpQuote.price,
      change: fmpQuote.change,
      changePercent: fmpQuote.changesPercentage,
      volume: fmpQuote.volume,
      avgVolume: fmpQuote.avgVolume,
      marketCap: fmpQuote.marketCap,
      peRatio: fmpQuote.pe || 0,
      eps: fmpQuote.eps || 0,
      high52: fmpQuote.yearHigh,
      low52: fmpQuote.yearLow,
      dayHigh: fmpQuote.dayHigh,
      dayLow: fmpQuote.dayLow,
      open: fmpQuote.open,
      previousClose: fmpQuote.previousClose,
      dividendYield: fmpProfile?.lastDiv ? (fmpProfile.lastDiv / fmpQuote.price) * 100 : 0,
      beta: fmpProfile?.beta || 0,
      sector: fmpProfile?.sector || POPULAR_STOCKS[upperSymbol]?.sector || "Unknown",
      industry: fmpProfile?.industry || "Unknown",
      exchange: fmpQuote.exchange || fmpProfile?.exchange || "NASDAQ",
      description: fmpProfile?.description || "",
      financials: fmpFinancials || undefined,
    };
  }

  // Strategy 2: Finnhub real-time quote + FMP profile
  const finnhubQuote = await finnhubFetchQuote(upperSymbol);
  if (finnhubQuote && finnhubQuote.c > 0) {
    return {
      symbol: upperSymbol,
      name: fmpProfile?.companyName || POPULAR_STOCKS[upperSymbol]?.name || upperSymbol,
      price: finnhubQuote.c,
      change: finnhubQuote.d,
      changePercent: finnhubQuote.dp,
      volume: 0,
      avgVolume: 0,
      marketCap: fmpProfile?.mktCap || 0,
      peRatio: 0,
      eps: 0,
      high52: 0,
      low52: 0,
      dayHigh: finnhubQuote.h,
      dayLow: finnhubQuote.l,
      open: finnhubQuote.o,
      previousClose: finnhubQuote.pc,
      dividendYield: 0,
      beta: fmpProfile?.beta || 0,
      sector: fmpProfile?.sector || POPULAR_STOCKS[upperSymbol]?.sector || "Unknown",
      industry: fmpProfile?.industry || "Unknown",
      exchange: fmpProfile?.exchange || "NASDAQ",
      description: fmpProfile?.description || "",
      financials: fmpFinancials || undefined,
    };
  }

  // Strategy 3: Yahoo Finance
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yahooFinance = (await import("yahoo-finance2")).default as any;
    const quote = await yahooFinance.quote(upperSymbol);
    const profile = await yahooFinance.quoteSummary(upperSymbol, { modules: ["assetProfile"] }).catch(() => null);

    return {
      symbol: upperSymbol,
      name: quote.longName || quote.shortName || upperSymbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      avgVolume: quote.averageDailyVolume10Day || 0,
      marketCap: quote.marketCap || 0,
      peRatio: quote.trailingPE || 0,
      eps: quote.epsTrailingTwelveMonths || 0,
      high52: quote.fiftyTwoWeekHigh || 0,
      low52: quote.fiftyTwoWeekLow || 0,
      dayHigh: quote.regularMarketDayHigh || 0,
      dayLow: quote.regularMarketDayLow || 0,
      open: quote.regularMarketOpen || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      dividendYield: quote.dividendYield || 0,
      beta: quote.beta || 0,
      sector: profile?.assetProfile?.sector || POPULAR_STOCKS[upperSymbol]?.sector || "Unknown",
      industry: profile?.assetProfile?.industry || "Unknown",
      exchange: quote.exchange || "NASDAQ",
      description: profile?.assetProfile?.longBusinessSummary || "",
    };
  } catch {
    // Strategy 4: mock fallback
    const info = POPULAR_STOCKS[upperSymbol];
    if (!info) throw new Error(`Could not fetch data for symbol: ${upperSymbol}`);
    return generateMockQuote(upperSymbol, info.name, info.sector);
  }
}

export async function fetchHistoricalData(symbol: string, period: string = "1y"): Promise<PriceData[]> {
  const upperSymbol = symbol.toUpperCase();

  // Strategy 1: FMP
  const fmpData = await fmpFetchHistorical(upperSymbol, period);
  if (fmpData.length > 0) return fmpData;

  // Strategy 2: Yahoo Finance
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yahooFinance = (await import("yahoo-finance2")).default as any;
    const periodMap: Record<string, { period1: string; interval: string }> = {
      "1m": { period1: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0], interval: "1d" },
      "3m": { period1: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0], interval: "1d" },
      "6m": { period1: new Date(Date.now() - 180 * 86400000).toISOString().split("T")[0], interval: "1d" },
      "1y": { period1: new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0], interval: "1d" },
      "2y": { period1: new Date(Date.now() - 730 * 86400000).toISOString().split("T")[0], interval: "1wk" },
      "5y": { period1: new Date(Date.now() - 1825 * 86400000).toISOString().split("T")[0], interval: "1wk" },
    };
    const config = periodMap[period] || periodMap["1y"];
    const result = await yahooFinance.chart(upperSymbol, { period1: config.period1, interval: config.interval });
    if (result?.quotes) {
      return result.quotes
        .filter((q: { close: number | null }) => q.close !== null)
        .map((q: { date: Date; open: number; high: number; low: number; close: number; volume: number }) => ({
          date: new Date(q.date).toISOString().split("T")[0],
          open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume,
        }));
    }
  } catch { /* fall through */ }

  return generateMockHistoricalData(upperSymbol, period);
}

export async function fetchCompetitors(symbol: string): Promise<CompetitorData[]> {
  const upperSymbol = symbol.toUpperCase();

  // Try FMP peers first, then Finnhub, then fallback
  let peerSymbols = await fmpFetchPeers(upperSymbol);
  if (peerSymbols.length === 0) {
    peerSymbols = await finnhubFetchPeers(upperSymbol);
  }
  if (peerSymbols.length === 0) {
    const info = POPULAR_STOCKS[upperSymbol];
    peerSymbols = info?.competitors || ["AAPL", "MSFT", "GOOGL", "AMZN"];
  }

  const competitors: CompetitorData[] = [];
  for (const sym of peerSymbols.slice(0, 5)) {
    try {
      const quote = await fetchStockQuote(sym);
      competitors.push({
        symbol: sym,
        name: quote.name,
        price: quote.price,
        marketCap: quote.marketCap,
        peRatio: quote.peRatio,
        changePercent: quote.changePercent,
        revenue: quote.financials?.revenue || quote.marketCap * 0.15,
        sector: quote.sector,
      });
    } catch {
      competitors.push(generateMockCompetitor(sym));
    }
  }
  return competitors;
}

function generateMockQuote(symbol: string, name: string, sector: string): StockQuote {
  const basePrice = hashStringToRange(symbol, 50, 500);
  const change = (Math.random() - 0.5) * 10;
  return {
    symbol, name, sector,
    price: basePrice, change,
    changePercent: (change / basePrice) * 100,
    volume: Math.floor(Math.random() * 50000000) + 1000000,
    avgVolume: Math.floor(Math.random() * 30000000) + 5000000,
    marketCap: basePrice * (Math.random() * 5e9 + 1e9),
    peRatio: Math.random() * 40 + 5,
    eps: basePrice / (Math.random() * 40 + 5),
    high52: basePrice * 1.3, low52: basePrice * 0.7,
    dayHigh: basePrice * 1.02, dayLow: basePrice * 0.98,
    open: basePrice * (1 + (Math.random() - 0.5) * 0.02),
    previousClose: basePrice - change,
    dividendYield: Math.random() * 3, beta: 0.5 + Math.random() * 1.5,
    industry: "Technology", exchange: "NASDAQ",
    description: `${name} is a leading company in the ${sector} sector.`,
  };
}

function generateMockCompetitor(symbol: string): CompetitorData {
  const basePrice = hashStringToRange(symbol, 50, 400);
  return {
    symbol, name: POPULAR_STOCKS[symbol]?.name || symbol,
    price: basePrice, marketCap: basePrice * 5e9,
    peRatio: Math.random() * 35 + 8,
    changePercent: (Math.random() - 0.5) * 6,
    revenue: basePrice * 5e9 * 0.15,
    sector: POPULAR_STOCKS[symbol]?.sector || "Technology",
  };
}

function generateMockHistoricalData(symbol: string, period: string): PriceData[] {
  const days = period === "1m" ? 30 : period === "3m" ? 90 : period === "6m" ? 180 : period === "2y" ? 104 : period === "5y" ? 260 : 252;
  const basePrice = hashStringToRange(symbol, 80, 300);
  const data: PriceData[] = [];
  let price = basePrice;
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const change = (Math.random() - 0.48) * (price * 0.03);
    price = Math.max(price + change, 10);
    data.push({
      date: date.toISOString().split("T")[0],
      open: price + (Math.random() - 0.5) * 2,
      high: price * (1 + Math.random() * 0.02),
      low: price * (1 - Math.random() * 0.02),
      close: price,
      volume: Math.floor(Math.random() * 50000000) + 5000000,
    });
  }
  return data;
}

function hashStringToRange(str: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return min + (Math.abs(hash) % (max - min));
}

export function getPopularStocks(): string[] {
  return Object.keys(POPULAR_STOCKS);
}

export function getStockInfo(symbol: string) {
  return POPULAR_STOCKS[symbol.toUpperCase()];
}
