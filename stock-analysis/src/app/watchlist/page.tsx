"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatPercent, getSignalColor, getSignalBg } from "@/lib/utils";
import { fetchQuoteSummary } from "@/lib/fetch-json";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  signal?: string;
  confidence?: number;
  addedAt: string;
}

const DEFAULT_WATCHLIST = ["AAPL", "TSLA", "NVDA", "GOOGL", "AMD", "MSFT"];

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");

  const loadWatchlist = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const stored = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("watchlist") || "null")
      : null;
    const symbols: string[] = stored || DEFAULT_WATCHLIST;

    const items = await Promise.all(
      symbols.map(async (sym): Promise<WatchlistItem> => {
        try {
          const data = await fetchQuoteSummary(sym);
          return {
            symbol: sym,
            name: data.quote?.name || sym,
            price: data.quote?.price || 0,
            changePercent: data.quote?.changePercent || 0,
            signal: data.signal?.signal,
            confidence: data.signal?.confidence,
            addedAt: new Date().toISOString(),
          };
        } catch {
          return {
            symbol: sym,
            name: sym,
            price: 0,
            changePercent: 0,
            addedAt: new Date().toISOString(),
          };
        }
      })
    );

    setWatchlist(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const stored = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("watchlist") || "null")
        : null;
      const symbols: string[] = stored || DEFAULT_WATCHLIST;

      const items = await Promise.all(
        symbols.map(async (sym): Promise<WatchlistItem> => {
          try {
            const data = await fetchQuoteSummary(sym);
            return {
              symbol: sym,
              name: data.quote?.name || sym,
              price: data.quote?.price || 0,
              changePercent: data.quote?.changePercent || 0,
              signal: data.signal?.signal,
              confidence: data.signal?.confidence,
              addedAt: new Date().toISOString(),
            };
          } catch {
            return {
              symbol: sym,
              name: sym,
              price: 0,
              changePercent: 0,
              addedAt: new Date().toISOString(),
            };
          }
        })
      );

      if (!cancelled) {
        setWatchlist(items);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToWatchlist = () => {
    if (!newSymbol.trim()) return;
    const sym = newSymbol.trim().toUpperCase();
    if (watchlist.some((w) => w.symbol === sym)) return;

    const stored = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("watchlist") || "null") || DEFAULT_WATCHLIST
      : DEFAULT_WATCHLIST;
    stored.push(sym);
    localStorage.setItem("watchlist", JSON.stringify(stored));
    setNewSymbol("");
    void loadWatchlist(true);
  };

  const removeFromWatchlist = (symbol: string) => {
    const stored = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("watchlist") || "null") || DEFAULT_WATCHLIST
      : DEFAULT_WATCHLIST;
    const updated = stored.filter((s: string) => s !== symbol);
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setWatchlist(watchlist.filter((w) => w.symbol !== symbol));
  };

  return (
    <div className="page-shell page-shell-wide">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[32px] font-semibold text-white tracking-tight">Watchlist</h1>
          <p className="text-zinc-400 mt-1 text-[14px] font-light tracking-tight">Track stocks and get AI-powered signals in real time</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); addToWatchlist(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add symbol..."
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 rounded-lg text-white font-medium hover:bg-teal-500 transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-6 skeleton-shine">
              <div className="h-6 bg-zinc-800 rounded w-20 mb-3" />
              <div className="h-8 bg-zinc-800 rounded w-32 mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((item, i) => (
            <div
              key={item.symbol}
              className={`glass-card interactive-card rounded-2xl p-6 group animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}
              onClick={() => router.push(`/stock/${item.symbol}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{item.symbol}</h3>
                  <p className="text-sm text-zinc-500 truncate max-w-[200px]">{item.name}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.symbol); }}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl font-bold text-white">{formatCurrency(item.price)}</span>
                <span className={`text-sm font-medium ${item.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(item.changePercent)}
                </span>
              </div>

              {item.signal && (
                <div className={`px-4 py-2 rounded-lg border text-center ${getSignalBg(item.signal)}`}>
                  <span className={`text-sm font-bold ${getSignalColor(item.signal)}`}>
                    {item.signal.toUpperCase()}
                  </span>
                  {item.confidence && (
                    <span className="text-xs text-zinc-400 ml-2">({item.confidence}%)</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
