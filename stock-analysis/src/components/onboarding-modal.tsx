"use client";

import { useEffect, useState } from "react";
import { BRAND, TERMS } from "@/lib/brand";
import { BrandLogo } from "@/components/brand-logo";

const STORAGE_KEY = "sp_onboarded_v2";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm">
      <div
        className="ultra-card rounded-2xl w-full max-w-md p-6 sm:p-8 animate-fadeIn shadow-2xl ultra-card-inner"
        role="dialog"
        aria-labelledby="onboard-title"
      >
        <div className="flex items-center gap-3 mb-4">
          <BrandLogo size={44} />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-teal-400">{BRAND.terminal}</div>
            <h2 id="onboard-title" className="text-xl font-bold text-white tracking-tight font-display">
              Welcome to {BRAND.name}
            </h2>
          </div>
        </div>
        <ul className="space-y-2.5 text-[13px] text-zinc-400 mb-6">
          <li className="flex gap-2">
            <span className="text-teal-400 shrink-0 font-mono">01</span>
            <span>
              Run a <strong className="text-zinc-200">{TERMS.pulseScan}</strong> — {TERMS.meridianBrief} meets Wilder technicals.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-400 shrink-0 font-mono">02</span>
            <span>
              Read your <strong className="text-zinc-200">{TERMS.edgeIndex}</strong> — conviction only we calculate.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-400 shrink-0 font-mono">03</span>
            <span>
              Hunt ideas in <strong className="text-zinc-200">{TERMS.alphaForge}</strong> · compare in {TERMS.twinLens}.
            </span>
          </li>
        </ul>
        <p className="text-[11px] text-zinc-500 mb-5 font-mono">
          Full terminal access while we build — no paywalls.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="w-full px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
        >
          Enter terminal
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="w-full mt-3 text-[11px] text-zinc-600 hover:text-zinc-400"
        >
          Don&apos;t show again
        </button>
      </div>
    </div>
  );
}
