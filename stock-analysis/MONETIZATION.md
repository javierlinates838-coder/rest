# Monetization (dormant)

Payments and pricing UI are **disabled**. `OPEN_ACCESS` in `src/lib/product-phase.ts` is `true`, so all features are unlimited without cookies or checkout.

## Required Vercel env (always)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Meridian AI analysis |
| `FMP_API_KEY` | Quotes & history |
| `FINNHUB_API_KEY` | Live tape & news |
| `NEWS_API_KEY` | Headlines |

## When re-enabling payments

1. Set `OPEN_ACCESS` to `false` in `src/lib/product-phase.ts`.
2. Restore pricing pages and upgrade gates (see git history around `b0890e6`).
3. Configure Stripe env vars:

| Variable | Purpose |
|----------|---------|
| `STRIPE_LIFETIME_PAYMENT_LINK` | One-click lifetime checkout |
| `STRIPE_SECRET_KEY` | Session verify on success page |
| `STRIPE_WEBHOOK_SECRET` | `checkout.session.completed` |

4. **Root Directory** on Vercel: `stock-analysis`.

## Smoke test (local)

```bash
npm run build && npm run start
# In another terminal:
curl -s http://localhost:3000/api/usage | jq .
# expect openAccess: true, hasFullAccess via usage (isPro true when OPEN_ACCESS)

curl -s "http://localhost:3000/api/search?q=AAPL" | head -c 200
curl -s "http://localhost:3000/api/market" | head -c 200
```

Activation API (`/api/activate-access`) still works for beta codes but redirects home, not `/pricing`.
