# DreamToon — Architecture

> Tell me your dream. I'll draw it.
>
> 15 seconds of voice in. A 4-panel comic out. Thirty seconds end-to-end. Five cents a comic. Runs entirely on the Cloudflare edge.

DreamToon is a single-purpose generative app: the user holds a button, describes the dream they just woke up from, releases the button, and receives a shareable four-panel comic strip rendered in their chosen art style. The entire pipeline — transcription, scene composition, image generation, image composition, storage, delivery — runs on Cloudflare Workers with no external compute. The only third-party network calls are to Anthropic (Claude Sonnet 4.7 for scene composition) and Stripe (for the optional paid tier).

This document covers the system shape, the request lifecycle, the data plane, the cost model, the edge cases that actually break this kind of product, and the architectural decisions that look weird until you understand the constraints.

---

## 1. Why this shape

Three constraints drove every decision.

**Constraint 1: people open this app at 7am, half-conscious, having just woken from a dream.** They are not patient. They will not wait two minutes for a comic. The pipeline budget is thirty seconds wall-clock, with the first visible panel inside fifteen seconds. That kills any architecture that serializes the four image generations.

**Constraint 2: this has to cost less than five cents per comic to be viable at $3/mo unlimited.** That kills any architecture that touches an OpenAI image model, a hosted GPU, or a long-running compute box. Workers AI Flux Schnell at roughly half a cent per image is the only number that works.

**Constraint 3: dreams are weird, fragmented, sometimes inappropriate, sometimes mention copyrighted characters.** That forces a content-shaping layer between raw transcript and image prompts. Claude does that shaping. It also drives character continuity across all four panels, which is the difference between a comic and four unrelated images.

Everything below is downstream of those three constraints.

---

