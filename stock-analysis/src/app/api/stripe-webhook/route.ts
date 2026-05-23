import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe-server";

export const runtime = "nodejs";

/** Stripe webhook — logs completed lifetime checkouts (cookie set on success page). */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.info("[stripe-webhook] lifetime purchase", {
      sessionId: session.id,
      email: session.customer_details?.email,
      amount: session.amount_total,
      plan: session.metadata?.plan ?? "lifetime",
    });
  }

  return NextResponse.json({ received: true });
}
