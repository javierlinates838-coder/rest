"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** Avoid SSR/hydration crashes for browser-only UI (charts, etc.). */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
