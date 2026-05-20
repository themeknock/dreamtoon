# DreamToon — Frontend

> The product is a button. The button knows what you dreamed about.

The frontend's only job is to make a half-asleep human believe that pressing one button on a phone screen will, thirty seconds later, give them a shareable comic of last night's dream. Everything in this document — pages, components, copy, motion, error states — is downstream of that one job.

Stack: Next.js 16 (App Router, deployed to Cloudflare Pages), Tailwind v4, shadcn/ui, TypeScript strict, GSAP for the hero, Framer Motion for component-level transitions, `wavesurfer.js` for the recording waveform. No state library — TanStack Query for server state, `useState`/`useReducer` for everything local. No Redux, no Zustand, no contexts beyond auth.

---

## 1. Design system

**Theme.** Cream-but-magical. The base is a warm off-white (`#FBF7EE` light, `#1B1714` dark), but every interactive surface gets a subtle dream gradient: a soft `radial-gradient` that drifts slowly behind the recording button, paired with a low-saturation blue-to-pink wash on the comic viewer. Nothing screams. Everything glows.

Tailwind v4 theme variables (in `app/globals.css`):

```css
@theme {
  --color-cream-50: #FBF7EE;
  --color-cream-100: #F4EEDF;
  --color-ink-900: #1B1714;
  --color-ink-700: #3A3128;
  --color-dream-pink: #F7C8D9;
  --color-dream-blue: #C8DCF7;
  --color-dream-gold: #E8B96A;
  --font-display: "Fraunces", serif;
  --font-body: "Inter", sans-serif;
  --shadow-dream: 0 20px 60px -20px rgb(232 185 106 / 0.35);
  --radius-soft: 1.25rem;
}
```

**Typography.** Fraunces for headlines (the soft slab serif gives the "bedtime story" feel), Inter for body. Headlines tracking-tight, body tracking-normal. One size up from default on mobile — these users are squinting.

**Motion principles.** Everything fades in (not pops). The record button breathes (slow scale 1.00 → 1.04 → 1.00, 4 sec loop, paused on hover/active). Panel-by-panel reveal during generation uses a `clip-path: inset()` wipe from top, not a fade — it feels more like drawing.

**Mobile-first.** This is the unusual constraint. Most people dream, wake up, and reach for their phone within thirty seconds. The desktop site exists but is secondary. Every layout collapses cleanly at 360px wide. The record button is the largest tap target on the page on mobile (200×200px), and it stays anchored within thumb reach on portrait phones.

---

## 2. Pages

### `/` — landing

Three sections, vertical scroll, no nav bar competing for attention.

**Hero (100vh).** One giant headline, the record button, and nothing else above the fold. A single line of subcopy under the button. The background has a slow GSAP-animated gradient drift (a `radial-gradient` whose center coordinates animate over a 20-second loop). On scroll, the headline parallaxes up at 0.4× the scroll speed.

Headline: **"tell me your dream — I'll draw it."**
Subcopy: **"15 seconds of voice. 4 panels. Ready to share."**
Button: the `RecordButton` component (see §3).

The headline is lowercase intentionally — it reads softer, more bedside-table.

**Sample carousel (60vh).** Horizontal-scrolling row of six pre-made sample comics with their original dream transcripts shown on hover. Snap-scroll, no buttons, just swipe/drag. Each card is `aspect-square`, the comic itself, and below it a one-line transcript like *"I was a fish but I could fly"*. Clicking opens `/comic/[id]` for that sample.

These six samples are seeded into D1 at deploy time and pinned with `gallery = true`. They double as cache warmers for AI Gateway — anyone who tries the same dream pulls the cached Claude response.

**How it works (40vh).** Three steps, icons, brief copy. Hold the button. Describe your dream. Get a comic. Not "how the AI works" — users don't care about the model stack on this page.

**Footer.** Tiny. Links to `/legal`, `/gallery`, `/dashboard`, GitHub, contact email. Twelve-point font. Should feel like an afterthought because it is.

### `/comic/[id]` — the shareable comic

This is the page that gets shared on Twitter/iMessage/TikTok, so it needs to load fast and look great in an OG card.

**Above the fold.** The 4-panel comic centered, max-width 720px on desktop, full-width minus 16px gutter on mobile. Below it: an audio playback control showing the original recording (with a waveform via `wavesurfer.js`), so people can hear the dream the comic came from. Tap the waveform to play.

**Below the fold.** Big share row — Twitter, copy link, save image, share-sheet (native on mobile). Below that: "made with DreamToon" with a soft CTA to record your own.

**OG image.** Generated server-side at `/api/comic/:id/og.png`. 1200×630, the first panel on the left, the headline "a dream, drawn." on the right, watermark bottom-right. Set in `metadata.openGraph.images` for the route. The page also sets `twitter:card = summary_large_image`.

**Performance.** The comic image is served from R2 via custom domain `cdn.dreamtoon.app` with aggressive cache headers (`public, max-age=31536000, immutable`). Next.js `<Image>` with `unoptimized` since R2 is already optimized. No client JS required to view a comic — server-rendered HTML with the image and OG tags, JS only hydrates for the share buttons and waveform.

