"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LIFETIME } from "@/lib/subscription";
import { TERMS } from "@/lib/brand";
import { PulseFrame } from "@/components/pulse-frame";

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "ok" | "manual" | "error">(() =>
    sessionId ? "loading" : "manual"
  );
  const [message, setMessage] = useState<string | null>(() =>
    sessionId ? null : "If you already paid, enter your access code on the Access page."
  );

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/verify-checkout?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Verification failed");
        setStatus("ok");
        setMessage(data.message);
        setTimeout(() => router.push("/"), 2500);
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setMessage(e instanceof Error ? e.message : "Verification failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <div className="page-shell page-shell-wide max-w-lg mx-auto text-center py-16">
      <PulseFrame className="command-hero py-10 mb-6">
        <div className="pulse-frame-inner">
          {status === "loading" && (
            <>
              <span className="hero-eyebrow">Processing</span>
              <h1 className="command-hero-title text-white font-display">Confirming payment…</h1>
              <p className="text-zinc-400 text-sm mt-3">Unlocking {TERMS.pulseLifetime}</p>
            </>
          )}
          {status === "ok" && (
            <>
              <span className="hero-eyebrow text-emerald-400">Success</span>
              <h1 className="command-hero-title text-white font-display">You&apos;re in.</h1>
              <p className="text-emerald-300/90 text-sm mt-3">{message}</p>
              <p className="text-zinc-500 text-xs mt-4">Redirecting to {TERMS.pulseHub}…</p>
            </>
          )}
          {(status === "manual" || status === "error") && (
            <>
              <span className="hero-eyebrow">Almost there</span>
              <h1 className="command-hero-title text-white font-display">Finish activation</h1>
              <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{message}</p>
              <p className="text-[11px] text-zinc-500 mt-4 font-mono">
                Lifetime code: {LIFETIME.publicCode}
              </p>
            </>
          )}
        </div>
      </PulseFrame>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/pricing" className="btn-primary pressable px-6 py-3 rounded-xl text-sm font-bold">
          Enter access code
        </Link>
        <Link href="/" className="pressable px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm">
          {TERMS.pulseHub}
        </Link>
      </div>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell py-20 text-center text-zinc-500 text-sm">Loading…</div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
