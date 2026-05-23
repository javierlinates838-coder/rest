/**
 * Product phase — payments off while mastering the terminal.
 * Set NEXT_PUBLIC_PAYMENTS_ENABLED=true in Vercel when ready to sell.
 */
export const PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

/** Beta: unlock full access with codes; no checkout pressure */
export const BETA_MODE = !PAYMENTS_ENABLED;

export const BETA_COPY = {
  eyebrow: "Beta · Building the terminal",
  headline: "Master the terminal first",
  subhead:
    "Payments come later. Right now, use a beta code for full access while we polish every surface.",
  activateHint: "Beta code unlocks everything — no card required.",
} as const;
