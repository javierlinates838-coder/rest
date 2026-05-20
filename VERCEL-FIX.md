# Vercel deploy fix — `.next` not found

## The problem

The app lives in **`stock-analysis/`**, but Vercel was building from the **repo root** (`rest/`).  
Next.js creates `.next` inside `stock-analysis/.next`, so Vercel looked in the wrong place.

## The fix (do this in Vercel)

1. Open [vercel.com/dashboard](https://vercel.com/dashboard) → your **rest** project  
2. **Settings** → **Build and Deployment**  
3. Set **Root Directory** to:

   ```text
   stock-analysis
   ```

4. **Clear** any custom **Output Directory** (leave empty / automatic)  
5. **Framework Preset** → **Next.js**  
6. **Build Command** → `npm run build` (default)  
7. **Install Command** → `npm install` (default)  
8. **Save** → **Deployments** → **Redeploy**

## Environment variables

Still add in **Settings → Environment Variables**:

- `GEMINI_API_KEY`
- `FMP_API_KEY`
- `FINNHUB_API_KEY`

## After redeploy

Build log should show paths like `stock-analysis/package.json` and succeed without the `.next` error.
