"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PLANS,
  PRO_FEATURES,
  COMPETITOR_STACK,
  competitorStackTotal,
  stockPulseAnnualSavings,
} from "@/lib/subscription";
import { UsageMeter } from "@/components/usage-meter";
import { BRAND, TERMS } from "@/lib/brand";
import { PulseFrame } from "@/components/pulse-frame";

export default function PricingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(true);
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const proPrice = annual ? `$${PLANS.pro.priceAnnual}` : `$${PLANS.pro.priceMonthly}`;
  const proPeriod = annual ? "/ year" : "/ month";
  const stackTotal = competitorStackTotal();
  const savings = stockPulseAnnualSavings();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/activate-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Activation failed");
      setMessage(data.message);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="page-shell page-shell-wide max-w-5xl mx-auto">
      <PulseFrame className="command-hero text-center mb-8 py-10">
        <div className="pulse-frame-inner">
        <span className="hero-eyebrow">{BRAND.name} Access</span>
        <h1 className="command-hero-title text-white mb-3 font-display">
          One terminal. <span className="gradient-text">Pulse Prime.</span>
        </h1>
        <p className="text-[15px] text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {BRAND.tagline}. {TERMS.pulsePrime} unlocks unlimited {TERMS.pulseScan}, {TERMS.edgeIndex}, exports, and digests.
        </p>
        </div>
      </PulseFrame>

      <div className="max-w-xs mx-auto mb-10">
        <UsageMeter />
      </div>

      {/* ROI calculator */}
      <div className="ultra-card rounded-2xl p-6 mb-10 ultra-card-inner">
        <h2 className="text-lg font-bold text-white mb-4">What you&apos;re replacing</h2>
        <div className="space-y-2 mb-4">
          {COMPETITOR_STACK.map((c) => (
            <div key={c.name} className="flex justify-between text-[13px]">
              <span className="text-zinc-400">{c.name}</span>
              <span className="font-mono text-zinc-300">${c.cost}/yr</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-zinc-800 pt-3 text-sm font-semibold">
          <span className="text-zinc-400">Stacked total</span>
          <span className="font-mono text-red-400/90 line-through">${stackTotal}/yr</span>
        </div>
        <div className="flex justify-between mt-2 text-sm font-bold">
          <span className="text-teal-400">StockPulse Pro (annual)</span>
          <span className="font-mono text-emerald-400">${PLANS.pro.priceAnnual}/yr</span>
        </div>
        <p className="text-[12px] text-amber-200/90 mt-3 font-mono">
          You save ${savings}+/yr vs buying the same capabilities separately
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!annual ? "bg-teal-600/30 text-teal-200" : "text-zinc-500"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${annual ? "bg-teal-600/30 text-teal-200" : "text-zinc-500"}`}
        >
          Annual (save 31%)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="ultra-card rounded-2xl p-7 ultra-card-inner">
          <h2 className="text-xl font-bold text-white">Free</h2>
          <div className="mt-2 mb-5">
            <span className="text-4xl font-bold text-white">$0</span>
          </div>
          <ul className="space-y-2.5 mb-6 text-[13px] text-zinc-400">
            <li>✓ 8 full AI analyses / day</li>
            <li>✓ {TERMS.smartScore} + basic {TERMS.edgeShort} preview</li>
            <li>✓ Screener (bias + min score)</li>
            <li>✓ Compare 4 symbols</li>
          </ul>
          <span className="block w-full text-center py-2.5 rounded-xl bg-zinc-800/80 text-zinc-500 text-sm">
            Start free on dashboard
          </span>
        </div>

        <div className="ultra-card rounded-2xl p-7 ultra-card-inner glow-border">
          <span className="pro-badge mb-3 inline-block">RECOMMENDED</span>
          <h2 className="text-xl font-bold text-white font-display">{TERMS.pulsePrime}</h2>
          <div className="mt-2 mb-5">
            <span className="text-4xl font-bold text-white font-mono">{proPrice}</span>
            <span className="text-zinc-500 text-sm ml-1">{proPeriod}</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {Object.values(PRO_FEATURES).map((f) => (
              <li key={f.title} className="flex gap-2 text-[13px] text-zinc-300">
                <span className="text-teal-400 shrink-0">✓</span>
                <span>
                  <strong className="text-white font-medium">{f.title}</strong>
                  <span className="text-zinc-500"> — {f.description}</span>
                </span>
              </li>
            ))}
          </ul>
          <a
            href="mailto:support@stockpulse.app?subject=StockPulse%20Pro%20Checkout"
            className="btn-primary pressable block w-full text-center py-3 rounded-xl text-sm font-bold mb-3"
          >
            Join waitlist — Stripe soon
          </a>
        </div>
      </div>

      {/* Beta activation */}
      <div className="ultra-card rounded-2xl p-6 mb-8 ultra-card-inner">
        <h3 className="text-lg font-bold text-white mb-2">Have a beta code?</h3>
        <p className="text-[13px] text-zinc-500 mb-4">
          Unlock Pro instantly for 30 days. Try code <span className="font-mono text-teal-400">PULSE14</span> during launch.
        </p>
        <form onSubmit={handleActivate} className="flex flex-wrap gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ACCESS CODE"
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm focus:border-teal-500/50 outline-none"
          />
          <button
            type="submit"
            disabled={activating}
            className="btn-primary pressable px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {activating ? "Activating…" : "Activate Pro"}
          </button>
        </form>
        {message && <p className="text-emerald-400 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      <p className="text-[11px] text-zinc-600 text-center">
        Not financial advice. Cancel anytime when billing launches.
      </p>
      <Link href="/" className="block text-center text-teal-400 text-sm font-medium mt-6 hover:text-teal-300">
        ← Back to terminal
      </Link>
    </div>
  );
}
