"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchGallery, workerUrl, type GalleryItem } from "@/lib/api";

export function SampleComics() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetchGallery({ sort: "top" })
      .then((r) => {
        if (alive) setItems(r.items.slice(0, 4));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--container-page)] px-6 pb-20 md:px-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Recent comics from the wild
          </span>
          <h2
            className="font-display mt-1 text-2xl font-semibold tracking-[-0.02em] text-ink"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
          >
            What people dreamed lately
          </h2>
        </div>
        <Link
          href="/gallery"
          className="mono text-[11px] uppercase tracking-[0.14em] text-link no-underline hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/c?id=${c.id}`}
            className="group relative block aspect-square overflow-hidden rounded-lg border border-rule bg-paper transition-transform hover:scale-[1.01]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={workerUrl(`/api/comic/${c.id}/image`)}
              alt="A user-generated DreamToon comic"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
