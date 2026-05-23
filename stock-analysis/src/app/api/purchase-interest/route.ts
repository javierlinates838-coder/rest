import { NextRequest, NextResponse } from "next/server";
import { LIFETIME } from "@/lib/subscription";
import { lifetimePaymentLink } from "@/lib/stripe-server";

/** Capture purchase intent — redirects to Stripe when payment link is configured. */
export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json();
    email = String(body.email || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const stripeLink = lifetimePaymentLink();

  console.info("[purchase-interest]", { email, plan: "lifetime", price: LIFETIME.price });

  return NextResponse.json({
    success: true,
    message: stripeLink
      ? "Redirecting to secure checkout…"
      : "You're on the list. We'll email your checkout link at launch.",
    checkoutUrl: stripeLink || null,
    price: LIFETIME.price,
    plan: "lifetime",
  });
}
