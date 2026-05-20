export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ?? "http://localhost:8787";

export function workerUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${WORKER_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type ComicMeta = {
  id: string;
  style: "watercolor" | "line-art" | "oil" | "pixel";
  shareCount: number;
  viewCount: number;
  gallery: boolean;
  createdAt: number | string;
  transcript: string;
  imageUrl: string;
};

export async function fetchComic(id: string): Promise<ComicMeta | null> {
  try {
    const res = await fetch(workerUrl(`/api/comic/${id}`), {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ComicMeta;
  } catch {
    return null;
  }
}

export type GalleryItem = {
  id: string;
  style: string;
  createdAt: number | string;
  transcript?: string;
};

export async function fetchGallery(params: {
  sort?: "top" | "new";
  cursor?: string;
  style?: string;
}): Promise<{ items: GalleryItem[]; nextCursor: number | null }> {
  const sp = new URLSearchParams();
  if (params.sort) sp.set("sort", params.sort);
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.style) sp.set("style", params.style);
  try {
    const res = await fetch(workerUrl(`/api/gallery?${sp.toString()}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { items: [], nextCursor: null };
    return (await res.json()) as {
      items: GalleryItem[];
      nextCursor: number | null;
    };
  } catch {
    return { items: [], nextCursor: null };
  }
}
