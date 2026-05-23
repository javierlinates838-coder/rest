import { NextRequest, NextResponse } from "next/server";
import { COOKIES } from "@/lib/access";
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

export async function POST(request: NextRequest) {
  let code = "";
  try {
    const body = await request.json();
    code = String(body.code || "").trim().toUpperCase();
  } catch {
    code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase() || "";
  }

  if (!code) {
    return NextResponse.json({ error: "Enter your access code." }, { status: 400 });
  }

  if (LIFETIME_CODES.includes(code)) {
    const response = NextResponse.json({
      success: true,
      plan: "lifetime",
      message: `${LIFETIME.name} activated — pay-once access forever. Welcome to the terminal.`,
    });
    response.cookies.set(COOKIES.lifetime, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 20,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.delete(COOKIES.pro);
    return response;
  }

  if (TRIAL_CODES.includes(code)) {
    const response = NextResponse.json({
      success: true,
      plan: "trial",
      message: "30-day full access unlocked. Grab Lifetime on Access before launch ends.",
    });
    response.cookies.set(COOKIES.pro, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(COOKIES.trialStarted, new Date().toISOString(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.json(
    {
      error: `Invalid code. Lifetime: ${LIFETIME.publicCode}. Trial: PULSE14.`,
    },
    { status: 400 }
  );
}
