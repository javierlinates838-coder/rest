<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Project structure
- **Monorepo** with npm workspaces. The root `/workspace/package.json` delegates to the single workspace `stock-analysis/`.
- All `npm` commands (`install`, `dev`, `build`, `lint`) must be run from the **repo root** (`/workspace`), never from inside `stock-analysis/`.

### Running the dev server
```bash
npm run dev          # starts Next.js 16 Turbopack dev server on http://localhost:3000
```

### Lint / Build
```bash
npm run lint         # ESLint 9 — pre-existing warnings/errors exist in the codebase
npm run build        # production build (Turbopack)
```

### Environment variables
- Copy `stock-analysis/.env.example` to `stock-analysis/.env.local` for local dev.
- No API keys are strictly required — the app uses a cascading fallback chain (FMP → Finnhub → Yahoo Finance npm → mock data; Gemini → OpenAI → built-in rules engine).
- For richer data, set `GEMINI_API_KEY` and `FMP_API_KEY` in `.env.local`.

### Key caveats
- `.npmrc` sets `install-strategy=hoisted` to avoid duplicate `node_modules` in `stock-analysis/`.
- No database, Docker, or external services are needed to run the app locally.
- Monetization (Stripe) is disabled via `OPEN_ACCESS = true` in `src/lib/product-phase.ts`.
- The lint target has 3 pre-existing errors (React `set-state-in-effect`, `prefer-const`) and 9 warnings; these are not regressions.
