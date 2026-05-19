"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatPercent, getSignalColor, getSignalBg } from "@/lib/utils";
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

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    const stored = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("portfolio") || "null")
      : null;
    const portfolio = stored || SAMPLE_PORTFOLIO;

    const holdingData: PortfolioHolding[] = [];
    for (const item of portfolio) {
      try {
        const res = await fetch(`/api/analyze?symbol=${item.symbol}`);
        const data = await res.json();
        const currentPrice = data.quote?.price || item.avgCost;
        const totalValue = currentPrice * item.shares;
        const totalCost = item.avgCost * item.shares;
        holdingData.push({
          symbol: item.symbol,
          name: data.quote?.name || item.symbol,
          shares: item.shares,
          avgCost: item.avgCost,
          currentPrice,
          changePercent: data.quote?.changePercent || 0,
          signal: data.signal?.signal,
          confidence: data.signal?.confidence,
          totalValue,
          totalGain: totalValue - totalCost,
          gainPercent: ((totalValue - totalCost) / totalCost) * 100,
        });
      } catch {
        holdingData.push({
          symbol: item.symbol,
          name: item.symbol,
          shares: item.shares,
          avgCost: item.avgCost,
          currentPrice: item.avgCost,
          changePercent: 0,
          totalValue: item.avgCost * item.shares,
          totalGain: 0,
          gainPercent: 0,
        });
      }
    }
    setHoldings(holdingData);
    setLoading(false);
  }, []);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  const totalGain = holdings.reduce((s, h) => s + h.totalGain, 0);
  const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const pieData = holdings.map((h) => ({
    name: h.symbol,
    value: h.totalValue,
  }));

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-[32px] font-semibold text-white tracking-tight mb-2">Portfolio</h1>
      <p className="text-[14px] text-zinc-400 font-light tracking-tight mb-8">Track your holdings with AI-powered signals and deep analysis</p>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-zinc-800 rounded-xl" />)}
          </div>
          <div className="h-96 bg-zinc-800 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-1">TOTAL VALUE</div>
              <div className="text-3xl font-bold text-white">{formatCurrency(totalValue)}</div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-1">TOTAL P&L</div>
              <div className={`text-3xl font-bold ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
              </div>
              <div className={`text-sm ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(totalGainPercent)}
              </div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-xs text-zinc-500 mb-1">HOLDINGS</div>
              <div className="text-3xl font-bold text-white">{holdings.length}</div>
              <div className="text-sm text-zinc-400">stocks tracked</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Portfolio Allocation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                    formatter={(value) => [formatCurrency(Number(value)), "Value"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">P&L by Holding</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={holdings.map((h) => ({ symbol: h.symbol, gain: h.totalGain }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="symbol" stroke="#52525b" />
                  <YAxis stroke="#52525b" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                    formatter={(value) => [formatCurrency(Number(value)), "P&L"]}
                  />
                  <Bar dataKey="gain" radius={[4, 4, 0, 0]}>
                    {holdings.map((h, index) => (
                      <Cell key={`cell-${index}`} fill={h.totalGain >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">HOLDING</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">SHARES</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">AVG COST</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">CURRENT</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">VALUE</th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">P&L</th>
                  <th className="text-center text-xs text-zinc-500 font-medium px-4 py-3">SIGNAL</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr
                    key={h.symbol}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/stock/${h.symbol}`)}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white">{h.symbol}</div>
                      <div className="text-xs text-zinc-500">{h.name}</div>
                    </td>
                    <td className="text-right px-4 py-4 text-white">{h.shares}</td>
                    <td className="text-right px-4 py-4 text-zinc-400">{formatCurrency(h.avgCost)}</td>
                    <td className="text-right px-4 py-4 text-white font-medium">{formatCurrency(h.currentPrice)}</td>
                    <td className="text-right px-4 py-4 text-white">{formatCurrency(h.totalValue)}</td>
                    <td className="text-right px-4 py-4">
                      <div className={h.totalGain >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {h.totalGain >= 0 ? "+" : ""}{formatCurrency(h.totalGain)}
                      </div>
                      <div className={`text-xs ${h.gainPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatPercent(h.gainPercent)}
                      </div>
                    </td>
                    <td className="text-center px-4 py-4">
                      {h.signal && (
                        <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getSignalBg(h.signal)} ${getSignalColor(h.signal)}`}>
                          {h.signal.toUpperCase()}
                        </span>
                      )}
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
