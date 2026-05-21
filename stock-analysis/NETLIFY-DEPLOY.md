# Deploy to Netlify

This app uses **Next.js API routes** (`/api/analyze`, `/api/stock`, etc.). You cannot use a plain static HTML zip. Netlify must **build** the project with the Next.js plugin.

## Option A — GitHub (recommended)

1. Push the repo to GitHub.
2. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
3. Pick the repo.
4. **Base directory**: `stock-analysis`
5. Build settings (auto from `netlify.toml`):
   - Build command: `npm run build`
   - Plugin: `@netlify/plugin-nextjs`
6. **Site configuration → Environment variables** — add:
   - `GEMINI_API_KEY`
   - `FMP_API_KEY`
   - `NEWS_API_KEY`
   - `FINNHUB_API_KEY`
   - `OPENAI_API_KEY` (optional)
7. **Deploy site**.

## Option B — Upload zip (build on Netlify)

Use the zip created at repo root: `stock-analysis-netlify.zip` (source only, no `node_modules`).

1. Netlify → **Add new site** → **Deploy manually** does **not** run Next.js builds — it only hosts static files.
2. Instead use the **Netlify CLI** from the unzipped folder:

```bash
unzip stock-analysis-netlify.zip -d stock-analysis
cd stock-analysis
npm install -g netlify-cli
netlify login
netlify init          # link or create a site
netlify env:set GEMINI_API_KEY "your-key"
netlify env:set FMP_API_KEY "your-key"
netlify env:set FINNHUB_API_KEY "your-key"
netlify deploy --build --prod
```

Or import the zip via Git: push the unzipped contents to a repo and use Option A.

## Option C — Recreate the zip locally

From the repository root:

```bash
./scripts/build-netlify-zip.sh
```

Output: `stock-analysis-netlify.zip`

## Environment variables

Same as Vercel — set in **Site configuration → Environment variables**, then redeploy.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Ensure Node 18+; run `npm run build` locally first |
| API routes 404 | Confirm `@netlify/plugin-nextjs` is active (see `netlify.toml`) |
| Empty metrics | Set `FMP_API_KEY` and redeploy |
| Analyze timeout | Netlify function limits may apply; heavy `/api/analyze` may need caching or Pro |

## Note on “drag and drop” zip

Netlify’s **drag-and-drop** deploy is for **pre-built static** sites (`index.html`). This project needs a **build step**. Use Git import or `netlify deploy --build`.
