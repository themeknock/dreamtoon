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

// Lenient on purpose: a slightly-off LLM response should still produce a comic,
// never a hard error. camera is a free string (Gemini often says "wide shot"),
// mins are minimal, safety defaults to not-flagged, panels normalized to 4 later.
const PanelSchema = z.object({
  scene: z.string().min(1).optional().default(""),
  mood: z.string().min(1).optional().default(""),
  camera: z.string().optional().default("medium"),
  dialogue: z.string().optional(),
  prompt: z.string().min(8),
});

export const SceneSchema = z.object({
  character_sheet: z.string().min(1).optional().default(""),
  art_direction: z.string().min(1).optional().default(""),
  panels: z.array(PanelSchema).min(1),
  safety: z
    .object({
      flagged: z.boolean().optional().default(false),
      category: z.string().optional(),
      message: z.string().optional(),
    })
    .optional()
    .default({ flagged: false }),
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

function extractJson(s: string): string {
  // Strip code fences, then take the outermost {...} block so stray prose
  // around the JSON can't break parsing.
  const noFences = s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const first = noFences.indexOf("{");
  const last = noFences.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return noFences.slice(first, last + 1);
  }
  return noFences;
}

const FALLBACK_PANEL = {
  scene: "",
  mood: "dreamlike",
  camera: "medium",
  prompt: "a soft dreamlike illustrated comic panel, hand-drawn, atmospheric",
};

// Guarantee exactly 4 panels — the composite step requires it. Trim extras,
// pad short responses by repeating the last good panel.
function normalizeTo4(scene: Scene): Scene {
  let panels = scene.panels.slice(0, 4);
  while (panels.length < 4) {
    panels.push(panels[panels.length - 1] ?? FALLBACK_PANEL);
  }
  // Ensure every panel.prompt carries the style/character context.
  panels = panels.map((p) => ({
    ...p,
    prompt:
      p.prompt && p.prompt.length >= 8
        ? p.prompt
        : `${scene.character_sheet} ${scene.art_direction} ${p.scene}`.trim() ||
          FALLBACK_PANEL.prompt,
  }));
  return { ...scene, panels };
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function composeScene(
  env: Env,
  transcript: string,
  style: Style,
): Promise<Scene> {
  const primary = env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  // One model per attempt (full control over latency). Gemini Flash is fast
  // (~3-5s) and usually fine; on its occasional 504 we retry it once, then fall
  // back to DeepSeek (slower ~12s but very reliable). Worst case ~20s, not 90s.
  const modelForAttempt = [primary, "deepseek/deepseek-chat", "deepseek/deepseek-chat"];

  const attempt = async (model: string, followUp?: string): Promise<string> => {
    const userMessage = followUp
      ? `${buildUserMessage(transcript, style)}\n\n${followUp}`
      : buildUserMessage(transcript, style);

    // Per-attempt timeout: a hanging provider (Gemini's slow 504) gets aborted
    // fast so we move to the reliable fallback instead of waiting 60s+.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 22_000);
    let resp: Response;
    try {
      resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.PUBLIC_APP_URL || "https://dreamtoon.app",
          "X-Title": "DreamToon",
        },
        body: JSON.stringify({
          model,
          // Generous: each panel prompt embeds the full character_sheet +
          // art_direction, so verbose (esp. non-English) dreams can exceed a
          // tight cap and truncate the JSON mid-string → parse failure.
          max_tokens: 4000,
          temperature: 0.6,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      });
    } finally {
      clearTimeout(timer);
    }

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

  // Up to 3 attempts: the schema is already lenient, so a failure here is rare,
  // but each retry feeds the error back so the model self-corrects.
  let lastErr = "";
  for (let i = 0; i < modelForAttempt.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 300)); // brief backoff
    const model = modelForAttempt[i]!;
    let raw: string;
    try {
      raw = await attempt(
        model,
        i === 0
          ? undefined
          : `Your previous reply was not valid. ${lastErr}. Return ONLY a single JSON object with keys character_sheet (string), art_direction (string), panels (array of 4 objects each with scene, mood, camera, prompt strings), safety ({flagged:boolean}). No prose.`,
      );
    } catch (e) {
      lastErr = e instanceof Error ? e.message.slice(0, 200) : "request_failed";
      continue; // provider hiccup (504 etc) — next attempt / fallback model
    }
    const parsed = safeParseScene(raw);
    if (parsed.success) {
      return normalizeTo4(parsed.data);
    }
    lastErr = parsed.error.message.slice(0, 200);
  }

  throw new Error(`compose_schema_failed: ${lastErr}`);
}

function safeParseScene(raw: string): z.SafeParseReturnType<unknown, Scene> {
  try {
    const obj = JSON.parse(extractJson(raw));
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
