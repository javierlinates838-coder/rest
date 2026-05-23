"use client";

import Link from "next/link";
import { TERMS } from "@/lib/brand";
import { LIFETIME } from "@/lib/subscription";
import { BETA_MODE } from "@/lib/product-phase";

const EDGES = [
  {
    title: TERMS.edgeShort,
    desc: "One conviction number born inside Pulse Terminal — not recycled RSI.",
    icon: "◆",
  },
  {
    title: TERMS.meridianBrief,
    desc: "AI narrative cross-examined against Wilder-native technicals.",
    icon: "⚡",
  },
  {
    title: TERMS.dataGrade,
    desc: "We flag simulated charts. Other apps quietly show fake OHLCV.",
    icon: "◎",
  },
  {
    title: "Volatility Forge",
    desc: "Entries, stops, and targets from ATR math — not influencer vibes.",
    icon: "▣",
  },
];

export function OnlyHereStrip() {
  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <span className="hero-eyebrow">Only on StockPulse</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3 font-display">
          Custom from{" "}
          <span className="gradient-text">first pixel</span> to last export
        </h2>
        <p className="text-[14px] text-zinc-500 max-w-xl mx-auto mt-3 leading-relaxed">
          Generic apps clone each other. Pulse Terminal ships its own language, scores, and surfaces.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {EDGES.map((e) => (
          <div key={e.title} className="vs-card">
            <div className="text-2xl mb-2 opacity-80">{e.icon}</div>
            <div className="text-[14px] font-bold text-white mb-1 font-display">{e.title}</div>
            <p className="text-[12px] text-zinc-500 leading-relaxed">{e.desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link href="/pricing" className="btn-primary pressable inline-flex px-8 py-3 rounded-xl text-sm font-bold">
          {BETA_MODE ? `Beta access · code ${LIFETIME.publicCode}` : `Lifetime $${LIFETIME.price} — one payment`}
        </Link>
        <p className="text-[11px] text-zinc-600 mt-3 font-mono">
          {BETA_MODE
            ? "Payments later — mastering the terminal first"
            : `No subscription · code ${LIFETIME.publicCode} on Access`}
        </p>
      </div>
    </section>
  );
}
