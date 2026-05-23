import { NextRequest, NextResponse } from "next/server";
import { PAYMENTS_ENABLED } from "@/lib/product-phase";
import { LIFETIME } from "@/lib/subscription";
import { isCheckoutConfigured, lifetimePaymentLink } from "@/lib/stripe-server";

/** Redirect to Stripe Payment Link or Access page (beta: codes only). */
export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;

  if (!PAYMENTS_ENABLED) {
    const beta = new URL("/pricing", base);
    beta.searchParams.set("code", LIFETIME.publicCode);
    return NextResponse.redirect(beta);
  }

  const link = lifetimePaymentLink();
  if (link) {
    return NextResponse.redirect(link);
  }

  const fallback = new URL("/pricing", base);
  fallback.searchParams.set("checkout", "pending");
  fallback.searchParams.set("price", String(LIFETIME.price));
  if (!isCheckoutConfigured()) {
    fallback.searchParams.set("hint", "code");
  }
  return NextResponse.redirect(fallback);
}
