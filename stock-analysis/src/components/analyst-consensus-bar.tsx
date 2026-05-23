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

  const segments = [
    { label: "Strong Buy", count: strongBuy, color: "bg-emerald-500", text: "text-emerald-400" },
    { label: "Buy", count: buy, color: "bg-green-500", text: "text-green-400" },
    { label: "Hold", count: hold, color: "bg-amber-500", text: "text-amber-400" },
    { label: "Sell", count: sell, color: "bg-orange-500", text: "text-orange-400" },
    { label: "Strong Sell", count: strongSell, color: "bg-red-500", text: "text-red-400" },
  ].filter((s) => s.count > 0);

  const bullPct = Math.round(((strongBuy + buy) / total) * 100);

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-white tracking-tight">
            Wall Street consensus
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {bullPct}% bullish · {total} analysts{period ? ` · ${period}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{bullPct}%</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Buy side</div>
        </div>
      </div>

      <div className="flex h-4 sm:h-5 rounded-full overflow-hidden bg-zinc-800/80 mb-4">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} min-w-[2px] transition-all`}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "Strong Buy", count: strongBuy, text: "text-emerald-400" },
          { label: "Buy", count: buy, text: "text-green-400" },
          { label: "Hold", count: hold, text: "text-amber-400" },
          { label: "Sell", count: sell, text: "text-orange-400" },
          { label: "Strong Sell", count: strongSell, text: "text-red-400" },
        ].map((row) => (
          <div key={row.label} className="rounded-lg bg-zinc-900/50 px-2 py-2 text-center border border-white/[0.04]">
            <div className={`text-lg font-bold tabular-nums ${row.text}`}>{row.count}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">{row.label}</div>
            <div className="text-[9px] text-zinc-600 tabular-nums">
              {total > 0 ? `${Math.round((row.count / total) * 100)}%` : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
