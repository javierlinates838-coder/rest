"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, formatPercent, getSignalColor } from "@/lib/utils";
import { smartScoreColor } from "@/lib/smart-score";
import type { ScreenerRow } from "@/lib/screener";
import { SectorBadge } from "@/components/sector-heatmap";
import { SCREENER_SECTOR_OPTIONS } from "@/lib/sectors";
import { ProSectionHeader } from "@/components/pro-section-header";
import { TERMS } from "@/lib/brand";
import { displayOrDash } from "@/lib/display-labels";
import { fetchJsonWithTimeout } from "@/lib/fetch-json";

type BiasFilter = "any" | "bullish" | "bearish";

const DEFAULT_MIN_SCORE = 0;
const SECTOR_OPTIONS = SCREENER_SECTOR_OPTIONS as readonly string[];

function sectorFromUrl(raw: string | null): string {
  if (raw && SECTOR_OPTIONS.includes(raw)) return raw;
  return "all";
}

function biasFromUrl(raw: string | null): BiasFilter {
  if (raw === "bullish" || raw === "bearish") return raw;
  return "any";
}

interface ScreenerResponse {
  rows?: ScreenerRow[];
  updatedAt?: string;
  universeSize?: number;
  maxSmartScore?: number;
  relaxedFilters?: boolean;
  biasEmpty?: boolean;
  partialData?: boolean;
  sectorKept?: boolean;
  error?: string;
}

