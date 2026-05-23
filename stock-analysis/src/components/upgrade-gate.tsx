"use client";

import Link from "next/link";
import { PRO_FEATURES } from "@/lib/subscription";

interface UpgradeGateProps {
  open: boolean;
  onClose: () => void;
  feature: keyof typeof PRO_FEATURES;
  title?: string;
}

export function UpgradeGate({ open, onClose, feature, title }: UpgradeGateProps) {
  if (!open) return null;

  const meta = PRO_FEATURES[feature];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="ultra-card max-w-md w-full rounded-2xl ultra-card-inner animate-scaleIn overflow-hidden">
        <div className="brief-terminal-header">
          <span className="brief-terminal-dot" />
          <span>Pro required</span>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {title || meta.title}
          </h2>
          <p className="text-[14px] text-zinc-400 leading-relaxed mb-5">{meta.description}</p>

          <ul className="space-y-2 mb-6">
            {Object.values(PRO_FEATURES)
              .slice(0, 5)
              .map((f) => (
                <li key={f.title} className="flex gap-2 text-[12px] text-zinc-400">
                  <span className="text-teal-400">✓</span>
                  {f.title}
                </li>
              ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Link
              href="/pricing"
              onClick={onClose}
              className="btn-primary pressable w-full text-center py-3 rounded-xl text-sm font-bold"
            >
              Unlock Pro — $12/mo
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-sm text-zinc-500 hover:text-zinc-300"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
