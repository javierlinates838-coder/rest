"use client";

import { useState } from "react";
import Link from "next/link";
import { ProSectionHeader } from "@/components/pro-section-header";
import { UpgradeGate } from "@/components/upgrade-gate";
import { TERMS } from "@/lib/brand";

const ALERT_TYPES = [
  { id: "signal", label: "Signal change", desc: "Buy → Hold → Sell transitions", pro: true },
  { id: "edge", label: "Edge Index threshold", desc: "Alert when Edge crosses 70 or drops below 40", pro: true },
  { id: "risk", label: "Risk grade downgrade", desc: "Grade slips to D or F", pro: true },
  { id: "price", label: "Price vs trade plan", desc: "Hits entry, stop, or target levels", pro: true },
];

export default function AlertsPage() {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <div className="page-shell page-shell-wide max-w-3xl mx-auto">
      <ProSectionHeader
        title={TERMS.signalWire}
        subtitle={`${TERMS.edgeShort}, signal, and plan-level wires — email delivery in beta`}
        badge="WIRE"
      />

      <div className="ultra-card rounded-2xl p-6 mb-6 ultra-card-inner">
        <p className="text-[14px] text-zinc-400 leading-relaxed mb-6">
          Most apps spam price wicks. StockPulse alerts fire on{" "}
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
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white">{a.label}</span>
                  <span className="pro-badge text-[8px]">PRO</span>
                </div>
                <p className="text-[12px] text-zinc-500 mt-0.5">{a.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="pressable px-3 py-1.5 rounded-lg border border-zinc-700 text-[11px] text-zinc-400 hover:text-white"
              >
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/pricing" className="btn-primary pressable inline-flex px-8 py-3 rounded-xl text-sm font-bold">
          Wire alerts with {TERMS.pulsePrime}
        </Link>
      </div>

      <UpgradeGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="price_alerts"
        title="Smart alerts are Pro-only"
      />
    </div>
  );
}
