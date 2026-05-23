"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPercent } from "@/lib/utils";
import { sectorColor, type SectorPerformanceRow } from "@/lib/sectors";

export function SectorHeatmap({
  sectors,
  estimated,
  source,
}: {
  sectors: SectorPerformanceRow[];
  estimated?: boolean;
  source?: string;
}) {
  const router = useRouter();

  if (sectors.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">Sector performance unavailable — check API keys and refresh.</p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="section-heading mb-0">
            <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Sector rotation
          </h2>
          <p className="text-[11px] text-zinc-500 mt-1">
            {estimated ? "ETF proxies" : source === "mixed" ? "FMP + ETF fill" : "Live sector tape"}
            {estimated && (
              <span className="text-amber-400/90 ml-1">· estimated</span>
            )}
          </p>
        </div>
        <Link
          href="/screener"
          className="text-[11px] font-medium text-teal-400/90 hover:text-teal-300"
        >
          Open Alpha Forge
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sectors.map((sector) => (
          <button
            key={sector.id}
            type="button"
            onClick={() => router.push(`/screener?sector=${encodeURIComponent(sector.label)}`)}
            className="sector-heatmap-card glass-card rounded-xl px-3 py-3 text-left pressable w-full"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="sector-rank shrink-0 tabular-nums"
                  style={{ color: sector.isLeader ? "#34d399" : sector.isLaggard ? "#f87171" : undefined }}
                >
                  #{sector.rank}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: sector.color }}
                  aria-hidden
                />
                <span className="text-[13px] font-semibold text-white truncate">{sector.label}</span>
              </div>
              <span
                className={`text-[13px] font-bold tabular-nums shrink-0 ${
                  sector.change >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatPercent(sector.change)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sector.barWidth}%`,
                    backgroundColor: sector.change >= 0 ? sector.color : "#f87171",
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="text-[10px] text-zinc-600 font-mono shrink-0">{sector.etf}</span>
            </div>
            {(sector.isLeader || sector.isLaggard) && (
              <p className="text-[10px] mt-1.5 text-zinc-500">
                {sector.isLeader ? "Leading the tape" : "Lagging the tape"}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectorBadge({ label }: { label: string }) {
  if (!label || label === "—") {
    return <span className="text-zinc-600">—</span>;
  }

  const color = sectorColor(label);

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
