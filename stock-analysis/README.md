# StockPulse — Pulse Terminal

AI + technical research terminal. **Open access** while the product is being built — no paywalls or checkout in the UI.

## Getting Started

```bash
cd stock-analysis
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and set API keys (`GEMINI_API_KEY`, `FMP_API_KEY`, `FINNHUB_API_KEY`, `NEWS_API_KEY`) for live data and Meridian AI.

## Deploy on Vercel

Set **Root Directory** to `stock-analysis`. See **[MONETIZATION.md](./MONETIZATION.md)** for env vars and optional Stripe setup when payments return.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
