"use client";

import { useEffect, useRef, useState } from "react";
import { workerUrl } from "@/lib/api";
import { vibrateSuccessTick } from "@/lib/permission";

/**
 * Polaroid-develop reveal — reading-order stagger (TL→TR→BL→BR),
 * 220ms apart, each panel: opacity 0→1, scale 0.94→1, blur(8px)→blur(0),
 * 700ms each with cubic-bezier(0.16, 1, 0.3, 1) (longer-tail expo-out,
 * the "settling into existence" curve).
 *
 * 600ms held-breath pause before the first panel appears — this is what
 * separates "reveal" from "page load". Single haptic + soft tonal cue
 * on the FINAL panel (4) only, never on each.
 *
 * Stitch-line sweeps under the comic at t+1400ms — the gold-leaf finish.
 */
export function ComicReveal({ comicId }: { comicId: string }) {
  const [revealedAt, setRevealedAt] = useState<number[]>([]);
  const [stitched, setStitched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRevealedAt([]);
    setStitched(false);

    // 600ms held breath, then reading-order stagger
    const HELD_BREATH = 600;
    const STAGGER = 220;

    const timers: number[] = [];
    for (let i = 0; i < 4; i++) {
      timers.push(
        window.setTimeout(() => {
          setRevealedAt((prev) => [...prev, i]);
          if (i === 3) {
            vibrateSuccessTick();
          }
        }, HELD_BREATH + i * STAGGER),
      );
    }
    // Stitch line — drawn underneath after all 4 land
    timers.push(
      window.setTimeout(() => setStitched(true), HELD_BREATH + 3 * STAGGER + 700),
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [comicId]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl bg-paper p-3 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.32)] md:p-4"
    >
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {[1, 2, 3, 4].map((n) => {
          const idx = n - 1;
          const revealed = revealedAt.includes(idx);
          return (
            <div
              key={n}
              className="relative aspect-square overflow-hidden rounded-md bg-soft"
            >
              {/* Placeholder shimmer until this panel's stagger window fires */}
              {!revealed && (
                <div className="absolute inset-0 panel-cook" aria-hidden="true" />
              )}
              {revealed && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={workerUrl(`/api/comic/${comicId}/panel/${n}`)}
                    alt={`Panel ${n}`}
                    className="panel-develop h-full w-full object-cover"
                    loading={n === 1 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <span className="mono absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink/85 text-[11px] font-bold text-paper backdrop-blur-sm">
                    {n}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Gold-leaf stitch line — draws across after the final panel lands */}
      <div className="relative mt-3 h-px overflow-hidden" aria-hidden="true">
        {stitched && (
          <div className="dream-gradient-bg absolute inset-0 stitch-line" />
        )}
      </div>
    </div>
  );
}
