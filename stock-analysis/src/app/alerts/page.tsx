"use client";

import { ProSectionHeader } from "@/components/pro-section-header";
import { TERMS } from "@/lib/brand";

const ALERT_TYPES = [
  { id: "signal", label: "Signal change", desc: "Buy → Hold → Sell transitions" },
  { id: "edge", label: "Edge Index threshold", desc: "Alert when Edge crosses 70 or drops below 40" },
  { id: "risk", label: "Risk grade downgrade", desc: "Grade slips to D or F" },
  { id: "price", label: "Price vs trade plan", desc: "Hits entry, stop, or target levels" },
];

export default function AlertsPage() {
  return (
    <div className="page-shell page-shell-wide max-w-3xl mx-auto">
      <ProSectionHeader
        title={TERMS.signalWire}
        subtitle={`${TERMS.edgeShort}, signal, and plan-level wires — coming soon`}
        badge="WIRE"
      />

      <div className="ultra-card rounded-2xl p-6 mb-6 ultra-card-inner">
        <p className="text-[14px] text-zinc-400 leading-relaxed mb-6">
          Most apps spam price wicks. StockPulse alerts will fire on{" "}
          <strong className="text-white">research changes</strong> — when our model changes conviction,
          not when CNBC sneezes.
        </p>
        <div className="space-y-3">
          {ALERT_TYPES.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.04]"
            >
              <div>
                <div className="text-[14px] font-semibold text-white">{a.label}</div>
                <p className="text-[12px] text-zinc-500 mt-0.5">{a.desc}</p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
