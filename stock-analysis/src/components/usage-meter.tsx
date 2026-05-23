"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UsageState {
  allowed: boolean;
  remaining: number;
  isPro: boolean;
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
  if (usage.isPro) {
    return (
      <Link
        href="/pricing"
        className={`pro-badge ${compact ? "text-[8px]" : ""} hover:opacity-90`}
        title="Pulse Prime member"
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
        title={`${usage.remaining} analyses left today`}
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
          Daily research quota
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
      {usage.remaining <= 3 && (
        <Link
          href="/pricing"
          className="block mt-2 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
        >
          Upgrade for unlimited →
        </Link>
      )}
    </div>
  );
}
