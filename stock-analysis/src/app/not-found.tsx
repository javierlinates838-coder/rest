import Link from "next/link";
import { PulseFrame } from "@/components/pulse-frame";
import { TERMS, BRAND } from "@/lib/brand";

export default function NotFound() {
  return (
    <div className="page-shell max-w-lg mx-auto py-24 text-center animate-softPop">
      <PulseFrame className="ultra-card rounded-2xl p-10 glow-border">
        <div className="pulse-frame-inner">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-teal-400 mb-3 font-mono">
            Signal lost · 404
          </p>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-3 font-display">
            Off the tape
          </h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            That route isn&apos;t wired into {BRAND.terminal}. Pulse Scan a ticker from {TERMS.pulseHub} instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary pressable px-6 py-2.5 rounded-lg text-white text-sm">
              {TERMS.pulseHub}
            </Link>
            <Link
              href="/stock/AAPL"
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 text-sm font-medium transition-colors font-mono"
            >
              {TERMS.pulseScan} AAPL
            </Link>
          </div>
        </div>
      </PulseFrame>
    </div>
  );
}
