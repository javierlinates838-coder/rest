import { NextRequest, NextResponse } from "next/server";

const PRO_COOKIE = "sp_pro";
const TRIAL_COOKIE = "sp_trial_started";

export async function POST(request: NextRequest) {
  let code = "";
  try {
    const body = await request.json();
    code = String(body.code || "").trim().toUpperCase();
  } catch {
    code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase() || "";
  }

  const validCodes = [
    process.env.SP_BETA_CODE?.toUpperCase(),
    "PULSE14",
    "EDGE2026",
  ].filter(Boolean) as string[];

  if (!code || !validCodes.includes(code)) {
    return NextResponse.json(
      { error: "Invalid access code. Check your email or pricing page." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Pro activated — unlimited research unlocked.",
    plan: "pro",
  });

  response.cookies.set(PRO_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(TRIAL_COOKIE, new Date().toISOString(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  return response;
}
