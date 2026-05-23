"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { TradingPlan } from "@/lib/trading-plan";
import type { ForgeScenario } from "@/lib/volatility-forge";
import { pctFromPrice } from "@/lib/volatility-forge";
import { TERMS } from "@/lib/brand";

export function VolatilityForgePanel({
  plan,
  currentPrice,
  chartSimulated,
}: {
  plan: TradingPlan;
  currentPrice: number;
  chartSimulated?: boolean;
}) {
  const { forge } = plan;
  const dualMode = forge.recommended === "wait";
  const [side, setSide] = useState<"long" | "short">(
    forge.recommended === "short" ? "short" : "long"
  );

  const scenario: ForgeScenario = dualMode
    ? side === "long"
      ? forge.long
      : forge.short
    : forge.recommended === "short"
      ? forge.short
      : forge.long;

  const levels = [
    { label: "Stop", price: scenario.stop },
    { label: "Entry", price: scenario.entry },
    { label: "Spot", price: currentPrice, highlight: true },
    { label: "Target 1", price: scenario.targets[0] },
    { label: "Target 2", price: scenario.targets[1] },
    { label: "Target 3", price: scenario.targets[2] },
  ];

  return (
    <section className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden mb-6">
      <div className="px-4 py-4 sm:px-5 border-b border-zinc-800/80">
        <h3 className="text-[15px] font-semibold text-white">Trade structure</h3>
        <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed max-w-2xl">
          {dualMode
            ? "No directional edge — compare long vs short levels (ATR + nearest support/resistance)."
            : `Active ${scenario.bias} plan · ${plan.timeframe}`}
        </p>

        <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
          <span className="px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-400 tabular-nums">
            Support {formatCurrency(forge.support)} ({pctFromPrice(forge.support, currentPrice)})
          </span>
          <span className="px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-400 tabular-nums">
            Resistance {formatCurrency(forge.resistance)} ({pctFromPrice(forge.resistance, currentPrice)})
          </span>
          <span className="px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-500 tabular-nums">
            ATR {forge.atrPercent}%
          </span>
        </div>

        {(chartSimulated || forge.levelsEstimated) && (
          <p className="text-[11px] text-amber-200/80 mt-3">
            {chartSimulated
              ? "Simulated chart — levels are estimates, not live pivots."
              : "Pivots did not bracket spot — ATR/Bollinger estimates used."}
          </p>
        )}
      </div>

      {dualMode && (
        <div className="flex border-b border-zinc-800/80">
          {(["long", "short"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`flex-1 py-2.5 text-[12px] font-medium ${
                side === s
                  ? s === "long"
                    ? "text-emerald-300 bg-emerald-500/10 border-b-2 border-emerald-500/60"
                    : "text-red-300 bg-red-500/10 border-b-2 border-red-500/60"
                  : "text-zinc-500"
              }`}
            >
              {s === "long" ? "Long" : "Short"} setup
            </button>
          ))}
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-4">
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[280px] text-[12px]">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-800/80">
                <th className="pb-2 font-medium">Level</th>
                <th className="pb-2 font-medium text-right">Price</th>
                <th className="pb-2 font-medium text-right">vs spot</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-zinc-800/50 ${row.highlight ? "text-white" : "text-zinc-300"}`}
                >
                  <td className="py-2 pr-2">{row.label}</td>
                  <td className="py-2 text-right tabular-nums font-medium">
                    {formatCurrency(row.price)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-zinc-500">
                    {pctFromPrice(row.price, currentPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniStat label="Entry" value={formatCurrency(scenario.entry)} sub={pctFromPrice(scenario.entry, currentPrice)} />
          <MiniStat label="Stop" value={formatCurrency(scenario.stop)} sub={pctFromPrice(scenario.stop, currentPrice)} />
          <MiniStat label="Target" value={formatCurrency(scenario.targets[1])} sub={pctFromPrice(scenario.targets[1], currentPrice)} />
          <MiniStat label="R:R" value={`${scenario.riskReward}:1`} sub={`$${scenario.riskPerShare.toFixed(2)} risk`} />
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed">{scenario.trigger}</p>

        {dualMode && (
          <p className="text-[11px] text-zinc-600">
            Neutral {TERMS.smartScore.toLowerCase()} · {plan.confidence}% confidence — not a live trade recommendation
          </p>
        )}
      </div>
    </section>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2 min-w-0">
      <div className="text-[9px] uppercase tracking-wide text-zinc-600">{label}</div>
      <div className="text-[13px] font-semibold text-white tabular-nums truncate">{value}</div>
      <div className="text-[10px] text-zinc-600 tabular-nums">{sub}</div>
    </div>
  );
}
