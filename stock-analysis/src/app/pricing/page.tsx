"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LIFETIME,
  PLANS,
  PAID_FEATURES,
  competitorStackTotal,
  lifetimeSavingsVsStack,
  lifetimeVsMonthlyBreakEven,
} from "@/lib/subscription";
import { BETA_MODE, BETA_COPY, PAYMENTS_ENABLED } from "@/lib/product-phase";
import { UsageMeter } from "@/components/usage-meter";
import { BRAND, TERMS } from "@/lib/brand";
import { PulseFrame } from "@/components/pulse-frame";
import { PricingUrlActivate } from "@/components/pricing-url-activate";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [code, setCode] = useState(
    searchParams.get("code") || (BETA_MODE ? LIFETIME.publicCode : "")
  );
  const [email, setEmail] = useState("");
  const [activating, setActivating] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(urlError);

  const stackTotal = competitorStackTotal();
  const savings3yr = lifetimeSavingsVsStack(3);
  const breakEvenMonths = lifetimeVsMonthlyBreakEven(12);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/activate-access", {
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

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setReserving(true);
    setError(null);
    try {
      const res = await fetch("/api/purchase-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setMessage(`Thanks — we'll email ${email} when paid access opens.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="page-shell page-shell-wide max-w-5xl mx-auto">
      <PricingUrlActivate onActivated={setMessage} onError={setError} />

      <PulseFrame className="command-hero text-center mb-8 py-10">
        <div className="pulse-frame-inner">
          <span className="hero-eyebrow">
            {BETA_MODE ? BETA_COPY.eyebrow : "One-time · No subscription trap"}
          </span>
          <h1 className="command-hero-title text-white mb-3 font-display">
            {BETA_MODE ? (
              <>
                <span className="gradient-text">{BETA_COPY.headline}</span>
              </>
            ) : (
              <>
                Pay <span className="gradient-text">once</span>. Own the terminal.
              </>
            )}
          </h1>
          <p className="text-[15px] text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {BETA_MODE ? (
              BETA_COPY.subhead
            ) : (
              <>
                {LIFETIME.tagline} We priced {TERMS.pulsePrime} Lifetime at{" "}
                <strong className="text-white">${LIFETIME.price}</strong> because research tools
                shouldn&apos;t rent you forever.
              </>
            )}
          </p>
        </div>
      </PulseFrame>

      <div className="max-w-xs mx-auto mb-8">
        <UsageMeter />
      </div>

      {/* Activation first in beta */}
      <div id="activate-section" className="ultra-card rounded-2xl p-6 mb-8 ultra-card-inner glow-border relative overflow-hidden">
        <div className="absolute top-4 right-4 pro-badge">{BETA_MODE ? "BETA" : "UNLOCK"}</div>
        <h2 className="text-xl font-bold text-white mb-2 font-display">
          {BETA_MODE ? "Unlock full access" : "Activate your access"}
        </h2>
        <p className="text-[13px] text-zinc-500 mb-4">
          {BETA_COPY.activateHint}{" "}
          <span className="font-mono text-teal-400">{LIFETIME.publicCode}</span>
          {BETA_MODE ? " · trial " : " · Lifetime · Trial "}
          <span className="font-mono text-zinc-400">PULSE14</span>
          {BETA_MODE ? " (30 days)" : " (30 days)"}
          {" · "}
          <Link
            href={`/api/activate-access?code=${LIFETIME.publicCode}`}
            className="text-teal-400 hover:text-teal-300 font-mono text-[12px]"
          >
            one-click activate
          </Link>
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
            {activating ? "Activating…" : "Activate"}
          </button>
        </form>
        {message && <p className="text-emerald-400 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      <div className="ultra-card rounded-2xl p-8 mb-8 ultra-card-inner relative overflow-hidden">
        {!BETA_MODE && <div className="absolute top-4 right-4 pro-badge">BEST VALUE</div>}
        {BETA_MODE ? (
          <>
            <h2 className="text-2xl font-bold text-white font-display mb-2">What you get in beta</h2>
            <p className="text-[14px] text-zinc-400 mb-6 max-w-xl">
              Same full terminal we&apos;ll sell later as {LIFETIME.name} (${LIFETIME.price} planned — not
              charging yet). Focus on mastering scans, Edge, Forge, and exports.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3 mb-2">
              <span className="text-5xl sm:text-6xl font-bold text-white font-mono">${LIFETIME.price}</span>
              <div className="pb-2">
                <span className="text-lg text-zinc-500 line-through font-mono">${LIFETIME.compareAt}</span>
                <p className="text-[12px] text-teal-400 font-semibold">one-time payment</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white font-display mb-2">{LIFETIME.name}</h2>
            <p className="text-[14px] text-zinc-400 mb-6 max-w-xl">
              Everything in {TERMS.pulsePrime} — unlimited {TERMS.pulseScan}, {TERMS.edgeIndex}, exports,
              digests, and future terminal updates.
            </p>
          </>
        )}

        <ul className="grid sm:grid-cols-2 gap-2 mb-8">
          {Object.values(PAID_FEATURES).map((f) => (
            <li key={f.title} className="flex gap-2 text-[12px] text-zinc-300">
              <span className="text-teal-400">✓</span>
              {f.title}
            </li>
          ))}
        </ul>

        {PAYMENTS_ENABLED ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/api/checkout"
              className="btn-primary pressable flex-1 text-center py-3.5 rounded-xl text-sm font-bold"
            >
              Buy Lifetime — ${LIFETIME.price}
            </a>
            <button
              type="button"
              onClick={() => {
                document.getElementById("activate-section")?.scrollIntoView({ behavior: "smooth" });
                setCode(LIFETIME.publicCode);
              }}
              className="flex-1 text-center py-3.5 rounded-xl border border-teal-500/40 bg-teal-500/10 text-teal-200 text-sm font-bold pressable"
            >
              Have a code? Activate
            </button>
          </div>
        ) : (
          <p className="text-[12px] text-zinc-500 font-mono text-center">
            Paid checkout is off during beta · use code {LIFETIME.publicCode} above
          </p>
        )}
      </div>

      {!BETA_MODE && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <div className="pro-metric">
            <div className="pro-metric-label">vs subscriptions</div>
            <div className="pro-metric-value text-lg">${stackTotal}/yr</div>
            <p className="pro-metric-delta text-zinc-500 text-[11px] mt-1">Typical stacked tools</p>
          </div>
          <div className="pro-metric">
            <div className="pro-metric-label">You pay</div>
            <div className="pro-metric-value text-lg text-emerald-400">${LIFETIME.price} once</div>
            <p className="pro-metric-delta text-zinc-500 text-[11px] mt-1">Save ${savings3yr}+ over 3 yrs</p>
          </div>
          <div className="pro-metric">
            <div className="pro-metric-label">Break-even</div>
            <div className="pro-metric-value text-lg">{breakEvenMonths} mo</div>
            <p className="pro-metric-delta text-zinc-500 text-[11px] mt-1">vs monthly research apps</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="ultra-card rounded-2xl p-6 ultra-card-inner">
          <h3 className="text-lg font-bold text-white mb-3 font-display">{PLANS.free.name}</h3>
          <p className="text-3xl font-bold text-white mb-4">$0</p>
          <ul className="space-y-2 text-[13px] text-zinc-400 mb-4">
            <li>✓ {PLANS.free.analysesPerDay} {TERMS.pulseScan}s per day</li>
            <li>✓ {TERMS.edgeShort} preview</li>
            <li>✓ {TERMS.alphaForge} basics</li>
          </ul>
          <Link href="/" className="text-teal-400 text-sm font-medium hover:text-teal-300">
            Start on {TERMS.pulseHub} →
          </Link>
        </div>

        <div className="ultra-card rounded-2xl p-6 ultra-card-inner border border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-400 mb-3">
            {BETA_MODE ? "Later: fair pricing" : "Why not monthly?"}
          </h3>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            {BETA_MODE ? (
              <>
                When we&apos;re ready, lifetime will be about <strong className="text-zinc-300">${LIFETIME.price}</strong>{" "}
                one-time — not another $12/mo trap. For now, ship feedback and learn the terminal.
              </>
            ) : (
              <>
                Subscriptions add up. Lifetime at ${LIFETIME.price} is less than three months of a typical
                research app.
              </>
            )}
          </p>
        </div>
      </div>

      {PAYMENTS_ENABLED && (
        <div className="ultra-card rounded-2xl p-6 mb-6 ultra-card-inner">
          <h3 className="text-lg font-bold text-white mb-2">Reserve Lifetime at ${LIFETIME.price}</h3>
          <p className="text-[13px] text-zinc-500 mb-4">Leave your email for checkout when ready.</p>
          <form onSubmit={handleReserve} className="flex flex-wrap gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm outline-none focus:border-teal-500/50"
            />
            <button
              type="submit"
              disabled={reserving}
              className="btn-primary pressable px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {reserving ? "Saving…" : `Lock $${LIFETIME.price}`}
            </button>
          </form>
        </div>
      )}

      <p className="text-[11px] text-zinc-600 text-center leading-relaxed max-w-lg mx-auto">
        {BRAND.name} is research software, not investment advice. API keys run on your Vercel project.
      </p>
      <Link href="/" className="block text-center text-teal-400 text-sm font-medium mt-6 hover:text-teal-300">
        ← {TERMS.pulseHub}
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="page-shell py-20 text-center text-zinc-500">Loading Access…</div>}>
      <PricingContent />
    </Suspense>
  );
}