export default function ScreenerPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSector = searchParams.get("sector");
  const urlBias = searchParams.get("bias");

  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bias, setBias] = useState<BiasFilter>(() => biasFromUrl(urlBias));
  const [minScore, setMinScore] = useState(DEFAULT_MIN_SCORE);
  const [universeSize, setUniverseSize] = useState(0);
  const [maxSmartScore, setMaxSmartScore] = useState(0);
  const [maxRisk, setMaxRisk] = useState("");
  const [sector, setSector] = useState(() => sectorFromUrl(urlSector));
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [relaxedFilters, setRelaxedFilters] = useState(false);
  const [biasEmpty, setBiasEmpty] = useState(false);
  const [partialData, setPartialData] = useState(false);

  const syncUrl = useCallback(
    (nextBias: BiasFilter, nextSector: string) => {
      const params = new URLSearchParams();
      if (nextSector !== "all") params.set("sector", nextSector);
      if (nextBias !== "any") params.set("bias", nextBias);
      const q = params.toString();
      router.replace(q ? `/screener?${q}` : "/screener", { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    setSector(sectorFromUrl(urlSector));
    setBias(biasFromUrl(urlBias));
  }, [urlSector, urlBias]);

  const fetchScreener = useCallback(async () => {
    const params = new URLSearchParams();
    if (bias !== "any") params.set("bias", bias);
    if (minScore > 0) params.set("minSmartScore", String(minScore));
    if (maxRisk) params.set("maxRiskGrade", maxRisk);
    if (sector && sector !== "all") params.set("sector", sector);
    return fetchJsonWithTimeout<ScreenerResponse>(`/api/screener?${params}`, 90000);
  }, [bias, minScore, maxRisk, sector]);

  const applyResponse = (data: ScreenerResponse) => {
    setRows(data.rows || []);
    setUpdatedAt(data.updatedAt || null);
    setUniverseSize(data.universeSize ?? 0);
    setMaxSmartScore(data.maxSmartScore ?? 0);
    setRelaxedFilters(Boolean(data.relaxedFilters));
    setBiasEmpty(Boolean(data.biasEmpty));
    setPartialData(Boolean(data.partialData));
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScreener();
      applyResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load screener");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchScreener();
        if (cancelled) return;
        applyResponse(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load screener");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchScreener]);

  const setBiasAndUrl = (id: BiasFilter) => {
    setBias(id);
    syncUrl(id, sector);
  };

  const setSectorAndUrl = (value: string) => {
    setSector(value);
    syncUrl(bias, value);
  };

  const resetFilters = () => {
    setBias("any");
    setMinScore(DEFAULT_MIN_SCORE);
    setMaxRisk("");
    setSector("all");
    router.replace("/screener", { scroll: false });
  };

  const filtersActive =
    bias !== "any" || minScore > 0 || maxRisk !== "" || sector !== "all";

  const relaxedMessage = useMemo(() => {
    if (!relaxedFilters) return null;
    if (bias === "bullish") {
      return sector !== "all"
        ? `Showing ${sector} names with positive tape — strict long-bias signals were thin.`
        : "Showing today’s gainers — strict long-bias signals were thin in this scan.";
    }
    if (bias === "bearish") {
      return sector !== "all"
        ? `Showing ${sector} names on negative tape — strict short-bias signals were thin.`
        : "Showing session decliners — strict short-bias signals were thin in this scan.";
    }
    if (sector !== "all") {
      return `Score or risk filters were relaxed — still limited to ${sector}.`;
    }
    return "Score or risk filters were relaxed to surface results.";
  }, [relaxedFilters, bias, sector]);

  return (
    <div className="page-shell page-shell-wide">
      <ProSectionHeader
        title={TERMS.alphaForge}
        subtitle={`Universe ranked by ${TERMS.smartScore} + tape bias · long and short use different sorts`}
        badge="FORGE"
      />

      {sector !== "all" && (
        <div className="glass-card rounded-xl px-4 py-2.5 mb-4 border border-teal-500/20 text-sm text-teal-100/90 flex flex-wrap items-center justify-between gap-2">
          <span>
            Sector: <strong className="text-white">{sector}</strong>
            {bias !== "any" && (
              <span className="text-zinc-500">
                {" "}
                · {bias === "bullish" ? "Long bias" : "Short bias"}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setSectorAndUrl("all")}
            className="text-[11px] text-zinc-400 hover:text-white"
          >
            Clear sector
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6 ultra-card p-4">
        <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
          {(
            [
              { id: "any" as const, label: "All" },
              { id: "bullish" as const, label: "Long bias" },
              { id: "bearish" as const, label: "Short bias" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setBiasAndUrl(id)}
              className={`px-4 py-2 text-[12px] font-medium ${
                bias === id ? "bg-teal-600/30 text-teal-200" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400 glass-card rounded-xl px-4 py-2">
          Min score
          <input
            type="range"
            min={0}
            max={80}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-teal-500"
          />
          <span className="text-white font-medium tabular-nums">{minScore === 0 ? "Any" : minScore}</span>
        </label>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400 rounded-xl px-3 py-2 border border-zinc-800">
          Max risk
          <select
            value={maxRisk}
            onChange={(e) => setMaxRisk(e.target.value)}
            className="bg-transparent text-white text-[12px] outline-none"
          >
            <option value="">Any</option>
            {["A", "B", "C", "D"].map((g) => (
              <option key={g} value={g}>
                ≤ {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400 rounded-xl px-3 py-2 border border-zinc-800 min-w-0">
          Sector
          <select
            value={sector}
            onChange={(e) => setSectorAndUrl(e.target.value)}
            className="bg-transparent text-white text-[12px] outline-none max-w-[180px] truncate"
          >
            {SCREENER_SECTOR_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All sectors" : s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-teal-600/80 text-white text-[12px] font-medium hover:bg-teal-500 disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Refresh"}
        </button>
        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-[12px] hover:text-white"
          >
            Reset filters
          </button>
        )}
      </div>

      {error && (
        <div className="glass-card rounded-xl px-4 py-3 mb-6 border border-red-500/20 text-red-200/90 text-sm flex flex-wrap items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {relaxedMessage && !loading && rows.length > 0 && (
        <div className="glass-card rounded-xl px-4 py-3 mb-4 border border-amber-500/20 text-amber-200/90 text-sm">
          {relaxedMessage}
        </div>
      )}

      {biasEmpty && !loading && rows.length === 0 && (
        <div className="glass-card rounded-xl px-4 py-3 mb-4 border border-zinc-600/40 text-zinc-300 text-sm">
          No symbols match{" "}
          <span className="font-medium text-white">
            {bias === "bearish" ? "short" : bias === "bullish" ? "long" : ""} bias
            {sector !== "all" ? ` in ${sector}` : ""}
          </span>
          . Try <span className="text-white">All</span>, another sector, or tap Refresh.
        </div>
      )}

      {partialData && !loading && (
        <div className="glass-card rounded-xl px-4 py-3 mb-4 border border-zinc-600/40 text-zinc-400 text-sm">
          Live quotes loaded; deep technical scan was limited (API timeout). Tap Refresh to rescan.
        </div>
      )}

      {updatedAt && !loading && (
        <p className="text-[11px] text-zinc-600 mb-3">
          Updated {new Date(updatedAt).toLocaleString()}
          {universeSize > 0 && (
            <>
              {" "}
              · {rows.length} shown · {universeSize} scored
              {maxSmartScore > 0 && ` · top ${TERMS.smartScore} ${maxSmartScore}`}
            </>
          )}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 mb-3">Scanning liquid universe… usually 15–45s.</p>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card h-16 rounded-xl skeleton-shine" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-zinc-500 text-sm space-y-3">
          <p>
            {biasEmpty
              ? `No ${bias === "bearish" ? "short-bias" : "long-bias"} names in the current universe.`
              : "Alpha Forge could not load any symbols."}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="btn-primary pressable px-5 py-2.5 rounded-lg text-white text-sm"
          >
            Retry scan
          </button>
          <p className="text-[11px] text-zinc-600">
            If this keeps happening, add FMP_API_KEY and FINNHUB_API_KEY on Vercel (stock-analysis root).
          </p>
        </div>
      ) : (
        <div className="pro-table-wrap table-scroll">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Chg%</th>
                <th className="text-center px-4 py-3">Bias</th>
                <th className="text-center px-4 py-3">Smart</th>
                <th className="text-center px-4 py-3">Signal</th>
                <th className="text-center px-4 py-3">Risk</th>
                <th className="text-right px-5 py-3">Sector</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.symbol}
                  className="border-b border-zinc-800/40 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => router.push(`/stock/${row.symbol}`)}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-white">{row.symbol}</div>
                    <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">{row.name}</div>
                  </td>
                  <td className="text-right px-4 py-3.5 text-white tabular-nums">{formatCurrency(row.price)}</td>
                  <td
                    className={`text-right px-4 py-3.5 tabular-nums ${row.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {formatPercent(row.changePercent)}
                  </td>
                  <td className="text-center px-4 py-3.5">
                    <ForgeBiasPill bias={row.forgeBias} />
                  </td>
                  <td className="text-center px-4 py-3.5">
                    <span className={`score-pill ${smartScoreColor(row.smartScore)}`}>{row.smartScore}</span>
                    <div className="text-[10px] text-zinc-500 mt-1">{row.smartLabel}</div>
                  </td>
                  <td className={`text-center px-4 py-3.5 text-[12px] font-medium ${getSignalColor(row.signal)}`}>
                    {row.signal}
                  </td>
                  <td className="text-center px-4 py-3.5 text-zinc-300">{row.riskGrade}</td>
                  <td className="text-right px-5 py-3.5">
                    <SectorBadge label={displayOrDash(row.sector)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ForgeBiasPill({ bias }: { bias: ScreenerRow["forgeBias"] }) {
  const styles =
    bias === "bullish"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
      : bias === "bearish"
        ? "bg-red-500/15 text-red-300 border-red-500/25"
        : "bg-zinc-700/40 text-zinc-400 border-zinc-600/40";
  const label = bias === "bullish" ? "Long" : bias === "bearish" ? "Short" : "Neutral";
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${styles}`}>
      {label}
    </span>
  );
}
