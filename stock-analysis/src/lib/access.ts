/**
 * Full-access detection — open build, cookies, or dev bypass.
 */

import { OPEN_ACCESS } from "@/lib/product-phase";

export const COOKIES = {
  lifetime: "sp_lifetime",
  pro: "sp_pro",
  trialStarted: "sp_trial_started",
  dailyAnalyses: "sp_daily_analyses",
} as const;

export type AccessPlan = "free" | "lifetime" | "trial";

export interface AccessStatus {
  hasFullAccess: boolean;
  plan: AccessPlan;
  isLifetime: boolean;
  isTrial: boolean;
}

/** Read access from cookie store (server). */
export function accessFromCookies(get: (name: string) => { value: string } | undefined): AccessStatus {
  if (OPEN_ACCESS || process.env.SP_DISABLE_LIMITS === "true") {
    return { hasFullAccess: true, plan: "lifetime", isLifetime: true, isTrial: false };
  }

  if (get(COOKIES.lifetime)?.value === "1") {
    return { hasFullAccess: true, plan: "lifetime", isLifetime: true, isTrial: false };
  }

  if (get(COOKIES.pro)?.value === "1") {
    return { hasFullAccess: true, plan: "trial", isLifetime: false, isTrial: true };
  }

  return { hasFullAccess: false, plan: "free", isLifetime: false, isTrial: false };
}
