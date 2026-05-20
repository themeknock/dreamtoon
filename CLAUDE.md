# CLAUDE.md — DreamToon skill file

This file is the contract Claude Code reads when working in this repo. Read it before touching `/prompts`, `/workers`, or anything that calls the Anthropic API. Shared monorepo conventions live in [`/_shared`](../_shared/) — defer to those for Workers boilerplate, AI Gateway config, rate-limiter middleware, Stripe webhook patterns, and Drizzle/D1 setup.

---

## Product axioms (do not violate)

1. **Art, not psychology.** DreamToon never interprets, analyzes, or explains a dream. No "what this means," no archetype-talk, no Jung, no Freud, no astrology, no "your subconscious is...". Any feature that drifts toward interpretation is rejected. If a user asks "what does this mean?" in any UI surface, the answer is "we just draw it — not our department." This is brand and legal armor at the same time.

2. **The 4-panel constraint is non-negotiable.** Not 6, not 9, not "user-configurable." Four panels in a 2×2 grid at 1080×1080. The recognizable artifact shape is the moat.

3. **Sub-30-second loop is the spec, not an aspiration.** From mic-tap to comic-revealed must be under 30 seconds at the 95th percentile. If a code change adds latency, it doesn't ship.

4. **Free tier exists permanently.** 3 comics/day/IP, watermarked. The watermark stays on free *and* paid — it's the share-mechanic, not a friction tier.

5. **The watermark is the marketing.** Every comic carries `dreamtoon.app/{id}` bottom-right. Never make it removable. Never make it optional. Never let it overlap panel content.

---

## Content moderation — hard rules

Two-layer system. Both layers must pass before a comic is written to R2.

### Layer 1 — Claude pre-gen refusal

The scene-composer prompt at `/prompts/scene-composer.md` includes the refusal contract. Output is a tool-use call to `compose_panels` with one of two shapes:

```ts
{ refusal: null, panels: [Panel, Panel, Panel, Panel] }
// OR
{ refusal: { category: RefusalCategory, message: string }, panels: null }
```

**Refusal categories (refuse, do not soften):**

- `sexual` — any sexual content, nudity, suggestive scenarios. Dreams about kissing/romance OK; explicit content refused.
- `graphic_violence` — gore, torture, detailed injury. Mild conflict (chase scenes, monsters, falling) OK; graphic refused.
- `minors_unsafe` — any child in a sexual, violent, or otherwise unsafe scenario. Hard refuse, no soft path.
- `real_named_person` — named celebrities, politicians, real public figures by name. "I dreamed about Taylor Swift" → refuse. "I dreamed about a famous singer" → OK, render generically.
- `copyrighted_character` — named IP characters. "Mickey Mouse," "Pikachu," "Spider-Man" → refuse. "A mouse in red shorts" → OK, render generically.
- `self_harm` — depictions of self-injury or suicide.
- `hate` — content targeting protected groups, hate symbols.

Refusal `message` is short and friendly, addressed to the user, never policy-flavored: *"this one's not for DreamToon — try describing the vibe instead of the people"*. No "I cannot generate," no "as an AI." Just a soft redirect.

### Layer 2 — post-gen image safety

Every generated panel passes through Workers AI image safety classification before composite. If any of the 4 panels flags, discard the whole comic and surface the refusal UX. Log to D1 `refusals` table with `{ transcript_hash, layer: 2, panel_index, classifier_output }` for prompt tuning.

### Things Claude should never do in this codebase

- Never weaken the refusal categories to be more permissive "because the dream sounds harmless." If the transcript names a real person or copyrighted character, it refuses, period.
- Never add a "dream interpretation" feature, route, prompt, or copy block. Reject the request and point at axiom 1.
- Never remove the watermark or make it user-configurable.
- Never increase the audio duration past 20 seconds (the 15s UI cap + 5s grace). Longer dreams = looser comics = worse share artifacts.

---

## Prompt contracts

- `/prompts/scene-composer.md` — system prompt for Claude Sonnet 4.7. Defines the `compose_panels` tool, the refusal categories, the style anchor (`"hand-drawn comic, soft watercolor, expressive linework, dreamlike palette"`), and the continuity rules ("refer back to subjects from earlier panels using descriptive references, not pronouns alone").
- `/prompts/refusal-copy.md` — the user-facing refusal microcopy library, keyed by category. Edit copy here, never inline in Worker code.

When editing the scene composer, run the eval set at `/prompts/evals/transcripts.jsonl` (~30 hand-curated dreams + adversarial cases). Continuity should hold on ≥85% of safe cases; refusals should fire on 100% of adversarial cases.

---

## Repo conventions

- `/_shared/` (monorepo root) has the Workers boilerplate, the AI Gateway wrapper, the KV-based rate limiter, the Stripe webhook handler, the Drizzle config patterns. **Use those.** Do not re-implement.
- D1 schema lives in `/db/schema.ts`. Migrations via `drizzle-kit`. Don't hand-edit migration SQL.
- All Anthropic + Workers AI calls route through AI Gateway. Direct API calls are a review-blocker.
- Frontend is Next.js 16 App Router, React Server Components by default, `'use client'` only where genuinely needed (mic recorder, reveal animation, share buttons).
- Tailwind v4. No inline `style={{}}` for anything that could be a utility class. Use `cn()` helper from `/_shared/`.
- shadcn/ui for primitives. Don't pull in additional UI libraries — the design is intentionally minimal.

---

## What to ask before shipping a change

- Does this preserve the sub-30-second loop?
- Does this preserve the four-panel constraint?
- Does this stay on the art-not-psychology side of the line?
- Does this go through AI Gateway?
- If it touches moderation: did the eval set still pass?

If any answer is no, the change doesn't ship.
