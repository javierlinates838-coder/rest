"use client";

import type { ReactNode } from "react";
import { formatLargeNumber, getSignalColor } from "@/lib/utils";
import { SmartScoreGauge } from "@/components/smart-score-gauge";
import { edgeTierColor } from "@/lib/edge-index";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";

export function StockGradingDeck({
  smart,
  signal,
  confidence,
  riskGrade,
  riskScore,
  edge,
  quote,
}: {
  smart: SmartScoreResult;
  signal: string;
  confidence: number;
  riskGrade: string;
  riskScore?: number;
  edge: EdgeIndexResult;
  quote: { marketCap: number; peRatio: number };
}) {
  const lowConviction = confidence < 35;
  const displayConf = lowConviction ? 0 : confidence;
  const riskColor =
    riskGrade === "A" || riskGrade === "B"
      ? "text-emerald-400"
      : riskGrade === "C"
        ? "text-zinc-300"
        : "text-red-400";

  return (
    <div
      className="border-t border-zinc-800/80 bg-zinc-950/40"
      aria-label="Conviction grades"
    >
      <div className="flex overflow-x-auto snap-x snap-mandatory sm:overflow-visible sm:grid sm:grid-cols-4 sm:divide-x sm:divide-zinc-800/80">
        <MetricStrip label={TERMS.smartScore}>
          <div className="flex items-center gap-3">
            <SmartScoreGauge score={smart.score} size="sm" />
            <span className="text-[13px] font-medium text-zinc-300">{smart.label}</span>
          </div>
        </MetricStrip>

        <MetricStrip label="Signal">
          <p className={`text-xl font-bold leading-none ${getSignalColor(signal)}`}>{signal}</p>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 max-w-[140px]">
            <div
              className="h-full bg-zinc-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, displayConf)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5">
            {lowConviction ? "Low conviction" : `${confidence}% confidence`}
          </p>
        </MetricStrip>

        <MetricStrip label="Risk">
          <p className={`text-2xl font-bold leading-none tabular-nums ${riskColor}`}>{riskGrade}</p>
          <p className="text-[10px] text-zinc-500 mt-1 tabular-nums">
            {riskScore != null ? `${riskScore}/100` : "—"}
          </p>
        </MetricStrip>

        <MetricStrip label={TERMS.edgeShort}>
          <p className={`text-xl font-bold tabular-nums leading-none ${edgeTierColor(edge.tier)}`}>
            {edge.edgeScore}
            <span className="text-[12px] font-medium ml-1 opacity-80">{edge.tier}</span>
          </p>
        </MetricStrip>
      </div>

      {(quote.marketCap > 0 || quote.peRatio > 0) && (
        <div className="flex flex-wrap gap-4 px-4 py-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
          {quote.marketCap > 0 && (
            <span>
              Mkt cap <span className="text-zinc-300">{formatLargeNumber(quote.marketCap)}</span>
            </span>
          )}
          {quote.peRatio > 0 && (
            <span>
              P/E <span className="text-zinc-300 tabular-nums">{quote.peRatio.toFixed(1)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MetricStrip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="snap-start shrink-0 w-[72%] sm:w-auto sm:shrink p-4 min-w-0 first:pl-4 last:pr-4 sm:px-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}
