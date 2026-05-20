#!/usr/bin/env bash
# Redeploy DreamToon. Run from repo root: bash scripts/deploy.sh
set -euo pipefail

WORKER_URL="https://dreamtoon-api.themeknock.workers.dev"
WRANGLER="workers/node_modules/.bin/wrangler"

echo "── 1/3  Deploy API Worker (backend) ─────────────────────"
( cd workers && node_modules/.bin/wrangler deploy )

echo "── 2/3  Build static frontend (root domain, no basePath) ─"
rm -rf .next out
NEXT_PUBLIC_WORKER_URL="$WORKER_URL" pnpm exec next build
touch out/.nojekyll

echo "── 3/3  Deploy frontend Worker → dreamtoon.themeknock.net ─"
"$WRANGLER" deploy -c wrangler-web.toml

echo "✓ Live: https://dreamtoon.themeknock.net"
