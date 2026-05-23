# Pulse Prime Lifetime — launch checklist

**Price:** $29 one-time (`PULSE29` launch code until Stripe is live)

## 1. Vercel env (Production)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Meridian AI analysis |
| `FMP_API_KEY` | Quotes & history |
| `FINNHUB_API_KEY` | Live tape & news |
| `NEWS_API_KEY` | Headlines |
| `STRIPE_LIFETIME_PAYMENT_LINK` | One-click $29 checkout |
| `STRIPE_SECRET_KEY` | Verify sessions on `/pricing/success` |
| `STRIPE_WEBHOOK_SECRET` | `checkout.session.completed` logging |

## 2. Stripe setup (5 min)

1. **Payment Link** — Product: "Pulse Prime Lifetime", **$29 one-time**.
2. **Success URL:**  
   `https://YOUR_DOMAIN/pricing/success?session_id={CHECKOUT_SESSION_ID}`
3. **Webhook** — Endpoint: `https://YOUR_DOMAIN/api/stripe-webhook`  
   Event: `checkout.session.completed`
4. Paste link into `STRIPE_LIFETIME_PAYMENT_LINK`.

## 3. User flows

| Flow | What happens |
|------|----------------|
| **Buy** | `/api/checkout` → Stripe → success page sets `sp_lifetime` |
| **Code** | `/pricing` enter `PULSE29` or `/pricing?code=PULSE29` |
| **Link** | `/api/activate-access?code=PULSE29` → cookie + redirect home |
| **Trial** | `PULSE14` → 30-day `sp_pro` |

## 4. Smoke test (after deploy)

```bash
curl -s -X POST https://YOUR_DOMAIN/api/activate-access \
  -H 'Content-Type: application/json' \
  -d '{"code":"PULSE29"}' -c cookies.txt

curl -s https://YOUR_DOMAIN/api/usage -b cookies.txt
# expect isPro:true, isLifetime:true
```

## 5. Root directory on Vercel

Set **Root Directory** to `stock-analysis`.
