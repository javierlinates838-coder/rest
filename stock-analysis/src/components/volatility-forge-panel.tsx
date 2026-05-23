"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { TradingPlan } from "@/lib/trading-plan";
import type { ForgeScenario } from "@/lib/volatility-forge";
import { pctFromPrice } from "@/lib/volatility-forge";

export function VolatilityForgePanel({
  plan,
  currentPrice,
}: {
  plan: TradingPlan;
  currentPrice: number;
}) {
  const { forge } = plan;
  const dualMode = forge.recommended === "wait";
  const [side, setSide] = useState<"long" | "short">(
    forge.recommended === "short" ? "short" : "long"
  );

  const scenario: ForgeScenario =
    dualMode ? (side === "long" ? forge.long : forge.short) : forge.recommended === "short" ? forge.short : forge.long;

  return (
    <section className="volatility-forge ultra-card rounded-2xl overflow-hidden animate-fadeInUp">
      <div className="p-5 sm:p-6 border-b border-white/[0.05]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white font-display tracking-tight">
                Volatility Forge
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/25">
                ATR · S/R levels
              </span>
            </div>
            <p className="text-[12px] text-zinc-500 max-w-xl leading-relaxed">
              {dualMode
                ? "Mixed signal — compare long and short structures. Levels are math from ATR and support/resistance, not duplicate copy-paste zones."
                : `Active ${scenario.bias} structure from technicals · ${plan.timeframe}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <LevelChip label="Support" value={forge.support} current={currentPrice} tone="support" />
            <LevelChip label="Resistance" value={forge.resistance} current={currentPrice} tone="resistance" />
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-400 font-mono border border-white/[0.06]">
              ATR {forge.atrPercent}%
            </span>
          </div>
        </div>

        {dualMode && (
          <div className="flex rounded-xl border border-zinc-700/80 overflow-hidden mt-4 w-full sm:w-auto">
            {(["long", "short"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-[12px] font-semibold capitalize ${
                  side === s
                    ? s === "long"
                      ? "bg-emerald-600/25 text-emerald-200"
                      : "bg-red-600/25 text-red-200"
                    : "text-zinc-500 hover:bg-zinc-800/50"
                }`}
              >
                {s} setup
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <ForgeLadder scenario={scenario} currentPrice={currentPrice} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatBox label="Entry" value={formatCurrency(scenario.entry)} sub={pctFromPrice(scenario.entry, currentPrice)} />
          <StatBox label="Stop" value={formatCurrency(scenario.stop)} sub={pctFromPrice(scenario.stop, currentPrice)} tone="bear" />
          <StatBox label="Target (base)" value={formatCurrency(scenario.targets[1])} sub={pctFromPrice(scenario.targets[1], currentPrice)} tone="bull" />
          <StatBox label="R:R" value={`${scenario.riskReward}:1`} sub={`Risk $${scenario.riskPerShare.toFixed(2)}`} />
        </div>

        <p className="text-[11px] text-zinc-500 mt-4 border-l-2 border-teal-500/30 pl-3">
          {scenario.trigger}
        </p>

        {dualMode && (
          <p className="text-[10px] text-amber-400/90 mt-3 font-mono">
            WAIT MODE · Technical confidence {plan.confidence}% — do not treat neutral % bands as a live call
          </p>
        )}
      </div>
    </section>
  );
}

function LevelChip({
  label,
  value,
  current,
  tone,
}: {
  label: string;
  value: number;
  current: number;
  tone: "support" | "resistance";
}) {
  return (
    <span
      className={`px-2.5 py-1 rounded-lg font-mono border ${
        tone === "support"
          ? "bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20"
          : "bg-red-500/10 text-red-300/90 border-red-500/20"
      }`}
    >
      {label} {formatCurrency(value)}{" "}
      <span className="opacity-70">({pctFromPrice(value, current)})</span>
    </span>
  );
}

function StatBox({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "bull" | "bear";
}) {
  return (
    <div className="rounded-xl bg-zinc-900/50 border border-white/[0.05] px-3 py-2.5">
      <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div
        className={`text-[15px] font-bold tabular-nums mt-0.5 ${
          tone === "bull" ? "text-emerald-400" : tone === "bear" ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-zinc-600 tabular-nums">{sub}</div>
    </div>
  );
}

function ForgeLadder({ scenario, currentPrice }: { scenario: ForgeScenario; currentPrice: number }) {
  const isLong = scenario.bias === "long";
  const levels = [
    { key: "stop", price: scenario.stop, label: "Stop", color: "#f87171" },
    { key: "entry", price: scenario.entry, label: "Entry", color: isLong ? "#34d399" : "#fb923c" },
    { key: "now", price: currentPrice, label: "Now", color: "#f8fafc" },
    { key: "t1", price: scenario.targets[0], label: "T1", color: "#5eead4" },
    { key: "t2", price: scenario.targets[1], label: "T2", color: "#2dd4bf" },
    { key: "t3", price: scenario.targets[2], label: "T3", color: "#14b8a6" },
  ].sort((a, b) => a.price - b.price);

  const min = levels[0].price * 0.995;
  const max = levels[levels.length - 1].price * 1.005;
  const span = max - min || 1;

  const pos = (p: number) => `${((p - min) / span) * 100}%`;

  return (
    <div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Price ladder</div>
      <div className="relative h-14 sm:h-16 rounded-xl bg-zinc-950/80 border border-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 opacity-20"
          style={{
            width: "100%",
            background: isLong
              ? "linear-gradient(90deg, rgba(248,113,113,0.5), rgba(52,211,153,0.4))"
              : "linear-gradient(90deg, rgba(52,211,153,0.3), rgba(248,113,113,0.5))",
          }}
        />
        {levels.map((l) => (
          <div
            key={l.key}
            className="absolute top-0 bottom-0 w-0.5 sm:w-1"
            style={{ left: pos(l.price), backgroundColor: l.color }}
            title={`${l.label} ${l.price}`}
          />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-teal-400 shadow-lg z-10"
          style={{ left: `calc(${pos(currentPrice)} - 6px)` }}
        />
      </div>
      <div className="relative h-12 mt-2 hidden sm:block">
        {levels.map((l) => (
          <div
            key={l.key}
            className="absolute text-center -translate-x-1/2"
            style={{ left: pos(l.price), minWidth: "4rem" }}
          >
            <div className="text-[9px] text-zinc-500 uppercase">{l.label}</div>
            <div className="text-[11px] font-semibold text-white tabular-nums">{formatCurrency(l.price)}</div>
            <div className="text-[9px] text-zinc-600 tabular-nums">{pctFromPrice(l.price, currentPrice)}</div>
          </div>
        ))}
      </div>
      <div className="sm:hidden grid grid-cols-2 gap-2 mt-3">
        {levels.map((l) => (
          <div key={l.key} className="text-[10px] flex justify-between border-b border-white/[0.04] py-1">
            <span className="text-zinc-500">{l.label}</span>
            <span className="text-white font-mono">{formatCurrency(l.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
