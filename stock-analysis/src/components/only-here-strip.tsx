"use client";

import Link from "next/link";

const EDGES = [
  {
    title: "Edge Index",
    desc: "One proprietary conviction score — not copy-pasted RSI.",
    icon: "◆",
  },
  {
    title: "AI + TA fusion",
    desc: "Gemini narrative cross-checked against Wilder indicators.",
    icon: "⚡",
  },
  {
    title: "Honest data grades",
    desc: "We tell you when charts are simulated — others hide it.",
    icon: "◎",
  },
  {
    title: "ATR trade plans",
    desc: "Entry, stop, and targets from volatility math — not vibes.",
    icon: "▣",
  },
];

export function OnlyHereStrip() {
  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <span className="hero-eyebrow">Why pay for StockPulse</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3">
          Built for investors who are tired of{" "}
          <span className="gradient-text">half-baked tools</span>
        </h2>
        <p className="text-[14px] text-zinc-500 max-w-xl mx-auto mt-3 leading-relaxed">
          Millions of apps show a chart and a generic “Buy.” We ship institutional briefs, risk grades,
          and an Edge Index you can&apos;t get elsewhere.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {EDGES.map((e) => (
          <div key={e.title} className="vs-card">
            <div className="text-2xl mb-2 opacity-80">{e.icon}</div>
            <div className="text-[14px] font-bold text-white mb-1">{e.title}</div>
            <p className="text-[12px] text-zinc-500 leading-relaxed">{e.desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link href="/pricing" className="btn-primary pressable inline-flex px-8 py-3 rounded-xl text-sm font-bold">
          See what Pro unlocks — $12/mo
        </Link>
        <p className="text-[11px] text-zinc-600 mt-3 font-mono">
          Replaces $1,000+/yr of stacked subscriptions
        </p>
      </div>
    </section>
  );
}