## 2. System diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Next.js 16 on Cloudflare Pages)                       │
│  • MediaRecorder API → 15-sec opus/webm blob                    │
│  • POST /api/dream  (multipart: audio + style)                  │
│  • SSE stream back: panel-by-panel status updates               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (Hono + TS)  —  /api/dream                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 0. Rate-limit check (KV: ip-hash → count, 3/day free)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Store raw audio → R2 (audio-recordings/<dreamId>)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. Transcribe (Workers AI: @cf/openai/whisper-large-v3) │   │
│  │    → transcript string (~1-3 sec)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3. Compose (Anthropic via AI Gateway: Claude Sonnet 4.7)│   │
│  │    Single prompt, structured output:                     │   │
│  │    {                                                     │   │
│  │      character_sheet: "...",                             │   │
│  │      art_direction: "...",                               │   │
│  │      panels: [                                           │   │
│  │        { scene, mood, camera, dialogue?, prompt },       │   │
│  │        × 4                                               │   │
│  │      ],                                                  │   │
│  │      safety: { flagged: bool, reason? }                  │   │
│  │    }                                                     │   │
│  │    ~2-3 sec, cached on identical transcript              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4. Generate 4 panels in PARALLEL                         │   │
│  │    Promise.all([                                         │   │
│  │      env.AI.run('@cf/black-forest-labs/flux-1-schnell',  │   │
│  │                 panels[0].prompt),                       │   │
│  │      … × 4                                               │   │
│  │    ])                                                    │   │
│  │    Each panel 1024×1024 PNG, ~6-10 sec parallel          │   │
│  │    On per-panel failure: retry once with reseeded prompt │   │
│  │    Stream "panel N ready" events to client over SSE      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5. Compose final image (Sharp WASM on Worker)            │   │
│  │    • 2×2 grid, 2048×2048 canvas                          │   │
│  │    • Gutter: 24px white, 6px black border per panel      │   │
│  │    • Panel number badges (1-4) top-left                  │   │
│  │    • Speech bubbles via SVG overlay if panel.dialogue    │   │
│  │    • Watermark: "dreamtoon.app" bottom-right             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 6. Persist                                               │   │
│  │    • R2: panel-images/<comicId>/{1,2,3,4}.png            │   │
│  │    • R2: final-comics/<comicId>.png                      │   │
│  │    • D1: insert rows into dreams + comics                │   │
│  │    • KV: increment ip-hash rate-limit counter            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Return { comicId, url } to browser → redirect /comic/[id]      │
└─────────────────────────────────────────────────────────────────┘
```

Total wall-clock budget on the happy path: roughly 18-26 seconds. Worst case (one Flux retry): 32 seconds. We hard-cap the Worker at 45 seconds and fail loudly past that.

---

## 3. Cloudflare resources

The entire data plane lives on six Cloudflare primitives.

**D1 — `dreamtoon-db`.** Three logical tables.

- `users` — `id`, `email`, `plan` (`free` | `pro`), `stripeCustomerId`, `createdAt`. Optional; anonymous dreaming is the default path.
- `dreams` — `id`, `userId` (nullable), `audioR2Key`, `transcript`, `ipHash` (sha256 of IP + daily salt), `createdAt`. One row per recording, regardless of success.
- `comics` — `id`, `dreamId` (FK), `finalImageR2Key`, `panel1R2Key` … `panel4R2Key`, `style` (enum: `line-art` | `oil` | `pixel` | `watercolor`), `shareCount`, `viewCount`, `gallery` (bool, default false), `createdAt`. One row per successful generation. Dreams without a comic row mean the pipeline failed.
- `usage` — `ipOrUserId`, `day` (YYYY-MM-DD), `comicCount`. Daily counter for free-tier enforcement. Primary key is the pair.

D1 is the source of truth for everything addressable. R2 keys are stored on these rows; never enumerate R2 directly.

**R2 — three buckets, separated by lifecycle.**

- `audio-recordings` — 7-day lifecycle rule. We keep audio briefly for debugging/abuse appeals, then drop it. Never linked publicly.
- `panel-images` — individual 1024×1024 panel PNGs. Kept as long as the parent comic.
- `final-comics` — composed 2048×2048 PNGs. Public-read via signed URL pattern or via a custom domain bound to the bucket. This is what gets shared.

Separate buckets matter because the audio bucket has the strictest retention and the strictest access (signed URLs only, never linked from comic pages). Mixing them invites a future leak.

**KV — `dreamtoon-rl`.** Two namespaces of keys.

- `rl:ip:<ipHash>:<day>` → integer, TTL = 26 hours. Counter for anonymous free-tier rate-limiting (3/day).
- `rl:user:<userId>:<day>` → integer, TTL = 26 hours. Same shape, signed-in path. Pro users skip this check entirely.

KV is the right primitive here: eventually consistent is fine for rate-limits (the worst case is one extra free generation, which costs us five cents).

**AI Gateway — `dreamtoon-gw`.** Wraps every Anthropic call and every Workers AI call. Three things we get from it that we don't get from raw SDK calls.

1. **Prompt caching for Claude.** Identical transcripts hit the gateway cache and return Claude's structured output for free. This is huge on the free tier — sample comics on the landing page get hit thousands of times, all free after the first.
2. **Spend cap.** Hard daily ceiling. If we somehow get hit with abuse the gateway shuts off Anthropic before our card explodes.
3. **One log surface.** Every model call, every retry, every cost, in one dashboard.

**Workers Cron — daily, 03:00 UTC.**

- Sweep `comics` where `gallery = false` AND `createdAt < now() - 7d` AND owner is on the free tier. Delete corresponding R2 objects (final + 4 panels + audio) and the D1 rows. Free-tier storage is a treadmill — we don't pay to store strangers' dream art forever.
- Recompute gallery ranking: top 50 comics by `shareCount + viewCount/10` over the last 14 days, written to a `gallery_top` table the `/gallery` page reads from. Saves an expensive query on every page load.

**No Durable Objects.** The whole pipeline is request/response with no cross-client state. Rate-limiting is per-IP not per-room. There is nothing to coordinate. Adding a DO here would be cargo-culting.

---

## 4. The Claude scene composer

This is the load-bearing piece of the architecture. The difference between DreamToon and a thin wrapper around Flux is exactly this step.

We send Claude Sonnet 4.7 one structured-output call. The system prompt is roughly 800 tokens and is **cached** via AI Gateway / Anthropic prompt caching — every dream after the first one only pays for the user's transcript and the output.

The system prompt establishes four things.

1. **Character continuity.** Claude must invent a one-paragraph `character_sheet` describing the protagonist (and any recurring secondary characters) in concrete visual detail: hair, clothing, build, age, distinguishing features. That sheet is then prefixed into every panel prompt, so Flux gets the same visual description four times. Without this, panel 1 is a redhead and panel 4 is a blonde and the comic is incoherent.
2. **Art direction.** Based on the user's `style` choice (line-art / oil / pixel / watercolor), Claude assembles a style block — about 100 tokens describing line weight, palette, shading, and reference influences. Same block in all four panel prompts.
3. **Panel composition.** Each panel gets `scene`, `mood`, `camera` (close-up / medium / wide / over-the-shoulder), and optional `dialogue`. The four panels follow a loose narrative arc: setup → development → twist → resolution. Claude is explicitly told not to require a coherent ending — dreams don't have endings.
4. **Safety shaping.** Three filters baked in. First, any mention of a copyrighted character ("Mickey Mouse", "Pikachu", "Darth Vader") is rewritten to a generic equivalent in the panel prompts ("a cartoon mouse in red shorts", "a yellow electric rodent", "a tall man in black armor"). Second, NSFW content gets flagged in `safety.flagged = true` and the pipeline halts with a friendly message. Third, depictions of minors in unsafe contexts hard-fail.

Output is structured JSON, validated against a Zod schema on the Worker. Validation failure triggers exactly one retry with a "your previous response did not match the schema, here is the schema, try again" follow-up. Two failures = pipeline failure, return the user's credit.

Cost per call: roughly 1,200 cached input tokens + 300 fresh input + 600 output = about $0.018 at Sonnet 4.7 pricing. Down to about $0.006 on cache hits.

---

## 5. Image composition

Flux Schnell returns 1024×1024 PNGs as `ReadableStream<Uint8Array>`. We pull all four into memory (4 MB total, trivial on a Worker) and feed them into Sharp WASM.

The composition logic is mechanical:

- Create a 2048×2048 white canvas.
- Resize each Flux output to 992×992 (leaving room for gutters).
- Composite at `(24, 24)`, `(1032, 24)`, `(24, 1032)`, `(1032, 1032)`.
- Composite four SVG panel-number badges (1, 2, 3, 4) at each panel's top-left corner.
- For each panel that has `dialogue`, composite an SVG speech bubble. Bubble placement is deterministic: top half of the panel, sized to the dialogue length, with a tail pointing at the panel center.
- Composite the watermark SVG at bottom-right of the full canvas.

Output PNG, around 1.5-2.5 MB. Stream straight to R2 via `R2Bucket.put` with the body being the Sharp output buffer.

Sharp's WASM build runs comfortably under the Worker CPU budget. We measured ~700ms for the full composition step on cold CPU, ~400ms warm. If we ever outgrow this, the fallback is to call out to a separate Worker with `@cf/squoosh`-style image bindings, but we're nowhere near that point.

---

## 6. Cost model

Per-comic happy-path cost:

| Step | Cost |
|---|---|
| Whisper transcription (~15s audio) | $0.0008 |
| Claude Sonnet (cached system prompt + small I/O) | $0.018 (uncached) / $0.006 (cached) |
| 4× Flux Schnell @ ~$0.005 each | $0.020 |
| R2 storage (~3 MB, prorated monthly) | $0.0001 |
| Worker CPU + invocation | $0.0001 |
| **Total per fresh comic** | **~$0.039** |
| **Total per cached/repeat dream** | **~$0.027** |

At $3/month unlimited with realistic usage (~30 comics/month for a power user), gross margin sits around 60% even on the heaviest user. The free tier (3/day = 90/month worst case) costs us about $3.50/user/month before R2 cleanup — which is why the 7-day deletion cron is non-optional.

---

## 7. Free vs paid

- **Free, anonymous.** 3 comics per IP per day, enforced via KV counter on `ipHash`. Comics auto-delete after 7 days unless the user opts them into the public gallery. No account required.
- **Free, signed-in.** Same 3/day cap but counted on `userId` instead of IP. Comics persist as long as the account does. Gallery opt-in available.
- **Pro, $3/month via Stripe.** Unlimited generation (with a soft 100/day abuse cap, not advertised). Comics persist forever. All four styles unlocked. Access to "remix" — re-render a saved dream in a different style without re-recording.

Stripe is metered subscription, not per-generation billing. Simpler, and the per-comic margin is high enough that we don't need to meter.

---

## 8. Edge cases that actually break this

Listed in order of how often they fire in practice.

**Abstract/incoherent dreams.** "I was just floating and then there was a feeling." Claude is instructed to lean into surrealism here: vague atmospheric panels rather than refusing. The composer prompt explicitly says "incoherent dreams are valid — render the *feeling*, not a story." Almost always produces something interesting.

**Copyrighted characters.** Handled at the Claude layer (see §4). Never reaches Flux. If a user describes their dream as "I was Spider-Man fighting Thanos", the panel prompts come out as "a young man in a red and blue web-themed suit" and "a large purple armored warlord." We never log the original mention or refuse the user — we just quietly generalize.

**NSFW content.** Two-layer filter. Claude flags during composition (`safety.flagged = true`) and the Worker halts before Flux. As backstop, Workers AI Flux has its own safety filter, so even if Claude misses something, generation fails closed. User sees: "I couldn't quite see that one. Try again?" — no shaming, no detail.

**Child-safety content.** Hard-coded refusal at the Claude layer for any combination of minors with unsafe context. Pipeline halts. No image generated. Logged for review (audio retained the full 7 days for this case specifically).

**Flux generation failure.** Flux Schnell occasionally returns an error or an obviously broken image (all-black, all-noise). One retry with a new seed and a slightly reworded prompt. Second failure → user gets a 1-comic credit refunded to their daily counter and a "the muse was offline, try again" message.

**Audio over 15 seconds.** Enforced client-side (MediaRecorder stops automatically) and server-side (reject any audio file over 200 KB / longer than 16 seconds after decode). The 1-second slack server-side accounts for codec overhead.

**Audio that's silent or pure noise.** Whisper returns an empty or nonsense transcript. We detect transcripts under 8 characters or with a high ratio of non-word tokens and fail early before paying for Claude: "I couldn't quite hear that — give it another go?"

**Same dream submitted twice quickly.** AI Gateway caches the Claude call (same transcript → same composition), but Flux still runs fresh because we want visual variation between identical-transcript submissions (different seeds). Net effect: second submission is about 30% cheaper but still gives a different-looking comic.

**Abuse — same IP slamming the endpoint.** KV counter hits 3 and the endpoint returns 429 with a "come back tomorrow or upgrade" message. KV counter has a 26-hour TTL so the reset is automatic.

---

## 9. What's deliberately not here

- No real-time / WebSocket pipeline. The 30-second SSE stream is enough; we don't need bidirectional.
- No user-uploaded reference images. Voice-only is the product. Adding image upload doubles the safety surface area.
- No video. The format is comic strips. People asking for "animated dreams" are politely told to wait.
- No fine-tuned model. Flux Schnell with good prompting and the Claude character-sheet trick is more than enough for a 2×2 grid at this scale.
- No Durable Objects, no queues, no R2 event notifications. The request-response shape genuinely doesn't need any of it.

When any of those become necessary, they're additive — none of them require rewriting the core pipeline. That's the test.
