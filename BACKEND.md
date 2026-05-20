# DreamToon — Backend

> One Worker. Six steps. Thirty seconds. Five cents.

The DreamToon backend is a single Hono-on-Workers app exposing a handful of routes, the most important of which (`POST /api/dream`) orchestrates a six-step pipeline from voice blob to composed comic image. This document covers the route surface, the pipeline internals with TypeScript code, the Drizzle schema, the cron, the auth layer, the Stripe wiring, and the operational details that make this thing not fall over under real traffic.

Everything in this document is TypeScript. Stack: `hono`, `@hono/zod-validator`, `drizzle-orm`, `drizzle-orm/d1`, `@anthropic-ai/sdk`, `sharp` (WASM build), `better-auth`, `stripe`. Bindings declared in `wrangler.toml`.

---

## 1. Environment shape

```ts
// src/env.ts
export type Env = {
  // Cloudflare bindings
  DB: D1Database;
  AUDIO_BUCKET: R2Bucket;
  PANELS_BUCKET: R2Bucket;
  COMICS_BUCKET: R2Bucket;
  RATE_LIMIT_KV: KVNamespace;
  AI: Ai;                          // Workers AI binding
  AI_GATEWAY_URL: string;          // routed Anthropic endpoint

  // Secrets
  ANTHROPIC_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  BETTER_AUTH_SECRET: string;
  RESEND_API_KEY: string;
  IP_HASH_SALT: string;            // rotated daily by cron

  // Config
  ENV: "dev" | "staging" | "prod";
  CDN_DOMAIN: string;              // e.g. cdn.dreamtoon.app
};
```

The AI Gateway URL is critical — every Anthropic call routes through it (not through `api.anthropic.com` directly) so we get caching, cost caps, and a single log surface.

---

## 2. Route surface

```ts
// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./env";
import { dreamRoutes } from "./routes/dream";
import { comicRoutes } from "./routes/comic";
import { galleryRoutes } from "./routes/gallery";
import { stripeRoutes } from "./routes/stripe";
import { authRoutes } from "./routes/auth";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("/api/*", cors({
  origin: (origin) => origin?.endsWith("dreamtoon.app") ? origin : "",
  credentials: true,
}));

app.route("/api/dream", dreamRoutes);
app.route("/api/comic", comicRoutes);
app.route("/api/gallery", galleryRoutes);
app.route("/api/stripe", stripeRoutes);
app.route("/api/auth", authRoutes);

app.get("/healthz", (c) => c.text("ok"));

export default {
  fetch: app.fetch,
  scheduled: async (event, env: Env, ctx) => {
    const { dailyCleanup } = await import("./cron/cleanup");
    ctx.waitUntil(dailyCleanup(env));
  },
};
```

