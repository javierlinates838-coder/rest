"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPercent } from "@/lib/utils";
import { SECTOR_DEFINITIONS, type SectorPerformanceRow } from "@/lib/sectors";

export function SectorHeatmap({
  sectors,
  estimated,
  source,
}: {
  sectors: SectorPerformanceRow[];
  estimated?: boolean;
  source?: string;
  layout?: "full" | "sidebar";
}) {
  const router = useRouter();

  if (sectors.length === 0) {
    return (
      <div className="sector-board-empty rounded-2xl p-8 text-center">
        <p className="text-sm text-zinc-400">Sector rotation data is loading or unavailable.</p>
        <p className="text-[11px] text-zinc-600 mt-2">Retry from the banner above, or check FMP_API_KEY on Vercel.</p>
      </div>
    );
  }

  const leader = sectors.find((s) => s.isLeader) ?? sectors[0];
  const laggard = sectors.find((s) => s.isLaggard) ?? sectors[sectors.length - 1];
  const maxAbs = Math.max(...sectors.map((s) => Math.abs(s.change)), 0.25);

  const sourceLabel = estimated
    ? "Sector ETFs (XLK, XLF, …)"
    : source === "mixed"
      ? "FMP sectors + ETF fill"
      : "FMP sector snapshot";

  return (
    <section className="sector-board mb-10">
      <div className="sector-board-header">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-display tracking-tight">
            Sector rotation
          </h2>
          <p className="text-[12px] text-zinc-500 mt-1">
            {sourceLabel} · {sectors.length} sectors ranked by today&apos;s move
          </p>
        </div>
        <Link href="/screener" className="sector-board-forge-link">
          Open Alpha Forge →
        </Link>
      </div>

      <div className="sector-macro-strip" aria-hidden>
        {sectors.map((s) => (
          <div
            key={s.id}
            className="sector-macro-seg"
            style={{
              flexGrow: Math.max(0.35, Math.abs(s.change) / maxAbs),
              backgroundColor: s.change >= 0 ? s.color : "#f87171",
              opacity: s.change >= 0 ? 0.85 : 0.7,
            }}
            title={`${s.label} ${formatPercent(s.change)}`}
          />
        ))}
      </div>

      <div className="sector-leader-row">
        <MacroHighlight
          tone="up"
          label="Session leader"
          sector={leader}
          onOpen={() => goForge(router, leader.label)}
        />
        <MacroHighlight
          tone="down"
          label="Session laggard"
          sector={laggard}
          onOpen={() => goForge(router, laggard.label)}
        />
      </div>

      <div className="sector-card-grid">
        {sectors.map((sector) => (
          <button
            key={sector.id}
            type="button"
            onClick={() => goForge(router, sector.label)}
            className="sector-card pressable"
          >
            <div className="sector-card-top">
              <span
                className="sector-card-rank"
                style={{
                  color: sector.isLeader ? "#34d399" : sector.isLaggard ? "#f87171" : "#94a3b8",
                }}
              >
                #{sector.rank}
              </span>
              <span className="sector-card-etf">{sector.etf}</span>
            </div>
            <div className="sector-card-name">{sector.label}</div>
            <div
              className={`sector-card-change ${sector.change >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {formatPercent(sector.change)}
            </div>
            <div className="sector-card-bar-track">
              <div
                className="sector-card-bar-fill"
                style={{
                  width: `${sector.barWidth}%`,
                  backgroundColor: sector.change >= 0 ? sector.color : "#f87171",
                }}
              />
            </div>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-zinc-600 mt-4 text-center sm:text-left">
        Tap a sector to screen names in Alpha Forge · ranks are sector ETFs / FMP sector performance, not single stocks
      </p>
    </section>
  );
}

function MacroHighlight({
  tone,
  label,
  sector,
  onOpen,
}: {
  tone: "up" | "down";
  label: string;
  sector: SectorPerformanceRow;
  onOpen: () => void;
}) {
  const up = tone === "up";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`sector-macro-highlight ${up ? "sector-macro-highlight--up" : "sector-macro-highlight--down"}`}
    >
      <span className="sector-macro-highlight-label">{label}</span>
      <span className="sector-macro-highlight-name">{sector.label}</span>
      <span className={`sector-macro-highlight-pct ${up ? "text-emerald-400" : "text-red-400"}`}>
        {formatPercent(sector.change)}
      </span>
      <span className="sector-macro-highlight-etf">{sector.etf}</span>
    </button>
  );
}

function goForge(router: ReturnType<typeof useRouter>, label: string) {
  router.push(`/screener?sector=${encodeURIComponent(label)}&bias=any`);
}

export function SectorBadge({ label }: { label: string }) {
  if (!label || label === "—") {
    return <span className="text-zinc-600">—</span>;
  }

  const def = SECTOR_DEFINITIONS.find((d) => d.label === label);
  const color = def?.color ?? "#64748b";

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
