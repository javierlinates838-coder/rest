"use client";

import type { EdgeIndexResult } from "@/lib/edge-index";
import { edgeTierColor } from "@/lib/edge-index";
import { TERMS } from "@/lib/brand";

interface EdgeIndexPanelProps {
  edge: EdgeIndexResult;
  symbol: string;
}

export function EdgeIndexPanel({ edge, symbol }: EdgeIndexPanelProps) {
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
        <span className="ml-auto font-mono text-zinc-500">{symbol}</span>
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
                <div className="text-[11px] text-zinc-500 font-mono">Conviction {edge.smartScore}</div>
              </div>
            </div>
            <p className="text-[12px] text-zinc-500 mt-2 max-w-md">
              Signal quality for {symbol}: conviction, {TERMS.dataGrade.toLowerCase()}, and risk in one score.
            </p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {bars.map((b) => (
            <div key={b.label} className="pro-metric">
              <div className="pro-metric-label">{b.label}</div>
              <div className="pro-metric-value text-lg">{b.value}</div>
              <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full ${b.color} rounded-full transition-all duration-700`}
                  style={{ width: `${b.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          {edge.drivers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-2">
                Supports
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
                Flags
              </div>
              <ul className="space-y-1.5">
                {edge.warnings.map((w) => (
                  <li key={w} className="text-[12px] text-zinc-400 flex gap-2">
                    <span className="text-amber-500">▼</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
