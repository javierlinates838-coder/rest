"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { useParams } from "next/navigation";
import { ClientOnly } from "@/components/client-only";
import { useClientNow } from "@/lib/use-client-now";
import { useRouter } from "next/navigation";
import {
  Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { formatCurrency, formatLargeNumber, formatPercent, getSignalColor, getSignalBg } from "@/lib/utils";
import { ApiError, fetchJson, fetchJsonWithTimeout } from "@/lib/fetch-json";
import { aiEngineLabel, formatDataSourceLabel, userFacingFetchError } from "@/lib/display-labels";
import { ErrorBoundary } from "@/components/error-boundary";
import { normalizeAnalysisPayload } from "@/lib/normalize-analysis";
import { priceChangePercent } from "@/lib/analysis-coherence";
import { StockLogo } from "@/components/stock-logo";
import {
  AnimatedNumber, Sparkline, DayRangeSlider, MarketSession, VolumeGauge,
  TradingPlanCard, KeyEventsCard, InstitutionalCard, PriceActionCard,
  QuickActions, NewsFilters, SentimentTimeline, StickyMiniHeader,
} from "@/components/stock-detail";
import {
  IconTechnical, IconFundamental, IconSentiment, IconManipulation, IconVolatility,
  IconInsider, IconVolume, IconPumpDump, IconPriceGap, IconDivergence,
  IconVolatilitySpike, IconShield, IconAlert, IconBullish, IconBearish, IconNews, IconPattern,
} from "@/components/icons";

interface AnalysisData {
  quote: {
    symbol: string; name: string; price: number; change: number;
    changePercent: number; volume: number; avgVolume: number;
    marketCap: number; peRatio: number; eps: number; high52: number;
    low52: number; dayHigh: number; dayLow: number; open: number;
    previousClose: number; dividendYield: number; beta: number;
    sector: string; industry: string; exchange: string; description: string;
  };
  indicators: {
    sma20: number; sma50: number; sma200: number;
    ema12: number; ema26: number; rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    atr: number; stochastic: { k: number; d: number };
    adx: number; vwap: number;
    fibonacciLevels: { level: string; price: number }[];
    supportLevels: number[]; resistanceLevels: number[];
  };
  signal: { signal: string; confidence: number; reasons: string[] };
  competitors: {
    symbol: string; name: string; price: number; marketCap: number;
    peRatio: number; changePercent: number; revenue: number; sector: string;
  }[];
  aiAnalysis: {
    summary: string; recommendation: string; confidence: number;
    priceTarget: { low: number; mid: number; high: number };
    riskLevel: string; timeHorizon: string; timeHorizonRationale?: string; keyFactors: string[];
    technicalOutlook: string; fundamentalOutlook: string;
    competitorAnalysis: string; catalysts: string[]; risks: string[];
    sentimentScore: number;
  };
  analystRecommendations?: {
    buy: number; hold: number; sell: number;
    strongBuy: number; strongSell: number; period: string;
  }[];
  news: { title: string; sentiment: string }[];
  dataSources?: { quotes: string; chart?: string; news: string; ai: string; tradingPlan?: string; institutional?: string; keyEvents?: string };
  analyzedAt?: string;
  redFlags?: {
    id: string;
    severity: "critical" | "warning" | "info";
    category: string;
    title: string;
    description: string;
    detectedAt: string;
    dataPoints: string[];
  }[];
  riskScore?: {
    overall: number;
    technical: number;
    fundamental: number;
    sentiment: number;
    manipulation: number;
    volatility: number;
    grade: string;
    verdict: string;
  };
  tradingPlan?: {
    bias: string;
    entry: { primary: number; secondary: number; aggressive: number };
    targets: { conservative: number; base: number; ambitious: number };
    stopLoss: { tight: number; standard: number; wide: number };
    riskReward: { conservative: number; base: number; ambitious: number };
    positionSize: { percentOfPortfolio: number; sharesPer1k: number };
    timeframe: string;
    notes: string[];
    invalidationLevel: number;
    confidence: number;
  };
  keyEvents?: { date: string; type: string; title: string; importance: string; description: string; daysAway: number }[];
  institutional?: {
    totalInstitutionalPercent: number;
    insiderOwnershipPercent: number;
    retailPercent: number;
    topHolders: { name: string; sharesPercent: number; trend: string }[];
    recentActivity: { holder: string; action: string; sharesPercent: number; date: string }[];
    shortInterestPercent: number;
    daysToCover: number;
    floatPercent: number;
  };
  priceAction?: {
    intradayMomentum: number; volumeProfile: string;
    buyPressure: number; sellPressure: number;
    averageTrueRangePercent: number; trendStrength: string;
    marketStructure: string;
  };
  history?: HistoryPoint[];
}

interface HistoryPoint {
  date: string; open: number; high: number; low: number;
  close: number; volume: number;
}

function parseAnalysis(data: unknown): AnalysisData | null {
  return normalizeAnalysisPayload(data) as AnalysisData | null;
}

function shortDataSource(label: string): string {
  return formatDataSourceLabel(label);
}

export default function StockPage() {
  const params = useParams();
  const rawSymbol = params?.symbol;
  const symbol = (Array.isArray(rawSymbol) ? rawSymbol[0] : rawSymbol || "AAPL").toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const router = useRouter();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("1y");
  const [newsItems, setNewsItems] = useState<{ id: string; title: string; source: string; publishedAt: string; sentiment: string; summary: string; image?: string; url?: string }[]>([]);
  const [newsFilter, setNewsFilter] = useState("all");
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [livePrice, setLivePrice] = useState<{ price: number; change: number; changePercent: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [chartSource, setChartSource] = useState<"fmp" | "yahoo" | "simulated" | "unknown">("unknown");
  const [newsSource, setNewsSource] = useState<string | null>(null);
  const [chartRefreshError, setChartRefreshError] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const skipPeriodFetchRef = useRef(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const clientNow = useClientNow();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const chartSourceLabel =
    chartSource === "fmp"
      ? "Live · FMP"
      : chartSource === "yahoo"
        ? "Live · Yahoo Finance"
        : chartSource === "simulated"
          ? "Simulated prices"
          : null;

  // Full analysis load when symbol changes (not on chart period change)
  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      setLoadError(null);
      setData(null);
      setHistory([]);
      setNewsItems([]);
      setChartSource("unknown");
      setNewsSource(null);
      setLoading(true);
    });
    skipPeriodFetchRef.current = true;

    (async () => {
      try {
        const encoded = encodeURIComponent(symbol);

        const [analysisData, stockData, newsData] = await Promise.all([
          fetchJsonWithTimeout<AnalysisData>(`/api/analyze?symbol=${encoded}`, 55000),
          fetchJson<{ history?: HistoryPoint[]; historySource?: string }>(
            `/api/stock?symbol=${encoded}&period=${period}`
          ).catch(() => ({ history: [], historySource: "unknown" })),
          fetchJson<{ news?: typeof newsItems; source?: string }>(`/api/news?symbol=${encoded}`).catch(() => ({
            news: [],
            source: "unknown",
          })),
        ]);
        if (cancelled) return;

        const parsed = parseAnalysis(analysisData);
        if (!parsed) {
          throw new Error("We couldn't build a complete analysis for this symbol. Try again or pick another ticker.");
        }
        setData(parsed);

        const stockHistory = stockData.history?.length ? stockData.history : [];
        const analysisHistory =
          Array.isArray(analysisData.history) && analysisData.history.length > 0
            ? (analysisData.history as HistoryPoint[])
            : [];
        setHistory(stockHistory.length > 0 ? stockHistory : analysisHistory);

        const src = stockData.historySource || analysisData.dataSources?.chart;
        if (stockData.historySource === "fmp" || src === "FMP Live") setChartSource("fmp");
        else if (stockData.historySource === "yahoo" || src === "Yahoo Finance") setChartSource("yahoo");
        else if (stockData.historySource === "simulated" || src?.includes("Simulated")) setChartSource("simulated");
        else if (stockHistory.length > 0 || analysisHistory.length > 0) setChartSource("unknown");

        let resolvedNews = newsData;
        const companyName = parsed.quote?.name?.trim();
        if (companyName) {
          const withName = await fetchJson<{ news?: typeof newsItems; source?: string }>(
            `/api/news?symbol=${encoded}&name=${encodeURIComponent(companyName)}`
          ).catch(() => resolvedNews);
          if (
            withName.news?.length &&
            (withName.source !== "generated" ||
              resolvedNews.source === "generated" ||
              withName.news.length > (resolvedNews.news?.length ?? 0))
          ) {
            resolvedNews = withName;
          }
        }
        if (resolvedNews.news?.length) setNewsItems(resolvedNews.news);
        setNewsSource(resolvedNews.source || null);
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Failed to load stock data";
          setLoadError(message);
          setData(null);
          console.error("Failed to fetch:", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // period intentionally omitted — chart period has its own effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, refreshKey]);

  // Chart period change — only refetch price history (fast), not full AI analysis
  useEffect(() => {
    if (!symbol || loading || !data) return;
    if (skipPeriodFetchRef.current) {
      skipPeriodFetchRef.current = false;
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setChartRefreshError(null);

    (async () => {
      try {
        const stockData = await fetchJson<{ history?: HistoryPoint[]; historySource?: string }>(
          `/api/stock?symbol=${encodeURIComponent(symbol)}&period=${period}`
        );
        if (!cancelled && stockData.history?.length) {
          setHistory(stockData.history);
          if (stockData.historySource === "fmp") setChartSource("fmp");
          else if (stockData.historySource === "yahoo") setChartSource("yahoo");
          else if (stockData.historySource === "simulated") setChartSource("simulated");
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? userFacingFetchError(e.message) : "Chart update failed";
          setChartRefreshError(msg);
        }
        console.error("Failed to refresh chart:", e);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch on period change
  }, [period]);

  useEffect(() => {
    function onScroll() {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setShowStickyHeader(rect.bottom < 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const fresh = await fetchJson<{ quote?: { price: number; change: number; changePercent: number } }>(
          `/api/stock?symbol=${encodeURIComponent(symbol)}&period=1m`
        );
        if (!cancelled && fresh?.quote) {
          setLivePrice({
            price: fresh.quote.price,
            change: fresh.quote.change,
            changePercent: fresh.quote.changePercent,
          });
        }
      } catch { /* ignore */ }
    };
    const interval = setInterval(tick, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [data, symbol]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <div className="h-8 bg-zinc-800/60 rounded-lg w-48 mb-3 shimmer" />
              <div className="h-12 bg-zinc-800/60 rounded-lg w-64 shimmer" />
            </div>
            <div className="h-28 w-52 bg-zinc-800/60 rounded-2xl shimmer" />
          </div>
          <div className="flex gap-1 mb-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 w-24 bg-zinc-800/40 rounded-lg shimmer" style={{ animationDelay: `${i * 100}ms` }} />)}
          </div>
          <div className="h-[400px] bg-zinc-800/40 rounded-2xl shimmer" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => <div key={i} className="h-20 bg-zinc-800/30 rounded-xl shimmer" style={{ animationDelay: `${i * 50}ms` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="glass-card rounded-2xl p-10 max-w-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
            Could not load {symbol}
          </h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {loadError ||
              "The analysis service did not return valid data. This often happens when API keys are missing on Vercel or the request timed out."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 text-sm font-medium transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { quote, indicators, signal, competitors, aiAnalysis, dataSources, analystRecommendations, redFlags, riskScore, analyzedAt, tradingPlan, keyEvents, institutional, priceAction } = data;

  const chartData = history.map((h) => ({
    date: h.date,
    price: h.close,
    volume: h.volume,
    sma20: 0,
    sma50: 0,
  }));

  if (chartData.length > 20) {
    for (let i = 19; i < chartData.length; i++) {
      chartData[i].sma20 = chartData.slice(i - 19, i + 1).reduce((s, d) => s + d.price, 0) / 20;
    }
  }
  if (chartData.length > 50) {
    for (let i = 49; i < chartData.length; i++) {
      chartData[i].sma50 = chartData.slice(i - 49, i + 1).reduce((s, d) => s + d.price, 0) / 50;
    }
  }

  const redFlagCount = data?.redFlags?.filter((f) => f.severity === "critical").length || 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "technical", label: "Technical" },
    { id: "ai-analysis", label: "AI Analysis" },
    { id: "red-flags", label: `Red Flags${redFlagCount > 0 ? ` (${redFlagCount})` : ""}` },
    { id: "competitors", label: "Competitors" },
    { id: "news", label: "News" },
  ];

  const radarData = [
    { subject: "Momentum", value: Math.min(indicators.rsi, 100), fullMark: 100 },
    { subject: "Trend", value: Math.min(indicators.adx * 2, 100), fullMark: 100 },
    { subject: "Volume", value: quote.avgVolume > 0 ? Math.min((quote.volume / quote.avgVolume) * 50, 100) : 50, fullMark: 100 },
    { subject: "Volatility", value: quote.price > 0 ? Math.min((indicators.atr / quote.price) * 2000, 100) : 50, fullMark: 100 },
    { subject: "Value", value: quote.peRatio > 0 ? Math.min(100 - (quote.peRatio / 50) * 100, 100) : 50, fullMark: 100 },
    { subject: "Sentiment", value: Math.max(Math.min(aiAnalysis.sentimentScore + 50, 100), 0), fullMark: 100 },
  ];

  const displayPrice = livePrice?.price ?? quote.price;
  const displayChange = livePrice?.change ?? quote.change;
  const displayChangePercent = livePrice?.changePercent ?? quote.changePercent;
  const recentPrices = (data.history || history.slice(-30)).map((h) => h.close);

  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="glass-card rounded-2xl p-10 max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-white mb-3">This page could not load</h2>
            <p className="text-sm text-zinc-400 mb-6">{err.message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button type="button" onClick={reset} className="px-6 py-2.5 bg-indigo-600 rounded-lg text-white text-sm">
                Try again
              </button>
              <button type="button" onClick={() => router.push("/")} className="px-6 py-2.5 bg-zinc-800 rounded-lg text-zinc-200 text-sm">
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    >
    <div className="page-shell">
      {/* Sticky Mini Header */}
      <StickyMiniHeader
        symbol={quote.symbol}
        name={quote.name}
        price={displayPrice}
        change={displayChange}
        changePercent={displayChangePercent}
        visible={showStickyHeader}
      />

      {/* Quick Actions */}
      <QuickActions symbol={quote.symbol} onRefresh={() => setRefreshKey((k) => k + 1)} />

      {/* Header */}
      <div ref={heroRef} className="w-full min-w-0 space-y-5 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="relative z-10 flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <StockLogo symbol={quote.symbol} size={44} />
            <h1 className="text-2xl sm:text-[32px] font-semibold text-white tracking-tight">{quote.symbol}</h1>
            <span className="text-zinc-400 text-sm sm:text-[16px] hidden sm:inline font-light tracking-tight max-w-[140px] truncate">{quote.name}</span>
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-zinc-800/60 text-zinc-500 rounded-md tracking-wider uppercase">{quote.exchange}</span>
            <span className="px-2.5 py-0.5 text-[10px] font-medium bg-indigo-500/10 text-indigo-400 rounded-md tracking-wide">{quote.sector}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4  flex-wrap">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-[44px] font-semibold text-white tracking-tight tabular-nums">
                <AnimatedNumber value={displayPrice} format={formatCurrency} />
              </span>
              <Sparkline data={recentPrices} color="auto" width={100} height={32} />
            </div>
            <div className={`flex items-center gap-2 pb-2 ${displayChangePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              <svg className={`w-4 h-4 ${displayChangePercent >= 0 ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-[17px] font-medium tracking-tight tabular-nums">
                {displayChange >= 0 ? "+" : ""}{formatCurrency(displayChange)} ({formatPercent(displayChangePercent)})
              </span>
            </div>
            {livePrice && chartSource !== "simulated" && (
              <span className="live-badge text-zinc-400 pb-2.5">Live quote</span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3  mt-3 flex-wrap">
            {dataSources && Object.entries(dataSources).map(([k, v]) => (
              <span key={k} className="data-source-tag">{shortDataSource(v)}</span>
            ))}
            <MarketSession />
            {analyzedAt && (
              <span className="text-[10px] text-zinc-600 tracking-wide">
                Analyzed {new Date(analyzedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Day range + volume gauge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 w-full lg:max-w-2xl">
            {quote.dayHigh > 0 && quote.dayLow > 0 && (
              <DayRangeSlider low={quote.dayLow} high={quote.dayHigh} current={quote.price} label="Day Range" />
            )}
            {quote.high52 > 0 && quote.low52 > 0 && (
              <DayRangeSlider low={quote.low52} high={quote.high52} current={quote.price} label="52-Week Range" />
            )}
            {quote.avgVolume > 0 && (
              <VolumeGauge volume={quote.volume} avgVolume={quote.avgVolume} />
            )}
            {quote.previousClose > 0 && (
              <div>
                <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-1.5">Today vs Yesterday</div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 text-[11px]">
                  <span className="text-zinc-400">Open: <span className="text-white font-medium">{formatCurrency(quote.open)}</span></span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">Prev: <span className="text-white font-medium">{formatCurrency(quote.previousClose)}</span></span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">Gap: <span className={`font-medium ${quote.open >= quote.previousClose ? "text-emerald-400" : "text-red-400"}`}>
                    {((quote.open - quote.previousClose) / quote.previousClose * 100).toFixed(2)}%
                  </span></span>
                </div>
                <div className="mt-1.5 text-[10px] text-zinc-500">
                  Volume: <span className="text-white font-medium">{(quote.volume / 1e6).toFixed(2)}M</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signal + Risk Badges — stacked on mobile */}
        <div className="grid grid-cols-1 gap-3 w-full sm:grid-cols-2 lg:grid-cols-3">
          <div className={`signal-card-glow px-5 py-4 sm:px-7 sm:py-5 rounded-2xl border mobile-card-full ${getSignalBg(signal.signal)} text-center animate-scaleIn`}>
            <div className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mb-1.5">Signal</div>
            <div className={`text-[22px] sm:text-[26px] font-semibold tracking-tight ${getSignalColor(signal.signal)}`}>{signal.signal.toUpperCase()}</div>
            <div className="text-[12px] text-zinc-400 mt-1 font-light">Confidence: {signal.confidence}%</div>
            {aiAnalysis.recommendation !== signal.signal && (
              <div className="text-[10px] text-zinc-500 mt-1.5">AI view: {aiAnalysis.recommendation}</div>
            )}
            <div className="w-full bg-zinc-800/50 rounded-full h-1.5 mt-2.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${signal.signal.includes("Buy") ? "bg-emerald-500" : signal.signal.includes("Sell") ? "bg-red-500" : "bg-yellow-500"}`}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
          </div>

          {riskScore && (
            <div className={`px-5 py-4 sm:px-7 sm:py-5 rounded-2xl border text-center mobile-card-full animate-scaleIn stagger-2 ${
              riskScore.grade === "A" ? "bg-emerald-500/5 border-emerald-500/20" :
              riskScore.grade === "B" ? "bg-green-500/5 border-green-500/20" :
              riskScore.grade === "C" ? "bg-yellow-500/5 border-yellow-500/20" :
              riskScore.grade === "D" ? "bg-orange-500/5 border-orange-500/20" :
              "bg-red-500/5 border-red-500/20"
            }`}>
              <div className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mb-1.5">Risk grade</div>
              <div className={`text-[28px] sm:text-[32px] font-bold tracking-tight ${
                riskScore.grade === "A" ? "text-emerald-400" :
                riskScore.grade === "B" ? "text-green-400" :
                riskScore.grade === "C" ? "text-yellow-400" :
                riskScore.grade === "D" ? "text-orange-400" :
                "text-red-400"
              }`}>{riskScore.grade}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{riskScore.overall}/100 · higher = riskier</div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-4 mobile-card-full animate-scaleIn stagger-3 sm:col-span-2 lg:col-span-1">
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <div className="text-zinc-500 text-[9px] tracking-wider uppercase">Day range</div>
                <div className="text-white font-medium text-[11px]">
                  {quote.dayLow > 0 ? formatCurrency(quote.dayLow) : "—"} – {quote.dayHigh > 0 ? formatCurrency(quote.dayHigh) : "—"}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 text-[9px] tracking-wider uppercase">52W range</div>
                <div className="text-white font-medium text-[11px]">
                  {quote.low52 > 0 ? formatCurrency(quote.low52) : "—"} – {quote.high52 > 0 ? formatCurrency(quote.high52) : "—"}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 text-[9px] tracking-wider uppercase">Mkt Cap</div>
                <div className="text-white font-medium">{formatLargeNumber(quote.marketCap)}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[9px] tracking-wider uppercase">P/E</div>
                <div className="text-white font-medium">{quote.peRatio > 0 ? quote.peRatio.toFixed(1) : "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="scroll-tabs tab-segment mb-6 sm:mb-8 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`tab-pill px-3 sm:px-5 py-2.5 rounded-lg text-[12px] sm:text-[13px] whitespace-nowrap flex-shrink-0 font-medium tracking-tight ${
              activeTab === tab.id
                ? "tab-pill-active"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analyst Recommendations (if available) */}
      {activeTab === "overview" && (chartSource === "simulated" || newsSource === "generated") && (
        <div className="glass-card rounded-xl px-4 py-3 mb-6 border border-amber-500/20 bg-amber-500/5 text-[12px] text-amber-200/90 leading-relaxed">
          {chartSource === "simulated" && (
            <span>Price charts are simulated without a live market data key. </span>
          )}
          {newsSource === "generated" && (
            <span>News shown here is illustrative until live headline APIs are connected. </span>
          )}
          Trading plan, institutional holdings, and key events are model estimates — not SEC filings.
        </div>
      )}

      {activeTab === "overview" && analystRecommendations && analystRecommendations.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6 glow-border">
          <h3 className="text-[15px] font-semibold text-white mb-4 tracking-tight">Wall Street Analyst Consensus</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 text-center">
            {[
              { label: "Strong Buy", value: analystRecommendations[0]?.strongBuy ?? 0, color: "text-emerald-400 bg-emerald-500/10" },
              { label: "Buy", value: analystRecommendations[0]?.buy ?? 0, color: "text-green-400 bg-green-500/10" },
              { label: "Hold", value: analystRecommendations[0]?.hold ?? 0, color: "text-yellow-400 bg-yellow-500/10" },
              { label: "Sell", value: analystRecommendations[0]?.sell ?? 0, color: "text-orange-400 bg-orange-500/10" },
              { label: "Strong Sell", value: analystRecommendations[0]?.strongSell ?? 0, color: "text-red-400 bg-red-500/10" },
            ].map((rec) => (
              <div key={rec.label} className={`rounded-xl py-3 ${rec.color}`}>
                <div className="text-[22px] font-semibold tracking-tight">{rec.value}</div>
                <div className="text-[10px] font-medium tracking-wider uppercase mt-0.5 opacity-70">{rec.label}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-zinc-600 mt-3 text-right tracking-wide">Period: {analystRecommendations[0]?.period ?? "—"}</div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Trading Plan - the centerpiece */}
          {tradingPlan && <TradingPlanCard plan={tradingPlan} currentPrice={quote.price} />}

          {/* Price Action + Institutional Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {priceAction && <PriceActionCard data={priceAction} />}
            {institutional && <InstitutionalCard data={institutional} />}
          </div>

          {/* Key Events Calendar */}
          {keyEvents && keyEvents.length > 0 && <KeyEventsCard events={keyEvents} />}

          {/* Price Chart */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Price Chart
                  {historyLoading && (
                    <span className="ml-2 text-[10px] font-normal text-zinc-500">Updating…</span>
                  )}
                </h3>
                {chartSourceLabel && (
                  <p className={`text-[10px] mt-1 ${chartSource === "simulated" ? "text-amber-400/90" : "text-zinc-500"}`}>
                    {chartSourceLabel}
                  </p>
                )}
                {chartRefreshError && (
                  <p className="text-[10px] mt-1 text-amber-400/90">{chartRefreshError}</p>
                )}
              </div>
              <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg">
                {["1m", "3m", "6m", "1y", "2y", "5y"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      period === p ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {chartData.length < 2 ? (
              <p className="text-sm text-zinc-500 py-12 text-center">Chart data is loading or unavailable for this symbol.</p>
            ) : (
            <ClientOnly fallback={<div className="h-[280px] rounded-xl bg-zinc-800/40 animate-pulse" />}>
            <div className="w-full min-h-[280px]" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart key={`${quote.symbol}-${period}`} data={chartData}>
                <defs>
                  <linearGradient id={`priceGradient-${quote.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5)} />
                <YAxis stroke="#52525b" tick={{ fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value) => [formatCurrency(Number(value)), ""]}
                />
                <Area type="monotone" dataKey="price" stroke="#6366f1" fill={`url(#priceGradient-${quote.symbol})`} strokeWidth={2} name="Price" />
                {chartData.some((d) => d.sma20 > 0) && (
                  <Line type="monotone" dataKey="sma20" stroke="#22c55e" dot={false} strokeWidth={1} strokeDasharray="4 4" name="SMA 20" />
                )}
                {chartData.some((d) => d.sma50 > 0) && (
                  <Line type="monotone" dataKey="sma50" stroke="#f59e0b" dot={false} strokeWidth={1} strokeDasharray="4 4" name="SMA 50" />
                )}
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
            </div>
            </ClientOnly>
            )}
          </div>

          {/* Volume Chart */}
          {chartData.length >= 2 && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Volume</h3>
            <ClientOnly fallback={<div className="h-[150px] rounded-xl bg-zinc-800/40 animate-pulse" />}>
              <div className="w-full min-h-[150px]" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart key={`vol-${quote.symbol}-${period}`} data={chartData.slice(-60)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
                    <YAxis stroke="#52525b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(Number(v) / 1e6).toFixed(0)}M`} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
                    <Bar dataKey="volume" fill="#6366f1" opacity={0.6} name="Volume" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ClientOnly>
          </div>
          )}

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Market Cap", value: formatLargeNumber(quote.marketCap), tooltip: "Total market value of outstanding shares" },
              { label: "P/E Ratio", value: quote.peRatio > 0 ? quote.peRatio.toFixed(2) : "N/A", tooltip: "Price-to-Earnings ratio" },
              { label: "EPS", value: formatCurrency(quote.eps), tooltip: "Earnings Per Share (trailing 12 months)" },
              { label: "52W High", value: formatCurrency(quote.high52), tooltip: "Highest price in the last 52 weeks" },
              { label: "52W Low", value: formatCurrency(quote.low52), tooltip: "Lowest price in the last 52 weeks" },
              { label: "Avg Volume", value: quote.avgVolume > 0 ? `${(quote.avgVolume / 1e6).toFixed(1)}M` : "—", tooltip: "10-day average daily volume" },
              { label: "Beta", value: quote.beta > 0 ? quote.beta.toFixed(2) : "—", tooltip: "Volatility relative to the market (1.0 = market)" },
              { label: "Dividend Yield", value: quote.dividendYield > 0 ? `${quote.dividendYield.toFixed(2)}%` : "—", tooltip: "Annual dividend as % of price" },
              { label: "Day Range", value: `${formatCurrency(quote.dayLow)} – ${formatCurrency(quote.dayHigh)}`, tooltip: "Today's trading range" },
              { label: "Sector", value: quote.sector, tooltip: "Market sector classification" },
              { label: "Industry", value: quote.industry, tooltip: "Specific industry within sector" },
              { label: "Open", value: formatCurrency(quote.open), tooltip: "Today's opening price" },
            ].map((stat, i) => (
              <div key={stat.label} className={`glass-card rounded-xl p-4 animate-fadeInUp stagger-${Math.min(i + 1, 8)} premium-tooltip`} data-tooltip={stat.tooltip}>
                <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-1.5">{stat.label}</div>
                <div className="text-[13px] font-semibold text-white truncate tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Company Description */}
          {quote.description && (
            <div className="glass-card rounded-2xl p-4 sm:p-6 animate-fadeInUp">
              <h3 className="text-[14px] font-semibold text-white tracking-tight mb-2">About {quote.name}</h3>
              <p className="text-[12px] text-zinc-400 font-light leading-relaxed line-clamp-3">{quote.description}</p>
            </div>
          )}

          {/* Radar Chart */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Stock Health Radar</h3>
            <ClientOnly fallback={<div className="h-[280px] rounded-xl bg-zinc-800/40 animate-pulse" />}>
              <div className="w-full min-h-[280px]" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 10 }} />
                    <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </ClientOnly>
          </div>
        </div>
      )}

      {/* Technical Analysis Tab */}
      {activeTab === "technical" && (
        <div className="space-y-6">
          {/* Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <IndicatorCard
              title="RSI (14)"
              value={indicators.rsi.toFixed(1)}
              status={indicators.rsi < 30 ? "Oversold" : indicators.rsi > 70 ? "Overbought" : "Neutral"}
              statusColor={indicators.rsi < 30 ? "text-emerald-400" : indicators.rsi > 70 ? "text-red-400" : "text-yellow-400"}
              detail={`RSI at ${indicators.rsi.toFixed(1)} indicates ${indicators.rsi < 30 ? "oversold conditions - potential buying opportunity" : indicators.rsi > 70 ? "overbought conditions - consider taking profits" : "neutral momentum"}`}
              gauge={indicators.rsi}
            />
            <IndicatorCard
              title="MACD"
              value={indicators.macd.macd.toFixed(3)}
              status={indicators.macd.histogram > 0 ? "Bullish" : "Bearish"}
              statusColor={indicators.macd.histogram > 0 ? "text-emerald-400" : "text-red-400"}
              detail={`MACD: ${indicators.macd.macd.toFixed(3)} | Signal: ${indicators.macd.signal.toFixed(3)} | Histogram: ${indicators.macd.histogram.toFixed(3)}`}
            />
            <IndicatorCard
              title="Bollinger Bands"
              value={`$${indicators.bollingerBands.middle.toFixed(2)}`}
              status={quote.price > indicators.bollingerBands.upper ? "Above Upper" : quote.price < indicators.bollingerBands.lower ? "Below Lower" : "Within Bands"}
              statusColor={quote.price > indicators.bollingerBands.upper ? "text-red-400" : quote.price < indicators.bollingerBands.lower ? "text-emerald-400" : "text-yellow-400"}
              detail={`Upper: $${indicators.bollingerBands.upper.toFixed(2)} | Lower: $${indicators.bollingerBands.lower.toFixed(2)}`}
            />
            <IndicatorCard
              title="Stochastic"
              value={`K: ${indicators.stochastic.k.toFixed(1)}`}
              status={indicators.stochastic.k < 20 ? "Oversold" : indicators.stochastic.k > 80 ? "Overbought" : "Neutral"}
              statusColor={indicators.stochastic.k < 20 ? "text-emerald-400" : indicators.stochastic.k > 80 ? "text-red-400" : "text-yellow-400"}
              detail={`%K: ${indicators.stochastic.k.toFixed(1)} | %D: ${indicators.stochastic.d.toFixed(1)}`}
              gauge={indicators.stochastic.k}
            />
            <IndicatorCard
              title="ADX (Trend Strength)"
              value={indicators.adx.toFixed(1)}
              status={indicators.adx > 25 ? "Strong Trend" : "Weak Trend"}
              statusColor={indicators.adx > 25 ? "text-emerald-400" : "text-zinc-400"}
              detail={`ADX at ${indicators.adx.toFixed(1)} - ${indicators.adx > 50 ? "Very strong trend" : indicators.adx > 25 ? "Trend is developing" : "No clear trend direction"}`}
            />
            <IndicatorCard
              title="ATR (Volatility)"
              value={`$${indicators.atr.toFixed(2)}`}
              status={`${((indicators.atr / quote.price) * 100).toFixed(1)}% of price`}
              statusColor="text-zinc-400"
              detail={`Average True Range measures daily volatility. Current ATR of $${indicators.atr.toFixed(2)} suggests ${(indicators.atr / quote.price) > 0.02 ? "elevated" : "moderate"} volatility.`}
            />
          </div>

          {/* Moving Averages */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Moving Averages</h3>
            <div className="space-y-3">
              {[
                { label: "SMA 20", value: indicators.sma20, signal: quote.price > indicators.sma20 },
                { label: "SMA 50", value: indicators.sma50, signal: quote.price > indicators.sma50 },
                { label: "SMA 200", value: indicators.sma200, signal: quote.price > indicators.sma200 },
                { label: "EMA 12", value: indicators.ema12, signal: quote.price > indicators.ema12 },
                { label: "EMA 26", value: indicators.ema26, signal: quote.price > indicators.ema26 },
                { label: "VWAP", value: indicators.vwap, signal: quote.price > indicators.vwap },
              ].map((ma) => (
                <div key={ma.label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-sm text-zinc-400">{ma.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white">{formatCurrency(ma.value)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ma.signal ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {ma.signal ? "BULLISH" : "BEARISH"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fibonacci Levels */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Fibonacci Retracement Levels</h3>
            <div className="space-y-2">
              {indicators.fibonacciLevels.map((fib) => {
                const pctFromPrice = ((fib.price - quote.price) / quote.price) * 100;
                return (
                  <div key={fib.level} className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0">
                    <span className="text-sm text-indigo-400 font-medium w-16">{fib.level}</span>
                    <div className="flex-1 mx-4">
                      <div className="relative h-2 bg-zinc-800 rounded-full">
                        <div
                          className="absolute h-2 bg-indigo-500/30 rounded-full"
                          style={{ width: `${Math.min(Math.abs(pctFromPrice) * 5, 100)}%`, left: pctFromPrice < 0 ? "auto" : "0", right: pctFromPrice < 0 ? "0" : "auto" }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-white w-24 text-right">{formatCurrency(fib.price)}</span>
                    <span className={`text-xs ml-3 w-16 text-right ${pctFromPrice >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pctFromPrice >= 0 ? "+" : ""}{pctFromPrice.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support & Resistance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-4">Support Levels</h3>
              {indicators.supportLevels.length > 0 ? (
                <div className="space-y-3">
                  {indicators.supportLevels.map((level, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/30 last:border-0">
                      <span className="text-sm text-zinc-400">S{i + 1}</span>
                      <span className="text-sm font-medium text-white">{formatCurrency(level)}</span>
                      <span className="text-xs text-zinc-500">{priceChangePercent(level, quote.price)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No clear support levels identified</p>
              )}
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">Resistance Levels</h3>
              {indicators.resistanceLevels.length > 0 ? (
                <div className="space-y-3">
                  {indicators.resistanceLevels.map((level, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/30 last:border-0">
                      <span className="text-sm text-zinc-400">R{i + 1}</span>
                      <span className="text-sm font-medium text-white">{formatCurrency(level)}</span>
                      <span className="text-xs text-zinc-500">{priceChangePercent(level, quote.price)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No clear resistance levels identified</p>
              )}
            </div>
          </div>

          {/* Signal Reasons */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Signal Analysis Breakdown</h3>
            <div className="space-y-2">
              {signal.reasons.map((reason, i) => {
                const isBullish = reason.includes("bullish") || reason.includes("buy") || reason.includes("oversold") || reason.includes("above") || reason.includes("Golden");
                const isBearish = reason.includes("bearish") || reason.includes("sell") || reason.includes("overbought") || reason.includes("below") || reason.includes("Death");
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-800/30 last:border-0">
                    <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${isBullish ? "bg-emerald-500" : isBearish ? "bg-red-500" : "bg-yellow-500"}`} />
                    <span className="text-sm text-zinc-300">{reason}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === "ai-analysis" && (
        <div className="space-y-6">
          {/* AI Summary */}
          <div className="glass-card rounded-xl p-6 glow-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Deep Analysis</h3>
                <p className="text-xs text-zinc-500">{aiEngineLabel(dataSources)}</p>
              </div>
            </div>
            <p className="text-zinc-300 leading-relaxed">{aiAnalysis.summary}</p>
          </div>

          {/* Price Targets */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">Price Target Projections</h3>
            <p className="text-[11px] text-zinc-500 mb-4">
              Bear = downside · Base = expected path · Bull = upside vs current ${quote.price.toFixed(2)}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-6">
              <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="text-xs text-zinc-500 mb-1">Bear (low)</div>
                <div className="text-2xl font-bold text-red-400">{formatCurrency(aiAnalysis.priceTarget.low)}</div>
                <div className="text-xs text-zinc-500 mt-1">{priceChangePercent(aiAnalysis.priceTarget.low, quote.price)}</div>
              </div>
              <div className="text-center p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <div className="text-xs text-zinc-500 mb-1">Base</div>
                <div className="text-2xl font-bold text-indigo-400">{formatCurrency(aiAnalysis.priceTarget.mid)}</div>
                <div className="text-xs text-zinc-500 mt-1">{priceChangePercent(aiAnalysis.priceTarget.mid, quote.price)}</div>
              </div>
              <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="text-xs text-zinc-500 mb-1">Bull (high)</div>
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(aiAnalysis.priceTarget.high)}</div>
                <div className="text-xs text-zinc-500 mt-1">{priceChangePercent(aiAnalysis.priceTarget.high, quote.price)}</div>
              </div>
            </div>
            <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-red-500 via-indigo-500 to-emerald-500 opacity-30"
                style={{ left: "0%", width: "100%" }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-indigo-500"
                style={{
                  left: `${(() => {
                    const span = aiAnalysis.priceTarget.high - aiAnalysis.priceTarget.low;
                    if (span <= 0) return 50;
                    return Math.max(0, Math.min(100, ((quote.price - aiAnalysis.priceTarget.low) / span) * 100));
                  })()}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>{formatCurrency(aiAnalysis.priceTarget.low)}</span>
              <span className="text-indigo-400">Current: {formatCurrency(quote.price)}</span>
              <span>{formatCurrency(aiAnalysis.priceTarget.high)}</span>
            </div>
          </div>

          {/* Risk & Time Horizon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-2">AI RISK VIEW</div>
              <div className={`text-xl font-bold ${
                aiAnalysis.riskLevel === "Low" ? "text-emerald-400" :
                aiAnalysis.riskLevel === "Medium" ? "text-yellow-400" :
                aiAnalysis.riskLevel === "High" ? "text-orange-400" : "text-red-400"
              }`}>{aiAnalysis.riskLevel}</div>
              {riskScore && (
                <div className="text-[10px] text-zinc-600 mt-1">Matches grade {riskScore.grade} ({riskScore.overall}/100)</div>
              )}
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-2">TIME HORIZON</div>
              <div className="text-xl font-bold text-indigo-400">{aiAnalysis.timeHorizon}</div>
              {aiAnalysis.timeHorizonRationale && (
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">{aiAnalysis.timeHorizonRationale}</p>
              )}
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-2">SENTIMENT SCORE</div>
              <div className={`text-xl font-bold ${aiAnalysis.sentimentScore > 0 ? "text-emerald-400" : aiAnalysis.sentimentScore < 0 ? "text-red-400" : "text-yellow-400"}`}>
                {aiAnalysis.sentimentScore > 0 ? "+" : ""}{aiAnalysis.sentimentScore}
              </div>
            </div>
          </div>

          {/* Technical & Fundamental Outlook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">Technical Outlook</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{aiAnalysis.technicalOutlook}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">Fundamental Outlook</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{aiAnalysis.fundamentalOutlook}</p>
            </div>
          </div>

          {/* Catalysts & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-3">Catalysts (Upside)</h3>
              <ul className="space-y-2">
                {aiAnalysis.catalysts.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-3">Risk Factors (Downside)</h3>
              <ul className="space-y-2">
                {aiAnalysis.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Factors */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Key Decision Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiAnalysis.keyFactors.map((factor, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-lg">
                  <span className="text-indigo-400 font-bold text-sm">{i + 1}.</span>
                  <span className="text-sm text-zinc-300">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Red Flags Tab */}
      {activeTab === "red-flags" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Risk Score Overview */}
          {riskScore && (
            <div className="glass-card rounded-2xl p-7 glow-border animate-fadeInUp">
              <div className="flex items-center gap-4 mb-6">
                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center font-semibold tracking-tight border ${
                  riskScore.grade === "A" ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/25" :
                  riskScore.grade === "B" ? "bg-green-500/8 text-green-400 border-green-500/25" :
                  riskScore.grade === "C" ? "bg-amber-500/8 text-amber-400 border-amber-500/25" :
                  riskScore.grade === "D" ? "bg-orange-500/8 text-orange-400 border-orange-500/25" :
                  "bg-red-500/8 text-red-400 border-red-500/25"
                }`}>
                  <span className="text-[30px]">{riskScore.grade}</span>
                  <span className="absolute bottom-1.5 right-1.5 text-[8px] font-bold tracking-widest opacity-60">RISK</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-white tracking-tight">Risk Assessment</h3>
                  <p className="text-[12px] text-zinc-400 font-light tracking-tight">{riskScore.verdict}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[30px] font-semibold text-white tracking-tight tabular-nums">
                    {riskScore.overall}<span className="text-[14px] text-zinc-500 font-light">/100</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-semibold tracking-widest uppercase">Overall Score</div>
                </div>
              </div>

              {/* Risk Gauge */}
              <div className="risk-gauge mb-8">
                <div className="risk-gauge-needle" style={{ left: `${riskScore.overall}%` }} />
              </div>

              {/* Risk Breakdown */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
                {[
                  { label: "Technical", value: riskScore.technical, Icon: IconTechnical },
                  { label: "Fundamental", value: riskScore.fundamental, Icon: IconFundamental },
                  { label: "Sentiment", value: riskScore.sentiment, Icon: IconSentiment },
                  { label: "Manipulation", value: riskScore.manipulation, Icon: IconManipulation },
                  { label: "Volatility", value: riskScore.volatility, Icon: IconVolatility },
                ].map((item, i) => {
                  const colorClass =
                    item.value <= 30 ? "text-emerald-400" :
                    item.value <= 50 ? "text-yellow-400" :
                    item.value <= 70 ? "text-orange-400" :
                    "text-red-400";
                  const bgClass =
                    item.value <= 30 ? "bg-emerald-500" :
                    item.value <= 50 ? "bg-yellow-500" :
                    item.value <= 70 ? "bg-orange-500" :
                    "bg-red-500";
                  return (
                    <div key={item.label} className={`relative text-center p-4 rounded-xl bg-zinc-900/50 border border-white/[0.02] animate-fadeInUp stagger-${i + 1}`}>
                      <div className={`flex justify-center mb-1.5 ${colorClass} opacity-90`}>
                        <item.Icon size={18} />
                      </div>
                      <div className={`text-[20px] font-semibold tracking-tight ${colorClass}`}>{item.value}</div>
                      <div className="text-[9px] text-zinc-500 font-semibold tracking-widest uppercase mt-0.5">{item.label}</div>
                      <div className="w-full bg-zinc-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
                        <div
                          className={`h-1 rounded-full transition-all duration-[1200ms] ease-out ${bgClass}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Red Flags List */}
          {redFlags && redFlags.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-[16px] font-semibold text-white tracking-tight flex items-center gap-2.5">
                <span className="text-red-400"><IconAlert size={18} /></span>
                Detected Alerts <span className="text-zinc-500 font-light">({redFlags.length})</span>
              </h3>
              {redFlags.map((flag, i) => {
                const CategoryIcon =
                  flag.category === "insider" ? IconInsider :
                  flag.category === "volume" ? IconVolume :
                  flag.category === "price" ? IconPriceGap :
                  flag.category === "manipulation" ? IconManipulation :
                  flag.category === "fundamental" ? IconBearish :
                  flag.category === "pattern" ? IconPattern :
                  IconAlert;
                const sevColor =
                  flag.severity === "critical" ? "text-red-400" :
                  flag.severity === "warning" ? "text-amber-400" :
                  "text-blue-400";
                return (
                <div
                  key={flag.id}
                  className={`glass-card rounded-2xl p-5 animate-fadeInUp stagger-${Math.min(i + 1, 8)} ${
                    flag.severity === "critical" ? "border-red-500/20 hover:border-red-500/40" :
                    flag.severity === "warning" ? "border-yellow-500/15 hover:border-yellow-500/30" :
                    "border-blue-500/10 hover:border-blue-500/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                      flag.severity === "critical" ? "bg-red-500/10" :
                      flag.severity === "warning" ? "bg-amber-500/10" :
                      "bg-blue-500/10"
                    } ${sevColor}`}>
                      <CategoryIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${
                          flag.severity === "critical" ? "flag-critical" :
                          flag.severity === "warning" ? "flag-warning" :
                          "flag-info"
                        }`}>
                          {flag.severity}
                        </span>
                        <span className="text-[10px] text-zinc-600 tracking-wider uppercase">{flag.category}</span>
                      </div>
                      <h4 className="text-[14px] font-semibold text-white tracking-tight mb-1.5">{flag.title}</h4>
                      <p className="text-[12px] text-zinc-400 font-light leading-relaxed mb-3">{flag.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {flag.dataPoints.map((dp, j) => (
                          <span key={j} className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/30">
                            {dp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-14 text-center animate-fadeIn">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                  <div className="relative w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <IconShield size={32} />
                  </div>
                </div>
              </div>
              <h3 className="text-[17px] font-semibold text-white tracking-tight mb-2">No elevated risk flags</h3>
              <p className="text-[12px] text-zinc-500 font-light max-w-md mx-auto leading-relaxed">
                Technical and volume scanners did not flag critical patterns for {quote.symbol} right now. Re-run analysis after major news or earnings.
              </p>
            </div>
          )}

          {/* What We Monitor */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-semibold text-white tracking-tight">What Our Scanner Monitors</h3>
              <span className="text-[10px] text-zinc-600 tracking-wider uppercase">On-demand scan</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { Icon: IconInsider, label: "Insider Trading", desc: "SEC filing anomalies & unusual insider selling patterns", color: "text-rose-400 bg-rose-500/8" },
                { Icon: IconVolume, label: "Volume Spikes", desc: "Detects volume exceeding 2x+ rolling average", color: "text-amber-400 bg-amber-500/8" },
                { Icon: IconPumpDump, label: "Pump & Dump", desc: "Combined RSI + volume signatures of manipulation", color: "text-red-400 bg-red-500/8" },
                { Icon: IconPriceGap, label: "Price Gaps", desc: "After-hours moves and opening gap anomalies", color: "text-indigo-400 bg-indigo-500/8" },
                { Icon: IconDivergence, label: "Divergences", desc: "MACD/price bearish and bullish divergence", color: "text-purple-400 bg-purple-500/8" },
                { Icon: IconVolatilitySpike, label: "Volatility Spikes", desc: "Bollinger squeeze and ATR anomaly detection", color: "text-cyan-400 bg-cyan-500/8" },
              ].map((item, i) => (
                <div key={item.label} className={`group p-4 rounded-xl bg-zinc-900/40 border border-white/[0.02] hover:border-white/[0.06] transition-all duration-300 animate-fadeInUp stagger-${i + 1}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-110 ${item.color}`}>
                    <item.Icon size={18} />
                  </div>
                  <div className="text-[12px] font-semibold text-white tracking-tight mb-1">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 font-light leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === "competitors" && (
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Competitor Analysis</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{aiAnalysis.competitorAnalysis}</p>
          </div>

          {/* Competitor Comparison Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">COMPANY</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">PRICE</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">CHANGE</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">MKT CAP</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">P/E</th>
                  <th className="text-center text-xs text-zinc-500 font-medium px-4 py-3">ANALYZE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800/50 bg-indigo-500/5">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-indigo-400">{quote.symbol}</div>
                    <div className="text-xs text-zinc-500">{quote.name} (Current)</div>
                  </td>
                  <td className="text-right px-4 py-3 text-white font-medium">{formatCurrency(quote.price)}</td>
                  <td className="text-right px-4 py-3">
                    <span className={quote.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatPercent(quote.changePercent)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3 text-zinc-400">{formatLargeNumber(quote.marketCap)}</td>
                  <td className="text-right px-4 py-3 text-zinc-400">{quote.peRatio > 0 ? quote.peRatio.toFixed(1) : "—"}</td>
                  <td className="text-center px-4 py-3 text-xs text-zinc-500">Current</td>
                </tr>
                {competitors.map((comp) => (
                  <tr key={comp.symbol} className="border-b border-zinc-800/30 hover:bg-zinc-800/30 cursor-pointer" onClick={() => router.push(`/stock/${comp.symbol}`)}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{comp.symbol}</div>
                      <div className="text-xs text-zinc-500">{comp.name}</div>
                    </td>
                    <td className="text-right px-4 py-3 text-white font-medium">{formatCurrency(comp.price)}</td>
                    <td className="text-right px-4 py-3">
                      <span className={comp.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {formatPercent(comp.changePercent)}
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 text-zinc-400">{formatLargeNumber(comp.marketCap)}</td>
                    <td className="text-right px-4 py-3 text-zinc-400">{comp.peRatio > 0 ? comp.peRatio.toFixed(1) : "—"}</td>
                    <td className="text-center px-4 py-3">
                      <button className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Competitor Comparison Chart */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Market Cap Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{ symbol: quote.symbol, value: quote.marketCap, isCurrent: true }, ...competitors.map((c) => ({ symbol: c.symbol, value: c.marketCap, isCurrent: false }))]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="symbol" stroke="#52525b" />
                <YAxis stroke="#52525b" tickFormatter={(v) => `$${(v / 1e9).toFixed(0)}B`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                  formatter={(value) => [formatLargeNumber(Number(value)), "Market Cap"]}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* P/E Comparison */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">P/E Ratio Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{ symbol: quote.symbol, value: quote.peRatio }, ...competitors.map((c) => ({ symbol: c.symbol, value: c.peRatio }))]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="symbol" stroke="#52525b" />
                <YAxis stroke="#52525b" />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
                <ReferenceLine y={competitors.reduce((s, c) => s + c.peRatio, quote.peRatio) / (competitors.length + 1)} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Avg", fill: "#f59e0b", fontSize: 12 }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="P/E Ratio" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* News Tab */}
      {activeTab === "news" && (() => {
        const filteredNews = newsFilter === "all" ? newsItems : newsItems.filter((n) => n.sentiment === newsFilter);
        const counts = {
          all: newsItems.length,
          positive: newsItems.filter((n) => n.sentiment === "positive").length,
          negative: newsItems.filter((n) => n.sentiment === "negative").length,
          neutral: newsItems.filter((n) => n.sentiment === "neutral").length,
        };

        // Group by time
        const now = clientNow || 0;
        const groups: { label: string; items: typeof filteredNews }[] = [
          { label: "Last Hour", items: [] },
          { label: "Today", items: [] },
          { label: "This Week", items: [] },
          { label: "Earlier", items: [] },
        ];
        for (const item of filteredNews) {
          const ageMs = now - new Date(item.publishedAt).getTime();
          if (ageMs < 3600000) groups[0].items.push(item);
          else if (ageMs < 86400000) groups[1].items.push(item);
          else if (ageMs < 604800000) groups[2].items.push(item);
          else groups[3].items.push(item);
        }

        // Source diversity
        const sources = Array.from(new Set(newsItems.map((n) => n.source))).slice(0, 8);

        const positivePct = counts.all > 0 ? Math.round((counts.positive / counts.all) * 100) : 0;
        const negativePct = counts.all > 0 ? Math.round((counts.negative / counts.all) * 100) : 0;
        const neutralPct = 100 - positivePct - negativePct;

        return (
          <div className="space-y-5 animate-fadeIn">
            {newsSource === "generated" && (
              <div className="glass-card rounded-xl px-4 py-3 border border-amber-500/20 bg-amber-500/5 text-[12px] text-amber-200/90">
                Headlines are illustrative samples — connect live news providers for real articles.
              </div>
            )}
            {/* News Hero / Sentiment Summary */}
            <div className="glass-card rounded-2xl p-6 glow-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2">News Sentiment</div>
                  <div className="text-[36px] font-semibold text-white tracking-tight">
                    {newsItems.length}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-light">stories analyzed</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2">Bull / Bear Ratio</div>
                  <div className="flex h-3 rounded-full overflow-hidden mb-2">
                    <div className="bg-emerald-500/80 transition-all duration-1000" style={{ width: `${positivePct}%` }} />
                    <div className="bg-zinc-500/80 transition-all duration-1000" style={{ width: `${neutralPct}%` }} />
                    <div className="bg-red-500/80 transition-all duration-1000" style={{ width: `${negativePct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-emerald-400">{positivePct}% bullish</span>
                    <span className="text-zinc-500">{neutralPct}% neutral</span>
                    <span className="text-red-400">{negativePct}% bearish</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2">Source Diversity</div>
                  <div className="flex flex-wrap gap-1">
                    {sources.map((src) => (
                      <span key={src} className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800/60 text-zinc-400 rounded-md tracking-wide">{src}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sentiment Timeline */}
            <SentimentTimeline items={newsItems} />

            {/* Filters */}
            <div className="flex justify-between items-center flex-wrap gap-3">
              <NewsFilters activeFilter={newsFilter} onFilter={setNewsFilter} counts={counts} />
              <div className="text-[10px] text-zinc-500 tracking-wide">
                Showing {filteredNews.length} of {newsItems.length} articles
              </div>
            </div>

            {/* Grouped News */}
            {filteredNews.length === 0 ? (
              <div className="glass-card rounded-2xl p-14 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/15 blur-2xl rounded-full" />
                    <div className="relative w-16 h-16 rounded-2xl bg-indigo-500/8 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
                      <IconNews size={28} />
                    </div>
                  </div>
                </div>
                <h3 className="text-[16px] font-semibold text-white tracking-tight mb-2">No news found</h3>
                <p className="text-[12px] text-zinc-500 font-light max-w-md mx-auto leading-relaxed">
                  {newsItems.length === 0
                    ? `We couldn't find any recent news for ${quote.symbol}. Live news typically becomes available for liquid, large-cap stocks.`
                    : `No ${newsFilter} articles match. Try another filter.`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => group.items.length === 0 ? null : (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-[12px] font-semibold text-zinc-400 tracking-wider uppercase">{group.label}</h3>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="text-[10px] text-zinc-600">{group.items.length} {group.items.length === 1 ? "article" : "articles"}</span>
                    </div>
                    <div className="space-y-3">
                      {group.items.map((item, i) => {
                        const ageMs = (clientNow || 0) - new Date(item.publishedAt).getTime();
                        const ageStr = ageMs < 3600000 ? `${Math.floor(ageMs / 60000)}m ago` :
                                       ageMs < 86400000 ? `${Math.floor(ageMs / 3600000)}h ago` :
                                       ageMs < 604800000 ? `${Math.floor(ageMs / 86400000)}d ago` :
                                       new Date(item.publishedAt).toLocaleDateString();
                        const hasLink = Boolean(item.url && item.url !== "#");
                        const cardClass = `glass-card rounded-2xl p-5 transition-all block animate-fadeInUp stagger-${Math.min(i + 1, 8)} ${
                          hasLink ? "hover:glow-border cursor-pointer" : ""
                        } ${
                          item.sentiment === "positive" ? "hover:border-emerald-500/20" :
                          item.sentiment === "negative" ? "hover:border-red-500/20" :
                          ""
                        }`;
                        const inner = (
                            <div className="flex gap-4">
                              {item.image ? (
                                <img src={item.image} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0 bg-zinc-800" />
                              ) : (
                                <div className={`w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden ${
                                  item.sentiment === "positive" ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-400" :
                                  item.sentiment === "negative" ? "bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-400" :
                                  "bg-gradient-to-br from-zinc-800/60 to-zinc-800/30 text-zinc-500"
                                }`}>
                                  {item.sentiment === "positive" ? <IconBullish size={28} /> :
                                   item.sentiment === "negative" ? <IconBearish size={28} /> :
                                   <IconNews size={28} />}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2 gap-3 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                                      item.sentiment === "positive" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                                      item.sentiment === "negative" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                                      "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20"
                                    }`}>
                                      {item.sentiment === "positive" ? "↑ Bullish" : item.sentiment === "negative" ? "↓ Bearish" : "Neutral"}
                                    </span>
                                    <span className="text-[10px] text-zinc-600">{item.source}</span>
                                    {(item.source === "Illustrative" || newsSource === "generated") && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/90 border border-amber-500/20">Sample</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-zinc-600 font-medium tabular-nums">{ageStr}</span>
                                </div>
                                <h4 className="text-[14px] text-white font-semibold mb-2 tracking-tight leading-snug">{item.title}</h4>
                                <p className="text-[11px] text-zinc-500 leading-relaxed font-light line-clamp-2">{item.summary}</p>
                                {item.url && item.url !== "#" && (
                                  <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
                                    <span>Read full article</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                        );
                        return hasLink ? (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cardClass}
                          >
                            {inner}
                          </a>
                        ) : (
                          <div key={item.id} className={cardClass}>
                            {inner}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
    </ErrorBoundary>
  );
}

function IndicatorCard({
  title, value, status, statusColor, detail, gauge,
}: {
  title: string; value: string; status: string; statusColor: string;
  detail: string; gauge?: number;
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-medium text-zinc-400">{title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor} bg-zinc-800/50`}>{status}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-2">{value}</div>
      {gauge !== undefined && (
        <div className="w-full h-2 bg-zinc-800 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${
              gauge < 30 ? "bg-emerald-500" : gauge > 70 ? "bg-red-500" : "bg-yellow-500"
            }`}
            style={{ width: `${Math.min(gauge, 100)}%` }}
          />
        </div>
      )}
      <p className="text-xs text-zinc-500 leading-relaxed">{detail}</p>
    </div>
  );
}
