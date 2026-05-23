"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { computeSmartScore, smartScoreColor } from "@/lib/smart-score";

interface ActionBriefProps {
  symbol: string;
  signal: string;
  confidence: number;
  riskGrade: string;
  changePercent: number;
  rsi: number;
  researchQualityScore?: number;
  tradingBias?: string;
  entryPrimary?: number;
  stopStandard?: number;
  targetBase?: number;
}

export function ActionBrief({
  symbol,
  signal,
  confidence,
  riskGrade,
  changePercent,
  rsi,
  researchQualityScore,
  tradingBias,
  entryPrimary,
  stopStandard,
  targetBase,
}: ActionBriefProps) {
  const smart = computeSmartScore({
    signal,
    confidence,
    riskGrade,
    changePercent,
    rsi,
    researchQualityScore,
  });

  const action =
    smart.label === "Strong Buy" || smart.label === "Buy"
      ? "Consider accumulating on pullbacks; confirm with your own thesis."
      : smart.label === "Strong Sell" || smart.label === "Sell"
        ? "Reduce exposure or wait for clearer support before adding size."
        : "No strong edge — monitor levels and wait for a clearer setup.";

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-teal-500/15 bg-teal-500/[0.04] mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[10px] font-semibold tracking-widest uppercase text-teal-400/90 mb-1">
            Action brief
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            {symbol} — {smart.label}
          </h2>
          <p className="text-[13px] text-zinc-400 mt-1 max-w-xl leading-relaxed">{action}</p>
        </div>
        <div className="text-center shrink-0">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Smart score</div>
          <div className={`text-4xl font-bold tabular-nums ${smartScoreColor(smart.score)}`}>
            {smart.score}
          </div>
          <div className="text-[11px] text-zinc-500">/ 100</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
        {tradingBias && (
          <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5 border border-white/[0.04]">
            <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Plan bias</div>
            <div className="text-white font-medium capitalize">{tradingBias}</div>
          </div>
        )}
        {entryPrimary != null && entryPrimary > 0 && (
          <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5 border border-white/[0.04]">
            <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Entry zone</div>
            <div className="text-white font-medium tabular-nums">{formatCurrency(entryPrimary)}</div>
          </div>
        )}
        {stopStandard != null && stopStandard > 0 && (
          <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5 border border-white/[0.04]">
            <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Stop</div>
            <div className="text-red-400/90 font-medium tabular-nums">{formatCurrency(stopStandard)}</div>
          </div>
        )}
        {targetBase != null && targetBase > 0 && (
          <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5 border border-white/[0.04]">
            <div className="text-zinc-500 text-[10px] uppercase mb-0.5">Target</div>
            <div className="text-emerald-400/90 font-medium tabular-nums">{formatCurrency(targetBase)}</div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-600 mt-4 leading-relaxed">
        Composite score blends signal, risk grade, momentum, and data quality — not investment advice.{" "}
        <Link href="/pricing" className="text-teal-400/80 hover:text-teal-300">
          Pro unlocks unlimited deep dives
        </Link>
        .
      </p>
    </div>
  );
}
