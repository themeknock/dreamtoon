# Refusal Copy Library — Two-Tier

User-facing microcopy split into **whimsy** (soft categories, cream-paper voice)
and **gravity** (serious categories, plain serif, no illustration, hotline inline).

The runtime source of truth is [`lib/refusal.ts`](../lib/refusal.ts). Edit copy
in both places (or only the .ts; this doc is the rationale mirror).

All copy follows three rules:

1. **No policy language.** Never "I cannot", "I'm unable", "as an AI", "violates".
2. **Three-beat refusal** (Claude/Anthropic pattern): soft decline → one-sentence
   reason in user's language → concrete redirect. Never stop at beat one.
3. **The visual carries the tier shift, not just the words.** Whimsy keeps
   the cream-paper voice. Gravity strips it.

---

## Whimsy tier — cream-paper voice

These categories keep the dreamlike voice. Visual treatment: cream card,
italic Fraunces body, mute-italic copy, soft "try another dream" link.

### `copyrighted_character`
> We can draw the vibe but not the brand — "a mouse in red shorts" works instead.

### `real_named_person`
> Swap the name for the vibe — "a famous singer" or "a politician" draws fine.

### `sexual`
> Let's keep this one PG — describe the feeling, not the bodies, and we'll draw it.

### `graphic_violence`
> We can't quite draw that one — try the chase scene without the close-up gore.

### `hate`
> We'll pass on that one — try a dream that isn't about a group of people.

### `unspecified` (fallback)
> This one's not for DreamToon — try describing the vibe instead of the people.

---

## Gravity tier — plain serif, no illustration, hotline inline

These categories drop the whimsy. The restraint itself is the brand choice —
like a comedian going still during a serious bit. Cream texture stays (it's the
DreamToon brand), but the voice is plain. No "try another dream" link with a
sparkle. A clear hotline + a quiet "go back" link.

### `minors_unsafe`
> We won't draw this one.
>
> If you're worried about a child, contact the **Childhelp National Hotline** →
> [childhelp.org](https://www.childhelp.org/childhelp-hotline/) · 1-800-422-4453

(Deliberately the curtest copy. No clever reroute. No softening.)

### `self_harm`
> We won't draw this one. If you're going through something, please reach out —
> you're not alone.
>
> **988 Suicide & Crisis Lifeline** → [988lifeline.org](https://988lifeline.org) · 988

(The hotline appears inline as part of the refusal, not in a footer link. Always.)

---

## Pipeline failures (not refusals)

These are recoverable system errors, not policy decisions. Different copy
register — "the muse" voice, never "the system" voice. **Preserve the
transcript** in the UI so the user's 15s of voice work isn't thrown away.

### Whisper returned silence
> We didn't catch any words — was your mic on?

### Flux failed twice + fal.ai fallback also failed
> The ink ran out at panel 3. Want me to finish it, or start over?
>
> Buttons: **Try finishing** · **Re-dream**

### AI Gateway down / generic pipeline failure
> The muse was offline — try again?

### Rate limit hit (3/day free)
> That's your 3 dreams for today. Tomorrow at midnight you get 3 more — or
> skip the wait with Pro.

---

## Layer 2 — post-gen image safety classifier rejects an image

When a panel passes Claude but the post-gen vision classifier flags it, the
whole comic is discarded. Layer-2 refusals stay whimsy-tier (the user wasn't
trying to do anything wrong; the model wandered):

> The muse got shy on that one — try recording it again, the prompt was good.

(Don't tell the user *which* panel flagged. That's prompt-engineering surface
area for adversarial users.)

---

## Tone audit checklist

Before adding new refusal copy, run it past these:

- [ ] Does it stop at "I can't"? (If yes, add the redirect beat.)
- [ ] Does it use the word "violate", "policy", "guidelines", "unable"? (Kill those.)
- [ ] Does it cosplay empathy ("I understand that…")? (Kill that.)
- [ ] Does the gravity-tier copy contain a sparkle or whimsy phrase? (Kill it.)
- [ ] Does the whimsy-tier copy have an em-dash and a soft verb? (Good.)
- [ ] Could it be tweeted as a screenshot and still read kind? (Goal.)
