import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function safeNum(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(safeNum(value));
}

export function formatLargeNumber(value: number): string {
  const v = safeNum(value);
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  const v = safeNum(value);
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function getSignalColor(signal: string): string {
  switch (signal.toLowerCase()) {
    case "strong buy":
      return "text-emerald-400";
    case "buy":
      return "text-green-400";
    case "hold":
      return "text-yellow-400";
    case "sell":
      return "text-orange-400";
    case "strong sell":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function getSignalBg(signal: string): string {
  switch (signal.toLowerCase()) {
    case "strong buy":
      return "bg-emerald-500/20 border-emerald-500/50";
    case "buy":
      return "bg-green-500/20 border-green-500/50";
    case "hold":
      return "bg-yellow-500/20 border-yellow-500/50";
    case "sell":
      return "bg-orange-500/20 border-orange-500/50";
    case "strong sell":
      return "bg-red-500/20 border-red-500/50";
    default:
      return "bg-gray-500/20 border-gray-500/50";
  }
}
