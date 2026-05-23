"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import type { TradingPlan } from "@/lib/trading-plan";
import type { ForgeScenario } from "@/lib/volatility-forge";
import { pctFromPrice } from "@/lib/volatility-forge";

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
  const defaultSide: "long" | "short" =
    forge.recommended === "short" ? "short" : "long";
  const [side, setSide] = useState<"long" | "short">(defaultSide);

  const scenario = side === "long" ? forge.long : forge.short;
  const other = side === "long" ? forge.short : forge.long;

  const levels = useMemo(
    () => [
      { label: "Stop", price: scenario.stop },
      { label: "Entry", price: scenario.entry },
      { label: "Spot", price: currentPrice, highlight: true },
      { label: "Target 1", price: scenario.targets[0] },
      { label: "Target 2", price: scenario.targets[1] },
      { label: "Target 3", price: scenario.targets[2] },
    ],
    [scenario, currentPrice]
  );

  const entryDiffers = Math.abs(scenario.entry - other.entry) > 0.02;

  return (
    <section className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden mb-6">
      <div className="px-4 py-4 sm:px-5 border-b border-zinc-800/80">
        <h3 className="text-[15px] font-semibold text-white">Trade structure</h3>
        <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">
          ATR + nearest support below spot and resistance above spot
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-[11px]">
          <div className="rounded-lg bg-zinc-950/50 px-2.5 py-2 border border-zinc-800/60">
            <dt className="text-zinc-600">Support</dt>
            <dd className="text-zinc-200 font-medium tabular-nums mt-0.5">
              {formatCurrency(forge.support)}{" "}
              <span className="text-zinc-500 font-normal">({pctFromPrice(forge.support, currentPrice)})</span>
            </dd>
          </div>
          <div className="rounded-lg bg-zinc-950/50 px-2.5 py-2 border border-zinc-800/60">
            <dt className="text-zinc-600">Resistance</dt>
            <dd className="text-zinc-200 font-medium tabular-nums mt-0.5">
              {formatCurrency(forge.resistance)}{" "}
              <span className="text-zinc-500 font-normal">
                ({pctFromPrice(forge.resistance, currentPrice)})
              </span>
            </dd>
          </div>
          <div className="rounded-lg bg-zinc-950/50 px-2.5 py-2 border border-zinc-800/60 col-span-2 sm:col-span-1">
            <dt className="text-zinc-600">ATR</dt>
            <dd className="text-zinc-200 font-medium tabular-nums mt-0.5">{forge.atrPercent}%</dd>
          </div>
        </dl>
        {(chartSimulated || forge.levelsEstimated) && (
          <p className="text-[11px] text-amber-200/80 mt-3">
            {chartSimulated
              ? "Estimated price history — levels are illustrative only."
              : "Using ATR estimates — pivots did not bracket live price."}
          </p>
        )}
      </div>

      <div
        className="flex border-b border-zinc-800/80"
        role="tablist"
        aria-label="Long or short setup"
      >
        {(["long", "short"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={side === s}
            onClick={() => setSide(s)}
            className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
              side === s
                ? s === "long"
                  ? "text-emerald-300 bg-emerald-500/15 border-b-2 border-emerald-500"
                  : "text-red-300 bg-red-500/15 border-b-2 border-red-500"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
            }`}
          >
            {s === "long" ? "Long setup" : "Short setup"}
          </button>
        ))}
      </div>

      <div key={side} className="p-4 sm:p-5 space-y-4 animate-fadeIn">
        <p className="text-[11px] text-zinc-500">
          Viewing <span className="text-zinc-300 font-medium capitalize">{side}</span> structure
          {forge.recommended === "wait"
            ? " · no directional edge on signal"
            : forge.recommended === side
              ? " · matches current signal"
              : ""}
          {!entryDiffers && (
            <span className="text-amber-200/80"> · widen filters if levels look identical</span>
          )}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px] text-[12px]">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-800/80">
                <th className="pb-2 font-medium w-[30%]">Level</th>
                <th className="pb-2 font-medium text-right">Price</th>
                <th className="pb-2 font-medium text-right">vs spot</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((row) => (
                <tr
                  key={`${side}-${row.label}`}
                  className={`border-b border-zinc-800/40 ${row.highlight ? "bg-zinc-800/20" : ""}`}
                >
                  <td className={`py-2.5 pr-2 ${row.highlight ? "text-white font-medium" : "text-zinc-400"}`}>
                    {row.label}
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-white">
                    {formatCurrency(row.price)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-zinc-500">
                    {pctFromPrice(row.price, currentPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniStat label="Entry" value={formatCurrency(scenario.entry)} sub={pctFromPrice(scenario.entry, currentPrice)} />
          <MiniStat label="Stop" value={formatCurrency(scenario.stop)} sub={pctFromPrice(scenario.stop, currentPrice)} variant="risk" />
          <MiniStat
            label="Target"
            value={formatCurrency(scenario.targets[1])}
            sub={pctFromPrice(scenario.targets[1], currentPrice)}
            variant="reward"
          />
          <MiniStat label="R:R" value={`${scenario.riskReward}:1`} sub={`$${scenario.riskPerShare.toFixed(2)} risk`} />
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed border-l-2 border-zinc-700 pl-3">
          {scenario.trigger}
        </p>

        <p className="text-[10px] text-zinc-600">
          {side === "long" ? "Short" : "Long"} entry at {formatCurrency(other.entry)} · stop{" "}
          {formatCurrency(other.stop)} — switch tab to compare
        </p>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  sub,
  variant,
}: {
  label: string;
  value: string;
  sub: string;
  variant?: "risk" | "reward";
}) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-2.5 py-2 min-w-0">
      <div className="text-[9px] uppercase tracking-wide text-zinc-600">{label}</div>
      <div
        className={`text-[13px] font-semibold tabular-nums truncate mt-0.5 ${
          variant === "risk" ? "text-red-400/90" : variant === "reward" ? "text-emerald-400/90" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-zinc-600 tabular-nums">{sub}</div>
    </div>
  );
}
