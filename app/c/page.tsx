"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchComic, type ComicMeta } from "@/lib/api";
import { ComicReveal } from "@/components/comic-reveal";
import { ShareRow } from "@/components/share-row";

function ComicView() {
  const params = useSearchParams();
  const id = params.get("id");
  const [comic, setComic] = useState<ComicMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);

    // A comic opened right after generation can race D1's read-after-write.
    // Retry a few times with backoff before giving up.
    const run = async () => {
      const delays = [0, 700, 1200, 2000];
      for (let i = 0; i < delays.length; i++) {
        if (!alive) return;
        if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
        const c = await fetchComic(id).catch(() => null);
        if (!alive) return;
        if (c) {
          setComic(c);
          setLoading(false);
          return;
        }
      }
      if (alive) setLoading(false);
    };
    void run();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="font-display animate-pulse text-lg italic text-mute">
          Unrolling the dream…
        </p>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="font-display text-xl italic text-ink-2">
          This dream drifted off.
        </p>
        <Link
          href="/"
          className="mono text-[12px] uppercase tracking-[0.14em] text-link"
        >
          Make your own →
        </Link>
      </div>
    );
  }

  return (
    <section className="flex flex-1 flex-col items-center gap-8 py-4 md:gap-10 md:py-8">
      <div className="text-center">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-mute">
          A dream, drawn
        </span>
        <p className="font-display mt-3 max-w-[58ch] text-[clamp(1.05rem,1.7vw,1.3rem)] italic leading-snug text-ink-2">
          &ldquo;{comic.transcript}&rdquo;
        </p>
      </div>

      <div className="w-full max-w-[720px]">
        <ComicReveal comicId={comic.id} />
      </div>

      <ShareRow comicId={comic.id} />

      <p className="mono max-w-[42ch] text-center text-[10px] uppercase tracking-[0.18em] text-mute">
        DreamToon is an art tool · not interpretation
      </p>
    </section>
  );
}

export default function ComicPage() {
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
          ← back home
        </Link>
      </header>

      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20">
            <p className="font-display animate-pulse text-lg italic text-mute">
              Unrolling the dream…
            </p>
          </div>
        }
      >
        <ComicView />
      </Suspense>

      <footer className="border-t border-rule py-6 text-center">
        <Link
          href="/"
          className="mono text-[10px] uppercase tracking-[0.18em] text-mute no-underline hover:text-ink"
        >
          dreamtoon.app
        </Link>
      </footer>
    </main>
  );
}
