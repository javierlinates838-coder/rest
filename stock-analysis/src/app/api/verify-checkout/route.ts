import { NextRequest, NextResponse } from "next/server";
import { withLifetimeAccess } from "@/lib/access-cookies";
import { LIFETIME } from "@/lib/subscription";
import { sessionGrantsLifetime } from "@/lib/stripe-server";

/** After Stripe success_url — verify session and set lifetime cookie. */
export async function GET(request: NextRequest) {
  const sessionId =
    request.nextUrl.searchParams.get("session_id")?.trim() ||
    request.nextUrl.searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const result = await sessionGrantsLifetime(sessionId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason || "Could not verify payment", verified: false },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    verified: true,
    plan: "lifetime",
    message: `${LIFETIME.name} unlocked — welcome to the terminal.`,
    email: result.email,
  });

  return withLifetimeAccess(response);
}
