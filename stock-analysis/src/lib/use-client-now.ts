"use client";

import { useSyncExternalStore } from "react";

/** Cached timestamp — must be stable between store notifications (React #185 if not). */
let snapshot = 0;

function subscribe(onStoreChange: () => void) {
  const tick = () => {
    const next = Date.now();
    if (next !== snapshot) {
      snapshot = next;
      onStoreChange();
    }
  };

  tick();
  const id = setInterval(tick, 60_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return 0;
}

/** Client-only timestamp for relative time labels (updates every minute). */
export function useClientNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
