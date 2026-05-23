"use client";

import type { ReactNode } from "react";
import { formatPercent, getSignalColor, getSignalBg } from "@/lib/utils";
import { smartScoreColor } from "@/lib/smart-score";
import { edgeTierColor } from "@/lib/edge-index";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";

export function StockConvictionRail({
  edge,
  smart,
  signal,
  confidence,
  riskGrade,
  riskScore,
  changePercent,
}: {
  edge: EdgeIndexResult;
  smart: SmartScoreResult;
  signal: string;
  confidence: number;
  riskGrade: string;
  riskScore?: number;
  changePercent: number;
}) {
  return (
    <div className="stock-conviction-rail ultra-card rounded-2xl p-4 sm:p-5 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <RailCell label={TERMS.edgeShort}>
          <span className={`text-3xl font-bold font-mono tabular-nums ${edgeTierColor(edge.tier)}`}>
            {edge.edgeScore}
          </span>
          <span className={`text-[12px] font-semibold ${edgeTierColor(edge.tier)}`}>{edge.tier}</span>
        </RailCell>

        <RailCell label={TERMS.smartScore}>
          <span className={`text-3xl font-bold tabular-nums ${smartScoreColor(smart.score)}`}>
            {smart.score}
          </span>
          <span className="text-[12px] text-zinc-400">{smart.label}</span>
        </RailCell>

        <RailCell label="Signal">
          <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${getSignalColor(signal)}`}>
            {signal}
          </span>
          <span className="text-[11px] text-zinc-500">
            {confidence < 35 ? "Low conviction — shown as Hold" : `${confidence}% confidence`}
          </span>
        </RailCell>

        <RailCell label="Risk">
          <span
            className={`text-3xl font-bold ${
              riskGrade === "A" || riskGrade === "B"
                ? "text-emerald-400"
                : riskGrade === "C"
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {riskGrade}
          </span>
          <span className="text-[11px] text-zinc-500">
            {riskScore != null ? `${riskScore}/100` : "—"} · {formatPercent(changePercent)} today
          </span>
        </RailCell>
      </div>
      <div
        className={`mt-3 rounded-lg px-3 py-2 text-center text-[11px] font-medium border ${getSignalBg(signal)} ${getSignalColor(signal)}`}
      >
        Tape read: {smart.tone === "bullish" ? "Bullish bias" : smart.tone === "bearish" ? "Bearish bias" : "Neutral / wait for structure"}
      </div>
    </div>
  );
}

function RailCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-zinc-900/40 border border-white/[0.05] px-3 py-3 text-center">
      <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="flex flex-col items-center gap-0.5">{children}</div>
    </div>
  );
}
