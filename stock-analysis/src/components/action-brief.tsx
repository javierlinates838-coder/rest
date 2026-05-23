"use client";

import Link from "next/link";
import { LIFETIME } from "@/lib/subscription";
import { formatCurrency } from "@/lib/utils";
import { computeSmartScore } from "@/lib/smart-score";
import { TERMS } from "@/lib/brand";
import { SmartScoreGauge } from "@/components/smart-score-gauge";

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
      ? "Accumulation bias on pullbacks — validate catalysts and position size against risk grade."
      : smart.label === "Strong Sell" || smart.label === "Sell"
        ? "Distribution bias — reduce exposure until structure confirms support."
        : "Neutral regime — wait for breakout or breakdown before sizing.";

  const metrics = [
    tradingBias && { label: "Plan bias", value: tradingBias, tone: "neutral" as const },
    entryPrimary != null && entryPrimary > 0 && { label: "Entry zone", value: formatCurrency(entryPrimary), tone: "neutral" as const },
    stopStandard != null && stopStandard > 0 && { label: "Stop", value: formatCurrency(stopStandard), tone: "bear" as const },
    targetBase != null && targetBase > 0 && { label: "Target", value: formatCurrency(targetBase), tone: "bull" as const },
    { label: "Confidence", value: `${confidence}%`, tone: "neutral" as const },
    { label: "Risk grade", value: riskGrade, tone: "neutral" as const },
  ].filter(Boolean) as { label: string; value: string; tone: "bull" | "bear" | "neutral" }[];

  return (
    <div className="ultra-card brief-terminal mb-6 animate-fadeIn">
      <div className="brief-terminal-header">
        <span className="brief-terminal-dot" aria-hidden />
        <span>{TERMS.meridianBrief}</span>
        <span className="ml-auto font-mono text-teal-400/80">{symbol}</span>
      </div>
      <div className="brief-terminal-body ultra-card-inner">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-5">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="pro-badge">AI + Technical</span>
              <span className="text-[11px] font-mono text-zinc-500">Signal: {signal}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
              {smart.label}
            </h2>
            <p className="text-[13px] text-zinc-400 max-w-xl leading-relaxed border-l-2 border-teal-500/30 pl-3">
              {action}
            </p>
          </div>
          <SmartScoreGauge score={smart.score} label={TERMS.smartScore} size="lg" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {metrics.map((m) => (
            <div key={m.label} className="pro-metric">
              <div className="pro-metric-label">{m.label}</div>
              <div
                className={`pro-metric-value text-base capitalize ${
                  m.tone === "bull" ? "text-emerald-400" : m.tone === "bear" ? "text-red-400" : "text-white"
                }`}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-600 mt-4 font-mono leading-relaxed">
          MODEL_OUTPUT · Not investment advice ·{" "}
          <Link href="/pricing" className="text-teal-400/90 hover:text-teal-300">
            Lifetime ${LIFETIME.price} → unlimited deep dives
          </Link>
        </p>
      </div>
    </div>
  );
}
