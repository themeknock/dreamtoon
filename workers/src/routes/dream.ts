import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { nanoid } from "nanoid";
import type { AppContext } from "../env";
import { db } from "../db/client";
import { dreams, comics, refusals } from "../db/schema";
import { hashIp, sha256Hex } from "../lib/hash";
import { transcribeAudio, looksLikeSpeech } from "../pipeline/transcribe";
import { composeScene, StyleEnum, type Style } from "../pipeline/compose";
import { generatePanel } from "../pipeline/flux";
import { composeImage } from "../pipeline/image";
import { checkRateLimit, incrementUsage } from "../pipeline/limits";

export const dreamRoutes = new Hono<AppContext>();

const MAX_AUDIO_BYTES = 200_000;

dreamRoutes.post("/", async (c) => {
  const form = await c.req.formData();
  const audio = form.get("audio");
  const styleRaw = (form.get("style") as string) || "watercolor";
  const styleParsed = StyleEnum.safeParse(styleRaw);
  if (!styleParsed.success) {
    return c.json({ error: "invalid_style" }, 400);
  }
  const style: Style = styleParsed.data;

  const isBlobLike =
    audio &&
    typeof audio === "object" &&
    "arrayBuffer" in audio &&
    typeof (audio as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
    typeof (audio as { size?: unknown }).size === "number";
  if (!isBlobLike) {
    return c.json({ error: "audio_required" }, 400);
  }
  const audioBlob = audio as unknown as Blob;
  if (audioBlob.size > MAX_AUDIO_BYTES) {
    return c.json({ error: "audio_too_long" }, 413);
  }
  if (audioBlob.size < 500) {
    return c.json({ error: "audio_too_short" }, 400);
  }

  const ip = c.req.header("cf-connecting-ip") ?? "0.0.0.0";
  const ipHash = await hashIp(ip, c.env.IP_HASH_SALT || "dt-dev-salt");
  const userId = c.get("userId");

  const limit = await checkRateLimit(c.env, userId, ipHash);
  if (!limit.ok) {
    return c.json(
      { error: "rate_limited", resetAt: limit.resetAt, cap: limit.cap },
      429,
    );
  }

  const dreamId = nanoid(12);
  const comicId = nanoid(12);

  // SSE responses bypass the global cors middleware's header injection, so
  // set the CORS headers explicitly here or the browser blocks the stream
  // ("Failed to fetch") on cross-origin requests.
  const origin = c.req.header("Origin");
  if (origin) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Vary", "Origin");
  }

  return streamSSE(c, async (sse) => {
    const emit = (event: string, data: object) =>
      sse.writeSSE({ event, data: JSON.stringify(data) });

    const t0 = Date.now();
    let stage = "audio";
    try {
      await emit("status", { stage: "listening", dreamId });

      const audioBytes = new Uint8Array(await audioBlob.arrayBuffer());
      const audioR2Key = `audio-recordings/${dreamId}.webm`;
      await c.env.AUDIO_BUCKET.put(audioR2Key, audioBytes, {
        httpMetadata: { contentType: audioBlob.type || "audio/webm" },
      });

      stage = "transcribe";
      const transcript = await transcribeAudio(c.env, audioBytes);
      if (!looksLikeSpeech(transcript)) {
        await emit("error", {
          code: "no_speech",
          message: "Couldn't quite hear that — give it another go?",
        });
        return;
      }

      await db(c.env).insert(dreams).values({
        id: dreamId,
        userId,
        audioR2Key,
        transcript,
        ipHash,
      });

      await emit("transcript", { transcript });

      stage = "compose";
      await emit("status", { stage: "imagining" });
      const scene = await composeScene(c.env, transcript, style);

      if (scene.safety.flagged) {
        const transcriptHash = await sha256Hex(transcript);
        await db(c.env).insert(refusals).values({
          id: nanoid(12),
          transcriptHash,
          layer: 1,
          category: scene.safety.category ?? "unspecified",
          ipHash,
        });
        await emit("refusal", {
          category: scene.safety.category,
          message:
            scene.safety.message ??
            "this one's not for DreamToon — try describing the vibe instead of the people.",
        });
        return;
      }

      stage = "flux";
      await emit("status", { stage: "drawing" });
      const panelPromises = scene.panels.map((p, i) =>
        generatePanel(c.env, p.prompt, i + 1).then(async (bytes) => {
          await emit("panel_ready", { index: i + 1 });
          return bytes;
        }),
      );
      const panelBytes = await Promise.all(panelPromises);

      stage = "compose_image";
      await emit("status", { stage: "composing" });
      const composed = await composeImage(panelBytes, scene, comicId);

      stage = "persist";
      const panelKeys = panelBytes.map(
        (_, i) => `panel-images/${comicId}/${i + 1}.png`,
      );
      const finalKey = `final-comics/${comicId}.png`;

      await Promise.all([
        c.env.COMICS_BUCKET.put(finalKey, composed, {
          httpMetadata: { contentType: "image/png" },
        }),
        ...panelBytes.map((bytes, i) =>
          c.env.PANELS_BUCKET.put(panelKeys[i]!, bytes, {
            httpMetadata: { contentType: "image/png" },
          }),
        ),
      ]);

      await db(c.env).insert(comics).values({
        id: comicId,
        dreamId,
        finalImageR2Key: finalKey,
        panel1R2Key: panelKeys[0]!,
        panel2R2Key: panelKeys[1]!,
        panel3R2Key: panelKeys[2]!,
        panel4R2Key: panelKeys[3]!,
        style,
        characterSheet: scene.character_sheet,
      });

      await incrementUsage(c.env, userId, ipHash);

      await emit("done", {
        comicId,
        url: `/c/${comicId}`,
        elapsedMs: Date.now() - t0,
      });
    } catch (err) {
      console.error("pipeline_failed", { stage, dreamId, err: String(err) });
      await emit("error", {
        code: "pipeline_failed",
        stage,
        message: "the muse was offline — try again?",
        detail: String(err).slice(0, 300),
      });
    }
  });
});
