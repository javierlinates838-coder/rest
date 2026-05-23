import { NextRequest, NextResponse } from "next/server";
import { LIFETIME } from "@/lib/subscription";
import { isCheckoutConfigured, lifetimePaymentLink } from "@/lib/stripe-server";

/** Redirect to Stripe Payment Link or Access page with checkout hint. */
export async function GET(request: NextRequest) {
  const link = lifetimePaymentLink();
  if (link) {
    return NextResponse.redirect(link);
  }

  const base = request.nextUrl.origin;
  const fallback = new URL("/pricing", base);
  fallback.searchParams.set("checkout", "pending");
  fallback.searchParams.set("price", String(LIFETIME.price));

  if (!isCheckoutConfigured()) {
    fallback.searchParams.set("hint", "code");
  }

  return NextResponse.redirect(fallback);
}
