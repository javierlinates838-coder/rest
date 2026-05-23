"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LIFETIME } from "@/lib/subscription";
import { BETA_MODE } from "@/lib/product-phase";

interface UsageState {
  allowed: boolean;
  remaining: number;
  isPro: boolean;
  isLifetime?: boolean;
  plan?: string;
  count: number;
  limit: number;
}

export function UsageMeter({ compact = false }: { compact?: boolean }) {
  const [usage, setUsage] = useState<UsageState | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => null);
  }, []);

  if (!usage) return null;

  if (usage.isPro && usage.isLifetime) {
    return (
      <Link
        href="/pricing"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 ${compact ? "" : ""}`}
        title={LIFETIME.name}
      >
        <span className={`font-mono font-bold text-emerald-300 ${compact ? "text-[8px]" : "text-[9px]"}`}>
          LIFETIME
        </span>
      </Link>
    );
  }

  if (usage.isPro) {
    return (
      <Link
        href="/pricing"
        className={`pro-badge ${compact ? "text-[8px]" : ""} hover:opacity-90`}
        title="Full access"
      >
        PRIME
      </Link>
    );
  }

  const pct = Math.min(100, (usage.count / usage.limit) * 100);

  if (compact) {
    return (
      <Link
        href="/pricing"
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 transition-colors"
        title={
          BETA_MODE
            ? `${usage.remaining} scans left · code ${LIFETIME.publicCode}`
            : `${usage.remaining} scans left · Lifetime $${LIFETIME.price}`
        }
      >
        <span className="text-[9px] font-mono font-bold text-amber-200">{usage.remaining}</span>
        <span className="text-[8px] text-amber-200/70 uppercase">left</span>
      </Link>
    );
  }

  return (
    <div className="usage-meter ultra-card p-3 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Daily Pulse Scans
        </span>
        <span className="text-[11px] font-mono text-white">
          {usage.count}/{usage.limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        href="/pricing"
        className="block mt-2 text-[11px] font-semibold text-teal-300 hover:text-teal-200"
      >
        {BETA_MODE
          ? `Full access · code ${LIFETIME.publicCode} →`
          : `Lifetime $${LIFETIME.price} — pay once →`}
      </Link>
    </div>
  );
}
