"use client";

import Link from "next/link";
import { TERMS } from "@/lib/brand";

export function TradeSetupsStrip() {
  return (
    <section className="mb-8" aria-label="Trade setups">
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-teal-500/15 bg-gradient-to-br from-teal-500/[0.06] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400/90 mb-1">
              Actionable setups
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Find names worth trading today
            </h2>
            <p className="text-[12px] text-zinc-500 mt-1 max-w-xl leading-relaxed">
              {TERMS.alphaForge} ranks liquid tickers by long/short bias, conviction, and risk — then open any row for entry, stop, and target levels.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/screener?bias=bullish"
              className="btn-primary pressable px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            >
              Long setups
            </Link>
            <Link
              href="/screener?bias=bearish"
              className="pressable px-5 py-2.5 rounded-xl text-[13px] font-semibold border border-zinc-600 text-zinc-200 hover:border-red-500/40 hover:text-red-200"
            >
              Short setups
            </Link>
            <Link
              href="/compare"
              className="pressable px-5 py-2.5 rounded-xl text-[13px] font-medium border border-zinc-700 text-zinc-400 hover:text-teal-200 hover:border-teal-500/30"
            >
              {TERMS.twinLens}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
