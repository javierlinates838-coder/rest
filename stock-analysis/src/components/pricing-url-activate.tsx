"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Auto-activate when user lands on /pricing?code=XXX */
export function PricingUrlActivate({
  onActivated,
  onError,
}: {
  onActivated: (message: string) => void;
  onError: (error: string) => void;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    const code = params.get("code")?.trim();
    if (!code || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const res = await fetch("/api/activate-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Activation failed");
        onActivated(data.message);
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        router.replace(url.pathname + (url.search || ""));
        setTimeout(() => router.push("/"), 1800);
      } catch (e) {
        onError(e instanceof Error ? e.message : "Activation failed");
      }
    })();
  }, [params, router, onActivated, onError]);

  return null;
}
