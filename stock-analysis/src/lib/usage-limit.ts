import { cookies } from "next/headers";
import { accessFromCookies, COOKIES, type AccessPlan } from "@/lib/access";

export const FREE_DAILY_ANALYSES = 8;

interface UsageState {
  date: string;
  count: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseUsage(raw: string | undefined): UsageState {
  if (!raw) return { date: todayKey(), count: 0 };
  try {
    const parsed = JSON.parse(raw) as UsageState;
    if (parsed.date === todayKey()) return parsed;
  } catch {
    /* ignore */
  }
  return { date: todayKey(), count: 0 };
}

export async function getAccessStatus() {
  const store = await cookies();
  return accessFromCookies((name) => store.get(name));
}

export async function getAnalysisUsage(): Promise<{
  allowed: boolean;
  remaining: number;
  isPro: boolean;
  isLifetime: boolean;
  plan: AccessPlan;
  count: number;
}> {
  const access = await getAccessStatus();

  if (access.hasFullAccess) {
    return {
      allowed: true,
      remaining: 999,
      isPro: true,
      isLifetime: access.isLifetime,
      plan: access.plan,
      count: 0,
    };
  }

  const store = await cookies();
  const usage = parseUsage(store.get(COOKIES.dailyAnalyses)?.value);
  const remaining = Math.max(0, FREE_DAILY_ANALYSES - usage.count);

  return {
    allowed: usage.count < FREE_DAILY_ANALYSES,
    remaining,
    isPro: false,
    isLifetime: false,
    plan: "free",
    count: usage.count,
  };
}

export function nextUsageCookie(currentCount: number): { name: string; value: string } {
  return {
    name: COOKIES.dailyAnalyses,
    value: JSON.stringify({ date: todayKey(), count: currentCount + 1 }),
  };
}
