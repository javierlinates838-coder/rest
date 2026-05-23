"use client";

import Link from "next/link";
import { ProSectionHeader } from "@/components/pro-section-header";
import { LIFETIME } from "@/lib/subscription";

const COMPARISONS = [
  { us: "Smart Score + institutional brief", them: "TipRanks analyst scores", win: "Unified AI + TA" },
  { us: "Live screener with risk grades", them: "Finviz (paid filters)", win: "Included" },
  { us: "8 free deep dives → Lifetime unlimited", them: "Seeking Alpha paywall", win: "Pay once" },
  { us: "4-symbol compare workspace", them: "TradingView multi-chart Pro", win: "Research-first" },
];

export function CompetitiveStrip() {
  return (
    <section className="mb-12">
      <ProSectionHeader
        title="Platform advantage"
        subtitle="One terminal replaces fragmented subscriptions"
        badge="vs market"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        action={
          <Link
            href="/pricing"
            className="command-status-cta pressable"
          >
            Lifetime ${LIFETIME.price}
          </Link>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPARISONS.map((row) => (
          <div key={row.us} className="vs-card">
            <div className="vs-card-us">{row.us}</div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-[11px] text-zinc-600">vs {row.them}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400/90 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                {row.win}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-5">
        <Link href="/screener" className="text-sm font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-zinc-600">01</span>
          Launch screener →
        </Link>
        <Link href="/compare" className="text-sm font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-zinc-600">02</span>
          Compare workspace →
        </Link>
      </div>
    </section>
  );
}
