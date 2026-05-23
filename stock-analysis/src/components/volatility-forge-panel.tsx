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

  const scenario: ForgeScenario =
    dualMode
      ? side === "long"
        ? forge.long
        : forge.short
      : forge.recommended === "short"
        ? forge.short
        : forge.long;

  return (
    <section className="forge-structure glass-card rounded-xl mb-6">
      <header className="forge-structure-header">
        <div>
          <h3 className="forge-structure-title">Trade structure</h3>
          <p className="forge-structure-sub">
            {dualMode
              ? "No directional edge — compare long vs short levels from ATR and nearest S/R."
              : `Active ${scenario.bias} plan · ${plan.timeframe}`}
          </p>
        </div>
        <div className="forge-structure-levels">
          <LevelPill
            label="Support"
            value={forge.support}
            current={currentPrice}
            kind="below"
          />
          <LevelPill
            label="Resistance"
            value={forge.resistance}
            current={currentPrice}
            kind="above"
          />
          <span className="forge-structure-atr">ATR {forge.atrPercent}%</span>
        </div>
      </header>

      {(chartSimulated || forge.levelsEstimated) && (
        <p className="forge-structure-note">
          {chartSimulated
            ? "Chart is simulated — levels are ATR estimates, not live pivot data."
            : "Pivot levels did not bracket spot — using ATR/Bollinger estimates."}
        </p>
      )}

      {dualMode && (
        <div className="forge-structure-tabs">
          {(["long", "short"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`forge-structure-tab ${side === s ? `forge-structure-tab--${s}` : ""}`}
            >
              {s === "long" ? "Long" : "Short"} setup
            </button>
          ))}
        </div>
      )}

      <div className="forge-structure-body">
        <ForgeLadder scenario={scenario} currentPrice={currentPrice} />

        <div className="forge-structure-stats">
          <Stat label="Entry" value={formatCurrency(scenario.entry)} sub={pctFromPrice(scenario.entry, currentPrice)} />
          <Stat label="Stop" value={formatCurrency(scenario.stop)} sub={pctFromPrice(scenario.stop, currentPrice)} variant="risk" />
          <Stat label="Target" value={formatCurrency(scenario.targets[1])} sub={pctFromPrice(scenario.targets[1], currentPrice)} variant="reward" />
          <Stat label="R:R" value={`${scenario.riskReward}:1`} sub={`$${scenario.riskPerShare.toFixed(2)} risk`} />
        </div>

        <p className="forge-structure-trigger">{scenario.trigger}</p>

        {dualMode && (
          <p className="forge-structure-wait">
            {TERMS.smartScore} regime is neutral · model confidence {plan.confidence}% — not a live trade call
          </p>
        )}
      </div>
    </section>
  );
}

function LevelPill({
  label,
  value,
  current,
  kind,
}: {
  label: string;
  value: number;
  current: number;
  kind: "below" | "above";
}) {
  const ok = kind === "below" ? value < current : value > current;
  return (
    <div className={`forge-level-pill ${ok ? "" : "forge-level-pill--warn"}`}>
      <span className="forge-level-pill-label">{label}</span>
      <span className="forge-level-pill-value">{formatCurrency(value)}</span>
      <span className="forge-level-pill-pct">{pctFromPrice(value, current)}</span>
    </div>
  );
}

function Stat({
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
    <div className="forge-stat">
      <span className="forge-stat-label">{label}</span>
      <span
        className={`forge-stat-value ${
          variant === "risk" ? "text-red-400/90" : variant === "reward" ? "text-emerald-400/90" : "text-white"
        }`}
      >
        {value}
      </span>
      <span className="forge-stat-sub">{sub}</span>
    </div>
  );
}

function ForgeLadder({ scenario, currentPrice }: { scenario: ForgeScenario; currentPrice: number }) {
  const levels = [
    { key: "stop", price: scenario.stop, label: "Stop" },
    { key: "entry", price: scenario.entry, label: "Entry" },
    { key: "now", price: currentPrice, label: "Spot" },
    { key: "t1", price: scenario.targets[0], label: "T1" },
    { key: "t2", price: scenario.targets[1], label: "T2" },
    { key: "t3", price: scenario.targets[2], label: "T3" },
  ].sort((a, b) => a.price - b.price);

  const min = levels[0].price * 0.995;
  const max = levels[levels.length - 1].price * 1.005;
  const span = max - min || 1;
  const pos = (p: number) => `${((p - min) / span) * 100}%`;

  return (
    <div className="forge-ladder">
      <div className="forge-ladder-track">
        {levels.map((l) => (
          <div
            key={l.key}
            className={`forge-ladder-tick ${l.key === "now" ? "forge-ladder-tick--spot" : ""}`}
            style={{ left: pos(l.price) }}
            title={`${l.label} ${formatCurrency(l.price)}`}
          />
        ))}
      </div>
      <div className="forge-ladder-labels">
        {levels.map((l) => (
          <div key={l.key} className="forge-ladder-row">
            <span className="text-zinc-500">{l.label}</span>
            <span className="text-white tabular-nums font-medium">{formatCurrency(l.price)}</span>
            <span className="text-zinc-600 tabular-nums">{pctFromPrice(l.price, currentPrice)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
