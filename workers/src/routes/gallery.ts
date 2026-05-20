import { Hono } from "hono";
import { eq, desc, and, lt } from "drizzle-orm";
import type { AppContext } from "../env";
import { db } from "../db/client";
import { comics, galleryTop, dreams } from "../db/schema";

export const galleryRoutes = new Hono<AppContext>();

const PAGE_SIZE = 24;

galleryRoutes.get("/", async (c) => {
  const cursor = c.req.query("cursor");
  const style = c.req.query("style");
  const sort = c.req.query("sort") ?? "top";

  if (sort === "top") {
    const top = await db(c.env)
      .select({
        id: comics.id,
        style: comics.style,
        createdAt: comics.createdAt,
      })
      .from(galleryTop)
      .innerJoin(comics, eq(galleryTop.comicId, comics.id))
      .orderBy(galleryTop.rank)
      .limit(PAGE_SIZE)
      .all();
    return c.json({ items: top, nextCursor: null });
  }

  // sort === "new"
  const conds = [eq(comics.gallery, true)];
  if (cursor) {
    const ts = Number(cursor);
    if (Number.isFinite(ts)) conds.push(lt(comics.createdAt, new Date(ts * 1000)));
  }
  if (style) {
    conds.push(eq(comics.style, style as "watercolor"));
  }

  const rows = await db(c.env)
    .select({
      id: comics.id,
      style: comics.style,
      createdAt: comics.createdAt,
      transcript: dreams.transcript,
    })
    .from(comics)
    .innerJoin(dreams, eq(comics.dreamId, dreams.id))
    .where(and(...conds))
    .orderBy(desc(comics.createdAt))
    .limit(PAGE_SIZE + 1)
    .all();

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = items.at(-1);
  const nextCursor =
    hasMore && last ? Math.floor(last.createdAt.getTime() / 1000) : null;

  return c.json({ items, nextCursor });
});
