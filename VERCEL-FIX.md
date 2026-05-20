# Vercel — auto-detect & deploy StockPulse AI

## If Vercel shows “Other” or won’t detect Next.js

The app lives in **`stock-analysis/`**. Use **one** of these setups:

### Option A — Recommended (auto on re-import)

1. [vercel.com/new](https://vercel.com/new) → import **`javierlinates838-coder/rest`**
2. On **Configure Project**, click **Edit** next to **Root Directory**
3. Select **`stock-analysis`** (it should appear in the list now that the repo has a root workspace)
4. Framework should show **Next.js** automatically
5. Leave **Output Directory** empty
6. Add env vars (see below) → **Deploy**

### Option B — Deploy from repo root (no Root Directory change)

If Root Directory is **`.`** (repo root), the root `vercel.json` runs:

- `npm install` (workspace)
- `npm run vercel-build` → builds `stock-analysis`

Use this only if you cannot set Root Directory to `stock-analysis`.

## Environment variables

Add for **Production**, **Preview**, and **Development**:

| Name | Required |
|------|----------|
| `GEMINI_API_KEY` | Yes (AI analysis) |
| `FMP_API_KEY` | Yes (quotes/fundamentals) |
| `FINNHUB_API_KEY` | Yes (news/sentiment) |

## Already have a broken Vercel project?

1. **Settings** → **Build and Deployment**
2. **Root Directory** → `stock-analysis` (or `.` with Option B)
3. **Framework** → Next.js
4. **Output Directory** → *(empty)*
5. **Deployments** → **Redeploy** → clear build cache

## Success looks like

Build log includes:

- `stock-analysis@0.1.0 build`
- `next build`
- No `.next was not found` error

## Local dev

```bash
# From repo root (workspace)
npm install
npm run dev

# Or from app folder
cd stock-analysis && npm install && npm run dev
```
