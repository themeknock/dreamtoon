"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchGallery, workerUrl, type GalleryItem } from "@/lib/api";

export default function GalleryPage() {
  const [sort, setSort] = useState<"top" | "new">("top");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchGallery({ sort })
      .then((r) => {
        if (alive) setItems(r.items);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [sort]);

  return (
    <main
      id="main"
      className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--container-page)] flex-col px-6 md:px-10"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 text-sm no-underline">
          <span className="text-mute">themeknock</span>
          <span className="text-rule">/</span>
          <span className="mono font-bold text-ink">DreamToon</span>
        </Link>
        <Link
          href="/"
          className="mono text-[11px] uppercase tracking-[0.14em] text-mute no-underline hover:text-ink"
        >
          ← record a dream
        </Link>
      </header>

      <section className="py-10">
        <div className="mb-8 text-center">
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Public gallery
          </span>
          <h1
            className="font-display mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.02em] text-ink"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
          >
            A scroll of{" "}
            <em
              className="font-display"
              style={{
                fontStyle: "italic",
                fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 30",
              }}
            >
              dreams
            </em>
            , drawn
          </h1>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {(["top", "new"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={
                sort === s
                  ? "mono inline-flex h-8 items-center rounded-full bg-[color:var(--soft)] px-3 text-[11px] uppercase tracking-[0.12em] text-ink"
                  : "mono inline-flex h-8 items-center rounded-full px-3 text-[11px] uppercase tracking-[0.12em] text-mute hover:text-ink"
              }
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-display text-center italic text-mute">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mx-auto max-w-[40ch] text-center text-mute">
            Empty for now — be the first to share a dream.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`/c?id=${c.id}`}
                className="group block aspect-square overflow-hidden rounded-lg border border-rule bg-paper transition-transform hover:scale-[1.01]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={workerUrl(`/api/comic/${c.id}/image`)}
                  alt="A DreamToon comic"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-rule py-6 text-center">
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-mute">
          DreamToon is an art tool · not psychology · not interpretation
        </p>
      </footer>
    </main>
  );
}
