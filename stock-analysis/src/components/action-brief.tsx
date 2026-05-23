"use client";

import { formatCurrency } from "@/lib/utils";
import { computeSmartScore } from "@/lib/smart-score";
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
  riskReward?: number;
  lowIntegrity?: boolean;
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
  riskReward,
  lowIntegrity,
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
      ? "Long bias. Work entries on pullbacks; keep the stop."
      : smart.label === "Strong Sell" || smart.label === "Sell"
        ? "Short or trim bias. Don't add until structure improves."
        : "Neutral. No clean break yet.";

  const metrics = [
    tradingBias && { label: "Bias", value: tradingBias, tone: "neutral" as const },
    entryPrimary != null && entryPrimary > 0 && { label: "Entry", value: formatCurrency(entryPrimary), tone: "neutral" as const },
    stopStandard != null && stopStandard > 0 && { label: "Stop", value: formatCurrency(stopStandard), tone: "bear" as const },
    targetBase != null && targetBase > 0 && { label: "Target", value: formatCurrency(targetBase), tone: "bull" as const },
    riskReward != null && riskReward > 0 && { label: "R:R", value: `${riskReward.toFixed(1)}×`, tone: "bull" as const },
    { label: "Confidence", value: `${confidence}%`, tone: "neutral" as const },
    { label: "Risk", value: riskGrade, tone: "neutral" as const },
  ].filter(Boolean) as { label: string; value: string; tone: "bull" | "bear" | "neutral" }[];

  return (
    <div className="ultra-card brief-terminal mb-6 animate-fadeIn">
      <div className="brief-terminal-header">
        <span className="brief-terminal-dot" aria-hidden />
        <span>Trade setup</span>
        <span className="ml-auto font-mono text-teal-400/80">{symbol}</span>
      </div>
      {lowIntegrity && (
        <p className="px-4 pt-3 text-[11px] text-amber-200/90 border-b border-amber-500/15 bg-amber-500/5">
          Thin data on this symbol. Treat levels as rough until feeds improve.
        </p>
      )}
      <div className="brief-terminal-body ultra-card-inner">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-5">
          <div className="flex-1 min-w-[200px]">
            <p className="text-[11px] font-mono text-zinc-500 mb-2">Signal · {signal}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
              {smart.label}
            </h2>
            <p className="text-[13px] text-zinc-400 max-w-xl leading-relaxed border-l-2 border-teal-500/30 pl-3">
              {action}
            </p>
          </div>
          <SmartScoreGauge score={smart.score} label="Conviction" size="lg" />
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

        <p className="text-[10px] text-zinc-600 mt-4 leading-relaxed">
          Not investment advice.
        </p>
      </div>
    </div>
  );
}
