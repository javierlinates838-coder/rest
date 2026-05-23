"use client";

import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { formatCurrency, formatLargeNumber } from "@/lib/utils";
import type { ChartPoint } from "@/lib/chart-series";

export function StockPriceChart({
  symbol,
  period,
  data,
}: {
  symbol: string;
  period: string;
  data: ChartPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart key={`${symbol}-${period}`} data={data}>
        <defs>
          <linearGradient id={`priceGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis stroke="#52525b" tick={{ fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value) => [formatCurrency(Number(value)), ""]}
        />
        <Area type="monotone" dataKey="price" stroke="#6366f1" fill={`url(#priceGradient-${symbol})`} strokeWidth={2} name="Price" />
        {data.some((d) => d.sma20 > 0) && (
          <Line type="monotone" dataKey="sma20" stroke="#22c55e" dot={false} strokeWidth={1} strokeDasharray="4 4" name="SMA 20" />
        )}
        {data.some((d) => d.sma50 > 0) && (
          <Line type="monotone" dataKey="sma50" stroke="#f59e0b" dot={false} strokeWidth={1} strokeDasharray="4 4" name="SMA 50" />
        )}
        <Legend />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StockVolumeChart({
  symbol,
  period,
  data,
}: {
  symbol: string;
  period: string;
  data: ChartPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart key={`vol-${symbol}-${period}`} data={data.slice(-60)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis stroke="#52525b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(Number(v) / 1e6).toFixed(0)}M`} />
        <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
        <Bar dataKey="volume" fill="#6366f1" opacity={0.6} name="Volume" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StockRadarChart({ data }: { data: { subject: string; value: number; fullMark: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke="#27272a" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 10 }} />
        <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function CompetitorMetricChart({
  title,
  rows,
  formatValue,
  avgLine,
  barFill = "#6366f1",
}: {
  title: string;
  rows: { symbol: string; value: number }[];
  formatValue: (v: number) => string;
  avgLine?: number;
  barFill?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="symbol" stroke="#52525b" />
          <YAxis stroke="#52525b" />
          <Tooltip
            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
            formatter={(value) => [formatValue(Number(value)), title]}
          />
          {avgLine != null && avgLine > 0 && (
            <ReferenceLine y={avgLine} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Avg", fill: "#f59e0b", fontSize: 12 }} />
          )}
          <Bar dataKey="value" fill={barFill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
