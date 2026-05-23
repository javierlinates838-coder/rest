"use client";

import Link from "next/link";
import type { EdgeIndexResult } from "@/lib/edge-index";
import { edgeTierColor } from "@/lib/edge-index";
import { TERMS } from "@/lib/brand";

interface EdgeIndexPanelProps {
  edge: EdgeIndexResult;
  symbol: string;
  isPro: boolean;
  onUpgrade?: () => void;
}

export function EdgeIndexPanel({ edge, symbol, isPro, onUpgrade }: EdgeIndexPanelProps) {
  const bars = [
    { label: "Conviction", value: edge.conviction, color: "bg-teal-500" },
    { label: "Data integrity", value: edge.dataIntegrity, color: "bg-sky-500" },
    { label: "Risk asymmetry", value: edge.riskAsymmetry, color: "bg-amber-500" },
  ];

  return (
    <div className="ultra-card rounded-2xl mb-6 overflow-hidden">
      <div className="brief-terminal-header">
        <span className="brief-terminal-dot" />
        <span>{TERMS.edgeIndex}</span>
        <span className="ml-auto font-mono text-teal-400/90">ONLY HERE</span>
      </div>
      <div className="p-5 sm:p-6 ultra-card-inner">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-bold font-mono tabular-nums ${edgeTierColor(edge.tier)}`}>
                {edge.edgeScore}
              </span>
              <div>
                <div className={`text-lg font-bold ${edgeTierColor(edge.tier)}`}>{edge.tier}</div>
                <div className="text-[11px] text-zinc-500 font-mono">Smart {edge.smartScore} fused</div>
              </div>
            </div>
            <p className="text-[12px] text-zinc-500 mt-2 max-w-md">
              Our proprietary fusion — unavailable on chart-only platforms. Signal, {TERMS.dataGrade.toLowerCase()}, and risk asymmetry in one number.
            </p>
          </div>
          {!isPro && (
            <button
              type="button"
              onClick={onUpgrade}
              className="pro-badge cursor-pointer hover:opacity-90"
            >
              PRO FULL VIEW
            </button>
          )}
        </div>

        <div className={`grid gap-4 ${isPro ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"}`}>
          {bars.map((b) => (
            <div key={b.label} className={`pro-metric ${!isPro && b.label !== "Conviction" ? "opacity-40 blur-[2px] select-none" : ""}`}>
              <div className="pro-metric-label">{b.label}</div>
              <div className="pro-metric-value text-lg">{b.value}</div>
              <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className={`h-full ${b.color} rounded-full transition-all duration-700`} style={{ width: `${b.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {isPro ? (
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {edge.drivers.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-2">
                  Edge drivers
                </div>
                <ul className="space-y-1.5">
                  {edge.drivers.map((d) => (
                    <li key={d} className="text-[12px] text-zinc-400 flex gap-2">
                      <span className="text-emerald-500">▲</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {edge.warnings.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 mb-2">
                  Warnings
                </div>
                <ul className="space-y-1.5">
                  {edge.warnings.map((w) => (
                    <li key={w} className="text-[12px] text-zinc-400 flex gap-2">
                      <span className="text-amber-500">!</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-amber-100/90">
              Full Edge breakdown for {symbol} is Pro-only — the metric hedge funds wish screeners had.
            </p>
            <Link href="/pricing" className="command-status-cta pressable shrink-0">
              Unlock
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
