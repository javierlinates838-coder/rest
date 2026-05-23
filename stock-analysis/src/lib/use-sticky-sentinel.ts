"use client";

import { useEffect, useState, type RefObject } from "react";

/** Toggle state when a sentinel element scrolls past the top offset. */
export function useStickySentinel(
  ref: RefObject<Element | null>,
  rootMarginTopPx = -60
): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(!entry.isIntersecting);
      },
      { root: null, rootMargin: `${rootMarginTopPx}px 0px 0px 0px`, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMarginTopPx]);

  return active;
}
