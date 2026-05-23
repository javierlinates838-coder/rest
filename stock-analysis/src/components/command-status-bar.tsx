"use client";

import Link from "next/link";
import { BRAND, TERMS } from "@/lib/brand";

interface CommandStatusBarProps {
  indicesCount?: number;
  trendingCount?: number;
  loading?: boolean;
}

export function CommandStatusBar({ indicesCount = 0, trendingCount = 0, loading }: CommandStatusBarProps) {
  return (
    <div className="command-status-bar animate-fadeIn">
      <div className="command-status-inner">
        <div className="command-status-cluster">
          <span className="command-status-label">{BRAND.terminal}</span>
          <span className="command-status-value font-mono">
            {loading ? "—" : "Live"}
          </span>
        </div>
        <div className="command-status-divider" aria-hidden />
        <div className="command-status-cluster">
          <span className="command-status-label">Indices</span>
          <span className="command-status-value font-mono tabular-nums">
            {loading ? "···" : indicesCount}
          </span>
        </div>
        <div className="command-status-divider hidden sm:block" aria-hidden />
        <div className="command-status-cluster hidden sm:flex">
          <span className="command-status-label">Universe</span>
          <span className="command-status-value font-mono tabular-nums">
            {loading ? "···" : trendingCount}
          </span>
        </div>
        <div className="flex-1 hidden lg:block" />
        <Link href="/screener" className="command-status-cta pressable">
          {TERMS.alphaForge}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
