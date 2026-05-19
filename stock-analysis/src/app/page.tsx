"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/lib/utils";

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
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      setIndices(data.indices || []);
      setTrending(data.trending || []);
      setSectors(data.sectors || []);
      setGainers(data.topGainers || []);
      setLosers(data.topLosers || []);
      setDataSources(data.dataSources || {});
    } catch (e) {
      console.error("Failed to fetch market data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

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
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
      {/* Hero */}
      <div className="text-center mb-14 animate-fadeIn">
        <h1 className="text-[52px] font-semibold tracking-tight leading-[1.1] mb-5">
          <span className="gradient-text">AI-Powered</span> Stock Analysis
        </h1>
        <p className="text-[17px] text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-light tracking-tight">
          Deep research, technical indicators, competitor insights, and intelligent
          buy/sell recommendations — powered by live market data.
        </p>

        {/* Search */}
        <div ref={searchRef} className="max-w-2xl mx-auto relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search any stock symbol or company name..."
                className="w-full pl-14 pr-32 py-4 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all text-[15px] font-light tracking-tight"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white text-[13px] font-semibold tracking-wide hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg shadow-indigo-500/20"
              >
                Analyze
              </button>
            </div>
          </form>

          {/* Search Autocomplete */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full glass-card rounded-xl overflow-hidden z-50 border border-zinc-800/50 animate-fadeIn">
              {searchResults.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => {
                    setShowResults(false);
                    setSearchQuery(r.symbol);
                    router.push(`/stock/${r.symbol}`);
                  }}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <div>
                    <span className="text-[14px] font-semibold text-white">{r.symbol}</span>
                    <span className="text-[12px] text-zinc-500 ml-3">{r.name}</span>
                  </div>
                  <span className="text-[11px] text-zinc-600">{r.exchange}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Picks */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {quickPicks.map((symbol) => (
            <button
              key={symbol}
              onClick={() => router.push(`/stock/${symbol}`)}
              className="px-4 py-1.5 text-[12px] font-medium bg-zinc-900/40 border border-zinc-800/40 rounded-full text-zinc-500 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200"
            >
              {symbol}
            </button>
          ))}
        </div>

        {/* Data Sources */}
        {Object.keys(dataSources).length > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            {Object.entries(dataSources).map(([key, value]) => (
              <span key={key} className="data-source-tag">{value}</span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="h-3 bg-zinc-800 rounded w-12 mb-3" />
              <div className="h-5 bg-zinc-800 rounded w-20 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Market Indices */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10 animate-fadeIn">
            {indices.map((index) => (
              <div
                key={index.symbol}
                className="glass-card rounded-2xl p-5 cursor-pointer group"
                onClick={() => router.push(`/stock/${index.symbol}`)}
              >
                <div className="text-[11px] text-zinc-500 font-semibold tracking-wider uppercase mb-1">{index.symbol}</div>
                <div className="text-[18px] font-semibold text-white tracking-tight">{formatCurrency(index.price)}</div>
                <div className={`text-[13px] font-medium tracking-tight ${index.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(index.changePercent)}
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
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full">
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
                          <div className="text-[14px] font-semibold text-white tracking-tight">{stock.symbol}</div>
                          <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">{stock.name}</div>
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
                        <span className="text-[12px] font-semibold text-emerald-400">+{typeof g.changePercent === 'number' ? g.changePercent.toFixed(2) : g.changePercent}%</span>
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
                        <span className="text-[12px] font-semibold text-red-400">{typeof l.changePercent === 'number' ? l.changePercent.toFixed(2) : l.changePercent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="glass-card rounded-2xl p-6 glow-border">
                <h3 className="text-[15px] font-semibold text-white mb-4 tracking-tight">Live API Features</h3>
                <ul className="space-y-2.5">
                  {[
                    "Real-time quotes via FMP API",
                    "Google Gemini 2.0 Flash AI analysis",
                    "Finnhub live news & sentiment",
                    "15+ technical indicators",
                    "Competitor deep dive",
                    "Fibonacci & support/resistance",
                    "Price target projections",
                    "Analyst consensus ratings",
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
