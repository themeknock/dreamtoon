# DreamToon — 10-Day Roadmap

Ship target: **public launch at end of Day 10.** Solo build. Every day has a single primary artifact; if the artifact ships, the day is done. No gold-plating.

---

## Day 0 — Setup (half-day, eve before Day 1)

**Artifact:** Empty repo, deployable hello-world Worker, domain pointed.

- `pnpm create next-app@latest` — Next.js 16, App Router, TS, Tailwind v4, shadcn init.
- `wrangler init workers/` — Cloudflare Workers project with bindings stubs for `AI`, `R2`, `D1`, `KV`.
- Create resources: `wrangler d1 create dreamtoon`, `wrangler r2 bucket create dreamtoon-comics`, `wrangler kv namespace create RATE_LIMIT`.
- Register `dreamtoon.app`, point Cloudflare DNS, attach Pages project for the Next.js frontend.
- Set up [AI Gateway](https://developers.cloudflare.com/ai-gateway/) for Anthropic + Workers AI requests so we get logging + caching + fallback from day one.
- `.dev.vars` with `ANTHROPIC_API_KEY`, `STRIPE_SECRET`, `FAL_KEY` (backup).
- Push to GitHub. Public from minute one — the repo itself is part of the launch.

---

## Days 1-2 — Voice input + transcription

**Artifact:** A page with a record button that returns a transcript string from Workers AI Whisper.

- **Day 1 — frontend record button.**
  - `MediaRecorder` API, 15-second hard cap (`setTimeout` to stop), record to `audio/webm;codecs=opus`.
  - shadcn `Button` with three states: idle / recording (red pulse) / processing.
  - Waveform visualization while recording — `AudioContext` + `AnalyserNode`, canvas bars. Single file, ~80 LOC.
  - Upload as `multipart/form-data` to `POST /api/transcribe` (Worker route).

- **Day 2 — Whisper on Workers.**
  - Worker route `POST /api/transcribe`: receive audio blob, call `env.AI.run('@cf/openai/whisper', { audio: [...bytes] })`, return `{ transcript: string }`.
  - Validate audio length server-side (reject > 20s).
  - End-to-end test: record "I dreamed I was flying over a city made of bread," confirm transcript ≈ that.
  - Latency target verified: < 2.5s for 15s audio.

End of Day 2: voice in, text out. Half the magic loop is real.

---

## Days 3-4 — Claude scene composer

**Artifact:** Worker route that takes a transcript and returns four panel descriptions with character continuity.

- **Day 3 — prompt engineering.**
  - System prompt (in `/prompts/scene-composer.md`): "You are a comic-strip director. Take this dream description and produce exactly 4 panels. Each panel must include: subject (with continuity references like 'the same red-haired figure'), setting (continuity), action, mood, art-style modifier. Output strict JSON: `{ refusal: null, panels: [{...}, {...}, {...}, {...}] }` OR `{ refusal: { reason: string }, panels: null }`."
  - Style anchor in every panel prompt: `"hand-drawn comic, soft watercolor, expressive linework, dreamlike palette"` — this is what gives the four panels visual cohesion when Flux generates them independently.
  - Refusal categories baked into the system prompt (sexual, graphic violence, minors, real named people, copyrighted named characters, self-harm, hate). See [`CLAUDE.md`](./CLAUDE.md) for the exact list.
  - Use Anthropic [tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) with a single `compose_panels` tool to force structured output. Cleaner than JSON-mode prompting.

- **Day 4 — Worker integration.**
  - Worker route `POST /api/compose`: accepts `{ transcript }`, calls Claude Sonnet 4.7 via AI Gateway, returns `{ panels }` or `{ refusal }`.
  - Manual eval pass: run 30 hand-written dream transcripts through it (varied: mundane, surreal, mildly dark, edge cases). Tune the prompt until continuity holds on ~25/30.
  - Cache identical transcripts in KV for 24h — handy for the demo videos that get replayed.

End of Day 4: full text-to-panel-prompts pipeline works. Hardest creative-AI part done.

---

## Days 5-6 — Image generation + 2×2 composite

**Artifact:** Given 4 panel prompts, the Worker writes one 1080×1080 PNG to R2 and returns the URL.

- **Day 5 — parallel Flux calls.**
  - Worker route `POST /api/render`: takes `{ panels: [4] }`, fires 4 parallel `env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt, num_steps: 4 })` calls.
  - `Promise.all` — total wall time ≈ slowest panel, target ~3-4s.
  - If a panel fails (Workers AI 5xx), retry once; if still failing, fall back to [fal.ai Flux Schnell](https://fal.ai/models/fal-ai/flux/schnell) for that single panel. Never let one bad panel kill the comic.

- **Day 6 — composite + R2.**
  - Use [`@cf-wasm/photon`](https://github.com/cf-wasm/photon) or `OffscreenCanvas` in a Worker (Workers now supports it in [browser-rendering](https://developers.cloudflare.com/browser-rendering/)) to draw 4 panels into a 1080×1080 canvas with 8px gutters.
  - Generate `id = nanoid(10)`, write to `r2://dreamtoon-comics/{id}.png`, write metadata row to D1 (`id`, `created_at`, `transcript`, `ip_hash`, `user_id?`).
  - Return `{ id, url: "https://cdn.dreamtoon.app/{id}.png" }`.
  - Public R2 bucket behind a Cloudflare cache rule with `Cache-Control: public, max-age=31536000, immutable`.

End of Day 6: full pipeline works end-to-end via curl. Voice → comic PNG on R2. 95% of the engineering is now done.

---

## Day 7 — Watermark + OG share card

**Artifact:** Every comic has a permalink `/c/[id]` with a perfect Twitter/iMessage/Slack unfurl.

- Watermark gets baked into the composite step from Day 6 (move that into Day 7 if it slipped): bottom-right corner, `dreamtoon.app/{id}` in 18px, 60% opacity white-with-shadow.
- Next.js route `/c/[id]/page.tsx`: server component, reads D1 row, renders comic + "Make your own" CTA + transcript (collapsed by default).
- `generateMetadata` exports `og:image` = the comic PNG itself, `twitter:card` = `summary_large_image`. Verify with the [Twitter card validator](https://cards-dev.twitter.com/validator) and [Open Graph debugger](https://www.opengraph.xyz/).
- Permalink test: paste in iMessage, Slack, Twitter, Discord — preview is the comic.

---

## Day 8 — Content moderation layer

**Artifact:** Two-layer moderation that hard-blocks the categories in [`CLAUDE.md`](./CLAUDE.md).

- **Layer 1 — Claude pre-gen refusal.** Already in the system prompt from Day 3. Verify with 20 adversarial transcripts (sexual, named celebrities, named copyrighted characters, graphic violence, minors). All should return `{ refusal }`, none should produce panels.
- **Layer 2 — post-gen image safety.** Run each generated panel through [Workers AI image classification](https://developers.cloudflare.com/workers-ai/models/) (Llama Guard or equivalent vision-safety model) before composite. If any panel flags, discard the whole comic and show the refusal card.
- **Refusal UX.** A single shadcn `Card` with a friendly line ("this one's not for DreamToon — try describing the vibe instead of the people") and a "try another dream" button. No policy walls.
- **Logging.** Refusals get written to D1 with reason category for later review. Helps tune the prompt if false-positives are high.

---

## Day 9 — Frontend polish

**Artifact:** The full landing + record + reveal page, production-quality.

- Hero: oversized mic icon, one-line punch ("Describe your dream out loud. Get a 4-panel comic."), nothing else above the fold.
- Record button is the only interactive element. Tap → record → countdown ring (15s) → release or auto-stop.
- Processing state: three sequential status pills, animated — "Listening..." → "Imagining..." → "Drawing...".
- Reveal: 2×2 grid, panels fade in one at a time with a 400ms stagger, slight Y-translate, slight scale-up. GSAP timeline, ~25 LOC.
- Below reveal: three buttons — `Download PNG`, `Copy share link`, `Make another`.
- Mobile-first. Test on iPhone Safari + Android Chrome. Record button must hit the mic permission flow correctly on both.
- Empty-state copy on the homepage: 3-4 sample comics in a grid, randomized per page-load from a curated set of safe demo comics in R2.
- `app/c/[id]/page.tsx` polish: same panel-reveal animation on first paint for shared permalinks.

---

## Day 10 — Launch

**Artifact:** Public on Show HN, X, and Reddit. See [`LAUNCH.md`](./LAUNCH.md) for the full script.

- **Morning:** final QA pass. Run 20 dream transcripts end-to-end. Fix any sharp edges. Verify Stripe webhook (paid tier toggles unlimited).
- **10am PT:** Show HN post goes live. Tweet thread fires. 5 amplifier DMs sent (tldraw founders, named creative-AI accounts).
- **Throughout the day:** respond to every HN and Reddit comment within 15 minutes. Bug-fix in real time. Push small UX tweaks based on feedback.
- **Evening:** post 5 standout user-generated comics from the day to X as a follow-up thread.

---

## Out of scope for v1 (intentional)

- **Accounts and saved history.** Not on the critical path. better-auth + a simple `Sign in to save` flow can land in week 2 if usage warrants.
- **Style picker** ("watercolor / inkpunk / Ghibli / Moebius"). Tempting but adds choice-paralysis to the 30-second loop. v2.
- **Animated comics.** Cool, slow, expensive. v3.
- **Mobile app.** PWA is fine for v1. Native wrap if it pops.
- **Localization.** Whisper handles many languages already; Claude composes in any language. UI strings English-only for launch.
- **Multi-panel counts** (6, 9, 12 panels). Locked to 4. Constraint is a feature — recognizable artifact shape.

---

## Slip plan

If a day slips, the recovery order is:

1. **Day 8 (moderation) cannot slip past launch.** Non-negotiable. If anything else slips, this gets the borrowed time.
2. **Day 9 (polish) is the buffer.** A 90%-polished frontend launches; an 80%-polished frontend launches with apology. A frontend with no moderation does not launch.
3. **Day 4 (Claude composer) is the technical risk.** If continuity quality is bad on Day 4 evening, freeze it at "acceptable" and move on — fine-tune the prompt post-launch when real user transcripts surface the failure modes.
