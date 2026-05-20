# Vercel deploy — fixed

## Root cause

The repo had **two** `package-lock.json` files (repo root + `stock-analysis/`). Next.js picked the wrong workspace root, and Vercel looked for `.next` in the wrong folder.

## Fix applied in code

- Removed root `package.json` / workspace setup (app only in `stock-analysis/`)
- Set `turbopack.root` in `stock-analysis/next.config.ts`
- Added `stock-analysis/vercel.json`

## What you must set in Vercel

1. [vercel.com/dashboard](https://vercel.com/dashboard) → **rest** project  
2. **Settings** → **Build and Deployment**

| Setting | Value |
|---------|--------|
| **Root Directory** | `stock-analysis` |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` (default) |
| **Install Command** | `npm install` (default) |
| **Output Directory** | *(leave empty — automatic)* |

3. **Environment variables** (all environments):

   - `GEMINI_API_KEY`
   - `FMP_API_KEY`
   - `FINNHUB_API_KEY`

4. **Save** → **Deployments** → **Redeploy** (clear build cache if offered)

## Success looks like

Build log shows:

- `> stock-analysis@0.1.0 build`
- `> next build`
- No error about `.next was not found`
- No lockfile warning (or only a harmless note)

## Local dev

```bash
cd stock-analysis
npm install
npm run dev
```

Do **not** run `npm install` from the repo root only — use the `stock-analysis` folder.
