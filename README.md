# DreamToon

**Describe your dream out loud. Get a 4-panel comic.**

Voice-in, comic-out. Sub-30-second loop. Hit record, talk for 15 seconds about the dream you had last night, and DreamToon hands you a 1080×1080 four-panel comic strip — Instagram-Story-native, screenshot-friendly, share-or-die.

This is the **magic-transform** shape that [tldraw/make-real](https://github.com/tldraw/make-real) proved with 10K stars in two weeks, applied to the one piece of content every human generates every night and has no good way to share: the dream.

---

## What it does

1. Tap the mic. Record up to 15 seconds.
2. [Whisper](https://developers.cloudflare.com/workers-ai/models/whisper/) on Workers AI transcribes the audio.
3. [Claude Sonnet 4.7](https://www.anthropic.com/news/claude-sonnet-4-5) reads the transcript and writes four panel descriptions with character/setting continuity.
4. [Flux Schnell](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/) generates four 512×512 panels.
5. Workers composes them into one 1080×1080 PNG with a `dreamtoon.app/[id]` watermark.
6. Panel-by-panel fade-in reveal. Download, share, post.

Total user-perceived latency target: **under 30 seconds end-to-end.**

---

## Why this exists

Dreams are universal content with zero distribution shape. Text-form ("had a dream I was a fish") is weak. Visual dream art is artisan, not commodity. Nobody has shipped the OSS, free-tier, share-native version. Clean lane.

Cultural precedents this rides:

- [tldraw/make-real](https://makereal.tldraw.com/) — drawing → working UI. Proved magic-transform virality.
- [Suno](https://suno.com/) — text → song. Proved generative-art-as-meme.
- [Krea](https://www.krea.ai/) realtime — proved sub-second image gen is now table stakes.

DreamToon is the dream-shaped slot in that lineup.

---

## Stack

| Layer | Choice |
|---|---|
| Edge runtime | [Cloudflare Workers](https://developers.cloudflare.com/workers/) |
| Transcription | [Whisper on Workers AI](https://developers.cloudflare.com/workers-ai/models/whisper/) |
| Scene composition | Claude Sonnet 4.7 via [AI Gateway](https://developers.cloudflare.com/ai-gateway/) |
| Image generation | [Flux Schnell on Workers AI](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/) (fallback: [fal.ai](https://fal.ai/models/fal-ai/flux/schnell)) |
| Image storage | [R2](https://developers.cloudflare.com/r2/) |
| Comic metadata | [D1](https://developers.cloudflare.com/d1/) |
| Rate limiting | [KV](https://developers.cloudflare.com/kv/) (IP → daily count) |
| Per-session state | [Durable Objects](https://developers.cloudflare.com/durable-objects/) (optional, for the in-flight job) |
| Frontend | Next.js 16 (App Router) + Tailwind v4 + shadcn/ui + TypeScript |
| Auth (optional, save history only) | [better-auth](https://www.better-auth.com/) |
| ORM | [Drizzle](https://orm.drizzle.team/) |
| Billing | [Stripe](https://stripe.com/) → webhooks → D1 |

No backend server. No long-running compute. The whole pipeline fits in a single Worker request with a streamed response.

---

## Pricing

- **Free**: 3 dream comics per day per IP. Watermarked.
- **$3/mo**: Unlimited generations. Watermark stays (it's the share-mechanic).

Stripe checkout → webhook → D1 `users.tier='pro'`. Standard.

---

## Honest framing

This is **art**, not psychology. DreamToon will never claim to interpret what your dreams *mean*. No Freud cosplay, no Jungian archetype output, no "your subconscious is telling you...". It's a transformation engine: words you spoke → image you can share. That's it.

That framing is a moat, not a limitation. The pop-psychology lane is already crowded with dream-meaning apps that ship horoscope-grade nonsense. We're not competing with them; we're shipping a different category.

---

## Content safety

Dream content is uniquely difficult. People dream about violence, sex, real public figures, copyrighted characters, children, and disturbing imagery — none of which we can render. Moderation runs in two layers:

1. **Pre-gen** — Claude reads the transcript and returns either four panel prompts or a structured `refusal: { reason }`. Categories blocked: sexual content, graphic violence, minors in unsafe contexts, named real people, named copyrighted characters, self-harm, hate.
2. **Post-gen** — Workers AI image safety check before the composite is written to R2.

Refusals get a friendly "this one's not for DreamToon — try describing the vibe instead of the people" card, not a wall of policy text.

See [`CLAUDE.md`](./CLAUDE.md) for the full moderation spec.

---

## Repo layout

```
/app           Next.js 16 frontend
/workers       Edge pipeline (transcribe → compose → generate → composite)
/db            Drizzle schema + migrations (D1)
/prompts       Claude scene-composer + refusal prompts
/og            Share-card OG image generator
```

Shared infra patterns (Workers boilerplate, AI Gateway config, rate-limit middleware) live in [`/_shared`](../_shared/) at the monorepo root.

---

## Docs

- [`RESEARCH.md`](./RESEARCH.md) — Problem, market, viral mechanic, risks, sources.
- [`ROADMAP.md`](./ROADMAP.md) — 10-day ship plan, day-by-day.
- [`LAUNCH.md`](./LAUNCH.md) — Demo script, X thread, HN/Reddit plan, amplifier list.
- [`CLAUDE.md`](./CLAUDE.md) — Skill file for Claude Code: moderation rules, prompt contracts, repo conventions.

---

## Status

Code-complete alpha — Next.js 16 frontend, Hono-on-Workers backend, D1 + R2 + KV + Workers AI wired, Stripe + magic-link auth in place. Ready to deploy as soon as Cloudflare resource IDs are filled in.

See [`SETUP.md`](./SETUP.md) for the end-to-end local-dev + deploy checklist.

## License

MIT.