**Privacy.** Comics are unlisted by default — you need the ID to view. The `gallery` opt-in is a toggle on the page if you own the comic; flipping it on adds it to `/gallery`.

### `/gallery` — public opt-in feed

Paginated grid of comics where `gallery = true`, sorted by the `gallery_top` ranking the cron job maintains. 24 per page, infinite scroll with intersection observer, prefetch the next page on scroll.

Each tile is square, hover reveals a one-line transcript snippet (truncated to 60 chars). Click → `/comic/[id]`. Mobile: 2 columns, no hover, transcript shows inline below image on tap-hold.

A small filter chip row at the top: `all` / `line-art` / `oil` / `pixel` / `watercolor` / `today` / `this week`. Filters serialize to URL (`?style=oil&period=week`) so they're shareable.

### `/dashboard` — signed-in only

Listing of your comics. Same grid shape as `/gallery` but with extra controls per card: rename, toggle gallery, delete, "remix in another style" (Pro only). Sidebar shows usage (`12 / 90 this month` on free, `unlimited` on pro), plan info, link to Stripe customer portal.

Empty state for a new user: a single sentence, "you haven't told me a dream yet," with a button that goes back to `/`.

### `/legal`

One scrollable page. Three sections — Terms, Privacy, Content Policy. No tabs, no separate routes. Written in plain English, not lawyer English. The content policy explicitly addresses copyrighted characters ("we'll quietly redraw them as generic versions") and content we won't generate (CSAM, real-person nonconsensual, explicit content involving minors). Honesty here builds trust.

---

## 3. Components

### `RecordButton`

The heart of the app. One component, three states, one giant tap target.

**Idle.** A 200×200px (mobile) / 280×280px (desktop) circle, cream-gold gradient fill, slow breathing animation, a tiny microphone icon centered. Below the button, in 14px ink-700: "hold to record". On hover (desktop only): the breathing animation pauses and the shadow grows.

**Recording.** Tap-and-hold (mobile) or click-and-hold (desktop) starts recording. The button fills with a circular progress ring that completes over 15 seconds. Inside the ring, a live waveform from the mic input (using `AnalyserNode` from Web Audio API). Below: "describing your dream..." with the seconds counter. Releasing the button (or hitting 15 seconds) stops recording and triggers upload. Background gradient subtly intensifies during recording.

**Generating.** Button disappears (fade-out + scale-down). Replaced by the `GenerationProgress` component (see below).

Implementation notes. Use `MediaRecorder` with `audio/webm;codecs=opus`. Request mic permission on first interaction, not on page load. If permission denied, swap the button for a copy block explaining why we need the mic (with browser-specific instructions for re-enabling). Use `navigator.vibrate(20)` on press start (mobile only, falls through silently elsewhere) for haptic feedback.

The hold-to-record interaction matters. Click-to-start / click-to-stop sounds simpler but tested worse — half-asleep users forgot to press stop and recorded 60 seconds of silence. Hold-to-record self-limits by physical fatigue.

### `GenerationProgress`

Shown for the ~25-30 seconds between release and final comic.

A 2×2 grid where each cell is initially a soft cream-colored placeholder with a slow shimmer animation. As each panel comes back from the server (via SSE), the corresponding cell fades in with the panel image. The order isn't guaranteed (parallel Flux calls return in any order), so we render whichever finishes first into its assigned slot.

Below the grid, a one-line status:

- "listening..." (0-2 sec, while transcribing)
- "imagining..." (2-5 sec, while Claude composes)
- "drawing panel 1..." → "panel 2..." → "panel 3..." → "panel 4..." (as Flux returns)
- "putting it together..." (during Sharp composition)
- "done!" (right before redirect)

After the final panel composition finishes, the four-cell preview gracefully cross-fades into the final composed image, and the page navigates to `/comic/[id]`. The cross-fade is the key trick — without it, the redirect feels jarring.

### `ComicViewer`

Renders the final 4-panel comic on `/comic/[id]`. Two modes:

**Default.** 2×2 CSS grid, each panel `aspect-square`, gap-2 on mobile (8px), gap-4 on desktop. Click any panel to enter zoom mode.

**Zoom.** Selected panel fills 90vw/90vh with a backdrop blur over the rest of the page. Tap outside or hit Escape to exit. Arrow keys / swipe navigate between panels in zoom mode.

The viewer is a Server Component for the default render — no JS needed to see the comic. Zoom mode hydrates lazily via a small client component that wraps the grid.

### `StyleToggle`

Used on the landing page (above the record button) and on the dashboard (per-comic "remix" picker for Pro users). Four chip-style toggles: `line-art`, `oil`, `pixel`, `watercolor`. Each chip has a tiny thumbnail showing the style. Single-select. Default is `line-art` for new users; remembered in localStorage after first use.

On the landing page, the selected style is included as a form field in the POST to `/api/dream`. Visual feedback on select: a soft glow under the chip plus a slight scale-up.

### `ShareRow`

Below the comic on `/comic/[id]`. Four buttons.

