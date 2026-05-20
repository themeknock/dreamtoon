# DreamToon — Marketing Content Playbook

> Describe your dream out loud. Get a 4-panel comic.
> Voice-in, art-out. Magic-transform. Shareable artifact. 10-day ship.
> Closest precedent: [tldraw/make-real](https://github.com/tldraw/make-real) — 10K stars in 2 weeks.

This file is the operator's marketing bible for DreamToon. It assumes Talha is solo (with light agency support), has 3-5 hrs/week, X is the strongest channel, LinkedIn is dormant, and the product's highest-leverage surface is the **visual artifact**, not the prose. Everything below optimizes for that.

Cross-reference: `/_shared/LAUNCH_PLAYBOOK.md` for the universal cadence, founder posture, and Show HN/Reddit/X mechanics that apply across all 10 repos. This file only covers what's DreamToon-specific.

DreamToon is the **highest viral-potential repo of the ten**. Reason: universal appeal (everyone dreams), visual artifact (1:1 comic image), low-effort to share (one tap → IG Story). Treat it accordingly — Instagram and TikTok get the heavy investment that the dev-tool repos don't get.

---

## 1. Audience

Seven concentric rings, ordered from most-viral-on-contact to most-strategic. We seed the inner rings first, ride them outward.

**Ring 1 — Creative AI X scene (initial spark).**
Builders and tasteful operators who'll retweet a novel voice-in-art-out demo within an hour of seeing it. Handles like [@fofrAI](https://x.com/fofrAI), [@levelsio](https://x.com/levelsio), [@swyx](https://x.com/swyx), [@steveruizok](https://x.com/steveruizok), [@suhail](https://x.com/Suhail), [@karpathy](https://x.com/karpathy). They don't need to "use" DreamToon — one quote-tweet from any of them is worth ~500 organic impressions on cold posts. This ring is where the make-real moment happens or doesn't.

**Ring 2 — Gen Z + millennial Instagram users.**
The biggest TAM. They don't care about AI; they care about a weird-funny artifact they can put on their Story. Sub-segments: bookstagram, journaling-gram, witchy/dream-symbolism IG, mental-health creators, art accounts. The hook is *"I described my dream and got this"* — the AI angle is invisible.

**Ring 3 — Lucid dreaming communities.**
[r/LucidDreaming](https://www.reddit.com/r/LucidDreaming/) (470K), [r/Dreams](https://www.reddit.com/r/Dreams/) (390K), Discord servers around dream journals, the World of Lucid Dreaming forum diaspora. These users *already journal their dreams in text* — DreamToon turns that ritual into a visual. Highest conversion-to-power-user ratio of any segment.

**Ring 4 — Mental health / journaling audience.**
Therapists' Instagram, Day One / Stoic / Reflectly users, somatic-work TikTok, shadow-work creators. Angle: dreams as self-knowledge, the comic as a memory aid. Don't oversell the therapeutic claim — gesture at it, let the user complete the thought.

**Ring 5 — Comic artists and indie illustrators.**
[r/comics](https://www.reddit.com/r/comics/), [r/webcomics](https://www.reddit.com/r/webcomics/), Lunarbaboon-style audiences, Instagram comic-strip accounts. Sensitivity: this audience is allergic to "AI replacing artists." Position DreamToon as **a tool for non-artists to externalize their dreams**, not as a comic-generation engine. Never call it "AI art for comic creators." Call it "a doodle for your dream."

**Ring 6 — Parents recording kid dreams.**
Massive sleeper segment. Parenting Instagram, mom-TikTok, [r/Parenting](https://www.reddit.com/r/Parenting/). A 4-year-old's dream rendered as a 4-panel comic is keepsake-grade content. Once a single parent posts "my kid told me her dream and I made it into a comic" and it pops, this ring opens wide.

**Ring 7 — Press, podcasts, newsletters.**
Last ring, not first. Pull them in only after we have a gallery of organically-posted user comics to point at. See §9.

---

## 2. Channel matrix

Ranked by expected ROI for DreamToon specifically. This ordering is **different** from the other 9 repos in the portfolio — Instagram and TikTok lead here, not X.

| Channel | Priority | Format | Cadence | Why |
|---|---|---|---|---|
| **Instagram** | P0 | Carousel + Reels + Story | Daily during launch week, 3x/wk after | Native home for the 1080×1080 artifact. Story-sharing is the viral loop. |
| **TikTok** | P0 | 15-30s dream→comic transforms | 5x launch week, 2x/wk after | Transformation videos are the format TikTok rewards. Voice→image is built for it. |
| **X / Twitter** | P0 | Threads, single-image posts, replies | Daily | Where the creative-AI scene lives. Where the make-real-style spark catches. |
| **Reddit** | P1 | Native text + image posts | 1 per subreddit, hand-tailored | r/Dreams, r/LucidDreaming, r/sideproject, r/comics (carefully), r/midjourney, r/aiArt. |
| **Pinterest** | P1 | Pin every comic to themed boards | Weekly batch | Yes for visual. Dreams + comic-strip search volume is huge and uncrowded. Long-tail traffic for 12+ months. |
| **YouTube Shorts** | P2 | TikTok reposts + longer compilations | Repurpose only | Free reach, zero marginal effort. |
| **LinkedIn** | P3 | Creative-AI angle only, monthly | Monthly | Talha's LinkedIn is dormant. Post once after launch as a "what I built" reflection — don't try to revive the channel for this. |
| **Show HN** | P2 | Single launch post | Once | Won't be as hot as a dev tool, but a polished demo gif can pop. |
| **Product Hunt** | P3 | Skip or defer | — | Crowded, low signal for consumer-visual products. Optional, not core. |
| **Discord (creative-AI servers)** | P2 | Sample comics, link in profile | Weekly | fal.ai, Replicate, Latent Space, Banodoco — soft seeding, not spam. |

The asymmetry: this product lives or dies on **Instagram + TikTok + X**. Reddit and Pinterest are compounding long-tail. Everything else is opportunistic.

---

## 3. Hero viral artifact

**The artifact is the marketing.** Everything else is distribution.

**Spec:**
- 1080×1080 PNG (Instagram-square-native; also works as IG Story crop with letterboxing).
- 2×2 grid of 4 comic panels.
- Watermark bottom-right: `dreamtoon.app` in a thin readable type — visible enough to credit, small enough not to obstruct the bottom-right panel. ~16px at 1080×1080, ~1.5% opacity-adjusted-to-readable.
- Caption strip across the top OR speech bubbles inside panels — pick one, never both. Recommend speech bubbles for dialog-heavy dreams, top caption for narrated dreams.
- Color palette: configurable but default to a "vintage Sunday-funnies" warm palette. The default look is the brand. Don't ship 10 styles at launch — ship one that's instantly recognizable.
- Optional: subtle paper-texture overlay. This is the difference between "AI slop" and "I want to print this."

**Why this artifact wins:**
1. Square format = no awkward crops on IG feed, IG carousel slide-1, Reddit thumbnail, Pinterest pin, X timeline, LinkedIn preview. One file, every surface.
2. 4-panel structure is universally readable in <3 seconds — the time someone takes to decide to share.
3. Watermark drives attribution without being ugly.
4. The format is recognizable — when a user sees a second DreamToon comic in the wild, they recognize the style and start to associate it.

**Story variant:** A 1080×1920 vertical version with the 4 panels stacked, designed for IG/TikTok Story full-screen. Generate both PNGs from the same job; surface a "Share to Story" button in the UI.

**Reel/TikTok variant:** A 9:16 video where the panels appear one by one with the user's voice narrating, then the full grid at the end. This is the single most important repurposing asset — see §8.

---

## 4. Pre-launch (T-30 → T-1)

Goal in pre-launch: **establish "Talha generates a dream comic every day"** as a known thing within the creative-AI X scene, *before* the product is even available. By T-1, ~50 people should already be asking "where can I try this."

**T-30 to T-21 — Personal artifacts only, no product mention.**
- Day 1: Talha posts a single dream-comic image to X. Caption: just the dream description in quotes, the comic image, no link. Reply to himself with one line: "made a thing that does this." No CTA.
- Days 2-10: One per day. Vary the dream type — mundane, surreal, anxious, funny, childhood. The goal is to show range without explaining.
- All posts also go to a private Instagram account (`@dreamtoon` or similar handle, reserved early) — building the gallery before opening it.

**T-20 to T-11 — Build-in-public, named product.**
- Reveal the name. One X post: "calling it dreamtoon. voice in, 4 panels out. ~10 days."
- Post the architecture sketch (voice → Whisper → Claude story-beats → image-gen → composite). Make-real audience loves this.
- Tease specific implementation choices people will argue about: which image model (Flux dev vs schnell, SDXL Lightning, Imagen), which transcription path, the speech-bubble compositing approach. Controversy = engagement.
- DM 3-5 Ring-1 handles privately with a working preview link. No ask, just "you might find this fun." Steve Ruiz, fofr, swyx.

**T-10 to T-4 — Drafts in public, dogfood loudly.**
- Daily dream-comic posts continue, but now with "made with dreamtoon, opens [date]" in image alt-text or quoted thread.
- Show one failure case — a dream the model couldn't render — and how it was fixed. Failure posts get disproportionate engagement and signal that this isn't a hype-only launch.
- Reserve handles: `@dreamtoon` on X, IG, TikTok, Pinterest, YouTube, Reddit. Same handle everywhere.

**T-3 to T-1 — Launch staging.**
- All launch-day drafts written and reviewed (X thread, Show HN, Reddit posts, IG carousel, TikTok script, 6 DM templates).
- 10 pre-generated dream-comics queued for the launch-day X thread (variety: funny / scary / surreal / childhood / recurring / nightmare-with-humor / lucid / mundane-but-detailed / abstract / one-sentence-prompt).
- Status page, rate-limit posture, abuse-handling notes (see `/_shared/LEGAL_POSTURE.md`).
- T-1: One last "tomorrow" post on X with a single best-of-the-pre-launch comic. No link yet.

---

## 5. Launch day

Single calendar day. Sequence below is the operator order — don't skip steps, don't reorder.

### 5.1 X thread — 5 tweets, 5 sample dream-comics

**Tweet 1 (hook + artifact):**
> describe your dream out loud. get a 4-panel comic.
>
> dreamtoon is live: dreamtoon.app
>
> [comic image — the strongest of the 10 pre-generated]

**Tweet 2 (mechanic):**
> voice → transcript → story beats → 4 panels → composite. claude does the beats, flux does the panels. ~30 seconds end-to-end.
>
> [comic image #2 — surreal one]

**Tweet 3 (range demo):**
> works for the dreams you actually remember.
>
> "i was in my high school but it was underwater"
>
> [comic image #3]

**Tweet 4 (range demo 2 — emotional contrast):**
> and the ones you'd rather forget.
>
> [comic image #4 — nightmare-with-humor]

**Tweet 5 (CTA + ask):**
> free while infra holds. share yours with #dreamtoon — i'll repost the best one tomorrow.
>
> dreamtoon.app
>
> [comic image #5 — childhood/wholesome to close on a smile]

Post at **9:30am ET** Tuesday or Wednesday. Pin the thread. Reply to the first 30 quote-tweets and replies within the first 2 hours — engagement velocity in hour 1 determines algorithm reach for the next 48.

### 5.2 Reddit — drafts

Five subreddits, **five different posts**. Never cross-post the same text. Each one is written for that sub's tone. All posts include one comic image and one sentence about how it was made; no link unless the sub explicitly allows it (most don't on first post — link in first comment).

**r/Dreams** — title: *"Tried turning my dreams into 4-panel comics. Here's last night's."*
Body: brief dream description, comic image. No product mention in title. Mention the tool in a comment if asked. Subreddit is heavy moderation — read rules, no-link in OP.

**r/LucidDreaming** — title: *"For dream journalers: a voice-to-comic tool I built to make my journal less boring."*
Body: explain the journaling use-case first, tool second. Show one lucid-specific dream comic (e.g., "I realized I was dreaming and started flying").

**r/comics** — *Caution.* Title: *"Made a tool that turns spoken dreams into 4-panel comics — not a replacement for artists, just a doodle for non-artists."* Body acknowledges the artist-AI tension upfront. Don't post if the mod team has explicit anti-AI rules — check first.

**r/sideproject** — title: *"DreamToon: describe your dream, get a 4-panel comic. 10-day build, voice → Claude → Flux."* Standard sideproject tone — be honest about stack, costs, what's not working. Audience is builders.

**r/midjourney** — title: *"Built a voice-to-comic pipeline (not MJ — using Flux on Workers AI). Sharing because this audience will get it."* Acknowledge it's not MJ to avoid bait-and-switch backlash. Show the pipeline.

**Backup subs if any of the above stalls:** r/aiArt, r/StableDiffusion, r/InternetIsBeautiful, r/coolguides (if a comic happens to be educational), r/Showerthoughts (for the meta-post "I made a thing that turns dreams into comics"), r/InternetMysteries.

### 5.3 Show HN

**Title:** `Show HN: DreamToon – describe your dream out loud, get a 4-panel comic`

**Body:**
> Hi HN — built this in 10 days. Voice in, 4-panel comic image out.
>
> Pipeline: browser MediaRecorder → Whisper transcript → Claude breaks the dream into 4 story beats with panel descriptions and dialog → Flux generates each panel → server-side composite with speech bubbles → 1080×1080 PNG.
>
> Things I learned:
> - Claude's structured output is the linchpin — without consistent panel descriptions, the four images don't feel like one story. Spent more time on the story-beat prompt than on anything else.
> - Image consistency across 4 panels is the unsolved problem. Using a shared style token + character description per panel; results are 70% there. Open to ideas.
> - Composite-on-server (sharp / canvas) beats client-side for share-quality, and the watermark is non-negotiable for attribution loops.
>
> Free while the Workers AI free tier and my fal.ai credits hold. Source code: github.com/[handle]/dreamtoon. Happy to answer anything about the build.

Post at **8:00am ET**, same day as the X thread but 90 minutes earlier. HN morning audience converts better than midday. Watch the first hour — if it cracks page 2, reply to every comment. If it doesn't, don't repost.

### 5.4 TikTok — 15-second dream-to-comic transformation

**Script (text-on-screen, no narration needed):**
- 0-2s: Black screen, text *"describe your dream"*, voiceover of Talha actually describing a dream out loud (recorded once, not acted).
- 2-4s: Loading shimmer / processing animation. Text: *"30 seconds later"*.
- 4-8s: Panel 1 fades in. Panel 2. Panel 3. Panel 4. Each ~1s.
- 8-12s: Full 4-panel grid revealed, slight zoom-in. Text: *"dreamtoon.app"*.
- 12-15s: Hold on the grid. Caption appears: *"what's the weirdest dream you remember? comment it"*.

**Audio:** Use a trending sound (TikTok's "what was that dream" or any ambient-curious sound). Don't use copyrighted music — TikTok will throttle reach.

**Caption:** `made a thing that turns your dreams into comics. tell me yours #dreamtoon #dreams #aiart`

**Post 3 versions** Day 1, 2, 3 — same format, different source dreams. Whichever one pops, double down on its variant.

### 5.5 Instagram carousel — 10 slides

This is the **single highest-leverage launch asset for IG**. Carousels get re-served by IG's algorithm for weeks.

- Slide 1: Hook image — best dream comic + caption text *"I described my dream out loud. This is what came back."*
- Slide 2: The dream (text-only on warm-paper background, transcript-style).
- Slide 3: Panel 1 only, full-bleed.
- Slide 4: Panel 2 only.
- Slide 5: Panel 3 only.
- Slide 6: Panel 4 only.
- Slide 7: The full 4-panel grid.
- Slide 8: A second example — different dream, different vibe (childhood / wholesome).
- Slide 9: A third example — surreal/funny.
- Slide 10: CTA — *"dreamtoon.app — free while it lasts. share your dream with #dreamtoon"*.

**Caption (long-form, search-optimized):**
> what if you could see your dreams?
>
> dreamtoon turns a voice recording of your dream into a 4-panel comic. tell it what you remember — fragments, feelings, characters, anything — and 30 seconds later you have a comic you can keep, print, or send to a friend who'll get it.
>
> free for now. link in bio.
>
> #dreams #lucidDreaming #dreamjournal #aiart #aicomic #comicstrip #journalingcommunity #shadowwork #dreaminterpretation #wholesomecontent

### 5.6 DMs — launch day

Sent at 10am ET, **after** the X thread is live and has its first 50 likes (so the link goes to something with social proof). One per person, hand-edited per recipient. No mass-send.

1. **[Steve Ruiz](https://x.com/steveruizok) — tldraw/make-real precedent.**
   > Hey Steve — make-real was the proof-of-concept that voice/sketch → polished-artifact is a viral category. Built dreamtoon in the same spirit: voice → 4-panel comic. Not asking for a share, just thought you'd find the make-real DNA familiar. [link]

2. **[Andrej Karpathy](https://x.com/karpathy) — taste-maker, micro-app appreciator.**
   > Karpathy — built a tiny thing: describe a dream, get a 4-panel comic. ~600 LOC, claude does story beats, flux does panels. felt aligned with the "small useful apps" energy. [link]

3. **[Suhail Doshi](https://x.com/Suhail) — Playground founder, image-gen taste.**
   > Suhail — would love your eye on this. voice → 4-panel comic, flux for panels. consistency-across-panels is the hard part — curious how you'd approach it differently. [link]

4. **[Pieter Levels](https://x.com/levelsio) — solo-shipper amplifier.**
   > Pieter — 10-day solo build. dreamtoon. voice in, comic out. live, free, and a single index.tsx away from being a screenshot for your next thread. [link]

5. **[swyx](https://x.com/swyx) — creative-AI scene connector.**
   > swyx — built a voice-in art-out toy this week. felt like a Latent Space-coded category (small, taste-driven, viral-shaped). would love to hear if you think the build write-up is worth doing. [link]

6. **[fofr](https://x.com/fofrAI) — Replicate, image-pipeline taste-maker.**
   > fofr — voice → claude → flux → composite → 4-panel comic. would value your read on the panel-consistency approach (style token + character desc per panel). [link]

Do NOT DM journalists or podcasters on launch day. They come in week 2-3 (§9).

---

## 6. Week 1 daily seeds

Every day of week 1, one founder dream-comic + one community re-share. Format: post the user's comic with their consent, credit handle, no commentary other than "today's dreamtoon."

- **Mon (Launch day):** Founder's strongest pre-generated comic.
- **Tue:** Founder's nightmare-with-humor comic. *"my actual dream from saturday."*
- **Wed:** First community re-share. Whichever user-submitted comic from launch day got the most engagement on its original post. DM them for permission, then quote-tweet/repost.
- **Thu:** Founder kid-dream comic. *"my niece told me a dream and i ran it through dreamtoon."* (If real; never fabricate. If not, skip and pull another founder dream.)
- **Fri:** Best-of-week thread. 5 comics from the community, one tweet each, credit each handle, end with #dreamtoon.
- **Sat:** Light day. One IG Story share of the week's most-shared comic. Don't post fresh — rest, observe, take notes.
- **Sun:** Process post. *"here's what worked, what didn't, what's next."* On X, longer-form. Sets up week 2 with momentum.

Cross-post the daily founder comic to IG feed (single image), IG Story, Pinterest (pinned to a "dreamtoon gallery" board), Reddit (only if it fits — never force a daily Reddit post; the sub will throttle you).

---

## 7. Sustained growth (week 2+)

Three mechanics, all compounding.

**Public gallery.**
A page at `dreamtoon.app/gallery` showing opt-in user-submitted comics. Opt-in is explicit (checkbox at generation time, default OFF — see `/_shared/LEGAL_POSTURE.md` for consent posture). The gallery is browsable, has its own URL per comic, and includes a "share" button that pre-fills the user's social-network share dialog. The gallery itself becomes an SEO surface — every comic page is a unique URL with an image, a transcript snippet (if user opted in), and a generated title.

**Best of the week.**
Every Friday, a single post across X + IG + Pinterest: *"this week's best dreamtoon."* Pick by engagement on the original post, OR by editorial taste, OR rotate (favor weird/funny/wholesome to balance the algorithmic tilt toward dramatic content). Credit prominently. The "best of week" slot becomes a small prize people want to win.

**Hashtag campaign #dreamtoon.**
The hashtag is the distributed gallery. Monitor it across X, IG, TikTok, Pinterest. Every Friday, surface the best from each platform. Reply to every public post in the hashtag in the first 4 weeks — that early-mover engagement is what makes a hashtag stick.

Optional fourth mechanic if growth plateaus around week 4: a **monthly theme** — *"this week's prompt: a dream from when you were a kid"* or *"recurring dreams week."* Themed campaigns work for subreddit-coded audiences (r/Dreams, r/LucidDreaming) and give the creator account a content calendar.

---

## 8. Repurposing — single comic → 7 surfaces

Every generated dream-comic should be capable of being shipped to **7 surfaces from one source.** The pipeline:

1. **X native post** — the 1080×1080 PNG + dream transcript as caption. ~30 seconds to compose.
2. **TikTok 9:16 video** — panels appearing one-by-one with the recorded voice. Auto-generated server-side from the same job. Manual upload, ~2 minutes.
3. **IG Reel** — same video as TikTok, vertical, with a cover frame showing the full grid. Same upload, different caption optimized for IG search.
4. **IG carousel** — 4 slides (one per panel) + slide 5 (full grid) + slide 6 (transcript). Composed in-app, ~3 minutes.
5. **Pinterest pin** — the 1080×1080 PNG, pinned to a themed board (Surreal Dreams, Childhood Dreams, Nightmares-With-Humor). Bulk-pinnable; one weekly batch.
6. **YouTube Short** — re-upload of the TikTok/Reel video. Two clicks. Free reach.
7. **LinkedIn (creative-AI angle, monthly only)** — frame the comic as "the artifact from a 10-day solo build." Don't pretend LinkedIn cares about dreams; it cares about ship-velocity stories.

One source asset → seven impressions surfaces. Budget: ~15 minutes per comic for full repurposing once the workflow is templated. The first 5 comics will take 45 minutes each; comic 20 takes 12 minutes.

---

## 9. Press, podcasts, newsletters

Approach in week 2-3, never launch day. Need a gallery of organically-posted user comics before you pitch — journalists need the "users are doing this" angle, not the "founder built a thing" angle.

**Journalists (5):**
- [Kyle Wiggers](https://x.com/kyle_l_wiggers) — TechCrunch, creative AI beat. Cover Claude/Flux pipelines.
- [James Vincent](https://x.com/jjvincent) — The Verge alum, now writing on AI + culture. Loves voice-in-art-out demos.
- [Charlie Warzel](https://x.com/cwarzel) — The Atlantic, internet-culture desk. Frame: "dreams as the next thing the internet renders."
- [Rebecca Jennings](https://x.com/rebexxxxa) — Vox culture, Gen-Z internet trends. Frame: parent-and-kid dreams as a TikTok aesthetic.
- [Vice / Motherboard creators desk](https://www.vice.com/en/topic/motherboard) — pitch their generalist mailbox. Frame: weird-internet-art angle.

**Podcasts (5):**
- [Latent Space (swyx & Alessio)](https://www.latent.space/) — natural fit, creative-AI scene. Pitch as build-write-up.
- [Hard Fork (NYT — Kevin Roose, Casey Newton)](https://www.nytimes.com/column/hard-fork) — they love a "founder built a small viral thing" segment.
- [Pivot (Kara Swisher, Scott Galloway)](https://www.voxmedia.com/pages/pivot-kara-swisher-scott-galloway-podcast) — long shot, but a one-line mention from Kara is rocket fuel.
- [Reply All-style audio storytelling](https://gimletmedia.com/shows/reply-all) — pitch *"the people who use this to draw their dreams"* as a story, not a tool review. Even though Reply All is defunct, its successors (Search Engine with PJ Vogt, Endless Thread) are valid targets.
- [Connected (Relay FM — Federico Viticci, Stephen Hackett, Myke Hurley)](https://www.relay.fm/connected) — for the Apple-creator audience; angle is the iPhone voice-memo-to-comic flow.

**Newsletters (5):**
- [Ben's Bites](https://www.bensbites.com/) — daily AI news, large list, friendly to small launches.
- [Hidden Brain newsletter / Shankar Vedantam](https://hiddenbrain.org/) — the dreams-and-psychology angle, not the AI angle.
- [Garbage Day (Ryan Broderick)](https://www.garbageday.email/) — *the* internet-culture newsletter. If Ryan covers it, the next 30 days take care of themselves.
- [Today in Tabs (Rusty Foster)](https://www.todayintabs.com/) — adjacent to Garbage Day, slightly older / more media-industry tilt. Same pitch.
- [fwiw (Read Max / others in the post-Substack-Twitter scene)](https://maxread.substack.com/) — culture-essay newsletters that occasionally feature internet objects.

**Pitch template (one per outlet, hand-edited):**
> Subject: a tool that turns spoken dreams into 4-panel comics — users are doing strange things with it
>
> Hey [name] — built dreamtoon.app two weeks ago. Voice in, 4-panel comic out. Not pitching the build; pitching the artifact behavior — people are using it for kid-dream keepsakes, dream journals, and one therapist DM'd me asking if she could share it with clients. Gallery: dreamtoon.app/gallery. Happy to send the most-shared 20 comics if useful, no obligation.

---

## 10. Partnerships

Four targets, ranked by likely lift.

**Anthropic devrel.**
The strongest fit. Claude is the story-beat brain in the pipeline — without consistent structured output across 4 panels, the product doesn't work. Pitch: a co-marketing case study on Claude as the *narrative engine*, not the chatbot. Contact: [Alex Albert](https://x.com/alexalbert__) for visibility, or the dev-relations team via the partner network. Reference: existing Anthropic showcases of creative pipelines.

**Cloudflare Workers AI team.**
Flux running on Workers AI is the cheap-and-fast image-gen path. Pitch: a showcase post on running consumer-scale image generation on Workers AI, with DreamToon as the case study. Contact: [Rita Kozlov](https://x.com/ritakozlov_) and the Cloudflare dev-rel team. They actively look for showcase apps for the Workers AI launch narrative.

**fal.ai team.**
Alternative provider, faster cold-starts than most. Pitch: same case-study angle, framed around latency. Useful even if not the primary provider — being on multiple provider showcases multiplies reach.

**Replicate.**
[Replicate](https://replicate.com/) hosts the broader image-gen ecosystem. Pitch: the build write-up + a "deploy your own dreamtoon" Replicate template (one-click clone of the pipeline). Their blog regularly features apps that ship a clone-able template alongside.

Order of outreach: Anthropic first (highest leverage, longest cycle), Cloudflare second (showcase fits their Workers AI roadmap), fal.ai and Replicate in parallel as faster turnarounds.

---

## 11. Content seed bank — 30 ideas

Daily posting fuel. Mix and match across X, IG, TikTok. Each idea is one post.

1. Founder's weirdest dream of the year, rendered.
2. *"describe your worst dream — i'll comic it"* — call for submissions.
3. Recurring dream theme: falling. 5 user comics in a thread.
4. Recurring dream theme: teeth falling out.
5. Recurring dream theme: showing up to school/work unprepared.
6. Kids' dreams series — kid 1's dream, narrated by parent.
7. Kids' dreams series — kid 2.
8. Kids' dreams series — kid 3.
9. *"what's the most beautiful dream you ever had"* — call for submissions.
10. Lucid dreaming community feature — best 5 lucid-dream comics.
11. Nightmares-with-humor — series of 4 comics where the punchline is the surreal pivot.
12. *"i dreamt my dead grandmother told me…"* — grief-and-dreams series, handled gently.
13. Dream symbolism explainer — 4 comics + classical-symbol notes (water, flying, animals, strangers).
14. Pet dreams — *"what do you think your dog dreams about"*, comic the funniest guess.
15. Pre-exam anxiety dreams compilation.
16. Pre-wedding anxiety dreams compilation.
17. Travel dreams — places people have only dreamt of.
18. Dreams-from-fever — fever dreams as a genre.
19. The first dream you remember from childhood.
20. Famous dreams in history (Mary Shelley's Frankenstein dream, Kekulé's benzene ring, McCartney's Yesterday) — 4-panel each.
21. *"finish my dream"* — post 3 panels, let the audience guess the 4th, then reveal.
22. Behind-the-scenes — the prompt that Claude saw for [yesterday's comic].
23. Failure case — a dream the model botched, and what it produced instead.
24. Style variation post — same dream, three styles. (Only post if the alt-styles ship.)
25. *"submit your dream as a voice note, i'll comic 5 of you live tomorrow."* — live event.
26. *"draw your dream first, then comic it"* — comparison post.
27. Therapist Q&A — invite a real therapist to riff on 3 user dreams. Gentle, non-clinical.
28. The 1AM submissions vs the 3PM submissions — temporal pattern post.
29. Most-shared dreamtoon of the month — wrap-up.
30. *"the dreams you told me"* — anniversary post at month 6 or 12, gallery of the year's best, with credit.

---

## 12. Hashtags + SEO

**Primary hashtags (every post):** `#dreamtoon`
**Universal dream tags (most posts):** `#dreams #dreamjournal #lucidDreaming #dreaminterpretation`
**Creative-AI tags (when audience-appropriate):** `#aiart #aicomic #aitools #generativeart`
**Comic-strip tags (when relevant):** `#comics #comicstrip #webcomic #4panel`
**Mental-health-adjacent (when relevant, never primary):** `#journaling #journalingcommunity #shadowwork #selfreflection`
**Pinterest-specific search terms (high volume, low competition):** *dream journal ideas*, *dream interpretation art*, *4 panel comic prompt*, *visual dream journal*, *dream symbolism illustrated*.

**SEO keywords for the gallery and landing page:**
- *turn dreams into comics* (low competition, high intent)
- *dream to comic generator* (rising)
- *voice to comic ai* (rising, almost no competition)
- *dream journal visual* (steady, high-intent)
- *ai dream interpretation* (high volume — tangential but valuable)
- *4 panel comic maker* (medium competition)

Every gallery page gets `<title>` + meta-description templated from the dream's first 80 chars + the panel-1 alt-text. Sitemap auto-generated. The gallery becomes a long-tail SEO asset by month 3.

---

## 13. Milestones

The metrics that matter, in order of *narrative* (not vanity) value.

| Milestone | Target window | Why it matters |
|---|---|---|
| **First 100 comics generated** | T+24h | Validates the funnel works under launch-day load. |
| **First 1,000 comics generated** | T+7 days | Real product-market signal. Tweet the number. |
| **First user-submitted comic that goes viral on its own** | T+3-14 days | The moment the product is bigger than the founder's account. |
| **First "I made this for my grandma/kid/friend" testimonial** | T+5-14 days | The emotional-fit signal. Screenshot it, pin it, build the next 30 days of marketing around it. |
| **First press mention** | T+7-21 days | Garbage Day, Ben's Bites, or TC. Any. |
| **First 10K stars on the GitHub repo** | T+14-30 days | The make-real benchmark. If we hit this we are in the conversation. |
| **First 10K-share dream comic** | T+30-90 days | The "viral comic" milestone. When one user's comic out-shares everything the founder has posted. |
| **First 100K total comics generated** | T+60-90 days | Infrastructure-stress milestone — also the point where Anthropic / Cloudflare / fal.ai partnerships convert. |
| **First user-printed comic in the wild** | T+30-180 days | Someone posts a photo of a printed dreamtoon. The product has left the screen. |

Track these. Post each one as it lands. Each milestone is itself a content slot.

---

## Operating notes

- **One artifact, seven surfaces.** Never make platform-specific assets from scratch. Every comic is built once and repurposed seven times.
- **Founder posts daily during launch week, then 4x/week.** Set a hard floor; protect the cadence over the polish.
- **Engage Ring-1 first, journalists last.** Do not pitch press until users are organically posting their own comics.
- **Watermark is the marketing.** Every shared comic is an unpaid impression for the URL.
- **Respect the comic-artist segment.** Position the tool as *for non-artists to externalize dreams*, never *for replacing illustrators*. This single framing decision determines whether r/comics is an ally or an enemy.
- **The IG handle, the X handle, the TikTok handle, the Pinterest handle, the YouTube handle are all `@dreamtoon`.** Same everywhere. Lock them on day one of pre-launch.
- **The gallery is the moat.** A public, opt-in, browsable, hashtag-linked gallery compounds over months. Build it in week 2, not later.
- **Two verification rounds, then ship.** Per the global rule — don't keep polishing assets past the second pass. Ship the comic, watch the response, iterate from data.

For the universal launch mechanics (Show HN posting time, HN comment posture, X reply etiquette, Reddit account warmup), see `/_shared/LAUNCH_PLAYBOOK.md`. This file is DreamToon-specific only.
