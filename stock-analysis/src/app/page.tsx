"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/lib/utils";
import { PremiumSearch } from "@/components/premium-search";
import { MobileTrendingList } from "@/components/mobile-trending-list";
import { StockPicks } from "@/components/stock-picks";
import { StockLogo } from "@/components/stock-logo";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
}

interface SectorData {
  name: string;
  change: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [gainers, setGainers] = useState<MoverStock[]>([]);
  const [losers, setLosers] = useState<MoverStock[]>([]);
  const [dataSources, setDataSources] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarketData() {
      try {
        setMarketError(null);
        const res = await fetch("/api/market");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setMarketError(data.error || "Market data unavailable");
          return;
        }
        setIndices(data.indices || []);
        setTrending(data.trending || []);
        setSectors(data.sectors || []);
        setGainers(data.topGainers || []);
        setLosers(data.topLosers || []);
        setDataSources(data.dataSources || {});
      } catch (e) {
        if (!cancelled) setMarketError("Could not load market data. Check your connection and try again.");
        console.error("Failed to fetch market data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length >= 1) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowResults(true);
        } catch {
          setSearchResults([]);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      router.push(`/stock/${searchQuery.trim().toUpperCase()}`);
    }
  };

  const quickPicks = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "AMD"];

  return (
    <div className="page-shell">
      {/* Hero */}
      <div className="text-center mb-8 sm:mb-14 animate-fadeIn">
        <h1 className="mobile-hero-title sm:text-[44px] lg:text-[52px] font-semibold tracking-tight leading-[1.1] mb-3 sm:mb-5 px-1">
          <span className="gradient-text">AI-Powered</span> Stock Analysis
        </h1>
        <p className="hidden sm:block text-[17px] text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-light tracking-tight px-2">
          Deep research, technical indicators, competitor insights, and intelligent
          buy/sell recommendations — powered by live market data.
        </p>
        <p className="sm:hidden text-[14px] text-zinc-500 mb-5 leading-relaxed font-light px-1">
          Live quotes, AI analysis, and smart signals.
        </p>

        <div ref={searchRef} className="w-full max-w-2xl mx-auto">
          <PremiumSearch
            searchQuery={searchQuery}
            searchResults={searchResults}
            showResults={showResults}
            onQueryChange={handleSearchChange}
            onSubmit={handleSearch}
            onCloseResults={() => setShowResults(false)}
            onOpenResults={() => searchQuery.length > 0 && searchResults.length > 0 && setShowResults(true)}
            quickPicks={quickPicks}
          />
        </div>

        <div className="hidden sm:flex flex-wrap justify-center gap-2 mt-5">
          {quickPicks.map((symbol) => (
            <button
              key={symbol}
              onClick={() => router.push(`/stock/${symbol}`)}
              className="chip-press px-4 py-1.5 text-[12px] font-medium bg-zinc-900/40 border border-zinc-800/40 rounded-full text-zinc-500 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/10"
            >
              {symbol}
            </button>
          ))}
        </div>

        {Object.keys(dataSources).length > 0 && (
          <div className="hidden sm:flex justify-center flex-wrap gap-2 mt-6">
            {Object.entries(dataSources).map(([key, value]) => (
              <span key={key} className="data-source-tag">{value}</span>
            ))}
          </div>
        )}
      </div>

      {marketError && !loading && (
        <div className="glass-card rounded-xl px-4 py-3 mb-6 border border-amber-500/20 bg-amber-500/5 text-sm text-amber-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>{marketError}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetch("/api/market")
                .then((r) => r.json())
                .then((data) => {
                  if (data.error) setMarketError(data.error);
                  else {
                    setMarketError(null);
                    setIndices(data.indices || []);
                    setTrending(data.trending || []);
                    setSectors(data.sectors || []);
                    setGainers(data.topGainers || []);
                    setLosers(data.topLosers || []);
                    setDataSources(data.dataSources || {});
                  }
                })
                .catch(() => setMarketError("Could not load market data."))
                .finally(() => setLoading(false));
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 skeleton-shine">
              <div className="h-3 bg-zinc-800 rounded w-12 mb-3" />
              <div className="h-5 bg-zinc-800 rounded w-20 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <StockPicks />

          {/* Market Indices */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {indices.map((index, i) => (
              <div
                key={index.symbol}
                className={`glass-card interactive-card rounded-2xl p-5 group animate-fadeInUp stagger-${i + 1}`}
                onClick={() => router.push(`/stock/${index.symbol}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] text-zinc-500 font-semibold tracking-wider uppercase">{index.symbol}</div>
                  <div className={`w-1.5 h-1.5 rounded-full ${index.changePercent >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                </div>
                <div className="text-[18px] font-semibold text-white tracking-tight">{formatCurrency(index.price)}</div>
                <div className="flex items-center gap-1.5">
                  <svg className={`w-3 h-3 ${index.changePercent >= 0 ? "text-emerald-400" : "text-red-400 rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className={`text-[13px] font-medium tracking-tight ${index.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(index.changePercent)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trending Stocks */}
            <div className="lg:col-span-2">
              <h2 className="text-[20px] font-semibold text-white mb-5 tracking-tight flex items-center gap-2.5">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Trending Stocks
              </h2>
              <MobileTrendingList
                stocks={trending}
                onSelect={(symbol) => router.push(`/stock/${symbol}`)}
              />
              <div className="hidden lg:block glass-card rounded-2xl overflow-hidden table-scroll">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Symbol</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Price</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Change</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3 hidden sm:table-cell">Volume</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3 hidden md:table-cell">Mkt Cap</th>
                      <th className="text-center text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trending.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors duration-150"
                        onClick={() => router.push(`/stock/${stock.symbol}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <StockLogo symbol={stock.symbol} size={32} />
                            <div>
                              <div className="text-[14px] font-semibold text-white tracking-tight">{stock.symbol}</div>
                              <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">{stock.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right px-5 py-3.5 text-[14px] font-medium text-white tracking-tight">{formatCurrency(stock.price)}</td>
                        <td className="text-right px-5 py-3.5">
                          <span className={`text-[13px] font-medium tracking-tight ${stock.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </td>
                        <td className="text-right px-5 py-3.5 text-[13px] text-zinc-500 hidden sm:table-cell">{stock.volume ? `${(stock.volume / 1e6).toFixed(1)}M` : "—"}</td>
                        <td className="text-right px-5 py-3.5 text-[13px] text-zinc-500 hidden md:table-cell">{stock.marketCap ? formatLargeNumber(stock.marketCap) : "—"}</td>
                        <td className="text-center px-5 py-3.5">
                          <span className="px-3 py-1 text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                            Analyze
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Sector Performance */}
              <div>
                <h2 className="text-[20px] font-semibold text-white mb-5 tracking-tight flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Sectors
                </h2>
                <div className="space-y-2.5">
                  {sectors.map((sector) => (
                    <div key={sector.name} className="glass-card rounded-xl px-4 py-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[13px] text-zinc-300 font-medium tracking-tight">{sector.name}</span>
                        <span className={`text-[13px] font-semibold tracking-tight ${sector.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatPercent(sector.change)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800/50 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${sector.change >= 0 ? "bg-emerald-500/70" : "bg-red-500/70"}`}
                          style={{ width: `${Math.min(Math.abs(sector.change) * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Gainers */}
              {gainers.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-emerald-400 mb-3 tracking-tight">Top Gainers</h3>
                  <div className="space-y-1.5">
                    {gainers.slice(0, 4).map((g) => (
                      <div key={g.symbol} className="glass-card rounded-xl px-4 py-2.5 flex justify-between items-center cursor-pointer" onClick={() => router.push(`/stock/${g.symbol}`)}>
                        <span className="text-[13px] font-semibold text-white">{g.symbol}</span>
                        <span className="text-[12px] font-semibold text-emerald-400">{formatPercent(g.changePercent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Losers */}
              {losers.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-red-400 mb-3 tracking-tight">Top Losers</h3>
                  <div className="space-y-1.5">
                    {losers.slice(0, 4).map((l) => (
                      <div key={l.symbol} className="glass-card rounded-xl px-4 py-2.5 flex justify-between items-center cursor-pointer" onClick={() => router.push(`/stock/${l.symbol}`)}>
                        <span className="text-[13px] font-semibold text-white">{l.symbol}</span>
                        <span className="text-[12px] font-semibold text-red-400">{formatPercent(l.changePercent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="glass-card rounded-2xl p-6 glow-border">
                <h3 className="text-[15px] font-semibold text-white mb-4 tracking-tight">Platform highlights</h3>
                <ul className="space-y-2.5">
                  {[
                    "Live quotes & historical charts",
                    "AI deep dive with price targets",
                    "Stacked news from multiple providers",
                    "15+ technical indicators",
                    "Peer comparison tables",
                    "Fibonacci & support/resistance",
                    "Risk scanner & trading plan",
                    "Analyst consensus when available",
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-[12px] text-zinc-400 font-light tracking-tight">
                      <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
