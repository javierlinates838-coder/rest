"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      setIndices(data.indices || []);
      setTrending(data.trending || []);
      setSectors(data.sectors || []);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stock/${searchQuery.trim().toUpperCase()}`);
    }
  };

  const quickPicks = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "AMD"];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fadeIn">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">AI-Powered</span> Stock Analysis
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
          Deep research, technical analysis, competitor insights, and smart buy/sell
          recommendations — all powered by artificial intelligence.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any stock symbol (e.g., AAPL, TSLA, NVDA)..."
              className="w-full px-6 py-4 bg-zinc-900/80 border border-zinc-700/50 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Analyze
            </button>
          </div>
        </form>

        {/* Quick Picks */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {quickPicks.map((symbol) => (
            <button
              key={symbol}
              onClick={() => router.push(`/stock/${symbol}`)}
              className="px-4 py-1.5 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-16 mb-2" />
              <div className="h-6 bg-zinc-800 rounded w-24 mb-1" />
              <div className="h-4 bg-zinc-800 rounded w-20" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Market Indices */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-fadeIn">
            {indices.map((index) => (
              <div key={index.symbol} className="glass-card rounded-xl p-4 hover:glow-border transition-all cursor-pointer" onClick={() => router.push(`/stock/${index.symbol}`)}>
                <div className="text-xs text-zinc-500 font-medium mb-1">{index.symbol}</div>
                <div className="text-lg font-bold text-white">{formatCurrency(index.price)}</div>
                <div className={`text-sm font-medium ${index.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(index.changePercent)}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trending Stocks */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Trending Stocks
              </h2>
              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">SYMBOL</th>
                      <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">PRICE</th>
                      <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">CHANGE</th>
                      <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3 hidden sm:table-cell">VOLUME</th>
                      <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3 hidden md:table-cell">MKT CAP</th>
                      <th className="text-center text-xs text-zinc-500 font-medium px-4 py-3">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trending.map((stock, i) => (
                      <tr
                        key={stock.symbol}
                        className="border-b border-zinc-800/30 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                        style={{ animationDelay: `${i * 50}ms` }}
                        onClick={() => router.push(`/stock/${stock.symbol}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{stock.symbol}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-[150px]">{stock.name}</div>
                        </td>
                        <td className="text-right px-4 py-3 font-medium text-white">
                          {formatCurrency(stock.price)}
                        </td>
                        <td className="text-right px-4 py-3">
                          <span className={`font-medium ${stock.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </td>
                        <td className="text-right px-4 py-3 text-zinc-400 text-sm hidden sm:table-cell">
                          {(stock.volume / 1e6).toFixed(1)}M
                        </td>
                        <td className="text-right px-4 py-3 text-zinc-400 text-sm hidden md:table-cell">
                          {formatLargeNumber(stock.marketCap)}
                        </td>
                        <td className="text-center px-4 py-3">
                          <button className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">
                            Analyze
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sector Performance */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Sector Performance
              </h2>
              <div className="space-y-3">
                {sectors.map((sector) => (
                  <div key={sector.name} className="glass-card rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-300">{sector.name}</span>
                      <span className={`text-sm font-medium ${sector.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatPercent(sector.change)}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${sector.change >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(Math.abs(sector.change) * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Features Card */}
              <div className="glass-card rounded-xl p-6 mt-6 glow-border">
                <h3 className="font-bold text-white mb-3">AI Analysis Features</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    15+ Technical Indicators
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI-Powered Buy/Sell Signals
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Competitor Deep Dive
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    News Sentiment Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Fibonacci & Support/Resistance
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Price Target Projections
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
