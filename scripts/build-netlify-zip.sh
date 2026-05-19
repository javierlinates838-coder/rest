#!/usr/bin/env bash
# Creates stock-analysis-netlify.zip for Netlify (source bundle, no secrets).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/stock-analysis-netlify.zip"
SRC="$ROOT/stock-analysis"

if [[ ! -d "$SRC" ]]; then
  echo "Missing stock-analysis directory" >&2
  exit 1
fi

rm -f "$OUT"
cd "$ROOT"
zip -r "$OUT" stock-analysis \
  -x "stock-analysis/node_modules/*" \
  -x "stock-analysis/.next/*" \
  -x "stock-analysis/out/*" \
  -x "stock-analysis/.env.local" \
  -x "stock-analysis/.env" \
  -x "stock-analysis/.vercel/*" \
  -x "stock-analysis/.git/*" \
  -x "stock-analysis/*.tsbuildinfo" \
  -x "stock-analysis/.DS_Store"

echo "Created: $OUT"
ls -lh "$OUT"