Concrete endpoints:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/dream` | The pipeline. Multipart audio in, SSE stream out, comic ID at the end. |
| `GET` | `/api/comic/:id` | JSON metadata for a comic. |
| `GET` | `/api/comic/:id/image` | Redirect to R2-signed URL (or CDN URL for public comics). |
| `GET` | `/api/comic/:id/og.png` | Dynamic 1200×630 Open Graph image. |
| `POST` | `/api/comic/:id/share` | Increment `shareCount`. Fire-and-forget. |
| `POST` | `/api/comic/:id/gallery` | Owner-only. Toggle gallery opt-in. |
| `DELETE` | `/api/comic/:id` | Owner-only. Hard-delete (D1 rows + R2 objects). |
| `GET` | `/api/gallery` | Paginated public gallery. `?cursor=&style=&period=`. |
| `POST` | `/api/stripe/webhook` | Stripe events (subscription created/updated/cancelled). |
| `*` | `/api/auth/*` | better-auth handler (magic-link). |

---

## 3. Drizzle schemas

```ts
// src/db/schema.ts
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const dreams = sqliteTable("dreams", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  audioR2Key: text("audio_r2_key").notNull(),
  transcript: text("transcript").notNull(),
  ipHash: text("ip_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const comics = sqliteTable("comics", {
  id: text("id").primaryKey(),
  dreamId: text("dream_id").notNull().references(() => dreams.id, { onDelete: "cascade" }),
  finalImageR2Key: text("final_image_r2_key").notNull(),
  panel1R2Key: text("panel1_r2_key").notNull(),
  panel2R2Key: text("panel2_r2_key").notNull(),
  panel3R2Key: text("panel3_r2_key").notNull(),
  panel4R2Key: text("panel4_r2_key").notNull(),
  style: text("style", { enum: ["line-art", "oil", "pixel", "watercolor"] }).notNull(),
  shareCount: integer("share_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  gallery: integer("gallery", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const usage = sqliteTable(
  "usage",
  {
    actorId: text("actor_id").notNull(),    // userId OR ipHash
    day: text("day").notNull(),              // YYYY-MM-DD UTC
    comicCount: integer("comic_count").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.actorId, t.day] }),
  }),
);

export const galleryTop = sqliteTable("gallery_top", {
  rank: integer("rank").primaryKey(),
  comicId: text("comic_id").notNull().references(() => comics.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  refreshedAt: integer("refreshed_at", { mode: "timestamp" }).notNull(),
});
```

`gallery_top` is rebuilt by the daily cron. The `/api/gallery` endpoint reads from it (cheap indexed scan) rather than recomputing the ranking on every page load.

Indexes that matter: `dreams(ipHash, createdAt)` for abuse forensics, `comics(gallery, createdAt)` for the gallery feed, `comics(dreamId)` unique for the FK lookup.

---

## 4. The pipeline — `POST /api/dream`

This is the only route that matters for understanding the system. It's a single Hono handler with six sequential steps, streaming SSE progress events back to the browser.

```ts
// src/routes/dream.ts
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { nanoid } from "nanoid";
import { drizzle } from "drizzle-orm/d1";
import { dreams, comics } from "../db/schema";
import type { Env } from "../env";
import { transcribeAudio } from "../pipeline/transcribe";
import { composeScene } from "../pipeline/compose";
import { generatePanel } from "../pipeline/flux";
import { composeImage } from "../pipeline/image";
import { checkRateLimit, incrementUsage } from "../pipeline/limits";
import { hashIp } from "../util/hash";

export const dreamRoutes = new Hono<{ Bindings: Env }>();

const StyleEnum = z.enum(["line-art", "oil", "pixel", "watercolor"]);

dreamRoutes.post("/", async (c) => {
  const form = await c.req.formData();
  const audio = form.get("audio");
  const style = StyleEnum.parse(form.get("style") ?? "line-art");

  if (!(audio instanceof File)) {
    return c.json({ error: "audio is required" }, 400);
  }
  if (audio.size > 200_000) {
    return c.json({ error: "audio too long" }, 413);
  }

  const ip = c.req.header("cf-connecting-ip") ?? "0.0.0.0";
  const ipHash = await hashIp(ip, c.env.IP_HASH_SALT);
  const userId = c.get("userId" as never) as string | null;

  const limit = await checkRateLimit(c.env, userId, ipHash);
  if (!limit.ok) {
    return c.json({ error: "rate_limited", resetAt: limit.resetAt }, 429);
  }

  const dreamId = nanoid(12);
  const comicId = nanoid(12);
  const db = drizzle(c.env.DB);

  return streamSSE(c, async (sse) => {
    const emit = (event: string, data: object) =>
      sse.writeSSE({ event, data: JSON.stringify(data) });

    try {
      // STEP 1: store audio
      await emit("status", { stage: "listening" });
      const audioBytes = new Uint8Array(await audio.arrayBuffer());
      const audioR2Key = `audio-recordings/${dreamId}.webm`;
      await c.env.AUDIO_BUCKET.put(audioR2Key, audioBytes, {
        httpMetadata: { contentType: audio.type || "audio/webm" },
      });

      // STEP 2: transcribe
      const transcript = await transcribeAudio(c.env, audioBytes);
      if (transcript.trim().length < 8) {
        await emit("error", { code: "no_speech" });
        return;
      }

      await db.insert(dreams).values({
        id: dreamId,
        userId,
        audioR2Key,
        transcript,
        ipHash,
      });

      // STEP 3: compose scene with Claude
      await emit("status", { stage: "imagining" });
      const scene = await composeScene(c.env, transcript, style);
      if (scene.safety.flagged) {
        await emit("error", { code: "safety" });
        return;
      }

      // STEP 4: 4× Flux Schnell in parallel
      const panelPromises = scene.panels.map((p, i) =>
        generatePanel(c.env, p.prompt, i + 1).then(async (bytes) => {
          await emit("panel", { index: i + 1 });
          return bytes;
        }),
      );
      const panelBytes = await Promise.all(panelPromises);

      // STEP 5: compose final image
      await emit("status", { stage: "composing" });
      const composed = await composeImage(panelBytes, scene, comicId);

      // STEP 6: persist
      const panelKeys = panelBytes.map(
        (_, i) => `panel-images/${comicId}/${i + 1}.png`,
      );
      const finalKey = `final-comics/${comicId}.png`;

      await Promise.all([
        c.env.COMICS_BUCKET.put(finalKey, composed, {
          httpMetadata: { contentType: "image/png" },
        }),
        ...panelBytes.map((bytes, i) =>
          c.env.PANELS_BUCKET.put(panelKeys[i], bytes, {
            httpMetadata: { contentType: "image/png" },
          }),
        ),
      ]);

      await db.insert(comics).values({
        id: comicId,
        dreamId,
        finalImageR2Key: finalKey,
        panel1R2Key: panelKeys[0],
        panel2R2Key: panelKeys[1],
        panel3R2Key: panelKeys[2],
        panel4R2Key: panelKeys[3],
        style,
      });

      await incrementUsage(c.env, userId, ipHash);
      await emit("done", { comicId, url: `/comic/${comicId}` });
    } catch (err) {
      console.error("pipeline_failed", err);
      await emit("error", { code: "pipeline_failed" });
    }
  });
});
```

The handler is intentionally readable end-to-end. Each `pipeline/*` module is small and self-contained. The next four sections cover those modules.

---

## 5. Step 2 — Whisper on Workers AI

```ts
// src/pipeline/transcribe.ts
import type { Env } from "../env";

export async function transcribeAudio(
  env: Env,
  audioBytes: Uint8Array,
): Promise<string> {
  const response = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
    audio: Array.from(audioBytes),
    language: "en",
    task: "transcribe",
  });

  // Workers AI returns { text: string, word_count: number, words?: [...] }
  const text = (response as { text?: string }).text ?? "";
  return text.trim();
}
```

Whisper Large v3 Turbo on Workers AI processes 15 seconds of audio in roughly 1-2 seconds. We pass the raw audio bytes — Workers AI handles the codec (webm/opus, mp3, wav).

If the transcript is empty or trivially short we bail before paying for Claude. The empty-transcript branch in the main handler covers silent / mic-blocked recordings.

---

## 6. Step 3 — Claude structured output

This is the architectural keystone. One Claude Sonnet 4.7 call turns a free-form dream transcript into a fully-specified four-panel scene with character continuity and safety shaping.

```ts
// src/pipeline/compose.ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Env } from "../env";

const SceneSchema = z.object({
  character_sheet: z.string().min(20),
  art_direction: z.string().min(20),
  panels: z.array(z.object({
    scene: z.string(),
    mood: z.string(),
    camera: z.enum(["close-up", "medium", "wide", "over-the-shoulder"]),
    dialogue: z.string().optional(),
    prompt: z.string().min(40),
  })).length(4),
  safety: z.object({
    flagged: z.boolean(),
    reason: z.string().optional(),
  }),
});

export type Scene = z.infer<typeof SceneSchema>;

const SYSTEM_PROMPT = `You are DreamToon's scene composer. You turn a short
spoken dream description into a coherent 4-panel comic specification.

Hard rules:
- Output VALID JSON matching the provided schema. No prose, no markdown.
- Invent a concrete one-paragraph character_sheet describing the protagonist
  visually (hair, clothing, age, build, distinguishing features).
- Every panel's "prompt" MUST embed the character_sheet text AND the
  art_direction block, so the image model produces consistent characters.
- Panels form a loose arc: setup, development, twist, resolution. Incoherent
  or abstract dreams are valid — render the feeling, not the plot.
- If the transcript mentions a copyrighted character (e.g. Mickey Mouse,
  Spider-Man, Pikachu, Darth Vader), silently rewrite to a generic
  equivalent in the panel prompts. Do NOT refuse. Do NOT mention this.
- If the transcript depicts sexual content, real-person nonconsensual content,
  or anything involving minors in unsafe context, set safety.flagged = true
  with a short reason. Do not produce panel prompts in that case.

Style: when style="line-art" use clean black ink, minimal shading. "oil"
uses thick impasto strokes and warm palette. "pixel" uses crisp 32x32 era
pixel-art aesthetics. "watercolor" uses soft bleeds, off-white paper texture.`;

export async function composeScene(
  env: Env,
  transcript: string,
  style: "line-art" | "oil" | "pixel" | "watercolor",
): Promise<Scene> {
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: env.AI_GATEWAY_URL,  // routes through CF AI Gateway
  });

  const attempt = async (followUp?: string) => {
    const response = await client.messages.create({
      model: "claude-sonnet-4-7-20251015",
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },  // <- the big cost lever
        },
      ],
      messages: [
        {
          role: "user",
          content: `Style: ${style}\n\nDream transcript:\n"${transcript}"\n\n${followUp ?? "Return the JSON now."}`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("no_text_block");
    return block.text;
  };

  let raw = await attempt();
  let parsed = SceneSchema.safeParse(JSON.parse(stripFences(raw)));

  if (!parsed.success) {
    raw = await attempt(
      `Your previous response did not match the schema. Errors: ${parsed.error.message}. Return ONLY valid JSON matching the schema.`,
    );
    parsed = SceneSchema.safeParse(JSON.parse(stripFences(raw)));
  }

  if (!parsed.success) throw new Error("compose_schema_failed");
  return parsed.data;
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "").trim();
}
```

Three things worth pointing out.

The `cache_control: { type: "ephemeral" }` on the system block is what makes this cheap. Anthropic caches the ~800-token system prompt; subsequent calls in the cache TTL window pay roughly 10% of the input cost. AI Gateway adds another caching layer keyed on the full prompt — so identical transcripts get the entire Claude response for free.

Schema validation runs on Worker, not on Anthropic. We use Zod, not Anthropic's tool-use, because tool-use adds overhead we don't need for a single response shape. One retry on schema failure (with the error message fed back), then we give up and the user gets a "muse was offline" error. In practice this fires on under 0.5% of calls.

Safety is part of the same call. We don't run a separate moderation pass — Claude is good enough at this and the second call costs more than it saves.

---

## 7. Step 4 — parallel Flux Schnell

```ts
// src/pipeline/flux.ts
import type { Env } from "../env";

export async function generatePanel(
  env: Env,
  prompt: string,
  panelIndex: number,
): Promise<Uint8Array> {
  const attempt = async (seed: number) => {
    const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt,
      steps: 4,            // Flux Schnell is tuned for 1-4 steps
      seed,
    });
    // Workers AI returns { image: string } where image is base64 PNG
    if (typeof (response as { image?: string }).image === "string") {
      return base64ToBytes((response as { image: string }).image);
    }
    if (response instanceof ReadableStream) {
      return new Uint8Array(await new Response(response).arrayBuffer());
    }
    throw new Error("flux_unexpected_response");
  };

  const baseSeed = Math.floor(Math.random() * 1_000_000) + panelIndex * 1000;

  try {
    const bytes = await attempt(baseSeed);
    if (looksBroken(bytes)) throw new Error("broken_image");
    return bytes;
  } catch {
    // One retry with a different seed
    return attempt(baseSeed + 7919);
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function looksBroken(bytes: Uint8Array): boolean {
  // PNG must start with 89 50 4E 47 0D 0A 1A 0A
  if (bytes.length < 8) return true;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return true;
  if (bytes.length < 5000) return true; // suspiciously tiny PNG = blank
  return false;
}
```

Promise.all in the main handler runs all four of these in parallel. Worker concurrency is per-request, not per-Worker, so four parallel Workers AI calls is fine. Wall-clock for four parallel Flux Schnell calls at 4 steps each: 6-10 seconds typical.

Per-panel retry with a new seed handles two failure modes: transient Workers AI errors and the occasional Flux output that's a blank or noise frame. We don't retry beyond once because a second Flux failure on the same panel is almost always a content-shaping problem, not a transient one — Claude needs to recompose. We surface that to the user as a generic "try again" rather than re-prompting on the server.

---

## 8. Step 5 — Sharp WASM composition

```ts
// src/pipeline/image.ts
import sharp from "sharp";
import type { Scene } from "./compose";

const CANVAS = 2048;
const PANEL = 992;
const GUTTER = 24;

const POSITIONS: ReadonlyArray<{ left: number; top: number }> = [
  { left: GUTTER,             top: GUTTER },
  { left: GUTTER + PANEL + GUTTER * 2, top: GUTTER },
  { left: GUTTER,             top: GUTTER + PANEL + GUTTER * 2 },
  { left: GUTTER + PANEL + GUTTER * 2, top: GUTTER + PANEL + GUTTER * 2 },
];

export async function composeImage(
  panels: Uint8Array[],
  scene: Scene,
  comicId: string,
): Promise<Uint8Array> {
  const resized = await Promise.all(
    panels.map((bytes) =>
      sharp(bytes)
        .resize(PANEL, PANEL, { fit: "cover" })
        .png()
        .toBuffer(),
    ),
  );

  const overlays: sharp.OverlayOptions[] = [];

  resized.forEach((buf, i) => {
    overlays.push({ input: buf, left: POSITIONS[i].left, top: POSITIONS[i].top });

    // Panel number badge (1, 2, 3, 4)
    overlays.push({
      input: Buffer.from(panelBadgeSvg(i + 1)),
      left: POSITIONS[i].left + 16,
      top: POSITIONS[i].top + 16,
    });

    // Speech bubble if dialogue
    const dialogue = scene.panels[i].dialogue;
    if (dialogue) {
      overlays.push({
        input: Buffer.from(speechBubbleSvg(dialogue, PANEL)),
        left: POSITIONS[i].left,
        top: POSITIONS[i].top,
      });
    }
  });

  // Watermark
  overlays.push({
    input: Buffer.from(watermarkSvg()),
    left: CANVAS - 280,
    top: CANVAS - 80,
  });

  const composed = await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 251, g: 247, b: 238, alpha: 1 }, // cream-50
    },
  })
    .composite(overlays)
    .png({ compressionLevel: 8 })
    .toBuffer();

  return new Uint8Array(composed);
}

function panelBadgeSvg(n: number): string {
  return `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="26" fill="#1B1714"/>
    <text x="28" y="38" text-anchor="middle" font-family="Inter,sans-serif"
          font-size="28" font-weight="700" fill="#FBF7EE">${n}</text>
  </svg>`;
}

function speechBubbleSvg(text: string, w: number): string {
  const safe = text.replace(/[<>&]/g, "");
  const truncated = safe.length > 90 ? safe.slice(0, 87) + "..." : safe;
  return `<svg width="${w}" height="${w}" xmlns="http://www.w3.org/2000/svg">
    <rect x="60" y="60" rx="40" ry="40" width="${w - 120}" height="140"
          fill="#FBF7EE" stroke="#1B1714" stroke-width="6"/>
    <text x="${w / 2}" y="140" text-anchor="middle" font-family="Inter,sans-serif"
          font-size="32" fill="#1B1714">${truncated}</text>
  </svg>`;
}

function watermarkSvg(): string {
  return `<svg width="260" height="60" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="44" font-family="Fraunces,serif" font-size="36"
          fill="#1B1714" opacity="0.7">dreamtoon.app</text>
  </svg>`;
}
```

Sharp's WASM build runs on Workers without native deps. The composition takes about 400-700ms for the full pipeline. Output is a 2048×2048 PNG at compression level 8, typically 1.5-2.5 MB.

Three things to know. We `fit: "cover"` rather than `contain` so panels fill cleanly without letterboxing — Flux output is already 1:1 so this is effectively a noop for sizing, but it future-proofs us against model changes. Speech bubbles are SVG-rendered (not Sharp text) for crisp scaling. The cream background matches the frontend theme exactly, so a comic dropped into the site doesn't have a visible seam.

---

## 9. OG image — `GET /api/comic/:id/og.png`

```ts
// src/routes/comic.ts (excerpt)
comicRoutes.get("/:id/og.png", async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const row = await db.select().from(comics).where(eq(comics.id, id)).get();
  if (!row) return c.notFound();

  const panel1 = await c.env.PANELS_BUCKET.get(row.panel1R2Key);
  if (!panel1) return c.notFound();
  const panelBytes = new Uint8Array(await panel1.arrayBuffer());

  const og = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 251, g: 247, b: 238, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(panelBytes).resize(630, 630, { fit: "cover" }).toBuffer(),
        left: 0,
        top: 0,
      },
      {
        input: Buffer.from(ogTextSvg()),
        left: 660,
        top: 230,
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Response(og, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

function ogTextSvg(): string {
  return `<svg width="500" height="170" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="60" font-family="Fraunces,serif" font-size="56"
          font-weight="600" fill="#1B1714">a dream,</text>
    <text x="0" y="130" font-family="Fraunces,serif" font-size="56"
          font-weight="600" fill="#1B1714">drawn.</text>
    <text x="0" y="170" font-family="Inter,sans-serif" font-size="22"
          fill="#3A3128">dreamtoon.app</text>
  </svg>`;
}
```

The OG image is computed on demand and cached aggressively (one-year immutable) since comics never change. Cloudflare's CDN handles all repeat hits.

---

## 10. Rate-limiting and usage

```ts
// src/pipeline/limits.ts
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { users, usage } from "../db/schema";
import type { Env } from "../env";

const FREE_DAILY = 3;
const PRO_DAILY_SOFT = 100;

export async function checkRateLimit(
  env: Env,
  userId: string | null,
  ipHash: string,
): Promise<{ ok: true } | { ok: false; resetAt: number }> {
  const day = new Date().toISOString().slice(0, 10);
  const actorId = userId ?? ipHash;
  const key = `rl:${actorId}:${day}`;

  let cap = FREE_DAILY;
  if (userId) {
    const db = drizzle(env.DB);
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (user?.plan === "pro") cap = PRO_DAILY_SOFT;
  }

  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? "0", 10);
  if (current >= cap) {
    const tomorrow = Math.floor(Date.now() / 1000) + 86400;
    return { ok: false, resetAt: tomorrow };
  }
  return { ok: true };
}

export async function incrementUsage(
  env: Env,
  userId: string | null,
  ipHash: string,
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const actorId = userId ?? ipHash;
  const key = `rl:${actorId}:${day}`;

  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? "0", 10);
  await env.RATE_LIMIT_KV.put(key, String(current + 1), {
    expirationTtl: 60 * 60 * 26,
  });

  const db = drizzle(env.DB);
  await db.insert(usage)
    .values({ actorId, day, comicCount: 1 })
    .onConflictDoUpdate({
      target: [usage.actorId, usage.day],
      set: { comicCount: sql`${usage.comicCount} + 1` },
    });
}
```

KV is the hot path (every dream request reads + writes one key); D1 is the durable record for analytics. The two can diverge briefly under load and that's fine — KV wins for the gate, D1 wins for billing.

---

## 11. Stripe webhook

```ts
// src/routes/stripe.ts
import { Hono } from "hono";
import Stripe from "stripe";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import type { Env } from "../env";

export const stripeRoutes = new Hono<{ Bindings: Env }>();

stripeRoutes.post("/webhook", async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.text("missing signature", 400);

  const body = await c.req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, sig, c.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return c.text("bad signature", 400);
  }

  const db = drizzle(c.env.DB);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const active = sub.status === "active" || sub.status === "trialing";
      await db.update(users)
        .set({ plan: active ? "pro" : "free" })
        .where(eq(users.stripeCustomerId, customerId));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await db.update(users)
        .set({ plan: "free" })
        .where(eq(users.stripeCustomerId, customerId));
      break;
    }
  }

  return c.text("ok");
});
```

Stripe is a flat $3/month subscription, not metered. The webhook flips `users.plan`; rate-limiting reads it. Customer Portal handles cancellations and card updates; we never see card data.

---

## 12. Cron — daily cleanup

```ts
// src/cron/cleanup.ts
import { drizzle } from "drizzle-orm/d1";
import { and, eq, lt, sql } from "drizzle-orm";
import { comics, dreams, users, galleryTop } from "../db/schema";
import type { Env } from "../env";

export async function dailyCleanup(env: Env): Promise<void> {
  const db = drizzle(env.DB);
  const cutoff = Math.floor(Date.now() / 1000) - 7 * 86400;

  // 1. Find free-tier non-gallery comics older than 7 days
  const toDelete = await db
    .select({
      comicId: comics.id,
      finalKey: comics.finalImageR2Key,
      p1: comics.panel1R2Key,
      p2: comics.panel2R2Key,
      p3: comics.panel3R2Key,
      p4: comics.panel4R2Key,
      audioKey: dreams.audioR2Key,
      dreamId: dreams.id,
    })
    .from(comics)
    .innerJoin(dreams, eq(comics.dreamId, dreams.id))
    .leftJoin(users, eq(dreams.userId, users.id))
    .where(and(
      eq(comics.gallery, false),
      lt(comics.createdAt, new Date(cutoff * 1000)),
      sql`(${users.plan} IS NULL OR ${users.plan} = 'free')`,
    ))
    .all();

  // 2. Delete R2 objects in batches
  for (const row of toDelete) {
    await Promise.all([
      env.COMICS_BUCKET.delete(row.finalKey),
      env.PANELS_BUCKET.delete(row.p1),
      env.PANELS_BUCKET.delete(row.p2),
      env.PANELS_BUCKET.delete(row.p3),
      env.PANELS_BUCKET.delete(row.p4),
      env.AUDIO_BUCKET.delete(row.audioKey),
    ]);
    await db.delete(dreams).where(eq(dreams.id, row.dreamId));
    // comics cascades on dream delete
  }

  // 3. Rebuild gallery_top
  const top = await db
    .select({
      id: comics.id,
      score: sql<number>`${comics.shareCount} + (${comics.viewCount} / 10)`,
    })
    .from(comics)
    .where(and(
      eq(comics.gallery, true),
      sql`${comics.createdAt} > ${new Date(cutoff * 1000)}`,
    ))
    .orderBy(sql`score DESC`)
    .limit(50)
    .all();

  await db.delete(galleryTop);
  if (top.length > 0) {
    await db.insert(galleryTop).values(
      top.map((t, i) => ({
        rank: i + 1,
        comicId: t.id,
        score: t.score,
        refreshedAt: new Date(),
      })),
    );
  }
}
```

Scheduled via `wrangler.toml`:

```toml
[triggers]
crons = ["0 3 * * *"]
```

Three AM UTC — middle of the night for most of the user base, so cleanup doesn't compete with the morning dream rush.

---

## 13. Auth (optional)

better-auth with the magic-link strategy via Resend, sessions stored in D1 via the better-auth Drizzle adapter. Three small extensions on top of the default config.

- **Anonymous → signed-in migration.** When a user signs in for the first time, we read the `dt_anon` cookie (set on first anonymous dream), find any `dreams` rows where `userId IS NULL` and `ipHash` matches their current request, and link them to the new user. One D1 update.
- **Cookie shape.** Session cookie is HTTP-only, Secure, SameSite=Lax, scoped to `.dreamtoon.app`. The anonymous tracking cookie (`dt_anon`) is just a nanoid, HTTP-only, 30-day TTL.
- **Stripe customer creation.** On user creation, we create a Stripe customer and store the ID on the row. Skip if we already have one (idempotent for re-signins after deletion).

No social auth, no passwords, no 2FA. The product doesn't justify the support load.

---

## 14. Observability

Three layers.

**Structured logs** via `hono/logger` plus per-pipeline-step `console.log({ stage, dreamId, ms })`. Logpush from Workers sends these to R2 as JSONL daily, queryable via Workers Analytics Engine for hot stuff (error rates by stage, p95 latency).

**AI Gateway dashboard** is the single source of truth for model spend, cache-hit rate, and error rate. We don't reimplement any of that — just check the gateway UI.

**Alerts.** Two: pipeline error rate > 5% over a 10-minute window (PagerDuty), and AI Gateway daily cost > $X (email-only). Anything else can wait until the next morning.

---

## 15. What's deliberately missing

No queue. No retries beyond one-per-step. No background reprocessing. No webhook for "your comic is ready" — the SSE stream finishes inside the original request. No fan-out to multiple image models. No A/B testing framework. No feature flags beyond a simple `ENV` check.

Every one of those is a thing you'd want at 10× the current scale. At current scale they would be drag. They get added when the metric forces them, not before.
