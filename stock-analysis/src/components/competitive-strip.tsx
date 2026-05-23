"use client";

import Link from "next/link";

const COMPARISONS = [
  { us: "Smart Score + AI brief", them: "TipRanks analyst scores" },
  { us: "Free screener + risk grades", them: "Finviz screeners (paid filters)" },
  { us: "8 free deep dives / day", them: "Seeking Alpha paywall" },
  { us: "Compare 4 tickers", them: "TradingView multi-chart (Pro)" },
];

export function CompetitiveStrip() {
  return (
    <section className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="section-heading mb-0">
            Why StockPulse vs. the rest
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1 max-w-xl">
            One workspace for signals, screener, and AI research — without juggling five subscriptions.
          </p>
        </div>
        <Link
          href="/pricing"
          className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-sm font-semibold hover:bg-amber-500/25 transition-colors"
        >
          Upgrade to Pro — $12/mo
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPARISONS.map((row) => (
          <div
            key={row.us}
            className="glass-card rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
          >
            <div className="flex-1">
              <span className="text-[11px] text-teal-400 font-semibold uppercase tracking-wide">StockPulse</span>
              <p className="text-[13px] text-white font-medium mt-0.5">{row.us}</p>
            </div>
            <div className="hidden sm:block text-zinc-600">vs</div>
            <div className="flex-1 sm:text-right">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Typical alt</span>
              <p className="text-[12px] text-zinc-500 mt-0.5">{row.them}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        <Link href="/screener" className="text-sm text-teal-400 hover:text-teal-300 font-medium">
          Open screener →
        </Link>
        <Link href="/compare" className="text-sm text-teal-400 hover:text-teal-300 font-medium">
          Compare symbols →
        </Link>
      </div>
    </section>
  );
}
