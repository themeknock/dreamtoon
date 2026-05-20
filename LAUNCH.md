# DreamToon — Launch

This is the highest-ceiling launch of the ten repos in this batch. Clean lane, universal demand, magic-transform shape that already has two billion-view precedents ([make-real](https://makereal.tldraw.com/), [Suno](https://suno.com/)). The job on launch day is to not fumble the demo.

---

## The demo (this is the entire launch)

A single 22-second screen recording. That's the unit of marketing. Everything else amplifies it.

**Beat sheet:**

| Time | What's on screen |
|---|---|
| 0:00 | Hero page. Mic icon. Copy: "Describe your dream out loud." |
| 0:01 | Tap mic. Countdown ring appears. |
| 0:02-0:14 | Voice-over (real, not subtitled): *"I dreamed I was at my grandmother's house but the floor was made of water and there were jellyfish glowing under the kitchen table and she was making toast like nothing was wrong."* |
| 0:15 | Release. "Listening..." → "Imagining..." → "Drawing..." pills cycle. |
| 0:20 | Comic fades in panel-by-panel. 2×2 grid. Watercolor style. Grandmother in panel 1. Same grandmother + glowing jellyfish in panel 2. Floor-as-water revealed in panel 3. Toast plate in panel 4. |
| 0:22 | Cursor moves to `Copy share link`. End. |

That video, posted at 10am PT on Day 10, is the launch.

Two production notes:
1. **Use a real dream.** Not a clever scripted one. The point is "I just told it about my actual weird dream and look what happened." Authenticity reads on camera.
2. **Don't cut the awkward pause** between releasing the mic and the comic appearing. The 5-second wait is the magic — it has to feel like something is *happening*, not like a pre-rendered demo.

---

## X / Twitter launch thread

Six tweets, fired 4 minutes apart so the algorithm has time to seed each one.

**Tweet 1 — the demo.**
> describe your dream out loud → get a 4-panel comic
>
> 15 seconds in, 25 seconds out
>
> dreamtoon.app — free, open source
>
> [embed 22-sec demo video]

**Tweet 2 — second sample.**
> a few from this morning
>
> [grid of 4 sample comics, each with the transcript caption underneath]
>
> every dream becomes a 1080×1080 PNG with a permalink you can share

**Tweet 3 — the stack flex.**
> built in 10 days on:
>
> – Whisper on Workers AI (transcription)
> – Claude Sonnet 4.7 (scene composer)
> – Flux Schnell on Workers AI (image gen)
> – R2 + D1 + KV
>
> total marginal cost: ~$0.01 per comic. free tier: 3/day

**Tweet 4 — the moat clarification (this is the brand-defining tweet).**
> what dreamtoon doesn't do:
>
> – it doesn't tell you what your dream "means"
> – it doesn't run jungian analysis
> – it doesn't horoscope
>
> it's an art tool. words you spoke → image you can share. that's it.

**Tweet 5 — repo.**
> repo's public, MIT licensed:
> github.com/[handle]/DreamToon
>
> stack notes, prompt, moderation rules, the whole 10-day plan in there. fork it, ship something weirder.

**Tweet 6 — 5 standout user comics, posted 6-8 hours later.**
> things people dreamed about today
>
> [4-up screenshot grid of best user-submitted comics, with permission]

---

## Show HN post

**Title:** `Show HN: DreamToon – describe your dream out loud, get a 4-panel comic`

**Body:**

> Hey HN — DreamToon turns 15 seconds of voice into a 4-panel comic. Tap the mic, describe a dream, get back a 1080×1080 PNG with a permalink.
>
> Stack: Cloudflare Workers + Workers AI (Whisper for transcription, Flux Schnell for image gen), Claude Sonnet 4.7 for scene composition with character continuity, R2 for storage, D1 for metadata. Marginal cost is about a cent per comic. Free tier is 3/day per IP, $3/mo for unlimited.
>
> The interesting engineering bit is the Claude scene composer — it takes the transcript and outputs four panel prompts with continuity references ("the same red-haired figure from panel 1," "the same kitchen, now flooding") so when Flux generates the four panels independently they still read as one comic. Prompt's in the repo.
>
> Hard rule on the product: this is art, not psychology. DreamToon won't tell you what your dreams mean. It just makes the image.
>
> Two-layer content moderation (Claude pre-gen refusal + Workers AI image safety post-gen) for the obvious reason — dreams contain everything.
>
> Repo: https://github.com/[handle]/DreamToon
> Live: https://dreamtoon.app
>
> Built in 10 days. Happy to answer anything about the stack, the prompt, the moderation layer, or the launch plan — full ROADMAP and LAUNCH docs are in the repo.

**Posting time:** Tuesday 10am PT. Avoid Monday (HN volume is too high), avoid Friday (low evening traffic).

---

## Reddit plan

Stagger over 48 hours. Different framing per sub. Never copy-paste the same text — reddit moderators clock that instantly.

- **[r/sideproject](https://www.reddit.com/r/sideproject/)** — launch day. Builder framing. "Built this in 10 days, here's the stack." Links repo + live site.
- **[r/InternetIsBeautiful](https://www.reddit.com/r/InternetIsBeautiful/)** — Day 2. Pure product framing, no builder voice. Title: "DreamToon — describe a dream out loud, get a comic."
- **[r/comics](https://www.reddit.com/r/comics/)** — Day 2. Lead with a great user-generated comic (with permission), DreamToon as caption credit. NOT a self-promo post — a comic post that happens to come from DreamToon. Check sub rules first.
- **[r/Dreams](https://www.reddit.com/r/Dreams/)** — Day 3. Post a sample comic, ask "anyone want to try with one of your dreams?" — invite community use. Be present in comments.
- **[r/LucidDreaming](https://www.reddit.com/r/LucidDreaming/)** — Day 3. Same framing as r/Dreams but specifically frame the use case as "dream journal that produces a shareable artifact."
- **[r/webcomics](https://www.reddit.com/r/webcomics/)** — Day 4. Same approach as r/comics.
- **[r/ChatGPT](https://www.reddit.com/r/ChatGPT/) and [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/)** — Day 4-5. Builder framing, prompt-engineering focus. Share the Claude scene-composer prompt as the hook.

**Do not post to** r/Singularity (wrong vibe), r/MachineLearning (wrong audience), r/programming (not novel enough on the engineering axis).

---

## Amplifier DM list

Five accounts, sent within the first 90 minutes of launch. Short DM, demo video attached, no ask.

1. **[Steve Ruiz](https://twitter.com/steveruizok)** (tldraw founder) — DreamToon is the spiritual successor to make-real. He will recognize the shape immediately. DM: "Built this on the make-real shape — voice → comic instead of drawing → UI. Wanted you to see it. [video]"
2. **[Karpathy](https://twitter.com/karpathy)** — quotes creative-AI demos that work. Long shot, high payoff.
3. **[Suhail Doshi](https://twitter.com/Suhail)** (Playground founder) — image-gen taste-maker, posts the things he likes.
4. **[swyx](https://twitter.com/swyx)** — surfaces creative-AI launches on AI News, Latent Space.
5. **[fofr](https://twitter.com/fofrai)** — Replicate creative-AI lead, big audience among the exact demographic that'll post DreamToon outputs.

DM template (variations per recipient):
> Hey — built this thing on the [make-real / Suno / creative-AI demo] shape. Voice in, 4-panel comic out, 25 seconds end to end. Open source, on Cloudflare. Wasn't sure if it'd work; turns out Claude is weirdly good at panel continuity. Sending because you'd see the lineage. [22-sec video]
>
> No ask — just thought you'd like the artifact. dreamtoon.app

Crucially: **no follow-up if they don't reply.** One shot.

---

## Expected trajectory

Of the ten repos in this batch, DreamToon has the highest ceiling and the lowest floor. The lane is so clean that either it pops in week one or it stalls — there's no "moderate success" middle ground here, because the product only matters if it's the thing everyone is posting.

**Realistic best case (P50 conditional on getting traction):**
- Day 1: 200-500 HN upvotes, front page top-10, 20K-50K site visits.
- Week 1: 2K-5K GitHub stars (make-real did 10K in 14 days; this is in that band).
- Week 1: 50K-200K comics generated, share rate ~30%, ~10K-50K Instagram/TikTok impressions of the watermark.
- Week 2: tech press pickup (The Verge, 404 Media, Decoder podcast mention). Possible mainstream pickup if a celebrity posts one.
- Month 1: 100-500 pro signups at $3/mo — not the prize, just runway.

**Floor case (P50 if it doesn't catch):**
- Day 1: front-page-of-HN-for-a-few-hours, 5K-10K visits.
- Week 1: 300-800 stars.
- Distribution flatlines after the launch news cycle.
- Repo remains as a clean reference implementation of the voice-to-multimodal-output pattern. Useful as a portfolio artifact regardless.

**Tail case (low probability, but real):**
- Goes the way of [Lensa Magic Avatars](https://prisma-ai.com/lensa) or the Ghibli wave. Trends on TikTok. Infra strain. Need to scale Workers AI quota and add fal.ai capacity. Different problem, good one to have.

The launch plan is built for the P50-best case. If the tail case hits, the recovery move is documented in [`ROADMAP.md`](./ROADMAP.md) — Workers AI auto-scales, fal.ai is already wired as the fallback, R2 egress is free. The architecture survives a 100x spike.

---

## What "launched" means

Launch is not "live site exists." Launch is the moment the demo video is on X. Everything before that (repo, site, stripe, moderation) is prep; everything after that (HN, Reddit, amplifier DMs, real-time bug fixes, follow-up threads) is the launch itself.

Day 10. 10am PT. Mic icon on screen. Press record.
