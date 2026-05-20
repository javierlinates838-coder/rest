"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 60_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return Date.now();
}

function getServerSnapshot() {
  return 0;
}

/** Client-only timestamp for relative time labels (updates every minute). */
export function useClientNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
