"use client";

/** Monetization gates disabled — component kept for call sites during build phase. */
export function UpgradeGate(_props: {
  open: boolean;
  onClose: () => void;
  feature?: string;
  title?: string;
}) {
  return null;
}
