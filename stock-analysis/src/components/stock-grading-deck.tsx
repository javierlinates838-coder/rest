"use client";

import type { ReactNode } from "react";
import { formatLargeNumber, getSignalColor } from "@/lib/utils";
import { SmartScoreGauge } from "@/components/smart-score-gauge";
import { edgeTierColor } from "@/lib/edge-index";
import type { EdgeIndexResult } from "@/lib/edge-index";
import type { SmartScoreResult } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";

function MetricCell({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-4 min-w-0 flex flex-col items-center justify-center text-center ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
        {label}
      </span>
      {children}
    </div>
  );
}

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
    <section
      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden"
      aria-label="Conviction grades"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-zinc-800/80">
        <MetricCell label={TERMS.smartScore}>
          <SmartScoreGauge score={smart.score} size="md" />
          <span className="text-[12px] text-zinc-400 mt-1">{smart.label}</span>
        </MetricCell>

        <MetricCell
          label="Signal"
          className="lg:items-start lg:text-left lg:px-5"
        >
          <p className={`text-2xl font-bold leading-none ${getSignalColor(signal)}`}>
            {signal}
          </p>
          <div className="w-full max-w-[200px] h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-zinc-500 rounded-full"
              style={{ width: `${Math.max(4, displayConf)}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-500 mt-2 leading-snug">
            {lowConviction ? "Low conviction · shown as Hold" : `${confidence}% confidence`}
          </span>
        </MetricCell>

        <MetricCell label="Risk grade">
          <p className={`text-4xl font-bold leading-none ${riskColor}`}>{riskGrade}</p>
          <span className="text-[11px] text-zinc-500 mt-2 tabular-nums">
            {riskScore != null ? `${riskScore}/100` : "—"} · higher = riskier
          </span>
        </MetricCell>

        <MetricCell label={TERMS.edgeShort} className="lg:items-start lg:text-left lg:px-4">
          <p className={`text-2xl font-bold tabular-nums leading-none ${edgeTierColor(edge.tier)}`}>
            {edge.edgeScore}
            <span className="text-sm font-semibold ml-1.5">{edge.tier}</span>
          </p>
          <p className="text-[10px] text-zinc-600 mt-2 tabular-nums leading-relaxed">
            Conv {edge.conviction} · Data {edge.dataIntegrity} · Asym {edge.riskAsymmetry}
          </p>
        </MetricCell>
      </div>

      {(quote.marketCap > 0 || quote.peRatio > 0) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-500">
          {quote.marketCap > 0 && (
            <span>
              Mkt cap <span className="text-zinc-300 font-medium">{formatLargeNumber(quote.marketCap)}</span>
            </span>
          )}
          {quote.peRatio > 0 && (
            <span>
              P/E <span className="text-zinc-300 font-medium tabular-nums">{quote.peRatio.toFixed(1)}</span>
            </span>
          )}
        </div>
      )}
    </section>
  );
}
