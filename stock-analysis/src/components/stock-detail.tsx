"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useClientNow } from "@/lib/use-client-now";
import {
  IconEarnings, IconDividend, IconFed, IconEconomic, IconSplit, IconGuidance, IconCalendar,
  IconTarget, IconStop, IconBuy, IconArrowUp, IconArrowDown, IconArrowRight,
} from "./icons";

export function AnimatedNumber({ value, format, duration = 800 }: { value: number; format: (n: number) => string; duration?: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(safeValue);

  useEffect(() => {
    const start = display;
    const end = safeValue;
    const startTime = performance.now();

    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue]);

  return <>{format(display)}</>;
}

export function Sparkline({ data, color = "#34d399", width = 80, height = 28 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const isUp = data[data.length - 1] >= data[0];
  const stroke = color === "auto" ? (isUp ? "#34d399" : "#f87171") : color;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-grad-${stroke.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        fill={`url(#sparkline-grad-${stroke.replace("#", "")})`}
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  );
}

export function DayRangeSlider({ low, high, current, label = "Day Range" }: {
  low: number; high: number; current: number; label?: string;
}) {
  if (high <= low) return null;
  const position = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">{label}</span>
        <span className="text-[11px] text-zinc-400 font-light">
          {formatCurrency(low)} – {formatCurrency(high)}
        </span>
      </div>
      <div className="relative h-1.5 bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-emerald-500/30 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-teal-500 shadow-lg shadow-teal-500/50 transition-all duration-700"
          style={{ left: `calc(${position}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-[10px] text-red-400 font-medium">Low</span>
        <span className="text-[11px] font-semibold text-white">{formatCurrency(current)} ({position.toFixed(0)}%)</span>
        <span className="text-[10px] text-emerald-400 font-medium">High</span>
      </div>
    </div>
  );
}

export function MarketSession() {
  const [session, setSession] = useState<{ label: string; color: string; subtitle: string }>({ label: "—", color: "bg-zinc-500", subtitle: "" });
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const utcHours = now.getUTCHours();
      const utcMinutes = now.getUTCMinutes();
      const dayOfWeek = now.getUTCDay();
      const totalMinutes = utcHours * 60 + utcMinutes;

      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const preMarketStart = 9 * 60;
      const marketOpen = 14 * 60 + 30;
      const marketClose = 21 * 60;
      const afterHoursEnd = 25 * 60;

      let label = "Closed";
      let color = "bg-zinc-500";
      let subtitle = "Market Closed";

      if (isWeekday) {
        if (totalMinutes >= preMarketStart && totalMinutes < marketOpen) {
          label = "Pre-Market";
          color = "bg-blue-500";
          subtitle = `Opens in ${formatTimeRemaining(marketOpen - totalMinutes)}`;
        } else if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
          label = "Market Open";
          color = "bg-emerald-500";
          subtitle = `Closes in ${formatTimeRemaining(marketClose - totalMinutes)}`;
        } else if (totalMinutes >= marketClose && totalMinutes < afterHoursEnd) {
          label = "After Hours";
          color = "bg-amber-500";
          subtitle = "Extended trading active";
        }
      } else if (dayOfWeek === 0) {
        subtitle = "Opens Monday";
      } else if (dayOfWeek === 6) {
        subtitle = "Weekend";
      }

      setSession({ label, color, subtitle });
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${session.color} animate-pulse`} />
        <span className="text-[11px] text-zinc-300 font-medium tracking-tight">{session.label}</span>
      </div>
      <span className="text-[10px] text-zinc-600 tracking-wide">{session.subtitle}</span>
      <span className="text-[10px] text-zinc-600 tracking-wide font-mono hidden sm:inline">{time}</span>
    </div>
  );
}

function formatTimeRemaining(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function VolumeGauge({ volume, avgVolume }: { volume: number; avgVolume: number }) {
  if (avgVolume === 0) return null;
  const ratio = volume / avgVolume;
  const pct = Math.min(ratio * 50, 100);
  const isHigh = ratio > 1.5;
  const isVeryHigh = ratio > 2.5;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Volume vs Avg</span>
        <span className={`text-[11px] font-semibold tracking-tight ${isVeryHigh ? "text-red-400" : isHigh ? "text-amber-400" : "text-zinc-400"}`}>
          {ratio.toFixed(2)}× {isVeryHigh ? "(spike!)" : isHigh ? "(elevated)" : ""}
        </span>
      </div>
      <div className="relative h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
            isVeryHigh ? "bg-red-500" : isHigh ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute top-0 left-1/2 w-px h-full bg-zinc-600/50" />
      </div>
      <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5">
        <span>0×</span>
        <span>1× (avg)</span>
        <span>2×+</span>
      </div>
    </div>
  );
}

function ModelEstimatePill() {
  return (
    <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
      Model estimate
    </span>
  );
}

export function TradingPlanCard({ plan, currentPrice }: {
  plan: {
    bias: string;
    entry: { primary: number; secondary: number; aggressive: number };
    targets: { conservative: number; base: number; ambitious: number };
    stopLoss: { tight: number; standard: number; wide: number };
    riskReward: { conservative: number; base: number; ambitious: number };
    positionSize: { percentOfPortfolio: number; sharesPer1k: number };
    timeframe: string;
    notes: string[];
    invalidationLevel: number;
    confidence: number;
  };
  currentPrice: number;
}) {
  const isLong = plan.bias === "long";
  const isShort = plan.bias === "short";

  return (
    <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-[16px] sm:text-[18px] font-semibold text-white tracking-tight">Trading Plan</h3>
            <ModelEstimatePill />
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
              isLong ? "bg-emerald-500/15 text-emerald-400" :
              isShort ? "bg-red-500/15 text-red-400" :
              "bg-zinc-500/15 text-zinc-400"
            }`}>
              {plan.bias === "long" ? "↑ LONG" : plan.bias === "short" ? "↓ SHORT" : "◯ NEUTRAL"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 font-light tracking-tight">{plan.timeframe}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[10px] text-zinc-500 tracking-wider uppercase">Position Size</div>
          <div className="text-[15px] font-semibold text-white">{plan.positionSize.percentOfPortfolio}% of portfolio</div>
          <div className="text-[10px] text-zinc-500">≈ {plan.positionSize.sharesPer1k} shares per $1k</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5">
          <div className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase mb-2">Entry Zone</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Primary</span>
              <span className="text-white font-semibold">{formatCurrency(plan.entry.primary)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Secondary</span>
              <span className="text-zinc-300">{formatCurrency(plan.entry.secondary)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Aggressive</span>
              <span className="text-zinc-300">{formatCurrency(plan.entry.aggressive)}</span>
            </div>
          </div>
        </div>

        <div className="bg-teal-500/5 border border-teal-500/15 rounded-xl p-3.5">
          <div className="text-[9px] text-teal-400 font-bold tracking-widest uppercase mb-2">Profit Targets</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">T1 (R:R {plan.riskReward.conservative})</span>
              <span className="text-white font-semibold">{formatCurrency(plan.targets.conservative)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">T2 (R:R {plan.riskReward.base})</span>
              <span className="text-zinc-300">{formatCurrency(plan.targets.base)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">T3 (R:R {plan.riskReward.ambitious})</span>
              <span className="text-zinc-300">{formatCurrency(plan.targets.ambitious)}</span>
            </div>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3.5">
          <div className="text-[9px] text-red-400 font-bold tracking-widest uppercase mb-2">Stop Loss</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Tight</span>
              <span className="text-zinc-300">{formatCurrency(plan.stopLoss.tight)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Standard</span>
              <span className="text-white font-semibold">{formatCurrency(plan.stopLoss.standard)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Wide</span>
              <span className="text-zinc-300">{formatCurrency(plan.stopLoss.wide)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual range bar */}
      <div className="mb-5">
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2.5">Plan Visualization</div>
        <div className="relative h-2.5 bg-zinc-800/50 rounded-full overflow-hidden">
          <div className="absolute h-full bg-gradient-to-r from-red-500/30 via-zinc-700/40 to-emerald-500/30" style={{ left: 0, right: 0 }} />
          {(() => {
            const allPrices = [plan.stopLoss.wide, plan.stopLoss.standard, plan.entry.primary, currentPrice, plan.targets.conservative, plan.targets.base, plan.targets.ambitious];
            const min = Math.min(...allPrices) * 0.99;
            const max = Math.max(...allPrices) * 1.01;
            const range = max - min;
            const pos = (price: number) => ((price - min) / range) * 100;
            return (
              <>
                <div className="absolute top-0 w-[2px] h-full bg-red-500" style={{ left: `${pos(plan.stopLoss.standard)}%` }} title="Stop Loss" />
                <div className="absolute top-0 w-[2px] h-full bg-emerald-500" style={{ left: `${pos(plan.entry.primary)}%` }} title="Entry" />
                <div className="absolute top-0 w-[2px] h-full bg-teal-400" style={{ left: `${pos(plan.targets.base)}%` }} title="Target" />
                <div
                  className="absolute -top-1 w-3 h-4.5 bg-white rounded-sm shadow-lg shadow-black/60 border border-zinc-900"
                  style={{ left: `calc(${pos(currentPrice)}% - 6px)`, height: "18px" }}
                  title="Current Price"
                />
              </>
            );
          })()}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-between text-[10px] text-zinc-500 mt-2.5">
          <span className="flex items-center gap-1.5"><IconStop size={11} className="text-red-400" /> Stop ${plan.stopLoss.standard.toFixed(2)}</span>
          <span className="flex items-center gap-1.5"><IconArrowRight size={11} className="text-white" /> Now ${currentPrice.toFixed(2)}</span>
          <span className="flex items-center gap-1.5"><IconTarget size={11} className="text-teal-400" /> Target ${plan.targets.base.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2">Trader Notes</div>
        {(plan.notes || []).map((note, i) => {
          const [type, text] = note.includes("|") ? note.split("|") : ["info", note];
          const color =
            type === "warning" ? "text-amber-400 bg-amber-500/10" :
            type === "positive" ? "text-emerald-400 bg-emerald-500/10" :
            type === "lightning" ? "text-yellow-400 bg-yellow-500/10" :
            "text-zinc-500 bg-zinc-800/40";
          return (
            <div key={i} className="text-[11px] text-zinc-300 font-light tracking-tight leading-relaxed flex items-start gap-2.5">
              <span className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-md flex items-center justify-center ${color}`}>
                {type === "warning" ? <IconArrowDown size={10} /> :
                 type === "positive" ? <IconBuy size={10} /> :
                 type === "lightning" ? <IconArrowUp size={10} /> :
                 <IconArrowRight size={10} />}
              </span>
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KeyEventsCard({ events }: { events: { date: string; type: string; title: string; importance: string; description: string; daysAway: number }[] }) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-white tracking-tight">Upcoming Key Events</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Estimated calendar — confirm dates with official sources</p>
        </div>
        <span className="text-[10px] text-zinc-500 tracking-wide shrink-0">Next {events.length}</span>
      </div>
      <div className="space-y-2.5">
        {events.slice(0, 5).map((event, i) => {
          const Icon =
            event.type === "earnings" ? IconEarnings :
            event.type === "dividend" ? IconDividend :
            event.type === "fed" ? IconFed :
            event.type === "economic" ? IconEconomic :
            event.type === "split" ? IconSplit :
            event.type === "guidance" ? IconGuidance :
            IconCalendar;
          const importanceColors = {
            high: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", iconBg: "bg-red-500/10 text-red-400" },
            medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", iconBg: "bg-amber-500/10 text-amber-400" },
            low: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", iconBg: "bg-blue-500/10 text-blue-400" },
          };
          const c = importanceColors[event.importance as keyof typeof importanceColors] || importanceColors.low;
          return (
            <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-white/[0.02] hover:border-white/[0.05] transition-colors animate-fadeInUp stagger-${i + 1}`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[13px] font-semibold text-white tracking-tight">{event.title}</span>
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}>{event.importance}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="font-mono">{event.date}</span>
                  <span className="text-zinc-700">·</span>
                  <span className={event.daysAway < 7 ? "text-amber-400 font-semibold" : "text-zinc-500"}>
                    {event.daysAway === 0 ? "Today" : event.daysAway === 1 ? "Tomorrow" : `In ${event.daysAway} days`}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-light leading-relaxed mt-1 line-clamp-2">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InstitutionalCard({ data }: {
  data: {
    totalInstitutionalPercent: number;
    insiderOwnershipPercent: number;
    retailPercent: number;
    topHolders: { name: string; sharesPercent: number; trend: string }[];
    recentActivity: { holder: string; action: string; sharesPercent: number; date: string }[];
    shortInterestPercent: number;
    daysToCover: number;
    floatPercent: number;
  };
}) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="text-[15px] font-semibold text-white tracking-tight">Ownership Structure</h3>
        <ModelEstimatePill />
      </div>
      <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
        Illustrative institutional breakdown — not sourced from live 13F filings.
      </p>

      {/* Stacked bar */}
      <div className="mb-5">
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className="bg-teal-500/80" style={{ width: `${data.totalInstitutionalPercent}%` }} />
          <div className="bg-emerald-500/80" style={{ width: `${data.insiderOwnershipPercent}%` }} />
          <div className="bg-zinc-600/80" style={{ width: `${data.retailPercent}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 mt-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-teal-500 rounded-full" />
            <span className="text-zinc-400">Institutional</span>
            <span className="text-white font-semibold ml-auto">{data.totalInstitutionalPercent}%</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-zinc-400">Insider</span>
            <span className="text-white font-semibold ml-1">{data.insiderOwnershipPercent}%</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <div className="w-2 h-2 bg-zinc-500 rounded-full" />
            <span className="text-zinc-400">Retail</span>
            <span className="text-white font-semibold ml-1">{data.retailPercent}%</span>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
        <div className="bg-zinc-900/50 rounded-lg p-2.5">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase">Short Interest</div>
          <div className={`text-[14px] font-semibold tracking-tight ${data.shortInterestPercent > 10 ? "text-red-400" : data.shortInterestPercent > 5 ? "text-amber-400" : "text-white"}`}>
            {data.shortInterestPercent}%
          </div>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-2.5">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase">Days to Cover</div>
          <div className="text-[14px] font-semibold text-white tracking-tight">{data.daysToCover}</div>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-2.5">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase">Float</div>
          <div className="text-[14px] font-semibold text-white tracking-tight">{data.floatPercent}%</div>
        </div>
      </div>

      {/* Top holders */}
      <div className="mb-5">
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2">Top Institutional Holders</div>
        <div className="space-y-1.5">
          {(data.topHolders || []).map((h, i) => {
            const TrendIcon = h.trend === "up" ? IconArrowUp : h.trend === "down" ? IconArrowDown : IconArrowRight;
            const trendColor = h.trend === "up" ? "text-emerald-400" : h.trend === "down" ? "text-red-400" : "text-zinc-500";
            return (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.02] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono w-4">{i + 1}.</span>
                  <span className="text-[12px] text-zinc-200 font-medium">{h.name}</span>
                  <span className={trendColor}>
                    <TrendIcon size={11} />
                  </span>
                </div>
                <span className="text-[12px] font-semibold text-white tracking-tight tabular-nums">{h.sharesPercent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2">Recent 13F Activity</div>
        <div className="space-y-1.5">
          {(data.recentActivity || []).map((a, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] py-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                  a.action === "bought" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>{a.action}</span>
                <span className="text-zinc-300 font-medium">{a.holder}</span>
              </div>
              <span className="text-zinc-400 font-mono text-[10px]">+{a.sharesPercent}% • {String(a.date).slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PriceActionCard({ data }: {
  data: {
    intradayMomentum: number; volumeProfile: string;
    buyPressure: number; sellPressure: number;
    averageTrueRangePercent: number; trendStrength: string;
    marketStructure: string;
  };
}) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
      <h3 className="text-[15px] font-semibold text-white tracking-tight mb-4">Price Action Analytics</h3>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Buy/Sell Pressure</span>
          <span className="text-[11px] text-zinc-400">{data.buyPressure}% / {data.sellPressure}%</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
          <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${data.buyPressure}%` }} />
          <div className="bg-red-500 transition-all duration-1000" style={{ width: `${data.sellPressure}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/40 rounded-xl p-3">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase mb-1">Market Structure</div>
          <div className={`text-[13px] font-semibold capitalize ${
            data.marketStructure === "uptrend" ? "text-emerald-400" :
            data.marketStructure === "downtrend" ? "text-red-400" :
            "text-amber-400"
          }`}>{data.marketStructure}</div>
        </div>
        <div className="bg-zinc-900/40 rounded-xl p-3">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase mb-1">Trend Strength</div>
          <div className={`text-[13px] font-semibold capitalize ${
            data.trendStrength === "strong" ? "text-emerald-400" :
            data.trendStrength === "moderate" ? "text-amber-400" :
            "text-zinc-400"
          }`}>{data.trendStrength}</div>
        </div>
        <div className="bg-zinc-900/40 rounded-xl p-3">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase mb-1">5-Day Momentum</div>
          <div className={`text-[13px] font-semibold ${data.intradayMomentum >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {data.intradayMomentum >= 0 ? "+" : ""}{data.intradayMomentum}%
          </div>
        </div>
        <div className="bg-zinc-900/40 rounded-xl p-3">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase mb-1">Volume Profile</div>
          <div className={`text-[13px] font-semibold capitalize ${
            data.volumeProfile === "increasing" ? "text-emerald-400" :
            data.volumeProfile === "decreasing" ? "text-red-400" :
            "text-zinc-400"
          }`}>{data.volumeProfile}</div>
        </div>
        <div className="bg-zinc-900/40 rounded-xl p-3 col-span-2">
          <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase mb-1">Daily Volatility (ATR%)</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-semibold text-white tracking-tight">{data.averageTrueRangePercent}%</span>
            <span className="text-[10px] text-zinc-500">
              {data.averageTrueRangePercent > 3 ? "Elevated" : data.averageTrueRangePercent > 1.5 ? "Normal" : "Low"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function readWatchlistSymbols(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("watchlist");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function QuickActions({ symbol, onRefresh }: { symbol: string; onRefresh?: () => void }) {
  const [watchlistRevision, setWatchlistRevision] = useState(0);
  const [copied, setCopied] = useState(false);
  const inWatchlist = useMemo(() => {
    void watchlistRevision;
    return readWatchlistSymbols().includes(symbol);
  }, [symbol, watchlistRevision]);

  const toggleWatchlist = () => {
    const stored = JSON.parse(localStorage.getItem("watchlist") || "null") || ["AAPL", "TSLA", "NVDA", "GOOGL", "AMD", "MSFT"];
    if (stored.includes(symbol)) {
      const updated = stored.filter((s: string) => s !== symbol);
      localStorage.setItem("watchlist", JSON.stringify(updated));
    } else {
      stored.push(symbol);
      localStorage.setItem("watchlist", JSON.stringify(stored));
    }
    setWatchlistRevision((n) => n + 1);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed right-3 bottom-[5.5rem] sm:right-5 sm:bottom-5 flex flex-row sm:flex-col gap-2 z-40">
      <button
        onClick={toggleWatchlist}
        className={`pressable group glass-card rounded-2xl p-3 hover:glow-border ${inWatchlist ? "border-amber-500/30" : ""}`}
        title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <svg className={`w-5 h-5 ${inWatchlist ? "text-amber-400 fill-amber-400" : "text-zinc-400 group-hover:text-amber-400"}`} fill={inWatchlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
      <button
        onClick={copyLink}
        className="pressable group glass-card rounded-2xl p-3 hover:glow-border"
        title="Copy link"
      >
        {copied ? (
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-zinc-400 group-hover:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={() => onRefresh?.()}
        className="pressable group glass-card rounded-2xl p-3 hover:glow-border"
        title="Refresh data"
      >
        <svg className="w-5 h-5 text-zinc-400 group-hover:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
}

export function NewsFilters({ activeFilter, onFilter, counts }: {
  activeFilter: string;
  onFilter: (f: string) => void;
  counts: { all: number; positive: number; negative: number; neutral: number };
}) {
  const filters = [
    { id: "all", label: "All", count: counts.all, color: "text-zinc-300" },
    { id: "positive", label: "Bullish", count: counts.positive, color: "text-emerald-400" },
    { id: "negative", label: "Bearish", count: counts.negative, color: "text-red-400" },
    { id: "neutral", label: "Neutral", count: counts.neutral, color: "text-zinc-400" },
  ];
  return (
    <div className="scroll-tabs gap-1.5 p-1 bg-zinc-900/40 rounded-xl border border-white/[0.03] w-full max-w-full">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilter(f.id)}
          className={`px-4 py-1.5 rounded-lg text-[12px] font-medium tracking-tight transition-all ${
            activeFilter === f.id
              ? "bg-zinc-800/80 text-white"
              : `${f.color} hover:bg-white/[0.03]`
          }`}
        >
          {f.label}
          <span className="ml-1.5 text-[10px] opacity-60">{f.count}</span>
        </button>
      ))}
    </div>
  );
}

export function SentimentTimeline({ items }: { items: { publishedAt: string; sentiment: string }[] }) {
  const now = useClientNow();
  if (items.length === 0 || now === 0) return null;

  const days = 7;
  const buckets: { positive: number; negative: number; neutral: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - i * 86400000 - (now % 86400000);
    const dayEnd = dayStart + 86400000;
    const bucket = { positive: 0, negative: 0, neutral: 0 };
    for (const item of items) {
      const t = new Date(item.publishedAt).getTime();
      if (t >= dayStart && t < dayEnd) {
        if (item.sentiment === "positive") bucket.positive++;
        else if (item.sentiment === "negative") bucket.negative++;
        else bucket.neutral++;
      }
    }
    buckets.push(bucket);
  }

  const maxBucket = Math.max(...buckets.map((b) => b.positive + b.negative + b.neutral), 1);

  return (
    <div className="glass-card rounded-2xl p-5 mb-5">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[13px] font-semibold text-white tracking-tight">Sentiment Timeline · Last 7 Days</h4>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Bullish</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Bearish</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500" /> Neutral</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-1 h-24">
        {buckets.map((b, i) => {
          const dayLabel = new Date(now - (days - 1 - i) * 86400000).toLocaleDateString("en-US", { weekday: "short" });
          const total = b.positive + b.negative + b.neutral;
          const height = total === 0 ? 4 : (total / maxBucket) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col-reverse" style={{ height: `${height}%`, minHeight: "4px" }}>
                {b.positive > 0 && <div className="bg-emerald-500/80 rounded-t-sm transition-all" style={{ height: `${(b.positive / Math.max(total, 1)) * 100}%` }} />}
                {b.neutral > 0 && <div className="bg-zinc-500/80 transition-all" style={{ height: `${(b.neutral / Math.max(total, 1)) * 100}%` }} />}
                {b.negative > 0 && <div className="bg-red-500/80 transition-all" style={{ height: `${(b.negative / Math.max(total, 1)) * 100}%` }} />}
              </div>
              <span className="text-[9px] text-zinc-600 tracking-wide">{dayLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StickyMiniHeader({ symbol, name, price, change, changePercent, visible }: {
  symbol: string; name: string; price: number; change: number; changePercent: number; visible: boolean;
}) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed top-14 sm:top-[60px] left-0 right-0 z-30 glass-card border-b border-white/[0.04] transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-2.5 flex flex-wrap items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-white tracking-tight">{symbol}</span>
          <span className="text-[12px] text-zinc-500 font-light tracking-tight hidden md:inline">{name}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[16px] font-semibold text-white tracking-tight">{formatCurrency(price)}</span>
          <span className={`text-[12px] font-medium tracking-tight ${changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {change >= 0 ? "+" : ""}{formatCurrency(change)} ({formatPercent(changePercent)})
          </span>
        </div>
      </div>
    </div>
  );
}
