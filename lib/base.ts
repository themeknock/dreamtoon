export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Build an in-app path honoring the GitHub Pages basePath. */
export function appPath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${clean}`;
}

/** Absolute public URL for sharing (origin + basePath + path). */
export function shareUrl(path: string): string {
  if (typeof window === "undefined") return appPath(path);
  return `${window.location.origin}${appPath(path)}`;
}
