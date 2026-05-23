"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(max-width: 639px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSnapshot() {
  return window.matchMedia("(max-width: 639px)").matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
