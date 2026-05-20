# UI/UX Synthesis — 10-Agent Research

10 parallel research agents, one per orthogonal UI/UX dimension. Findings ranked by ROI and applied to DreamToon code. This doc is the audit trail: research finding → code change → file touched.

## The thesis that emerged

DreamToon's product loop has five moments. Four of them are currently shaped but unpolished. The single highest leverage upgrade across all 10 agents converges on the same pattern:

> **Receipt → Preview → Surprise.** Show the user proof you heard them (transcript at 2s). Show the result coming alive (panels streaming as Flux returns them). Hold the magic for the very end (stitch + reveal on the final panel land).

Every code change below maps to one of those three beats — or to the surrounding chrome (landing, share, refusal, palette, type).

---

## Tier S — shipped this pass

### 1. Headline copy + landing reshape (Agent 4 — landing)

**Finding:** Suno + v0.dev both put the input bigger than the headline. The headline names the gesture, not the category ("Describe a song", not "AI music generator"). 4 tappable example chips solve the "blank page / I'm in public won't talk to my phone" problem — single biggest landing conversion lever.

**Applied:**
- Headline: `"Describe your dream. Get a 4-panel comic."` → **`"Talk. Get a comic."`**
- Removed the gold gradient on the emphasized phrase (replaced with Fraunces Italic — see Tier S #4)
- Removed redundant `"Voice in · comic out"` kicker (was doing the headline's job)
- Added `<ExampleChips>` component: 4 tappable prompt-stubs ("a dragon who runs a bakery", "my Monday morning", "two raccoons rob a bank", "I was flying over a city made of bread"). Tapping doesn't pre-fill audio — it sets a "dream prompt" for the user to read aloud, lowering the cold-start barrier.
- "Pro" link moved to a quiet corner; "Gallery" demoted to footer.

**Files:** `app/page.tsx`, `components/example-chips.tsx` (new).

---

### 2. Polaroid develop reveal (Agent 2 + Agent 10 — converged hard)

**Finding:** Current reveal is a 400ms-stagger fade. Both reveal-research and micro-interactions agents converged: 2×2 comics have a natural Z-pattern reading order (TL→TR→BL→BR). Stagger in that order. Use blur-to-sharp + slight scale-overshoot + the `cubic-bezier(0.16, 1, 0.3, 1)` "expo-out" curve. Hold a 600ms breath BEFORE reveal starts (this is what separates "reveal" from "page load"). Haptic + soft chime ONLY on the final panel (annoying on each).

**Applied:**
- `ComicReveal` rewritten:
  - 600ms held-breath empty-cream pause before any panel appears
  - Reading-order stagger (TL→TR→BL→BR), 220ms apart
  - Each panel: `opacity 0 → 1`, `scale 0.94 → 1`, `filter: blur(8px) → blur(0px)`, 400ms
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (longer tail = "settling into existence")
  - `navigator.vibrate(12)` on the final (panel 4) land, gated to mobile
  - Stitch line — subtle gold-leaf bottom-border sweep on the comic container at t+1400ms

**Files:** `components/comic-reveal.tsx`.

---

### 3. Dream-gradient: drop purple → 2-stop only (Agent 8 — palette)

**Finding:** 3-stop gold→orange→purple is the AI-app/horoscope tell of 2023-2024. In 2026 it reads dated. Keeping warm gold→orange retains the magical promise without horoscope smell.

**Applied:**
- `--dream-gradient: linear-gradient(135deg, #b8861f 0%, #d96a36 100%)` (was 3-stop with `#7a3a7a` purple end-stop)
- Gradient demoted from H1 use → only on the panel-frame loading shimmer + sample-comic hover states (texture, not voice)
- H1 emphasis now uses **Fraunces Italic** instead of gradient (see Tier S #4)

**Files:** `app/globals.css`.

---

### 4. Typography overhaul: Fraunces for H1 (Agent 9 — type)

**Finding:** JetBrains Mono 700 at -0.04em on cream paper reads "operator-grade infra tool" — collides with the dream-art-product intent. Linear/Vercel/Granola get away with it because they ARE dev tools. Move H1 to Fraunces variable (SOFT axis), keep Inter for body, retain mono only for badges/wordmark/panel-numbers as themeknock brand thread. Replace gradient-on-H1 with Italic-on-emphasis (Vercel/Rauno/Emil 2026 move).

**Applied:**
- Added `Fraunces` via `next/font/google` with `SOFT` + wonky `opsz` axes loaded
- H1 globally: `font-family: var(--font-display)` (= Fraunces)
- Emphasized phrase on hero: `<em className="font-display italic">comic</em>` — the italic IS the emphasis
- JetBrains Mono preserved on: wordmark, panel-number badges, micro-labels, watermark — brand-consistency thread across the 10 themeknock repos
- Body leading: 1.55 (down from 1.6) — tighter, editorial-feel

**Files:** `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/c/[id]/page.tsx`, `app/gallery/page.tsx`, `app/upgrade/page.tsx`.

---

### 5. Terracotta links + paper grain + warmth (Agent 8 — palette)

**Finding:** Gold body links fail WCAG AA on cream (3.4:1) AND smell horoscope. Anthropic uses warm clay (`#cc785c`) — same family, different temperature. Add subtle paper grain (1-2% noise SVG overlay) to separate "cream surface" from "beige div".

**Applied:**
- New token `--link: #8a3a1a` (terracotta-deep, 5.8:1 on cream — AA pass)
- All inline links: `color: var(--link)`, `text-decoration: underline`, `text-underline-offset: 2px`, `text-decoration-thickness: 1px` (Read.cv treatment)
- `--accent-deep #9a6f15` retained for icons/borders only
- `@utility paper-grain` — fixed-attachment SVG noise overlay at 2% opacity on body

**Files:** `app/globals.css`.

---

### 6. Processing UX: receipt → preview → surprise (Agent 3 — processing)

**Finding:** 20-30s waits without a receipt feel broken. The single highest-leverage UX moment is showing the transcript at 2s (Granola pattern). Then show panels filling in as Flux returns them, not after-the-fact. Replace mechanical stage pills with poetic streaming status lines ("Catching the colors before they fade…"). Stitch animation at the end is the reveal — no fake percentages.

**Applied:**
- `ProcessingPills` → renamed to `StatusStream`. Single rotating status line, 4s per swap, dream-themed copy library
- Transcript surfaces in italic immediately when `event: transcript` arrives (was: hidden under processing UI)
- Panels stream into a low-opacity preview grid as `event: panel_ready` fires — user sees 1/4, 2/4, 3/4, 4/4 fill in real-time (preview, not the final reveal)
- Final reveal still gated behind the full 600ms held-breath after `done` event
- Copy library (`lib/status-copy.ts`):
  - "Listening to your dream…"
  - "Catching the colors before they fade…"
  - "Drawing the first thing you saw…"
  - "Finding the light in your dream…"
  - "Pressing it into gold leaf…"

**Files:** `components/status-stream.tsx` (new, replaces processing-pills), `lib/status-copy.ts` (new), `components/recorder.tsx`.

---

### 7. Recording button: idle breathing + first-200ms morph (Agent 1 + Agent 10)

**Finding:** Best tap-to-record buttons morph (not just scale) in the first 200ms before audio capture, with an anticipation beat. Voice Memos pattern. Add idle breathing (scale 1.0 → 1.015 / 2.4s loop) so the eye knows where to act. Warm-shift the countdown ring in the final 3 seconds — TikTok proved this makes the cap feel like a creative constraint, not a failure state.

**Applied:**
- Idle breathing on the mic button via CSS keyframes (`@utility breathe`)
- First 200ms after tap: morph (Mic → stop-square icon), ring prime-draw 0→360deg empty, single `navigator.vibrate(8)` — all BEFORE `getUserMedia` runs (perceived latency drops to zero)
- Recording state: amplitude waveform scrolls right-to-left (was: bouncing frequency bars in place)
- Countdown ring color: dream-gradient stroke for 0-12s → amber (`var(--warn)`) at 12s → coral (`var(--bad)`) at 14s
- Soft haptic ticks at 12s + 14s; heavier tick at 15s auto-stop
- Active scale: 0.96 (down from 0.98 — 0.98 was too timid for a hero CTA)

**Files:** `components/record-button.tsx`, `components/recorder.tsx`, `components/waveform.tsx` (scroll mode added), `app/globals.css`.

---

### 8. Two-tier refusal voice (Agent 7 — refusal)

**Finding:** Whimsy on copyright/celebrity (cream-paper voice). Gravity on minors-unsafe/self-harm (plain serif, no illustration, hotline link). Same product, two registers — the visual carries the shift. Three-beat refusal structure (Claude model): soft decline → one-sentence reason in user's language → concrete redirect. On pipeline failure, NEVER throw the user back to home — preserve transcript, offer in-place retry.

**Applied:**
- `prompts/refusal-copy.md` rewritten with `whimsy` vs `gravity` columns
- `lib/refusal.ts` (new) — category → `{ tier, copy, ctaLabel, ctaAction }` map
- Recorder refusal UI now renders two visual variants based on `tier`:
  - **whimsy**: cream card, mute-italic copy, soft "try another dream" link
  - **gravity**: paper card, serif body, no illustration, hotline link inline (988 / Crisis Text Line) for self-harm
- Pipeline-error UI: transcript preserved + "Try finishing" / "Re-dream" buttons (was: throw to home)

**Files:** `prompts/refusal-copy.md`, `lib/refusal.ts` (new), `components/recorder.tsx`.

---

### 9. Share row: native share + inside-comic watermark intent (Agent 6 — sharing)

**Finding:** `navigator.share()` opens the iOS/Android native sheet on mobile — that's where the OG card unfurl gets tapped. Single primary CTA ("Copy share link"), secondary row for Download / Make-another. No social icons (degrades quality perception). Watermark INSIDE panel 4 (Polaroid/Dispo pattern) survives Instagram crop.

**Applied:**
- `ShareRow` uses `navigator.share()` when available (mobile), falls back to clipboard copy
- Single primary CTA: "Share comic" (mobile) / "Copy link" (desktop)
- Secondary row: Download PNG · Make another
- No X/IG/Slack buttons — link is universal
- **Watermark-inside-panel-4**: deferred to the Worker `pipeline/image.ts` polish pass (noted in SETUP.md — needs a baked watermark PNG anyway). Frontend ready when Worker ships the new composite.

**Files:** `components/share-row.tsx`.

---

### 10. iOS Safari + mobile hardening (Agent 5 — mobile)

**Finding:** Safari 18.4+ supports `audio/webm;codecs=opus`, older Safari still needs `audio/mp4`. Always probe. Permissions don't reliably persist across page loads on iOS Safari. WKWebView (Instagram in-app, TikTok in-app) is hostile — detect and redirect. iOS Vibration API ~useless; rely on semantic-HTML free haptics + Android `navigator.vibrate`. Use `viewport-fit=cover` + `safe-area-inset` for Dynamic Island.

**Applied:**
- MIME probe ladder confirmed in priority order: `webm/opus → webm → mp4/aac → mp4 → ogg/opus` (already in `lib/audio.ts` — verified correct)
- **In-page primer** before `getUserMedia`: shown on first tap of the mic, soft cream sheet that says "Next: allow mic access" with a Continue button — eliminates the cold-call system dialog
- `viewport-fit=cover` added to `<meta viewport>`, hero + footer use `env(safe-area-inset-bottom/top)`
- WKWebView detection via UA (`/FBAN|FBAV|Instagram|Line|MicroMessenger/`) — renders an "Open in Safari" CTA instead of attempting `getUserMedia`
- `Permissions API` pre-check: if `denied`, render the Settings-path screenshot help inline instead of attempting another doomed request
- `touch-action: manipulation` on the mic button (kills the 300ms tap delay)

**Files:** `app/layout.tsx`, `components/recorder.tsx`, `lib/audio.ts`, `lib/permission.ts` (new).

---

## Tier A — noted, not shipped this pass

These are high-value but require either Worker-side changes, design assets, or extended polish time. Each has a clear implementation note for the next pass.

| Item | Owner | Notes |
|---|---|---|
| Real watermark inside panel 4 (Polaroid pattern) | Worker `pipeline/image.ts` | Needs baked "dreamtoon.app" PNG asset. Replace placeholder dot. |
| OG image rendered at generation time | Worker `pipeline/image.ts` + new `routes/comic.ts` OG handler | 1200×630 with comic + prompt snippet bottom strip. Cache by hash. |
| Layer-2 image safety classifier | Worker `routes/dream.ts` after Flux | One `env.AI.run('@cf/meta/llama-guard-3-vision', ...)` per panel. Schema already there. |
| Second delight beat (subtle parallax/blink on one panel detail at t+30s post-reveal) | `components/comic-reveal.tsx` | Pick the panel with highest character close-up (heuristic from Claude scene-composer output — needs metadata) |
| Sound design system | `lib/sound.ts` + global audio context | Default-OFF toggle, speaker icon top-right. Web Audio API pre-decode on first gesture. |
| PWA install prompt after first comic | `app/manifest.ts` + `components/install-prompt.tsx` | Standalone PWA opens to mic auto-armed. |
| Stamp red `#b23a1f` for single CTA per page | `app/globals.css` + button variants | New Yorker move. |
| Dark mode (with cream identity preserved) | `app/globals.css` `[data-theme="dark"]` already exists | Wire the toggle. |
| Tightened body to 1.55 leading globally | Already partial — sweep all components | Editorial polish. |

---

## What didn't make the cut (intentionally)

- **6-second looped demo video behind hero** (Agent 4 suggestion). Adds bandwidth + competes with the mic for attention on mobile. Punt to post-launch A/B.
- **Auto-play preview audio on share permalink** (Suno pattern). DreamToon's artifact is image, not audio — audio belongs on Suno.
- **Public gallery with comments/reactions**. ROADMAP says v2. Holding.
- **Style picker UI** (4 art styles). ROADMAP says v2. Backend supports it; UI hides it.

---

## How to read this doc next time

Each agent's full output lives in the task-notification stream (not committed — agents return inline). The findings ABOVE are the synthesized actionable items. When polishing further:

1. Re-read Tier A list. Pick one. Cross-reference its source agent's full output in the conversation history for nuance.
2. Or: spawn one of the 10 agents again with a follow-up brief if you want a deeper dive on a specific dimension (the agent prompts in the transcript are reusable templates).
