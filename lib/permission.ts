/**
 * iOS Safari mic permission helpers.
 * - WKWebView detection (Instagram, TikTok, Line in-apps) — hostile to getUserMedia
 * - Permissions API pre-check (don't cold-call getUserMedia if denied)
 */

export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

const WKWEBVIEW_RE = /(FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|TikTok)/i;

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return WKWEBVIEW_RE.test(navigator.userAgent);
}

export async function checkMicPermission(): Promise<PermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return "unknown";
  }
  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state as PermissionState;
  } catch {
    return "unknown";
  }
}

export function vibrateLightTick(): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(8);
    } catch {
      /* noop */
    }
  }
}

export function vibrateSuccessTick(): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([12, 40, 12]);
    } catch {
      /* noop */
    }
  }
}
