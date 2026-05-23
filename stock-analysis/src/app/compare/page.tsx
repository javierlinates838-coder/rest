"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatPercent, getSignalColor } from "@/lib/utils";
import {
  readCompareList,
  toggleCompareSymbol,
  removeCompareSymbol,
  clearCompareList,
  MAX_COMPARE_SYMBOLS,
} from "@/lib/compare-symbols";
import { fetchQuoteSummary } from "@/lib/fetch-json";
import { computeSmartScore, smartScoreColor } from "@/lib/smart-score";
import { ProSectionHeader } from "@/components/pro-section-header";
import { SmartScoreGauge } from "@/components/smart-score-gauge";
import { TERMS } from "@/lib/brand";

interface CompareRow {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  signal: string;
  confidence: number;
  smartScore: number;
  smartLabel: string;
  error?: string;
}

export default function ComparePage() {
  const router = useRouter();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setSymbols(readCompareList());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshList = () => {
    setSymbols(readCompareList());
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (symbols.length === 0) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);
      const results = await Promise.all(
        symbols.map(async (sym): Promise<CompareRow> => {
          try {
            const data = await fetchQuoteSummary(sym);
            const signal = data.signal?.signal || "Hold";
            const confidence = data.signal?.confidence ?? 50;
            const smart = computeSmartScore({
              signal,
              confidence,
              riskGrade: data.riskGrade || "C",
              changePercent: data.quote.changePercent,
              rsi: data.rsi ?? 50,
            });
            return {
              symbol: sym,
              name: data.quote.name,
              price: data.quote.price,
              changePercent: data.quote.changePercent,
              signal,
              confidence,
              smartScore: smart.score,
              smartLabel: smart.label as string,
            };
          } catch {
            return {
              symbol: sym,
              name: sym,
              price: 0,
              changePercent: 0,
              signal: "—",
              confidence: 0,
              smartScore: 0,
              smartLabel: "—",
              error: "Failed to load",
            };
          }
        })
      );
      if (!cancelled) {
        setRows(results);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [symbols]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = addInput.trim().toUpperCase();
    if (!sym) return;
    const { added } = toggleCompareSymbol(sym);
    if (!added && !symbols.includes(sym)) {
      setAddError(`Maximum ${MAX_COMPARE_SYMBOLS} symbols — remove one first.`);
      return;
    }
    setAddError(null);
    setAddInput("");
    refreshList();
  };

  return (
    <div className="page-shell page-shell-wide">
      <ProSectionHeader
        title={TERMS.twinLens}
        subtitle={`Up to 4 symbols · side-by-side ${TERMS.smartScore} & signals`}
        badge="LENS"
      />

      {addError && (
        <p className="text-amber-300/90 text-sm mb-3">{addError}</p>
      )}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md ultra-card p-3">
        <input
          value={addInput}
          onChange={(e) => setAddInput(e.target.value.toUpperCase())}
          placeholder="e.g. NVDA"
          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700 text-white text-sm focus:border-teal-500/50 outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold"
        >
          Add
        </button>
        {symbols.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearCompareList();
              refreshList();
            }}
            className="px-3 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:text-white"
          >
            Clear
          </button>
        )}
      </form>

      {symbols.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-zinc-500 text-sm mb-4">No symbols in compare list yet.</p>
          <button
            type="button"
            onClick={() => router.push("/stock/AAPL")}
            className="text-teal-400 text-sm font-medium hover:text-teal-300"
          >
            Analyze a stock and tap Compare →
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {symbols.map((s) => (
            <div key={s} className="glass-card h-40 rounded-xl skeleton-shine" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rows.map((row) => (
            <div
              key={row.symbol}
              className="ultra-card rounded-2xl p-5 cursor-pointer relative"
              onClick={() => router.push(`/stock/${row.symbol}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/stock/${row.symbol}`)}
              role="button"
              tabIndex={0}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCompareSymbol(row.symbol);
                  refreshList();
                }}
                className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-300 text-lg leading-none"
                aria-label={`Remove ${row.symbol}`}
              >
                ×
              </button>
              <div className="text-xl font-bold text-white">{row.symbol}</div>
              <div className="text-[11px] text-zinc-500 truncate mb-3">{row.name}</div>
              {row.error ? (
                <p className="text-red-400/80 text-xs">{row.error}</p>
              ) : (
                <>
                  <div className="text-2xl font-semibold text-white tabular-nums">{formatCurrency(row.price)}</div>
                  <div className={`text-sm mt-1 ${row.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(row.changePercent)}
                  </div>
                  <div className="flex justify-center my-4">
                    <SmartScoreGauge score={row.smartScore} size="sm" />
                  </div>
                  <div className="pt-4 border-t border-zinc-800/80 space-y-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-mono text-[10px] uppercase">Label</span>
                      <span className={`font-semibold ${smartScoreColor(row.smartScore)}`}>{row.smartLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Signal</span>
                      <span className={getSignalColor(row.signal)}>{row.signal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Confidence</span>
                      <span className="text-zinc-300">{row.confidence}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Link href="/screener" className="inline-block mt-8 text-sm text-teal-400 hover:text-teal-300 font-medium">
        Find ideas in screener →
      </Link>
    </div>
  );
}
