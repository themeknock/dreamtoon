#!/usr/bin/env bash
# Redeploy DreamToon. Run from repo root: bash scripts/deploy.sh
set -euo pipefail

WORKER_URL="https://dreamtoon-api.themeknock.workers.dev"
BASE_PATH="/dreamtoon"
REPO_URL="https://github.com/themeknock/dreamtoon.git"

echo "── 1/3  Deploy Worker (backend) ─────────────────────────"
( cd workers && pnpm exec wrangler deploy )

echo "── 2/3  Build static frontend ───────────────────────────"
rm -rf .next out
NEXT_PUBLIC_WORKER_URL="$WORKER_URL" NEXT_PUBLIC_BASE_PATH="$BASE_PATH" pnpm exec next build
touch out/.nojekyll

echo "── 3/3  Push static build to gh-pages ───────────────────"
(
  cd out
  rm -rf .git
  git init -q
  git -c user.name="themeknock" -c user.email="themeknock@gmail.com" add -A
  git -c user.name="themeknock" -c user.email="themeknock@gmail.com" commit -q -m "deploy $(date -u +%FT%TZ)"
  git branch -M gh-pages
  git remote add origin "$REPO_URL"
  git push -f origin gh-pages
)

echo "✓ Live: https://themeknock.github.io/dreamtoon/"
echo "  (GitHub Pages takes ~1 min to refresh the CDN)"
