import { cookies } from "next/headers";

const COOKIE_NAME = "sp_daily_analyses";
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

export async function getAnalysisUsage(): Promise<{
  allowed: boolean;
  remaining: number;
  isPro: boolean;
  count: number;
}> {
  if (process.env.SP_DISABLE_LIMITS === "true") {
    return { allowed: true, remaining: 999, isPro: true, count: 0 };
  }

  const store = await cookies();
  if (store.get("sp_pro")?.value === "1") {
    return { allowed: true, remaining: 999, isPro: true, count: 0 };
  }

  const usage = parseUsage(store.get(COOKIE_NAME)?.value);
  const remaining = Math.max(0, FREE_DAILY_ANALYSES - usage.count);
  return {
    allowed: usage.count < FREE_DAILY_ANALYSES,
    remaining,
    isPro: false,
    count: usage.count,
  };
}

export function nextUsageCookie(currentCount: number): { name: string; value: string } {
  return {
    name: COOKIE_NAME,
    value: JSON.stringify({ date: todayKey(), count: currentCount + 1 }),
  };
}
