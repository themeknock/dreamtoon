import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import type { AppContext } from "../env";
import { db } from "../db/client";
import { comics, dreams } from "../db/schema";

export const comicRoutes = new Hono<AppContext>();

comicRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await db(c.env)
    .select({
      id: comics.id,
      style: comics.style,
      shareCount: comics.shareCount,
      viewCount: comics.viewCount,
      gallery: comics.gallery,
      createdAt: comics.createdAt,
      transcript: dreams.transcript,
      characterSheet: comics.characterSheet,
    })
    .from(comics)
    .innerJoin(dreams, eq(comics.dreamId, dreams.id))
    .where(eq(comics.id, id))
    .get();

  if (!row) return c.json({ error: "not_found" }, 404);

  // Fire-and-forget view counter
  c.executionCtx.waitUntil(
    db(c.env)
      .update(comics)
      .set({ viewCount: sql`${comics.viewCount} + 1` })
      .where(eq(comics.id, id)),
  );

  return c.json({
    id: row.id,
    style: row.style,
    shareCount: row.shareCount,
    viewCount: row.viewCount,
    gallery: row.gallery,
    createdAt: row.createdAt,
    transcript: row.transcript,
    imageUrl: `/api/comic/${id}/image`,
  });
});

comicRoutes.get("/:id/image", async (c) => {
  const id = c.req.param("id");
  const row = await db(c.env)
    .select({ key: comics.finalImageR2Key })
    .from(comics)
    .where(eq(comics.id, id))
    .get();
  if (!row) return c.json({ error: "not_found" }, 404);

  const obj = await c.env.COMICS_BUCKET.get(row.key);
  if (!obj) return c.json({ error: "not_found" }, 404);

  return new Response(obj.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(obj.size),
    },
  });
});

comicRoutes.get("/:id/panel/:n", async (c) => {
  const id = c.req.param("id");
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 4) {
    return c.json({ error: "bad_panel" }, 400);
  }
  const row = await db(c.env)
    .select({
      p1: comics.panel1R2Key,
      p2: comics.panel2R2Key,
      p3: comics.panel3R2Key,
      p4: comics.panel4R2Key,
    })
    .from(comics)
    .where(eq(comics.id, id))
    .get();
  if (!row) return c.json({ error: "not_found" }, 404);
  const key = [row.p1, row.p2, row.p3, row.p4][n - 1]!;
  const obj = await c.env.PANELS_BUCKET.get(key);
  if (!obj) return c.json({ error: "not_found" }, 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

comicRoutes.post("/:id/share", async (c) => {
  const id = c.req.param("id");
  await db(c.env)
    .update(comics)
    .set({ shareCount: sql`${comics.shareCount} + 1` })
    .where(eq(comics.id, id));
  return c.json({ ok: true });
});

comicRoutes.post("/:id/gallery", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "auth_required" }, 401);

  const owner = await db(c.env)
    .select({ userId: dreams.userId })
    .from(comics)
    .innerJoin(dreams, eq(comics.dreamId, dreams.id))
    .where(eq(comics.id, id))
    .get();
  if (!owner || owner.userId !== userId) {
    return c.json({ error: "forbidden" }, 403);
  }

  const body = (await c.req.json().catch(() => ({}))) as { gallery?: boolean };
  const gallery = !!body.gallery;
  await db(c.env).update(comics).set({ gallery }).where(eq(comics.id, id));
  return c.json({ ok: true, gallery });
});

comicRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "auth_required" }, 401);

  const row = await db(c.env)
    .select({
      dreamUserId: dreams.userId,
      dreamId: dreams.id,
      audioKey: dreams.audioR2Key,
      finalKey: comics.finalImageR2Key,
      p1: comics.panel1R2Key,
      p2: comics.panel2R2Key,
      p3: comics.panel3R2Key,
      p4: comics.panel4R2Key,
    })
    .from(comics)
    .innerJoin(dreams, eq(comics.dreamId, dreams.id))
    .where(eq(comics.id, id))
    .get();
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.dreamUserId !== userId) return c.json({ error: "forbidden" }, 403);

  await Promise.all([
    c.env.COMICS_BUCKET.delete(row.finalKey),
    c.env.PANELS_BUCKET.delete(row.p1),
    c.env.PANELS_BUCKET.delete(row.p2),
    c.env.PANELS_BUCKET.delete(row.p3),
    c.env.PANELS_BUCKET.delete(row.p4),
    c.env.AUDIO_BUCKET.delete(row.audioKey),
  ]);
  await db(c.env).delete(dreams).where(eq(dreams.id, row.dreamId));
  // comics cascades on dream delete

  return c.json({ ok: true });
});
