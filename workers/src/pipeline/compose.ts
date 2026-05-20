import { z } from "zod";
import type { Env } from "../env";

export const RefusalCategory = z.enum([
  "sexual",
  "graphic_violence",
  "minors_unsafe",
  "real_named_person",
  "copyrighted_character",
  "self_harm",
  "hate",
]);
export type RefusalCategory = z.infer<typeof RefusalCategory>;

export const StyleEnum = z.enum([
  "watercolor",
  "line-art",
  "oil",
  "pixel",
  "realistic",
]);
export type Style = z.infer<typeof StyleEnum>;

const PanelSchema = z.object({
  scene: z.string().min(8),
  mood: z.string().min(3),
  camera: z.enum(["close-up", "medium", "wide", "over-the-shoulder"]),
  dialogue: z.string().optional(),
  prompt: z.string().min(40),
});

export const SceneSchema = z.object({
  character_sheet: z.string().min(20),
  art_direction: z.string().min(20),
  panels: z.array(PanelSchema).length(4),
  safety: z.object({
    flagged: z.boolean(),
    category: RefusalCategory.optional(),
    message: z.string().optional(),
  }),
});

export type Scene = z.infer<typeof SceneSchema>;

const STYLE_ANCHORS: Record<Style, string> = {
  watercolor:
    "hand-drawn comic, soft watercolor washes, expressive ink linework, dreamlike palette of cream, gold, dusty rose, muted teal, off-white paper texture, no photo-real faces",
  "line-art":
    "clean black ink, minimal shading, sharp confident linework, cream background, halftone accents, no color fills beyond a single warm spot tone",
  oil:
    "oil painting, thick impasto strokes, warm umber + ochre palette, brush-visible edges, soft chiaroscuro lighting, no digital sharpness",
  pixel:
    "16-bit era pixel art, crisp dithering, 32x32 sprite logic, limited 12-color palette, subtle scanline texture",
  realistic:
    "cinematic photographic still, natural lighting, shallow depth of field, soft film grain, realistic textures and proportions, color-graded like a movie frame — stylized realism, NOT a real photograph of any identifiable real person",
};

const SYSTEM_PROMPT = `You are DreamToon's scene composer. You convert a short spoken dream description into a precise 4-panel comic specification.

OUTPUT CONTRACT
Return ONLY valid minified JSON that conforms exactly to this TypeScript shape:

{
  "character_sheet": string,        // one paragraph, concrete visual detail
  "art_direction": string,          // one paragraph, style + palette + lighting
  "panels": [Panel, Panel, Panel, Panel],
  "safety": { "flagged": boolean, "category"?: string, "message"?: string }
}
type Panel = {
  "scene": string,
  "mood": string,
  "camera": "close-up" | "medium" | "wide" | "over-the-shoulder",
  "dialogue"?: string,
  "prompt": string                  // full image-gen prompt, see rules
}

No prose. No markdown. No code fences. JSON only.

CHARACTER CONTINUITY
- Invent ONE protagonist sheet describing hair color + length, clothing, age band, build, distinguishing features (scar, glasses, hat) in concrete visual terms.
- Every panel prompt MUST begin with the literal character_sheet text, then the art_direction text, then panel-specific scene description.
- Refer back to subjects from earlier panels with descriptive phrases ("the same red-haired woman in the green coat"), never with pronouns alone.

NARRATIVE ARC (loose)
- Panel 1: setup / where we are
- Panel 2: development / what happens
- Panel 3: twist / surreal turn
- Panel 4: resolution / dream-logic ending
- Incoherent or abstract dreams are valid. Render the FEELING, not a plot.

REFUSAL CONTRACT — set safety.flagged = true and panels = [] (empty array of 4 placeholder objects with prompt="REFUSED") if the transcript contains:
- sexual: explicit sexual content or nudity (romance/kissing OK)
- graphic_violence: gore, torture, detailed injury (chase, monster, falling OK)
- minors_unsafe: any minor in sexual/violent/abusive context (hard refuse)
- real_named_person: named celebrity, politician, real public figure ("a famous singer" = generic, OK)
- copyrighted_character: named IP (Mickey Mouse, Pikachu, Spider-Man) ("a mouse in red shorts" = OK, render generically)
- self_harm: depictions of self-injury or suicide
- hate: content targeting protected groups or using hate symbols

When refusing, write safety.message as a short friendly sentence addressed to the user: "this one's not for DreamToon — try describing the vibe instead of the people". Never policy-flavored.

WHEN A NAMED IP OR REAL PERSON APPEARS BUT IS THE ONLY ISSUE: do NOT refuse. Silently rewrite to a generic equivalent in the panel prompts and proceed. Refusal is reserved for the harder categories above.

LANGUAGE
- The dream transcript may be in ANY language (Urdu, Hindi, Arabic, Spanish, …).
  Understand it in its original language, but ALWAYS write character_sheet,
  art_direction, and every panel.prompt in ENGLISH (the image model needs
  English). safety.message may stay simple English.

PROMPT QUALITY
- Each panel.prompt is ~80-140 words.
- Always include camera direction, lighting, and emotional tone.
- Match the chosen style anchor. For illustration styles (watercolor, line-art,
  oil, pixel) reinforce "illustrated, hand-drawn, not a photo". For the
  "realistic" style use cinematic/photographic cues instead. Either way, NEVER
  aim for a deceptive likeness of a real, identifiable person.`;

function buildUserMessage(transcript: string, style: Style): string {
  return `Style anchor: ${STYLE_ANCHORS[style]}

User dream transcript (verbatim):
"""
${transcript}
"""

Compose the JSON now.`;
}

function stripFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function composeScene(
  env: Env,
  transcript: string,
  style: Style,
): Promise<Scene> {
  const model = env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

  const attempt = async (followUp?: string): Promise<string> => {
    const userMessage = followUp
      ? `${buildUserMessage(transcript, style)}\n\n${followUp}`
      : buildUserMessage(transcript, style);

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.PUBLIC_APP_URL || "https://dreamtoon.app",
        "X-Title": "DreamToon",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`openrouter_${resp.status}: ${body.slice(0, 200)}`);
    }

    const json = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error("compose_no_text_block");
    return text;
  };

  let raw = await attempt();
  let parsed = safeParseScene(raw);

  if (!parsed.success) {
    raw = await attempt(
      `Your previous response did not match the schema. Errors: ${parsed.error.message.slice(0, 400)}. Return ONLY valid JSON matching the schema.`,
    );
    parsed = safeParseScene(raw);
  }

  if (!parsed.success) {
    throw new Error(`compose_schema_failed: ${parsed.error.message.slice(0, 200)}`);
  }
  return parsed.data;
}

function safeParseScene(raw: string): z.SafeParseReturnType<unknown, Scene> {
  try {
    const obj = JSON.parse(stripFences(raw));
    return SceneSchema.safeParse(obj);
  } catch (e) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: [],
          message: `json_parse_failed: ${e instanceof Error ? e.message : String(e)}`,
        },
      ]),
    } as z.SafeParseReturnType<unknown, Scene>;
  }
}
