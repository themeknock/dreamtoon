import { and, eq, lt, sql, isNull, or } from "drizzle-orm";
import type { Env } from "../env";
import { db } from "../db/client";
import { comics, dreams, users, galleryTop } from "../db/schema";

const SEVEN_DAYS_S = 7 * 86400;

export async function dailyCleanup(env: Env): Promise<void> {
  const dbi = db(env);
  const cutoff = new Date((Math.floor(Date.now() / 1000) - SEVEN_DAYS_S) * 1000);

  // 1. Free-tier non-gallery comics older than 7 days → delete
  const toDelete = await dbi
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
    .where(
      and(
        eq(comics.gallery, false),
        lt(comics.createdAt, cutoff),
        or(isNull(users.plan), eq(users.plan, "free")),
      ),
    )
    .all();

  for (const row of toDelete) {
    await Promise.all([
      env.COMICS_BUCKET.delete(row.finalKey),
      env.PANELS_BUCKET.delete(row.p1),
      env.PANELS_BUCKET.delete(row.p2),
      env.PANELS_BUCKET.delete(row.p3),
      env.PANELS_BUCKET.delete(row.p4),
      env.AUDIO_BUCKET.delete(row.audioKey),
    ]);
    await dbi.delete(dreams).where(eq(dreams.id, row.dreamId));
    // comics cascades on dream delete
  }

  // 2. Rebuild gallery_top
  const top = await dbi
    .select({
      id: comics.id,
      score: sql<number>`${comics.shareCount} + (${comics.viewCount} / 10)`,
    })
    .from(comics)
    .where(
      and(
        eq(comics.gallery, true),
        sql`${comics.createdAt} > ${cutoff}`,
      ),
    )
    .orderBy(sql`score DESC`)
    .limit(50)
    .all();

  await dbi.delete(galleryTop);
  if (top.length > 0) {
    await dbi.insert(galleryTop).values(
      top.map((t, i) => ({
        rank: i + 1,
        comicId: t.id,
        score: Number(t.score),
        refreshedAt: new Date(),
      })),
    );
  }
}
