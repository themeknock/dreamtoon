export type RefusalCategory =
  | "sexual"
  | "graphic_violence"
  | "minors_unsafe"
  | "real_named_person"
  | "copyrighted_character"
  | "self_harm"
  | "hate"
  | "unspecified";

export type RefusalTier = "whimsy" | "gravity";

export type RefusalEntry = {
  tier: RefusalTier;
  copy: string;
  cta?: { label: string; href?: string };
  hotline?: { label: string; href: string; phone?: string };
};

/**
 * Refusal copy library, split by tier.
 *   - whimsy: cream-paper voice, soft redirect, "try another dream" link
 *   - gravity: plain serif, no illustration, hotline link inline where applicable
 *
 * Three-beat refusal pattern (Claude/Anthropic): soft decline -> reason in
 * user's language -> concrete redirect. Never stop at beat one.
 */
export const REFUSALS: Record<RefusalCategory, RefusalEntry> = {
  copyrighted_character: {
    tier: "whimsy",
    copy: "We can draw the vibe but not the brand — \"a mouse in red shorts\" works instead.",
    cta: { label: "Try another dream" },
  },
  real_named_person: {
    tier: "whimsy",
    copy: "Swap the name for the vibe — \"a famous singer\" or \"a politician\" draws fine.",
    cta: { label: "Try another dream" },
  },
  sexual: {
    tier: "whimsy",
    copy: "Let's keep this one PG — describe the feeling, not the bodies, and we'll draw it.",
    cta: { label: "Try another dream" },
  },
  graphic_violence: {
    tier: "whimsy",
    copy: "We can't quite draw that one — try the chase scene without the close-up gore.",
    cta: { label: "Try another dream" },
  },
  hate: {
    tier: "whimsy",
    copy: "We'll pass on that one — try a dream that isn't about a group of people.",
    cta: { label: "Try another dream" },
  },
  minors_unsafe: {
    tier: "gravity",
    copy: "We won't draw this one.",
    hotline: {
      label: "If you're worried about a child, contact the Childhelp National Hotline",
      href: "https://www.childhelp.org/childhelp-hotline/",
      phone: "1-800-422-4453",
    },
  },
  self_harm: {
    tier: "gravity",
    copy: "We won't draw this one. If you're going through something, please reach out — you're not alone.",
    hotline: {
      label: "988 Suicide & Crisis Lifeline",
      href: "https://988lifeline.org",
      phone: "988",
    },
  },
  unspecified: {
    tier: "whimsy",
    copy: "This one's not for DreamToon — try describing the vibe instead of the people.",
    cta: { label: "Try another dream" },
  },
};

export function resolveRefusal(
  category: string | undefined,
  fallbackMessage?: string,
): RefusalEntry {
  if (category && (REFUSALS as Record<string, RefusalEntry>)[category]) {
    return (REFUSALS as Record<string, RefusalEntry>)[category]!;
  }
  if (fallbackMessage) {
    return { tier: "whimsy", copy: fallbackMessage, cta: { label: "Try another dream" } };
  }
  return REFUSALS.unspecified;
}
