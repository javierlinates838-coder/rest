"use client";

import Link from "next/link";
import { TERMS } from "@/lib/brand";

const CAPABILITIES = [
  {
    title: TERMS.edgeShort,
    desc: "A single conviction score derived inside Pulse Terminal — not recycled third-party ratings.",
  },
  {
    title: TERMS.meridianBrief,
    desc: "Narrative research cross-checked against Wilder-native technicals on every symbol.",
  },
  {
    title: TERMS.dataGrade,
    desc: "Integrity grades flag simulated or thin data before you rely on a chart.",
  },
  {
    title: "Volatility Forge",
    desc: "Entries, stops, and targets from ATR math — sized for the tape, not headlines.",
  },
];

export function OnlyHereStrip() {
  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <span className="hero-eyebrow">Pulse Terminal</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3 font-display">
          Built for serious research
        </h2>
        <p className="text-[14px] text-zinc-500 max-w-xl mx-auto mt-3 leading-relaxed">
          Proprietary scores, briefs, and screeners — one terminal, consistent language end to end.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CAPABILITIES.map((item, index) => (
          <div key={item.title} className="vs-card">
            <div className="capability-index mb-3" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </div>
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
