"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatPercent, getSignalColor, getSignalBg } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("portfolio") || "null")
        : null;
      const portfolio = Array.isArray(stored) && stored.length > 0 ? stored : SAMPLE_PORTFOLIO;
      if (!cancelled) setIsSample(!stored || stored.length === 0);

      const results = await Promise.all(
        portfolio.map(async (item: { symbol: string; shares: number; avgCost: number }) => {
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

      if (!cancelled) {
        setHoldings(results);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
      <h1 className="text-[32px] font-semibold text-white tracking-tight mb-2">Portfolio</h1>
      <p className="text-[14px] text-zinc-400 font-light tracking-tight mb-4">
        Holdings overview with live quotes — tap a row for full AI analysis
      </p>

      {isSample && (
        <div className="glass-card rounded-xl px-4 py-3 mb-6 border border-indigo-500/20 bg-indigo-500/5 text-[12px] text-indigo-200/90 leading-relaxed">
          Showing a <strong className="font-medium text-white">demo portfolio</strong> for illustration.
          Custom portfolios will be supported in a future update.
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
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-1">TOTAL VALUE</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-1">TOTAL GAIN/LOSS</div>
              <div className={`text-2xl font-bold ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
              </div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-1">RETURN</div>
              <div className={`text-2xl font-bold ${totalGainPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(totalGainPercent)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Allocation</h3>
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
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Position Values</h3>
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
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
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
