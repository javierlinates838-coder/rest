# Vercel — deploy StockPulse AI

## Project layout (do not mix old setups)

| Use | Do not use |
|-----|------------|
| Root `package.json` + **one** `package-lock.json` at repo root | Second lockfile in `stock-analysis/` |
| `npm install` from **repo root** only | `cd stock-analysis && npm install` (creates duplicate `node_modules`) |
| Vercel **Root Directory** = `stock-analysis` | Root Directory `.` without monorepo config |
| Env vars in Vercel dashboard | Committed `.env.local` |

## Import / configure

1. [vercel.com/new](https://vercel.com/new) → import **`javierlinates838-coder/rest`**
2. **Root Directory** → **`stock-analysis`** (Edit → pick from list)
3. **Framework** → Next.js
4. **Output Directory** → leave **empty**
5. **Install Command** → leave **default** (Vercel installs from workspace root)
6. Environment variables (Production + Preview + Development):
   - `GEMINI_API_KEY`
   - `FMP_API_KEY`
   - `FINNHUB_API_KEY`
7. Deploy (clear build cache if a previous deploy failed)

## Broken project already linked?

1. Settings → Build and Deployment  
2. Root Directory = `stock-analysis`  
3. Remove any custom **Output Directory** override  
4. Redeploy with **Clear cache**

## Local dev

```bash
# From repo root only
npm run reinstall   # first time or after weird errors
npm run dev
```

## Success

Build log shows `stock-analysis@0.1.0 build` and `next build` with no `.next was not found` error.
