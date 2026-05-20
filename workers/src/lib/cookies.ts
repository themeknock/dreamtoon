import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

export const SESSION_COOKIE = "dt_sess";
export const ANON_COOKIE = "dt_anon";

const SESSION_TTL_S = 60 * 60 * 24 * 30;
const ANON_TTL_S = 60 * 60 * 24 * 30;

export function readSession(c: Context): string | null {
  return getCookie(c, SESSION_COOKIE) ?? null;
}

export function writeSession(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export function clearSession(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export function readOrSetAnonId(c: Context, mint: () => string): string {
  const existing = getCookie(c, ANON_COOKIE);
  if (existing) return existing;
  const id = mint();
  setCookie(c, ANON_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: ANON_TTL_S,
  });
  return id;
}
