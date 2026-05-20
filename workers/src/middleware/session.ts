import type { MiddlewareHandler } from "hono";
import { eq, gt } from "drizzle-orm";
import { and } from "drizzle-orm";
import type { AppContext } from "../env";
import { db } from "../db/client";
import { sessions } from "../db/schema";
import { readSession } from "../lib/cookies";

export const sessionMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  c.set("userId", null);

  const token = readSession(c);
  if (!token) return next();

  const row = await db(c.env)
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())),
    )
    .get();

  if (row) c.set("userId", row.userId);
  await next();
};
