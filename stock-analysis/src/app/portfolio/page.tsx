"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";
import {
  readPortfolio,
  savePortfolio,
  clearPortfolio,
  type PortfolioEntry,
} from "@/lib/portfolio-storage";
import { ClientOnly } from "@/components/client-only";
import { ProSectionHeader } from "@/components/pro-section-header";
import { TERMS } from "@/lib/brand";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  changePercent: number;
  signal?: string;
  confidence?: number;
  totalValue: number;
  totalGain: number;
  gainPercent: number;
}

const SAMPLE_PORTFOLIO = [
  { symbol: "AAPL", shares: 50, avgCost: 150 },
  { symbol: "MSFT", shares: 30, avgCost: 320 },
  { symbol: "NVDA", shares: 25, avgCost: 450 },
  { symbol: "GOOGL", shares: 20, avgCost: 130 },
  { symbol: "TSLA", shares: 15, avgCost: 200 },
  { symbol: "AMD", shares: 40, avgCost: 110 },
];

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export default function PortfolioPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSample, setIsSample] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PortfolioEntry[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newCost, setNewCost] = useState("");
  const holdingsLoadGen = useRef(0);

  const loadHoldings = (portfolio: { symbol: string; shares: number; avgCost: number }[]) => {
    return Promise.all(
      portfolio.map(async (item) => {
        try {
          const data = await fetchJson<{
            quote?: { name: string; price: number; changePercent: number };
          }>(`/api/stock?symbol=${encodeURIComponent(item.symbol)}&period=1m`);
          const currentPrice = data.quote?.price || item.avgCost;
          const totalValue = currentPrice * item.shares;
          const totalCost = item.avgCost * item.shares;
          return {
            symbol: item.symbol,
            name: data.quote?.name || item.symbol,
            shares: item.shares,
            avgCost: item.avgCost,
            currentPrice,
            changePercent: data.quote?.changePercent || 0,
            totalValue,
            totalGain: totalValue - totalCost,
            gainPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
          } satisfies PortfolioHolding;
        } catch {
          const totalCost = item.avgCost * item.shares;
          return {
            symbol: item.symbol,
            name: item.symbol,
            shares: item.shares,
            avgCost: item.avgCost,
            currentPrice: item.avgCost,
            changePercent: 0,
            totalValue: totalCost,
            totalGain: 0,
            gainPercent: 0,
          } satisfies PortfolioHolding;
        }
      })
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = readPortfolio();
      const portfolio = stored && stored.length > 0 ? stored : SAMPLE_PORTFOLIO;
      if (!cancelled) setIsSample(!stored || stored.length === 0);

      const results = await loadHoldings(portfolio);

      if (!cancelled) {
        setHoldings(results);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startEdit = () => {
    const stored = readPortfolio();
    setDraft(stored && stored.length > 0 ? [...stored] : [...SAMPLE_PORTFOLIO]);
    setEditing(true);
  };

  const saveEdit = async () => {
    const gen = ++holdingsLoadGen.current;
    savePortfolio(draft);
    setIsSample(false);
    setEditing(false);
    setLoading(true);
    const results = await loadHoldings(draft);
    if (gen !== holdingsLoadGen.current) return;
    setHoldings(results);
    setLoading(false);
  };

  const addDraftRow = () => {
    const sym = newSymbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
    const shares = parseFloat(newShares);
    const avgCost = parseFloat(newCost);
    if (!sym || !shares || !avgCost) return;
    setDraft((d) => [...d.filter((x) => x.symbol !== sym), { symbol: sym, shares, avgCost }]);
    setNewSymbol("");
    setNewShares("");
    setNewCost("");
  };

  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  const totalGain = holdings.reduce((s, h) => s + h.totalGain, 0);
  const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const pieData = holdings.map((h) => ({
    name: h.symbol,
    value: h.totalValue,
  }));

  return (
    <div className="page-shell page-shell-wide">
      <ProSectionHeader
        title={TERMS.theLedger}
        subtitle={`Live marks · P&L · tap any row for ${TERMS.pulseScan}`}
        badge="LEDGER"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {!editing ? (
          <>
            <button
              type="button"
              onClick={startEdit}
              className="px-4 py-2 rounded-xl bg-teal-600/20 border border-teal-500/30 text-teal-200 text-sm font-medium hover:bg-teal-600/30"
            >
              Edit holdings
            </button>
            {isSample && (
              <span className="text-[12px] text-zinc-500 self-center">Demo data — save your own positions</span>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void saveEdit()}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
            >
              Save portfolio
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const gen = ++holdingsLoadGen.current;
                clearPortfolio();
                setDraft([]);
                setEditing(false);
                setIsSample(true);
                setLoading(true);
                void loadHoldings(SAMPLE_PORTFOLIO).then((r) => {
                  if (gen !== holdingsLoadGen.current) return;
                  setHoldings(r);
                  setLoading(false);
                });
              }}
              className="px-4 py-2 rounded-xl text-zinc-500 text-sm hover:text-zinc-300"
            >
              Reset to demo
            </button>
          </>
        )}
      </div>

      {editing && (
        <div className="glass-card rounded-xl p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Your positions</h3>
          {draft.map((row, i) => (
            <div key={row.symbol} className="flex flex-wrap gap-2 items-center text-sm">
              <span className="font-bold text-white w-16">{row.symbol}</span>
              <input
                type="number"
                value={row.shares}
                onChange={(e) => {
                  const shares = parseFloat(e.target.value) || 0;
                  setDraft((d) => d.map((x, j) => (j === i ? { ...x, shares } : x)));
                }}
                className="w-20 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white"
                placeholder="Shares"
              />
              <input
                type="number"
                value={row.avgCost}
                onChange={(e) => {
                  const avgCost = parseFloat(e.target.value) || 0;
                  setDraft((d) => d.map((x, j) => (j === i ? { ...x, avgCost } : x)));
                }}
                className="w-24 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white"
                placeholder="Avg cost"
              />
              <button
                type="button"
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                className="text-red-400/80 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
            <input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="Symbol"
              className="w-20 px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
            />
            <input
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
              placeholder="Shares"
              className="w-20 px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
            />
            <input
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              placeholder="Avg cost"
              className="w-24 px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
            />
            <button
              type="button"
              onClick={addDraftRow}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-sm"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-28 rounded-xl skeleton-shine" />)}
          </div>
          <div className="glass-card h-96 rounded-xl skeleton-shine" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="pro-metric">
              <div className="pro-metric-label">Total value</div>
              <div className="pro-metric-value">{formatCurrency(totalValue)}</div>
            </div>
            <div className="pro-metric">
              <div className="pro-metric-label">Total gain/loss</div>
              <div className={`pro-metric-value ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
              </div>
            </div>
            <div className="pro-metric">
              <div className="pro-metric-label">Return</div>
              <div className={`pro-metric-value ${totalGainPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(totalGainPercent)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Allocation</h3>
              <ClientOnly fallback={<div className="min-h-[250px] skeleton-shine rounded-lg" />}>
                <div className="min-h-[250px]">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                </div>
              </ClientOnly>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Position Values</h3>
              <ClientOnly fallback={<div className="min-h-[250px] skeleton-shine rounded-lg" />}>
                <div className="min-h-[250px]">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={holdings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="symbol" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="totalValue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </ClientOnly>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden pro-table-wrap table-scroll">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase">
                  <th className="text-left px-6 py-3">Symbol</th>
                  <th className="text-right px-4 py-3">Shares</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Value</th>
                  <th className="text-right px-4 py-3">Gain</th>
                  <th className="text-right px-6 py-3">Today</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr
                    key={h.symbol}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                    onClick={() => router.push(`/stock/${h.symbol}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{h.symbol}</div>
                      <div className="text-xs text-zinc-500">{h.name}</div>
                    </td>
                    <td className="text-right px-4 py-4 text-zinc-300">{h.shares}</td>
                    <td className="text-right px-4 py-4 text-white">{formatCurrency(h.currentPrice)}</td>
                    <td className="text-right px-4 py-4 text-white">{formatCurrency(h.totalValue)}</td>
                    <td className={`text-right px-4 py-4 font-medium ${h.totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercent(h.gainPercent)}
                    </td>
                    <td className={`text-right px-6 py-4 ${h.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercent(h.changePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
