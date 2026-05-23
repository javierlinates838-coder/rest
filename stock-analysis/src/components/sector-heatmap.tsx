"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPercent } from "@/lib/utils";
import { sectorColor, type SectorPerformanceRow } from "@/lib/sectors";

export function SectorHeatmap({
  sectors,
  estimated,
  source,
  layout = "full",
}: {
  sectors: SectorPerformanceRow[];
  estimated?: boolean;
  source?: string;
  layout?: "full" | "sidebar";
}) {
  const router = useRouter();

  if (sectors.length === 0) {
    return (
      <div className="sector-rotation-board ultra-card rounded-2xl p-6">
        <p className="text-sm text-zinc-500">Sector rotation unavailable — add FMP_API_KEY on Vercel and refresh.</p>
      </div>
    );
  }

  const leader = sectors.find((s) => s.isLeader) ?? sectors[0];
  const laggard = sectors.find((s) => s.isLaggard) ?? sectors[sectors.length - 1];
  const maxAbs = Math.max(...sectors.map((s) => Math.abs(s.change)), 0.01);

  const sourceLabel = estimated
    ? "Sector ETFs (XLK, XLF, …)"
    : source === "mixed"
      ? "FMP sectors + ETF fill"
      : "FMP sector snapshot";

  if (layout === "sidebar") {
    return (
      <div>
        <p className="text-[11px] text-zinc-500 mb-3">{sourceLabel}</p>
        <div className="space-y-2">
          {sectors.slice(0, 6).map((s) => (
            <SidebarSectorRow key={s.id} sector={s} onSelect={() => goForge(router, s.label)} />
          ))}
        </div>
        <Link href="/screener" className="text-[11px] text-teal-400 mt-3 inline-block">
          Full rotation board →
        </Link>
      </div>
    );
  }

  return (
    <section className="sector-rotation-board ultra-card rounded-2xl p-4 sm:p-6 mb-10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-white font-display tracking-tight">
              Sector rotation
            </h2>
            <span className="pro-badge">11 SECTORS</span>
            {estimated && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
                ETF proxy
              </span>
            )}
          </div>
          <p className="text-[12px] text-zinc-500 mt-1">{sourceLabel} · tap a row to screen in Alpha Forge</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <LeaderLaggardChip
            tone="up"
            label="Leader"
            name={leader.label}
            etf={leader.etf}
            change={leader.change}
          />
          <LeaderLaggardChip
            tone="down"
            label="Laggard"
            name={laggard.label}
            etf={laggard.etf}
            change={laggard.change}
          />
        </div>
      </div>

      <div className="sector-rotation-grid rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
        {sectors.map((sector) => (
          <button
            key={sector.id}
            type="button"
            onClick={() => goForge(router, sector.label)}
            className="sector-rotation-row w-full text-left pressable px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-white/[0.03] transition-colors"
            style={{
              backgroundImage: `linear-gradient(90deg, ${sector.change >= 0 ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)"} ${Math.min(85, sector.barWidth * 0.85)}%, transparent ${Math.min(85, sector.barWidth * 0.85)}%)`,
            }}
          >
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2.5rem_minmax(0,1fr)_3rem_4.5rem_5.5rem] items-center gap-2 sm:gap-3">
              <span
                className="sector-rank-lg tabular-nums"
                style={{
                  color: sector.isLeader ? "#34d399" : sector.isLaggard ? "#f87171" : "#94a3b8",
                }}
              >
                {sector.rank}
              </span>

              <div className="min-w-0 flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: sector.color }}
                />
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-white truncate">{sector.label}</div>
                  <div className="text-[10px] text-zinc-600 font-mono hidden sm:block">
                    {sector.etf} · {sector.isLeader ? "Leading" : sector.isLaggard ? "Lagging" : "Mid-pack"}
                  </div>
                </div>
              </div>

              <span className="hidden sm:block text-[10px] font-mono text-zinc-500 text-center">
                {sector.etf}
              </span>

              <div className="hidden sm:block col-span-1">
                <div className="h-2 rounded-full bg-zinc-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((Math.abs(sector.change) / maxAbs) * 100)}%`,
                      backgroundColor: sector.change >= 0 ? sector.color : "#f87171",
                    }}
                  />
                </div>
              </div>

              <span
                className={`text-[14px] sm:text-[15px] font-bold tabular-nums text-right ${
                  sector.change >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatPercent(sector.change)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/[0.05]">
        <p className="text-[11px] text-zinc-600">
          Ranked by today&apos;s sector performance · not individual stock picks
        </p>
        <Link
          href="/screener"
          className="text-[12px] font-semibold text-teal-400 hover:text-teal-300"
        >
          Screen all sectors in Alpha Forge
        </Link>
      </div>
    </section>
  );
}

function goForge(router: ReturnType<typeof useRouter>, label: string) {
  router.push(`/screener?sector=${encodeURIComponent(label)}`);
}

function LeaderLaggardChip({
  tone,
  label,
  name,
  etf,
  change,
}: {
  tone: "up" | "down";
  label: string;
  name: string;
  etf: string;
  change: number;
}) {
  const up = tone === "up";
  return (
    <div
      className={`rounded-xl px-3 py-2 min-w-[120px] border ${
        up ? "border-emerald-500/25 bg-emerald-500/8" : "border-red-500/25 bg-red-500/8"
      }`}
    >
      <div className={`text-[9px] font-bold uppercase tracking-widest ${up ? "text-emerald-500/80" : "text-red-400/80"}`}>
        {label}
      </div>
      <div className="text-[13px] font-semibold text-white truncate">{name}</div>
      <div className={`text-[12px] font-bold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
        {formatPercent(change)}
        <span className="text-[10px] text-zinc-600 font-mono font-normal ml-1">{etf}</span>
      </div>
    </div>
  );
}

function SidebarSectorRow({
  sector,
  onSelect,
}: {
  sector: SectorPerformanceRow;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left glass-card rounded-lg px-3 py-2 pressable">
      <div className="flex justify-between items-center">
        <span className="text-[12px] text-zinc-300">{sector.label}</span>
        <span className={sector.change >= 0 ? "text-emerald-400 text-[12px]" : "text-red-400 text-[12px]"}>
          {formatPercent(sector.change)}
        </span>
      </div>
    </button>
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
