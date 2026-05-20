# Deploy StockPulse AI to Vercel

This app is a **Next.js server app** (API routes + server-side data). Vercel is the recommended host.

## Before you start

1. **GitHub repo** with this project pushed (e.g. `javierlinates838-coder/rest`).
2. **Vercel account** — sign up at [https://vercel.com/signup](https://vercel.com/signup) (GitHub login is easiest).
3. **API keys** ready (same as local `.env.local`):
   - `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)
   - `FMP_API_KEY` — [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs)
   - `FINNHUB_API_KEY` — [Finnhub](https://finnhub.io/register)
   - `OPENAI_API_KEY` — optional fallback

Never commit keys to git. Only set them in Vercel **Environment Variables**.

> **Important:** The Next.js app is only in `stock-analysis/`. Do not add a `package.json` at the repo root — it breaks Vercel and local builds.

---

## Step 1: Import the project

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Click **Import** next to your GitHub repository.
3. If GitHub is not connected, authorize Vercel to access your account/repos.

---

## Step 2: Configure the build (critical)

Your Next.js app lives in the **`stock-analysis`** folder, not the repo root.

On the import screen, open **Root Directory** → **Edit** → type exactly:

```text
stock-analysis
```

**Required.** Do not leave Root Directory as `./` or empty — the build will fail with *".next was not found"*.

If you don't see a folder picker, type `stock-analysis` manually in **Settings → Build and Deployment → Root Directory**.

**Output Directory:** leave **empty** (automatic). Do not set `.next` yourself.

Confirm. Vercel should detect:

| Setting        | Value              |
|----------------|--------------------|
| Framework      | Next.js            |
| Build Command  | `npm run build`    |
| Output         | (automatic)        |
| Install Command| `npm install`      |

Leave **Node.js Version** on the default (18.x or 20.x both work).

---

## Step 3: Add environment variables

Still on the import screen (or later: **Project → Settings → Environment Variables**), add:

| Name               | Value              | Environments      |
|--------------------|--------------------|-------------------|
| `GEMINI_API_KEY`   | your Gemini key    | Production, Preview, Development |
| `FMP_API_KEY`      | your FMP key       | Production, Preview, Development |
| `FINNHUB_API_KEY`  | your Finnhub key   | Production, Preview, Development |
| `OPENAI_API_KEY`   | optional           | Production, Preview |

Apply to **all three** environments so preview deploys work the same as production.

---

## Step 4: Deploy

1. Click **Deploy**.
2. Wait for the build log to finish (usually 1–3 minutes).
3. When done, Vercel shows a URL like `https://your-project.vercel.app`.

---

## Step 5: Verify production

Open your deployment URL and check:

1. **Dashboard** (`/`) — indices, gainers/losers load.
2. **Stock page** (`/stock/AAPL`) — price, tabs, AI analysis load.
3. **Browser DevTools → Network** — calls to `/api/market`, `/api/analyze` return `200` (not `500`).

If AI or quotes fail, open **Vercel → Project → Deployments → [latest] → Functions / Logs** and look for missing env vars or upstream API errors.

---

## Production branch (optional)

By default Vercel deploys every push. To use `main` for production:

1. **Project → Settings → Git**
2. **Production Branch** → set to `main`
3. Merge your feature branch when ready; other branches become **Preview** URLs.

---

## Custom domain (optional)

1. **Project → Settings → Domains**
2. Add your domain (e.g. `stocks.yourdomain.com`)
3. Add the DNS records Vercel shows at your registrar (CNAME or A record).
4. Wait for SSL (automatic, usually a few minutes).

---

## Redeploy after changing env vars

Env vars are baked in at **build/runtime** per deployment:

1. **Settings → Environment Variables** → save changes
2. **Deployments** → ⋮ on latest → **Redeploy**

---

## Troubleshooting

### Build fails: "Cannot find module" or wrong directory

- **Root Directory** must be `stock-analysis`, not `/` or `rest`.

### Stock page loads but metrics are all zero

- Check `FMP_API_KEY` is set and redeploy.
- FMP free tier rate-limits quickly; wait a minute or upgrade FMP.

### `/api/analyze` times out (504 / FUNCTION_INVOCATION_TIMEOUT)

- The analyze route calls FMP, Finnhub, and Gemini in one request.
- **Hobby plan**: ~10 second serverless limit.
- **Pro plan**: up to 60 seconds; the app sets `maxDuration = 60` on `/api/analyze`.
- Mitigation: upgrade to Pro, or use the site lightly until you add caching.

### "Application error" on first load after idle

- Normal on serverless (**cold start**). Refresh once.

### API keys exposed?

- Rotate keys at FMP / Finnhub / Google if they were ever committed or shared publicly.
- Do **not** prefix keys with `NEXT_PUBLIC_` — they must stay server-only.

---

## Deploy from CLI (alternative)

```bash
npm i -g vercel
cd stock-analysis
vercel login
vercel        # first time: link project, set root if prompted
vercel --prod # production deploy
```

Add env vars in the dashboard or:

```bash
vercel env add GEMINI_API_KEY
vercel env add FMP_API_KEY
vercel env add FINNHUB_API_KEY
```

---

## Quick checklist

- [ ] Root Directory = `stock-analysis`
- [ ] `GEMINI_API_KEY`, `FMP_API_KEY`, `FINNHUB_API_KEY` set
- [ ] Redeploy after adding keys
- [ ] Test `/` and `/stock/AAPL`
- [ ] Rotate keys if they were ever leaked
