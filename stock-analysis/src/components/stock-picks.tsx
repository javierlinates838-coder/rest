"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/stock-logo";
import { formatCurrency, formatPercent, getSignalBg, getSignalColor } from "@/lib/utils";

interface StockPick {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  signal: string;
  confidence: number;
  riskGrade: string;
  score: number;
  reason: string;
  category: string;
}

interface RecommendationsData {
  topBuys: StockPick[];
  qualityPicks: StockPick[];
  momentumPicks: StockPick[];
  updatedAt: string;
}

function PickRow({ pick, onSelect }: { pick: StockPick; onSelect: (s: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pick.symbol)}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors text-left"
    >
      <StockLogo symbol={pick.symbol} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-white">{pick.symbol}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSignalBg(pick.signal)} ${getSignalColor(pick.signal)}`}>
            {pick.signal}
          </span>
          <span className="text-[10px] text-zinc-500">Grade {pick.riskGrade}</span>
        </div>
        <div className="text-[11px] text-zinc-500 truncate">{pick.name}</div>
        <div className="text-[10px] text-zinc-600 mt-0.5">{pick.reason}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[13px] font-medium text-white">{formatCurrency(pick.price)}</div>
        <div className={`text-[12px] font-medium ${pick.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {formatPercent(pick.changePercent)}
        </div>
      </div>
    </button>
  );
}

function PickSection({
  title,
  subtitle,
  picks,
  onSelect,
}: {
  title: string;
  subtitle: string;
  picks: StockPick[];
  onSelect: (s: string) => void;
}) {
  if (picks.length === 0) return null;
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <h3 className="text-[15px] font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-[11px] text-zinc-500 mb-3">{subtitle}</p>
      <div className="divide-y divide-white/[0.04]">
        {picks.map((pick) => (
          <PickRow key={pick.symbol} pick={pick} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export function StockPicks() {
  const router = useRouter();
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recommendations");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load picks");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-[20px] font-semibold text-white mb-4 tracking-tight">AI Stock Picks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-48 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">★</span>
            AI Stock Picks
          </h2>
          <p className="text-[12px] text-zinc-500 mt-1">
            Ranked from live quotes, technical signals, and risk grades — not financial advice.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PickSection
          title="Top Buys"
          subtitle="Strongest bullish signals with solid confidence"
          picks={data.topBuys}
          onSelect={(s) => router.push(`/stock/${s}`)}
        />
        <PickSection
          title="Quality & Lower Risk"
          subtitle="Risk grades A–B with neutral-to-bullish bias"
          picks={data.qualityPicks}
          onSelect={(s) => router.push(`/stock/${s}`)}
        />
        <PickSection
          title="Momentum"
          subtitle="Names leading today’s session"
          picks={data.momentumPicks}
          onSelect={(s) => router.push(`/stock/${s}`)}
        />
      </div>
    </section>
  );
}
