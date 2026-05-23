"use client";

export function AnalystConsensusBar({
  strongBuy,
  buy,
  hold,
  sell,
  strongSell,
  period,
}: {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  period?: string;
}) {
  const total = strongBuy + buy + hold + sell + strongSell;
  if (total <= 0) return null;

  const bullPct = Math.round(((strongBuy + buy) / total) * 100);
  const rows = [
    { label: "Strong Buy", count: strongBuy, pct: "bull" as const },
    { label: "Buy", count: buy, pct: "bull" as const },
    { label: "Hold", count: hold, pct: "hold" as const },
    { label: "Sell", count: sell, pct: "bear" as const },
    { label: "Strong Sell", count: strongSell, pct: "bear" as const },
  ];

  return (
    <div className="analyst-consensus glass-card rounded-xl p-4 sm:p-5 mb-6">
      <div className="analyst-consensus-head">
        <div>
          <h3 className="text-[14px] font-semibold text-white">Analyst consensus</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {total} ratings{period ? ` · ${period}` : ""}
          </p>
        </div>
        <div className="analyst-consensus-pct">
          <span className="text-[22px] font-semibold text-zinc-200 tabular-nums">{bullPct}%</span>
          <span className="text-[10px] text-zinc-500 block">bullish</span>
        </div>
      </div>

      <div className="analyst-consensus-bar">
        {rows.map((r) =>
          r.count > 0 ? (
            <div
              key={r.label}
              className={`analyst-consensus-seg analyst-consensus-seg--${r.pct}`}
              style={{ flexGrow: r.count }}
              title={`${r.label}: ${r.count}`}
            />
          ) : null
        )}
      </div>

      <div className="analyst-consensus-grid">
        {rows.map((r) => (
          <div key={r.label} className="analyst-consensus-cell">
            <span className="analyst-consensus-count">{r.count}</span>
            <span className="analyst-consensus-label">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
