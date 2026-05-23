"use client";

import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: [
      "8 full AI analyses per day",
      "Live quotes when API keys connected",
      "Basic screener (top ideas)",
      "Watchlist & local portfolio",
      "Compare up to 4 symbols",
    ],
    cta: "Current plan",
    ctaHref: "/",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/ month",
    highlight: true,
    features: [
      "Unlimited deep AI analyses",
      "Advanced screener filters",
      "Priority data refresh",
      "Export-ready research briefs",
      "Early access: alerts & email digests",
    ],
    cta: "Start Pro — coming soon",
    ctaHref: "mailto:support@stockpulse.app?subject=StockPulse%20Pro",
    disabled: false,
  },
];

export default function PricingPage() {
  return (
    <div className="page-shell page-shell-wide max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <span className="hero-eyebrow">Monetization</span>
        <h1 className="text-[32px] sm:text-[40px] font-bold text-white tracking-tight mb-3">
          Simple pricing that scales with you
        </h1>
        <p className="text-[15px] text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Competitors charge $30–$240/yr for screeners and research. StockPulse Pro keeps unlimited
          AI research under one subscription — Stripe checkout ships next.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`glass-card rounded-2xl p-7 ${
              plan.highlight ? "border border-amber-500/30 glow-border" : ""
            }`}
          >
            {plan.highlight && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3">
                Best value
              </span>
            )}
            <h2 className="text-xl font-bold text-white">{plan.name}</h2>
            <div className="mt-2 mb-5">
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              <span className="text-zinc-500 text-sm ml-1">{plan.period}</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-[13px] text-zinc-400">
                  <svg className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            {plan.disabled ? (
              <span className="block w-full text-center py-2.5 rounded-xl bg-zinc-800/80 text-zinc-500 text-sm font-medium">
                {plan.cta}
              </span>
            ) : (
              <a
                href={plan.ctaHref}
                className="block w-full text-center py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
              >
                {plan.cta}
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 text-[12px] text-zinc-500 leading-relaxed space-y-2">
        <p>
          <strong className="text-zinc-400">For developers / demos:</strong> set{" "}
          <code className="text-teal-400/90">SP_DISABLE_LIMITS=true</code> on Vercel to bypass daily caps,
          or cookie <code className="text-teal-400/90">sp_pro=1</code> for Pro simulation.
        </p>
        <p>
          Revenue model: freemium drives signups; Pro converts power users who hit the 8-analysis cap.
          Affiliate broker links and premium data feeds are planned for v2.
        </p>
        <Link href="/" className="text-teal-400 hover:text-teal-300 text-sm font-medium inline-block mt-2">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
