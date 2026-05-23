import Stripe from "stripe";
import { LIFETIME } from "@/lib/subscription";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/** True when paid checkout can run (Payment Link or API). */
export function isCheckoutConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_LIFETIME_PAYMENT_LINK?.trim() || process.env.STRIPE_SECRET_KEY?.trim()
  );
}

export function lifetimePaymentLink(): string | null {
  const link = process.env.STRIPE_LIFETIME_PAYMENT_LINK?.trim();
  return link || null;
}

/** Verify a completed Checkout Session paid for lifetime. */
export async function sessionGrantsLifetime(
  sessionId: string
): Promise<{ ok: boolean; email?: string; reason?: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, reason: "Stripe not configured" };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return { ok: false, reason: "Payment not completed" };
    }

    const amount = session.amount_total ?? 0;
    const expectedCents = LIFETIME.price * 100;
    // Allow Payment Links with slight discounts; reject clearly wrong amounts
    if (amount > 0 && amount < expectedCents * 0.5) {
      return { ok: false, reason: "Amount mismatch" };
    }

    const meta = session.metadata?.plan;
    if (meta && meta !== "lifetime") {
      return { ok: false, reason: "Not a lifetime purchase" };
    }

    return { ok: true, email: session.customer_details?.email ?? undefined };
  } catch (e) {
    console.error("[stripe] session retrieve failed", e);
    return { ok: false, reason: "Invalid session" };
  }
}
