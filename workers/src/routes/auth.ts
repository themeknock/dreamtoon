import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { AppContext } from "../env";
import { db } from "../db/client";
import { users, sessions, magicLinks, dreams } from "../db/schema";
import { writeSession, clearSession } from "../lib/cookies";
import { hashIp } from "../lib/hash";

export const authRoutes = new Hono<AppContext>();

const MAGIC_TTL_S = 60 * 10;
const SESSION_TTL_S = 60 * 60 * 24 * 30;

authRoutes.post("/request", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({ email: z.string().email() })
    .safeParse(body);
  if (!parsed.success) return c.json({ error: "bad_email" }, 400);

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + MAGIC_TTL_S * 1000);

  await db(c.env).insert(magicLinks).values({
    token,
    email: parsed.data.email.toLowerCase(),
    expiresAt,
  });

  const url = `${c.env.PUBLIC_APP_URL}/auth/verify?token=${token}`;

  if (c.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DreamToon <hello@dreamtoon.app>",
        to: parsed.data.email,
        subject: "Your DreamToon sign-in link",
        html: `<p>Tap to sign in to DreamToon — link expires in 10 minutes.</p><p><a href="${url}">${url}</a></p>`,
      }),
    });
  } else {
    console.warn("auth_magic_link_dev", url);
  }

  return c.json({ ok: true });
});

authRoutes.get("/verify", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "missing_token" }, 400);

  const link = await db(c.env)
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .get();

  if (!link || link.consumedAt || link.expiresAt < new Date()) {
    return c.json({ error: "invalid_or_expired" }, 400);
  }

  // Consume link
  await db(c.env)
    .update(magicLinks)
    .set({ consumedAt: new Date() })
    .where(eq(magicLinks.token, token));

  // Find or create user
  let user = await db(c.env)
    .select()
    .from(users)
    .where(eq(users.email, link.email))
    .get();

  if (!user) {
    const id = nanoid(16);
    await db(c.env).insert(users).values({
      id,
      email: link.email,
    });
    user = (await db(c.env)
      .select()
      .from(users)
      .where(eq(users.id, id))
      .get())!;
  }

  // Migrate anonymous dreams keyed to this IP/today onto the new user
  const ip = c.req.header("cf-connecting-ip") ?? "0.0.0.0";
  const ipHash = await hashIp(ip, c.env.IP_HASH_SALT || "dt-dev-salt");
  await db(c.env)
    .update(dreams)
    .set({ userId: user.id })
    .where(eq(dreams.ipHash, ipHash));

  // Mint session
  const sessionId = nanoid(32);
  await db(c.env).insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_S * 1000),
  });
  writeSession(c, sessionId);

  return c.redirect(`${c.env.PUBLIC_APP_URL}/`);
});

authRoutes.post("/logout", async (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ user: null });
  const u = await db(c.env)
    .select({ id: users.id, email: users.email, plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  return c.json({ user: u ?? null });
});
