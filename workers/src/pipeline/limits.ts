import { eq, sql } from "drizzle-orm";
import type { Env } from "../env";
import { db } from "../db/client";
import { users, usage } from "../db/schema";

const FREE_DAILY = 3;
const PRO_DAILY_SOFT = 100;
// Hard global ceiling across ALL users — cost circuit-breaker for the public
// demo. ~300 comics/day ≈ a few dollars max. Bump when you want more headroom.
const GLOBAL_DAILY = 300;

export type LimitResult =
  | { ok: true; remaining: number; cap: number }
  | { ok: false; resetAt: number; cap: number };

export async function checkRateLimit(
  env: Env,
  userId: string | null,
  ipHash: string,
): Promise<LimitResult> {
  const day = utcDay();
  const actorId = userId ?? ipHash;
  const key = kvKey(actorId, day);

  // Global cost circuit-breaker first.
  const globalKey = `rl:global:${day}`;
  const globalCount = parseInt(
    (await env.RATE_LIMIT_KV.get(globalKey)) ?? "0",
    10,
  );
  if (globalCount >= GLOBAL_DAILY) {
    const resetAt = Math.floor(Date.now() / 1000) + 86400;
    return { ok: false, resetAt, cap: GLOBAL_DAILY };
  }

  let cap = FREE_DAILY;
  if (userId) {
    const row = await db(env)
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    if (row?.plan === "pro") cap = PRO_DAILY_SOFT;
  }

  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? "0", 10);
  if (current >= cap) {
    const resetAt = Math.floor(Date.now() / 1000) + 86400;
    return { ok: false, resetAt, cap };
  }
  return { ok: true, remaining: cap - current, cap };
}

export async function incrementUsage(
  env: Env,
  userId: string | null,
  ipHash: string,
): Promise<void> {
  const day = utcDay();
  const actorId = userId ?? ipHash;
  const key = kvKey(actorId, day);

  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? "0", 10);
  await env.RATE_LIMIT_KV.put(key, String(current + 1), {
    expirationTtl: 60 * 60 * 26,
  });

  // Bump global daily counter (cost circuit-breaker).
  const globalKey = `rl:global:${day}`;
  const globalCount = parseInt(
    (await env.RATE_LIMIT_KV.get(globalKey)) ?? "0",
    10,
  );
  await env.RATE_LIMIT_KV.put(globalKey, String(globalCount + 1), {
    expirationTtl: 60 * 60 * 26,
  });

  await db(env)
    .insert(usage)
    .values({ actorId, day, comicCount: 1 })
    .onConflictDoUpdate({
      target: [usage.actorId, usage.day],
      set: { comicCount: sql`${usage.comicCount} + 1` },
    });
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function kvKey(actorId: string, day: string): string {
  return `rl:${actorId}:${day}`;
}
