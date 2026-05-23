import { NextResponse } from "next/server";
import { COOKIES } from "@/lib/access";

const cookieBase = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/** Attach lifetime access cookies to an API or redirect response. */
export function withLifetimeAccess(response: NextResponse): NextResponse {
  response.cookies.set(COOKIES.lifetime, "1", {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 365 * 20,
  });
  response.cookies.delete(COOKIES.pro);
  response.cookies.delete(COOKIES.trialStarted);
  return response;
}

/** Attach 30-day trial cookies. */
export function withTrialAccess(response: NextResponse): NextResponse {
  response.cookies.set(COOKIES.pro, "1", {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(COOKIES.trialStarted, new Date().toISOString(), {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
