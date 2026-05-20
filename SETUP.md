# DreamToon — Local Setup

End-to-end checklist to take this repo from clone → "I just recorded a dream and got a comic".

## 0. Prerequisites

- Node 20+ (Next.js 16 needs it). `node --version`
- pnpm 9+. `pnpm --version`
- A Cloudflare account with Workers, R2, D1, KV, AI Gateway enabled.
- An Anthropic API key.
- A Stripe account (test mode is fine for dev).
- A Resend account (or skip email — magic links print to Worker logs in dev).

## 1. Install

```bash
# from repo root
pnpm install
# workers
cd workers && pnpm install && cd ..
```

## 2. Provision Cloudflare resources

```bash
cd workers

# D1
wrangler d1 create dreamtoon-db
# copy the `database_id` from the output into wrangler.toml

# KV
wrangler kv namespace create RATE_LIMIT_KV
# copy the `id` into wrangler.toml

# R2 (3 buckets, separated by lifecycle)
wrangler r2 bucket create dreamtoon-audio
wrangler r2 bucket create dreamtoon-panels
wrangler r2 bucket create dreamtoon-comics

# AI Gateway — create from the dashboard at:
#   https://dash.cloudflare.com/<account>/ai/ai-gateway
# Slug: `dreamtoon`. Provider: `anthropic`.
# Then paste the gateway URL into wrangler.toml AI_GATEWAY_URL.
```

## 3. Migrate the database

```bash
# local
wrangler d1 migrations apply dreamtoon-db --local

# remote (after you've set the database_id in wrangler.toml)
wrangler d1 migrations apply dreamtoon-db --remote
```

## 4. Secrets

```bash
cp .dev.vars.example .dev.vars
# fill in real values
```

For production, push them with `wrangler secret put`:

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRICE_ID
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put IP_HASH_SALT
wrangler secret put FAL_KEY
```

## 5. Run

Two terminals:

```bash
# Terminal A — Workers backend on :8787
cd workers
pnpm dev

# Terminal B — Next.js frontend on :3717
cd ..
cp .env.example .env.local   # default points at localhost:8787
pnpm dev
```

Open http://localhost:3717.

## 6. End-to-end test

1. Tap the mic. Grant permission.
2. Talk for 15 seconds. ("I dreamed I was flying over a city made of bread...")
3. Auto-stops at 15s, uploads, transcribes, composes, draws, renders.
4. Lands on `/c/{id}` with the 2×2 comic.
5. Share link copies `https://localhost:3717/c/{id}` to clipboard.

## 7. Stripe webhook (dev)

```bash
stripe listen --forward-to http://localhost:8787/api/stripe/webhook
# Copy the webhook signing secret it prints into .dev.vars STRIPE_WEBHOOK_SECRET
```

## 8. Production deploy

```bash
# Workers
cd workers
wrangler deploy

# Frontend — Cloudflare Pages
# Push to GitHub, connect the repo in Cloudflare Pages dashboard.
# Build command:  pnpm build
# Build output:   .next
# Env vars:       NEXT_PUBLIC_WORKER_URL=https://api.dreamtoon.app
#                 NEXT_PUBLIC_APP_URL=https://dreamtoon.app
```

## What still needs work after Day 10

- The watermark in `workers/src/pipeline/image.ts` is a placeholder dot.
  Pre-render a proper `dreamtoon.app` watermark PNG (280×60, ink-on-cream,
  ~60% opacity), base64-encode it, and replace `WATERMARK_PNG`. A
  per-comic-id watermark would need SVG→PNG (`@resvg/resvg-wasm`) which is
  swappable in `pipeline/image.ts` without touching any other module.
- Layer-2 image safety classifier is wired into the schema (`refusals` table)
  but not the pipeline — drop it into `pipeline/dream.ts` after the Flux step
  using `env.AI.run('@cf/meta/llama-guard-3-vision' as never, ...)` or any
  workers-ai vision-safety model that's live at launch.
- Dark mode toggle. The tokens are flipped in `globals.css` under
  `[data-theme="dark"]` — wire the toggle in `layout.tsx`.
