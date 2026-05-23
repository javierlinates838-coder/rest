"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProSectionHeader } from "@/components/pro-section-header";
import { StockLogo } from "@/components/stock-logo";
import { TERMS } from "@/lib/brand";
import { formatCurrency, formatPercent, getSignalBg, getSignalColor } from "@/lib/utils";
import { fetchQuoteSummary } from "@/lib/fetch-json";
import {
  addCompareSymbol,
  clearCompareList,
  MAX_COMPARE_SYMBOLS,
  readCompareList,
  removeCompareSymbol,
} from "@/lib/compare-symbols";

type CompareRow = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  signal: string;
  confidence: number;
  riskGrade: string;
  rsi: number;
  loading?: boolean;
  error?: string;
};

export function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [loading, setLoading] = useState(true);

  const syncFromStorage = useCallback(() => {
    const fromUrl = (searchParams.get("symbols") || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const stored = readCompareList();
    const merged = Array.from(new Set([...fromUrl, ...stored])).slice(0, MAX_COMPARE_SYMBOLS);
    setSymbols(merged);
    return merged;
  }, [searchParams]);

  const loadRows = useCallback(async (list: string[]) => {
    if (list.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setRows(
      list.map((symbol) => ({
        symbol,
        name: symbol,
        price: 0,
        changePercent: 0,
        signal: "—",
        confidence: 0,
        riskGrade: "—",
        rsi: 50,
        loading: true,
      }))
    );

    const scored = await Promise.all(
      list.map(async (symbol): Promise<CompareRow> => {
        try {
          const data = await fetchQuoteSummary(symbol);
          return {
            symbol,
            name: data.quote?.name || symbol,
            price: data.quote?.price ?? 0,
            changePercent: data.quote?.changePercent ?? 0,
            signal: data.signal?.signal ?? "Hold",
            confidence: data.signal?.confidence ?? 0,
            riskGrade: data.riskGrade ?? "—",
            rsi: data.rsi ?? 50,
          };
        } catch {
          return {
            symbol,
            name: symbol,
            price: 0,
            changePercent: 0,
            signal: "—",
            confidence: 0,
            riskGrade: "—",
            rsi: 50,
            error: "Could not load",
          };
        }
      })
    );

    setRows(scored);
    setLoading(false);
  }, []);

  useEffect(() => {
    const merged = syncFromStorage();
    void loadRows(merged);
  }, [syncFromStorage, loadRows]);

  const addSymbol = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    const { list, added } = addCompareSymbol(sym);
    if (!added && !list.includes(sym)) return;
    setNewSymbol("");
    setSymbols(list);
    void loadRows(list);
  };

  const removeSymbol = (symbol: string) => {
    const list = removeCompareSymbol(symbol);
    setSymbols(list);
    void loadRows(list);
  };

  const clearAll = () => {
    clearCompareList();
    setSymbols([]);
    setRows([]);
  };

  const bestEdge = rows.reduce<CompareRow | null>((best, row) => {
    if (row.error || row.loading) return best;
    if (!best || row.confidence > best.confidence) return row;
    return best;
  }, null);

  return (
    <div className="page-shell page-shell-wide">
      <ProSectionHeader
        title={TERMS.twinLens}
        subtitle="Side-by-side conviction — pick the name with the stronger signal before you size a trade"
        badge="COMPARE"
        action={
          symbols.length > 0 ? (
            <button type="button" onClick={clearAll} className="command-status-cta pressable text-zinc-400">
              Clear all
            </button>
          ) : undefined
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addSymbol();
        }}
        className="flex flex-wrap gap-2 mb-6"
      >
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder={`Add up to ${MAX_COMPARE_SYMBOLS} symbols…`}
          className="flex-1 min-w-[140px] px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={symbols.length >= MAX_COMPARE_SYMBOLS}
          className="btn-primary pressable px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {bestEdge && bestEdge.confidence >= 40 && (
        <div className="glass-card rounded-xl px-4 py-3 mb-6 border border-teal-500/25 bg-teal-500/5 text-sm text-teal-100/90">
          Highest conviction in this lens:{" "}
          <button
            type="button"
            className="font-semibold text-white underline-offset-2 hover:underline"
            onClick={() => router.push(`/stock/${bestEdge.symbol}`)}
          >
            {bestEdge.symbol}
          </button>{" "}
          ({bestEdge.signal} · {bestEdge.confidence}%)
        </div>
      )}

      {symbols.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-zinc-500 text-sm space-y-4">
          <p>Add symbols from a stock page (compare button) or type tickers above.</p>
          <Link href="/screener" className="text-teal-400 hover:text-teal-300 text-[13px] font-medium">
            Open Alpha Forge for fresh long/short setups →
          </Link>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            rows.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : rows.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          }`}
        >
          {rows.map((row) => (
            <div
              key={row.symbol}
              className={`glass-card rounded-2xl p-5 relative ${row.loading ? "skeleton-shine" : "interactive-card pressable"}`}
              onClick={() => !row.loading && router.push(`/stock/${row.symbol}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/stock/${row.symbol}`)}
              role="button"
              tabIndex={0}
            >
              <button
                type="button"
                className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSymbol(row.symbol);
                }}
                aria-label={`Remove ${row.symbol}`}
              >
                ×
              </button>
              <div className="flex items-center gap-3 mb-4">
                <StockLogo symbol={row.symbol} size={40} />
                <div>
                  <h3 className="text-lg font-bold text-white">{row.symbol}</h3>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[120px]">{row.name}</p>
                </div>
              </div>
              {row.error ? (
                <p className="text-sm text-amber-300/90">{row.error}</p>
              ) : (
                <>
                  <p className="text-2xl font-semibold text-white tabular-nums">{formatCurrency(row.price)}</p>
                  <p
                    className={`text-sm font-medium tabular-nums mt-1 ${row.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {formatPercent(row.changePercent)}
                  </p>
                  <div className={`mt-4 px-3 py-2 rounded-lg border text-center ${getSignalBg(row.signal)}`}>
                    <span className={`text-sm font-bold ${getSignalColor(row.signal)}`}>{row.signal}</span>
                    <span className="text-xs text-zinc-400 ml-2">{row.confidence}%</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <dt className="text-zinc-600">Risk</dt>
                      <dd className="text-zinc-200 font-medium">{row.riskGrade}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-600">RSI</dt>
                      <dd className="text-zinc-200 font-medium tabular-nums">{row.rsi}</dd>
                    </div>
                  </dl>
                  <p className="text-[10px] text-teal-400/80 mt-4 font-medium">Open full {TERMS.pulseScan} →</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
