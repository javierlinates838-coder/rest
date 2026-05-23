import { NextRequest, NextResponse } from "next/server";
import { withLifetimeAccess, withTrialAccess } from "@/lib/access-cookies";
import { LIFETIME } from "@/lib/subscription";

const TRIAL_CODES = [
  process.env.SP_BETA_CODE?.toUpperCase(),
  "PULSE14",
  "EDGE2026",
].filter(Boolean) as string[];

const LIFETIME_CODES = [
  process.env.SP_LIFETIME_CODE?.toUpperCase(),
  LIFETIME.publicCode,
  "PULSE-LIFETIME",
  "LIFETIME29",
].filter(Boolean) as string[];

type ActivateResult =
  | { ok: true; plan: "lifetime" | "trial"; message: string }
  | { ok: false; error: string };

function activateWithCode(code: string): ActivateResult {
  const upper = code.trim().toUpperCase();
  if (!upper) {
    return { ok: false, error: "Enter your access code." };
  }

  if (LIFETIME_CODES.includes(upper)) {
    return {
      ok: true,
      plan: "lifetime",
      message: `${LIFETIME.name} activated — pay-once access forever. Welcome to the terminal.`,
    };
  }

  if (TRIAL_CODES.includes(upper)) {
    return {
      ok: true,
      plan: "trial",
      message: "30-day full access unlocked. Grab Lifetime on Access before launch ends.",
    };
  }

  return {
    ok: false,
    error: `Invalid code. Lifetime: ${LIFETIME.publicCode}. Trial: PULSE14.`,
  };
}

function jsonActivateResponse(result: ActivateResult, status = 200): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: status === 200 ? 400 : status });
  }

  const body = { success: true, plan: result.plan, message: result.message };
  const response = NextResponse.json(body);
  return result.plan === "lifetime" ? withLifetimeAccess(response) : withTrialAccess(response);
}

/** Shareable link: /api/activate-access?code=PULSE29 → sets cookie and redirects home */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim() || "";
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/pricing`);
  }

  const result = activateWithCode(code);
  if (!result.ok) {
    const fail = new URL("/pricing", origin);
    fail.searchParams.set("error", result.error);
    return NextResponse.redirect(fail);
  }

  const dest = new URL("/", origin);
  dest.searchParams.set("access", result.plan);
  const response = NextResponse.redirect(dest);
  return result.plan === "lifetime" ? withLifetimeAccess(response) : withTrialAccess(response);
}

export async function POST(request: NextRequest) {
  let code = "";
  try {
    const body = await request.json();
    code = String(body.code || "").trim();
  } catch {
    code = request.nextUrl.searchParams.get("code")?.trim() || "";
  }

  const result = activateWithCode(code);
  return jsonActivateResponse(result);
}
