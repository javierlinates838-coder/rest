# Repo cleanup — avoid stale / duplicate installs

## What causes “corruption”

| Problem | Fix |
|---------|-----|
| Ran `npm install` inside `stock-analysis/` **and** at repo root | Run `npm run reinstall` from **repo root only** |
| Two `package-lock.json` files | Only keep lockfile at **repo root** |
| Old `.next` build cache | `npm run clean` then `npm run build` |
| Vercel custom Install Command in subfolder | Leave install **default**; Root Directory = `stock-analysis` |
| API returns `{ error }` but UI treats it as data | Fixed via `fetchJson` / `fetchQuoteSummary` |

## Healthy reset (local)

```bash
npm run reinstall
npm run build
npm run dev
```

## What’s normal with npm workspaces

- `node_modules/` at repo root is small (workspace links).
- `stock-analysis/node_modules/` holds most packages — **do not commit** (gitignored).
- Never add `stock-analysis/package-lock.json` again.

## Vercel

After cleanup commits: **Redeploy** with **Clear build cache** once.
