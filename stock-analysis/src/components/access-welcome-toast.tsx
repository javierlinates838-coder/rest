"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TERMS } from "@/lib/brand";

function ToastInner() {
  const params = useSearchParams();
  const access = params.get("access");
  const isActive = access === "lifetime" || access === "trial";
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(() => setHidden(true), 6000);
    return () => clearTimeout(t);
  }, [isActive]);

  if (!isActive || hidden) return null;

  const label =
    access === "lifetime"
      ? `${TERMS.pulseLifetime} active`
      : `${TERMS.pulsePrime} trial active`;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 text-sm font-semibold shadow-lg animate-fadeIn">
      {label} — welcome to the terminal
    </div>
  );
}

export function AccessWelcomeToast() {
  return (
    <Suspense fallback={null}>
      <ToastInner />
    </Suspense>
  );
}