- **Copy link** — `navigator.clipboard.writeText`, button label changes to "copied!" for 2 seconds.
- **Save image** — fetches the R2 image as a blob and triggers a download. On iOS Safari, falls back to opening the image in a new tab with a "tap-hold to save" hint.
- **Share** — `navigator.share` if available (mobile), else opens a small modal with Twitter/Facebook/iMessage links.
- **Twitter** — direct intent URL with prefilled "I dreamt this last night → [link]".

Each share action POSTs to `/api/comic/:id/share` to increment `shareCount`. Fire-and-forget, doesn't block the share itself.

### `AudioPlayback`

Used on `/comic/[id]` to play back the original dream recording. Waveform via `wavesurfer.js`, single play/pause toggle, total/elapsed time. The audio URL is a signed R2 URL with a 1-hour TTL, fetched fresh on page load.

Only renders if the dream's audio is still in R2 (audio is deleted after 7 days for free-tier comics). If audio is gone, the component renders just the transcript instead as italicized text.

---

## 4. Copy voice

The product talks like someone reading a bedtime story to themselves. Lowercase, gentle, present tense, never apologetic but never overconfident. A few examples:

- Recording prompt: "tell me your dream"
- After release: "let me see if I caught that..."
- Mid-generation: "drawing now..."
- Error (transcript failed): "I couldn't quite hear that — give it another go?"
- Error (NSFW/unsafe filter triggered): "I couldn't quite see that one. Try again?"
- Error (Flux failed twice): "the muse was offline. one more try?"
- Rate limit hit: "that's 3 for today — come back tomorrow, or upgrade for unlimited."
- Empty dashboard: "you haven't told me a dream yet."
- Pro upgrade CTA: "$3/mo. dream as much as you want."

Two banned words: "AI" and "generate". The product never refers to itself as AI on user-facing surfaces. It "draws". It "listens". It "imagines". Pulling the model machinery out of view is the whole magic.

---

## 5. Loading and error states

**Loading principles.** Never a spinner. Always either a shimmer (for content placeholders) or a slow contextual animation (the dream gradient drift, the breathing record button, the panel-by-panel reveal). Spinners feel like waiting for a database; shimmers feel like watching something arrive.

**Error principles.** Three layers.

1. **Inline, gentle, retryable.** Most errors (mic permission, transcript failure, Flux failure) render as a softly-styled card right where the user was working, with one retry button. Never a full-screen error page.
2. **Toast for transient.** Network blips, share failures, copy-link failures use shadcn `Toast` at the bottom of the screen, 3-second auto-dismiss.
3. **Full-page only for terminal.** 404, 500, rate-limit ceilings get a full page with the same cream theme and a clear next action.

**Specific error mappings.**

- Mic permission denied → inline card with browser-specific re-enable steps.
- Recording too short (<2 seconds of audible content) → "I didn't catch any words — try again?"
- Transcript empty → "I couldn't quite hear that — give it another go?"
- Claude safety flag → "I couldn't quite see that one. Try again?" (deliberately vague — no shaming).
- Flux failure after retry → "the muse was offline. one more try?" (refunds the daily counter server-side).
- Rate limit → "that's 3 for today — come back tomorrow, or upgrade for unlimited." with upgrade CTA.
- Generic 500 → "something got tangled. one more try?" with a small "report this" link that opens a mailto.

---

## 6. Auth (optional, via better-auth)

Anonymous is the default everywhere. No nag, no login wall, no email-gating to see your own comic — the comic ID is the credential.

Sign-in shows up in exactly three places:

- Top-right of every page, a tiny "sign in" link, only if the user isn't signed in. After sign-in, it becomes their avatar.
- On `/comic/[id]`, a small inline pill: "save this to your dashboard?" → triggers sign-in via magic link.
- On `/dashboard` route, redirects to sign-in if anonymous.

Magic-link auth only. No passwords. No social. better-auth with the Resend email adapter, sessions in D1, cookies HTTP-only and SameSite=Lax.

After sign-in, any anonymous comics made from the same browser (tracked via a `dt_anon` cookie) get retroactively linked to the new account — a small but important detail. People hate losing the comic they just made.

---

## 7. Performance budget

Three hard targets, measured on a throttled-4G Moto G4 simulation:

- **LCP under 1.8s** on `/` and `/comic/[id]`. Achieved via server-rendered HTML, font preloading, R2 images with `priority` on the comic and `loading="eager"` on the first-panel hero sample.
- **INP under 200ms** on the record button press. The button must respond visually within one frame regardless of mic permission state.
- **CLS effectively zero.** All image containers have explicit `aspect-ratio`. Fonts are preloaded with `font-display: swap` and a metrics-matched fallback so the swap doesn't shift layout.

Bundle budget for the landing page: under 90 KB JS gzip. shadcn components are imported individually. GSAP is loaded async after first paint (the gradient drift is decorative — the page works without it).

Routes that are entirely server-rendered (`/`, `/comic/[id]`, `/gallery`, `/legal`) ship effectively no client JS by default. Client components are leaves, never the page shell.
