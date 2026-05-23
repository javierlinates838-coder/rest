"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatPercent, getSignalColor } from "@/lib/utils";
import { smartScoreColor } from "@/lib/smart-score";
import type { ScreenerRow } from "@/lib/screener";
import { ProSectionHeader } from "@/components/pro-section-header";
import { UpgradeGate } from "@/components/upgrade-gate";

type BiasFilter = "any" | "bullish" | "bearish";

const SECTORS = ["all", "Technology", "Healthcare", "Financial Services", "Energy", "Consumer Cyclical"];

export default function ScreenerPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bias, setBias] = useState<BiasFilter>("any");
  const [minScore, setMinScore] = useState(55);
  const [maxRisk, setMaxRisk] = useState("");
  const [sector, setSector] = useState("all");
  const [isPro, setIsPro] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((u) => setIsPro(Boolean(u.isPro)))
      .catch(() => null);
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (bias !== "any") params.set("bias", bias);
      params.set("minSmartScore", String(minScore));
      const res = await fetch(`/api/screener?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Screener failed");
      setRows(data.rows || []);
      setUpdatedAt(data.updatedAt || null);
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
        const params = new URLSearchParams();
        if (bias !== "any") params.set("bias", bias);
        params.set("minSmartScore", String(minScore));
        if (maxRisk) params.set("maxRiskGrade", maxRisk);
        if (sector && sector !== "all") params.set("sector", sector);
        const res = await fetch(`/api/screener?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 403 && data.code === "PRO_REQUIRED") {
          setGateOpen(true);
          throw new Error(data.error);
        }
        if (!res.ok) throw new Error(data.error || "Screener failed");
        setRows(data.rows || []);
        setUpdatedAt(data.updatedAt || null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load screener");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bias, minScore, maxRisk, sector]);

  return (
    <div className="page-shell page-shell-wide">
      <ProSectionHeader
        title="Quant screener"
        subtitle="Universe ranked by Smart Score — signal, risk, momentum fusion"
        badge="ALPHA"
        action={
          <Link href="/pricing" className="command-status-cta pressable">
            Pro filters
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6 ultra-card p-4">
        <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
          {(["any", "bullish", "bearish"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBias(b)}
              className={`px-4 py-2 text-[12px] font-medium capitalize ${
                bias === b ? "bg-teal-600/30 text-teal-200" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400 glass-card rounded-xl px-4 py-2">
          Min score
          <input
            type="range"
            min={40}
            max={80}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-teal-500"
          />
          <span className="text-white font-medium tabular-nums">{minScore}</span>
        </label>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400 rounded-xl px-3 py-2 border border-zinc-800">
          Max risk
          <select
            value={maxRisk}
            onChange={(e) => {
              if (!isPro && e.target.value) {
                setGateOpen(true);
                return;
              }
              setMaxRisk(e.target.value);
            }}
            className="bg-transparent text-white text-[12px] outline-none"
          >
            <option value="">Any</option>
            {["A", "B", "C", "D"].map((g) => (
              <option key={g} value={g}>
                ≤ {g}
              </option>
            ))}
          </select>
          {!isPro && <span className="pro-badge text-[8px]">PRO</span>}
        </label>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400 rounded-xl px-3 py-2 border border-zinc-800">
          Sector
          <select
            value={sector}
            onChange={(e) => {
              if (!isPro && e.target.value !== "all") {
                setGateOpen(true);
                return;
              }
              setSector(e.target.value);
            }}
            className="bg-transparent text-white text-[12px] outline-none max-w-[120px]"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {!isPro && <span className="pro-badge text-[8px]">PRO</span>}
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[12px] font-medium hover:bg-zinc-700 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <UpgradeGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="screener_advanced"
      />

      {error && (
        <div className="glass-card rounded-xl px-4 py-3 mb-6 border border-red-500/20 text-red-200/90 text-sm">
          {error}
        </div>
      )}

      {updatedAt && !loading && (
        <p className="text-[11px] text-zinc-600 mb-3">
          Updated {new Date(updatedAt).toLocaleString()}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card h-16 rounded-xl skeleton-shine" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-zinc-500 text-sm">
          No symbols match filters. Lower min score or check API keys on the server.
        </div>
      ) : (
        <div className="pro-table-wrap table-scroll">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Chg%</th>
                <th className="text-center px-4 py-3">Smart</th>
                <th className="text-center px-4 py-3">Signal</th>
                <th className="text-center px-4 py-3">Risk</th>
                <th className="text-right px-4 py-3">RSI</th>
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
                  <td className={`text-right px-4 py-3.5 tabular-nums ${row.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(row.changePercent)}
                  </td>
                  <td className="text-center px-4 py-3.5">
                    <span className={`score-pill ${smartScoreColor(row.smartScore)}`}>
                      {row.smartScore}
                    </span>
                    <div className="text-[10px] text-zinc-500 mt-1">{row.smartLabel}</div>
                  </td>
                  <td className={`text-center px-4 py-3.5 text-[12px] font-medium ${getSignalColor(row.signal)}`}>
                    {row.signal}
                  </td>
                  <td className="text-center px-4 py-3.5 text-zinc-300">{row.riskGrade}</td>
                  <td className="text-right px-4 py-3.5 text-zinc-400 tabular-nums">{row.rsi}</td>
                  <td className="text-right px-5 py-3.5 text-[11px] text-zinc-500">{row.sector || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
