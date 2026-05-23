"use client";

import { useEffect, useRef } from "react";

/** Run callback on an interval only while the document tab is visible. */
export function useVisiblePoll(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
) {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let id: ReturnType<typeof setInterval> | null = null;

    const run = () => {
      if (document.visibilityState !== "visible") return;
      void saved.current();
    };

    const start = () => {
      if (id != null) return;
      run();
      id = setInterval(run, intervalMs);
    };

    const stop = () => {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs]);
}
