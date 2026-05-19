"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { formatCurrency, formatLargeNumber, formatPercent, getSignalColor, getSignalBg } from "@/lib/utils";
import {
  AnimatedNumber, Sparkline, DayRangeSlider, MarketSession, VolumeGauge,
  TradingPlanCard, KeyEventsCard, InstitutionalCard, PriceActionCard,
  QuickActions, NewsFilters, SentimentTimeline, StickyMiniHeader,
} from "@/components/stock-detail";

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
    riskLevel: string; timeHorizon: string; keyFactors: string[];
    technicalOutlook: string; fundamentalOutlook: string;
    competitorAnalysis: string; catalysts: string[]; risks: string[];
    sentimentScore: number;
  };
  analystRecommendations?: {
    buy: number; hold: number; sell: number;
    strongBuy: number; strongSell: number; period: string;
  }[];
  news: { title: string; sentiment: string }[];
  dataSources?: { quotes: string; news: string; ai: string };
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

export default function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
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
  const heroRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analysisRes, stockRes, newsRes] = await Promise.all([
        fetch(`/api/analyze?symbol=${symbol}`),
        fetch(`/api/stock?symbol=${symbol}&period=${period}`),
        fetch(`/api/news?symbol=${symbol}`),
      ]);
      const analysisData = await analysisRes.json();
      const stockData = await stockRes.json();
      const newsData = await newsRes.json();
      setData(analysisData);
      setHistory(stockData.history || []);
      setNewsItems(newsData.news || []);
    } catch (e) {
      console.error("Failed to fetch:", e);
    } finally {
      setLoading(false);
    }
  }, [symbol, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
        const res = await fetch(`/api/stock?symbol=${symbol}&period=1m`);
        const fresh = await res.json();
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
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
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
        <h2 className="text-2xl font-bold text-white mb-4">Could not load data for {symbol}</h2>
        <button onClick={() => router.push("/")} className="px-6 py-2 bg-indigo-600 rounded-lg text-white">
          Back to Dashboard
        </button>
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
    { subject: "Volume", value: Math.min((quote.volume / quote.avgVolume) * 50, 100), fullMark: 100 },
    { subject: "Volatility", value: Math.min((indicators.atr / quote.price) * 2000, 100), fullMark: 100 },
    { subject: "Value", value: quote.peRatio > 0 ? Math.min(100 - (quote.peRatio / 50) * 100, 100) : 50, fullMark: 100 },
    { subject: "Sentiment", value: Math.max(Math.min(aiAnalysis.sentimentScore + 50, 100), 0), fullMark: 100 },
  ];

  const displayPrice = livePrice?.price ?? quote.price;
  const displayChange = livePrice?.change ?? quote.change;
  const displayChangePercent = livePrice?.changePercent ?? quote.changePercent;
  const recentPrices = (data.history || history.slice(-30)).map((h) => h.close);

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 animate-fadeIn">
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
      <QuickActions symbol={quote.symbol} />

      {/* Header */}
      <div ref={heroRef} className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[32px] font-semibold text-white tracking-tight">{quote.symbol}</h1>
            <span className="text-zinc-400 text-[16px] font-light tracking-tight">{quote.name}</span>
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-zinc-800/60 text-zinc-500 rounded-md tracking-wider uppercase">{quote.exchange}</span>
            <span className="px-2.5 py-0.5 text-[10px] font-medium bg-indigo-500/10 text-indigo-400 rounded-md tracking-wide">{quote.sector}</span>
          </div>

          <div className="flex items-end gap-4 ml-8 flex-wrap">
            <div className="flex items-baseline gap-3">
              <span className="text-[44px] font-semibold text-white tracking-tight tabular-nums">
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
            {livePrice && (
              <span className="live-badge text-zinc-400 pb-2.5">Live</span>
            )}
          </div>

          <div className="flex items-center gap-3 ml-8 mt-3 flex-wrap">
            {dataSources && Object.entries(dataSources).map(([k, v]) => (
              <span key={k} className="data-source-tag">{v}</span>
            ))}
            <MarketSession />
            {analyzedAt && (
              <span className="text-[10px] text-zinc-600 tracking-wide">
                Analyzed {new Date(analyzedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Day range + volume gauge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ml-8 mt-5 max-w-2xl">
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
                <div className="flex items-center gap-2 text-[11px]">
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

        {/* Signal + Risk Badges */}
        <div className="flex gap-3 items-stretch lg:flex-col lg:items-end">
          <div className="flex gap-3">
          <div className={`px-7 py-5 rounded-2xl border ${getSignalBg(signal.signal)} text-center min-w-[200px] animate-scaleIn`}>
            <div className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mb-1.5">AI Verdict</div>
            <div className={`text-[26px] font-semibold tracking-tight ${getSignalColor(signal.signal)}`}>{signal.signal.toUpperCase()}</div>
            <div className="text-[12px] text-zinc-400 mt-1 font-light">Confidence: {signal.confidence}%</div>
            <div className="w-full bg-zinc-800/50 rounded-full h-1.5 mt-2.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${signal.signal.includes("Buy") ? "bg-emerald-500" : signal.signal.includes("Sell") ? "bg-red-500" : "bg-yellow-500"}`}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
          </div>

          {riskScore && (
            <div className={`px-5 py-5 rounded-2xl border text-center min-w-[120px] animate-scaleIn stagger-2 ${
              riskScore.grade === "A" ? "bg-emerald-500/5 border-emerald-500/20" :
              riskScore.grade === "B" ? "bg-green-500/5 border-green-500/20" :
              riskScore.grade === "C" ? "bg-yellow-500/5 border-yellow-500/20" :
              riskScore.grade === "D" ? "bg-orange-500/5 border-orange-500/20" :
              "bg-red-500/5 border-red-500/20"
            }`}>
              <div className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mb-1.5">Risk</div>
              <div className={`text-[32px] font-bold tracking-tight ${
                riskScore.grade === "A" ? "text-emerald-400" :
                riskScore.grade === "B" ? "text-green-400" :
                riskScore.grade === "C" ? "text-yellow-400" :
                riskScore.grade === "D" ? "text-orange-400" :
                "text-red-400"
              }`}>{riskScore.grade}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{riskScore.overall}/100</div>
            </div>
          )}
          </div>

          {/* Mini quote summary card */}
          <div className="glass-card rounded-2xl p-4 min-w-[200px] animate-scaleIn stagger-3">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-zinc-500 text-[9px] tracking-wider uppercase">Bid</div>
                <div className="text-white font-medium">{formatCurrency(quote.price - 0.01)}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[9px] tracking-wider uppercase">Ask</div>
                <div className="text-white font-medium">{formatCurrency(quote.price + 0.01)}</div>
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
      <div className="flex gap-0.5 mb-8 bg-zinc-900/40 p-1 rounded-xl w-fit border border-white/[0.03]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-[13px] font-medium tracking-tight transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analyst Recommendations (if available) */}
      {activeTab === "overview" && analystRecommendations && analystRecommendations.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6 glow-border">
          <h3 className="text-[15px] font-semibold text-white mb-4 tracking-tight">Wall Street Analyst Consensus</h3>
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { label: "Strong Buy", value: analystRecommendations[0].strongBuy, color: "text-emerald-400 bg-emerald-500/10" },
              { label: "Buy", value: analystRecommendations[0].buy, color: "text-green-400 bg-green-500/10" },
              { label: "Hold", value: analystRecommendations[0].hold, color: "text-yellow-400 bg-yellow-500/10" },
              { label: "Sell", value: analystRecommendations[0].sell, color: "text-orange-400 bg-orange-500/10" },
              { label: "Strong Sell", value: analystRecommendations[0].strongSell, color: "text-red-400 bg-red-500/10" },
            ].map((rec) => (
              <div key={rec.label} className={`rounded-xl py-3 ${rec.color}`}>
                <div className="text-[22px] font-semibold tracking-tight">{rec.value}</div>
                <div className="text-[10px] font-medium tracking-wider uppercase mt-0.5 opacity-70">{rec.label}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-zinc-600 mt-3 text-right tracking-wide">Period: {analystRecommendations[0].period}</div>
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
              <h3 className="text-lg font-bold text-white">Price Chart</h3>
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
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#52525b" tick={{ fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value) => [formatCurrency(Number(value)), ""]}
                />
                <Area type="monotone" dataKey="price" stroke="#6366f1" fill="url(#priceGradient)" strokeWidth={2} name="Price" />
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

          {/* Volume Chart */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Volume</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData.slice(-60)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#52525b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
                <Bar dataKey="volume" fill="#6366f1" opacity={0.6} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
            <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
              <h3 className="text-[14px] font-semibold text-white tracking-tight mb-2">About {quote.name}</h3>
              <p className="text-[12px] text-zinc-400 font-light leading-relaxed line-clamp-3">{quote.description}</p>
            </div>
          )}

          {/* Radar Chart */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Stock Health Radar</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
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
                      <span className="text-xs text-zinc-500">{((level - quote.price) / quote.price * 100).toFixed(1)}%</span>
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
                      <span className="text-xs text-zinc-500">+{((level - quote.price) / quote.price * 100).toFixed(1)}%</span>
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
                <p className="text-xs text-zinc-500">Powered by advanced algorithms and market data</p>
              </div>
            </div>
            <p className="text-zinc-300 leading-relaxed">{aiAnalysis.summary}</p>
          </div>

          {/* Price Targets */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Price Target Projections</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="text-xs text-zinc-500 mb-1">Bear Case</div>
                <div className="text-2xl font-bold text-red-400">{formatCurrency(aiAnalysis.priceTarget.low)}</div>
                <div className="text-xs text-zinc-500 mt-1">{((aiAnalysis.priceTarget.low - quote.price) / quote.price * 100).toFixed(1)}%</div>
              </div>
              <div className="text-center p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <div className="text-xs text-zinc-500 mb-1">Base Case</div>
                <div className="text-2xl font-bold text-indigo-400">{formatCurrency(aiAnalysis.priceTarget.mid)}</div>
                <div className="text-xs text-zinc-500 mt-1">{((aiAnalysis.priceTarget.mid - quote.price) / quote.price * 100).toFixed(1)}%</div>
              </div>
              <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="text-xs text-zinc-500 mb-1">Bull Case</div>
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(aiAnalysis.priceTarget.high)}</div>
                <div className="text-xs text-zinc-500 mt-1">+{((aiAnalysis.priceTarget.high - quote.price) / quote.price * 100).toFixed(1)}%</div>
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
                  left: `${Math.max(0, Math.min(100, ((quote.price - aiAnalysis.priceTarget.low) / (aiAnalysis.priceTarget.high - aiAnalysis.priceTarget.low)) * 100))}%`,
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
              <div className="text-xs text-zinc-500 mb-2">RISK LEVEL</div>
              <div className={`text-xl font-bold ${
                aiAnalysis.riskLevel === "Low" ? "text-emerald-400" :
                aiAnalysis.riskLevel === "Medium" ? "text-yellow-400" :
                aiAnalysis.riskLevel === "High" ? "text-orange-400" : "text-red-400"
              }`}>{aiAnalysis.riskLevel}</div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-2">TIME HORIZON</div>
              <div className="text-xl font-bold text-indigo-400">{aiAnalysis.timeHorizon}</div>
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
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-[28px] font-bold ${
                  riskScore.grade === "A" ? "bg-emerald-500/15 text-emerald-400" :
                  riskScore.grade === "B" ? "bg-green-500/15 text-green-400" :
                  riskScore.grade === "C" ? "bg-yellow-500/15 text-yellow-400" :
                  riskScore.grade === "D" ? "bg-orange-500/15 text-orange-400" :
                  "bg-red-500/15 text-red-400"
                }`}>{riskScore.grade}</div>
                <div>
                  <h3 className="text-[18px] font-semibold text-white tracking-tight">Risk Assessment</h3>
                  <p className="text-[13px] text-zinc-400 font-light">{riskScore.verdict}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[28px] font-bold text-white tracking-tight">{riskScore.overall}<span className="text-[14px] text-zinc-500 font-light">/100</span></div>
                  <div className="text-[10px] text-zinc-500 tracking-wider uppercase">Overall Risk</div>
                </div>
              </div>

              {/* Risk Gauge */}
              <div className="risk-gauge mb-8">
                <div className="risk-gauge-needle" style={{ left: `${riskScore.overall}%` }} />
              </div>

              {/* Risk Breakdown */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Technical", value: riskScore.technical, icon: "📊" },
                  { label: "Fundamental", value: riskScore.fundamental, icon: "📈" },
                  { label: "Sentiment", value: riskScore.sentiment, icon: "🧠" },
                  { label: "Manipulation", value: riskScore.manipulation, icon: "🚨" },
                  { label: "Volatility", value: riskScore.volatility, icon: "⚡" },
                ].map((item, i) => (
                  <div key={item.label} className={`text-center p-3 rounded-xl bg-zinc-900/50 animate-fadeInUp stagger-${i + 1}`}>
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className={`text-[18px] font-bold tracking-tight ${
                      item.value <= 30 ? "text-emerald-400" :
                      item.value <= 50 ? "text-yellow-400" :
                      item.value <= 70 ? "text-orange-400" :
                      "text-red-400"
                    }`}>{item.value}</div>
                    <div className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase mt-0.5">{item.label}</div>
                    <div className="w-full bg-zinc-800 rounded-full h-1 mt-2">
                      <div
                        className={`h-1 rounded-full transition-all duration-1000 ${
                          item.value <= 30 ? "bg-emerald-500" :
                          item.value <= 50 ? "bg-yellow-500" :
                          item.value <= 70 ? "bg-orange-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags List */}
          {redFlags && redFlags.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-[16px] font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="text-red-400">⚠</span>
                Detected Alerts ({redFlags.length})
              </h3>
              {redFlags.map((flag, i) => (
                <div
                  key={flag.id}
                  className={`glass-card rounded-2xl p-5 animate-fadeInUp stagger-${Math.min(i + 1, 8)} ${
                    flag.severity === "critical" ? "border-red-500/20 hover:border-red-500/40" :
                    flag.severity === "warning" ? "border-yellow-500/15 hover:border-yellow-500/30" :
                    "border-blue-500/10 hover:border-blue-500/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[18px] ${
                      flag.severity === "critical" ? "bg-red-500/10" :
                      flag.severity === "warning" ? "bg-yellow-500/10" :
                      "bg-blue-500/10"
                    }`}>
                      {flag.category === "insider" ? "🕵️" :
                       flag.category === "volume" ? "📊" :
                       flag.category === "price" ? "💰" :
                       flag.category === "manipulation" ? "🚨" :
                       flag.category === "fundamental" ? "📉" :
                       flag.category === "pattern" ? "🔍" : "⚠️"}
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
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center animate-fadeIn">
              <div className="text-[40px] mb-3">✅</div>
              <h3 className="text-[16px] font-semibold text-white tracking-tight mb-2">No Red Flags Detected</h3>
              <p className="text-[13px] text-zinc-500 font-light max-w-md mx-auto">
                Our automated scanning system has not detected any unusual activity, manipulation patterns, or insider trading signals for this stock at this time.
              </p>
            </div>
          )}

          {/* What We Monitor */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-[14px] font-semibold text-white tracking-tight mb-4">What Our Scanner Monitors</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: "🕵️", label: "Insider Trading", desc: "SEC filing anomalies & insider sell patterns" },
                { icon: "📊", label: "Volume Spikes", desc: "Unusual volume that exceeds 2x+ average" },
                { icon: "🚨", label: "Pump & Dump", desc: "RSI + volume combos indicating manipulation" },
                { icon: "💰", label: "Price Gaps", desc: "After-hours moves and opening gaps" },
                { icon: "📉", label: "Divergences", desc: "MACD/price bearish and bullish divergences" },
                { icon: "⚡", label: "Volatility Spikes", desc: "Bollinger squeeze & ATR anomalies" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.02]">
                  <div className="text-lg mb-1.5">{item.icon}</div>
                  <div className="text-[12px] font-semibold text-white tracking-tight">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 font-light mt-0.5">{item.desc}</div>
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
                  <td className="text-right px-4 py-3 text-zinc-400">{quote.peRatio.toFixed(1)}</td>
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
                    <td className="text-right px-4 py-3 text-zinc-400">{comp.peRatio.toFixed(1)}</td>
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
        const now = Date.now();
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
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="text-[40px] mb-3">📰</div>
                <h3 className="text-[16px] font-semibold text-white tracking-tight mb-2">No news found</h3>
                <p className="text-[13px] text-zinc-500 font-light">
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
                        const ageMs = Date.now() - new Date(item.publishedAt).getTime();
                        const ageStr = ageMs < 3600000 ? `${Math.floor(ageMs / 60000)}m ago` :
                                       ageMs < 86400000 ? `${Math.floor(ageMs / 3600000)}h ago` :
                                       ageMs < 604800000 ? `${Math.floor(ageMs / 86400000)}d ago` :
                                       new Date(item.publishedAt).toLocaleDateString();
                        return (
                          <a
                            key={item.id}
                            href={item.url && item.url !== "#" ? item.url : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`glass-card rounded-2xl p-5 hover:glow-border transition-all block animate-fadeInUp stagger-${Math.min(i + 1, 8)} ${
                              item.sentiment === "positive" ? "hover:border-emerald-500/20" :
                              item.sentiment === "negative" ? "hover:border-red-500/20" :
                              ""
                            }`}
                          >
                            <div className="flex gap-4">
                              {item.image ? (
                                <img src={item.image} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0 bg-zinc-800" />
                              ) : (
                                <div className={`w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-[28px] ${
                                  item.sentiment === "positive" ? "bg-emerald-500/5" :
                                  item.sentiment === "negative" ? "bg-red-500/5" :
                                  "bg-zinc-800/40"
                                }`}>
                                  {item.sentiment === "positive" ? "📈" : item.sentiment === "negative" ? "📉" : "📰"}
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
                          </a>
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
