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
    { label: "Strong Buy", count: strongBuy, color: "bg-emerald-500" },
    { label: "Buy", count: buy, color: "bg-emerald-400/80" },
    { label: "Hold", count: hold, color: "bg-zinc-500" },
    { label: "Sell", count: sell, color: "bg-red-400/80" },
    { label: "Strong Sell", count: strongSell, color: "bg-red-500" },
  ];

  return (
    <div className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5 mb-6">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-white">Analyst consensus</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
            {total} ratings{bullPct > 0 ? ` · ${bullPct}% buy-side` : ""}
            {period ? ` · ${period}` : ""}
          </p>
        </div>
        <span className="text-xl font-semibold text-zinc-300 tabular-nums shrink-0">{bullPct}%</span>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800 mb-3 min-w-0">
        {rows.map((r) =>
          r.count > 0 ? (
            <div
              key={r.label}
              className={`${r.color} min-w-[3px] shrink-0`}
              style={{ flex: `${r.count} 1 0` }}
              title={`${r.label}: ${r.count}`}
            />
          ) : null
        )}
      </div>

      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {rows.map((r) => (
          <div key={r.label} className="text-center min-w-0 py-1">
            <div className="text-sm font-semibold text-zinc-200 tabular-nums">{r.count}</div>
            <div className="text-[8px] sm:text-[9px] text-zinc-600 uppercase leading-tight mt-0.5">
              {r.label.replace("Strong ", "Str. ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
