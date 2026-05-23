"use client";

import Link from "next/link";
import { TERMS } from "@/lib/brand";

const CAPABILITIES = [
  {
    title: TERMS.edgeShort,
    desc: "One conviction number per symbol, built from your tape and our models.",
  },
  {
    title: TERMS.meridianBrief,
    desc: "Written research checked against the same technical stack on every name.",
  },
  {
    title: TERMS.dataGrade,
    desc: "Flags when a chart or quote is simulated so you know before you trust it.",
  },
  {
    title: "Volatility Forge",
    desc: "Entry, stop, and target levels sized from ATR, not guesswork.",
  },
];

export function OnlyHereStrip() {
  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <span className="hero-eyebrow">{TERMS.pulseHub}</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3 font-display">
          What you get on every symbol
        </h2>
        <p className="text-[14px] text-zinc-500 max-w-xl mx-auto mt-3 leading-relaxed">
          Scores, briefs, and levels in one place. Same layout whether you open AAPL or a small cap.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CAPABILITIES.map((item) => (
          <div key={item.title} className="vs-card">
            <div className="text-[14px] font-bold text-white mb-1 font-display">{item.title}</div>
            <p className="text-[12px] text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link href="/screener" className="btn-primary pressable inline-flex px-8 py-3 rounded-xl text-sm font-bold">
          Open {TERMS.alphaForge}
        </Link>
      </div>
    </section>
  );
}
