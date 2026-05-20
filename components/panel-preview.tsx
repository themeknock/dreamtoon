"use client";

import { cn } from "@/lib/utils";

type Props = {
  panelsReady: number;
};

/**
 * Low-opacity 2x2 preview that fills in as Flux returns panels. Honest
 * progress — the user can see 1/4 → 4/4 lit up. No fake percentages.
 * Cells in flight shimmer with the panel-cook utility.
 */
export function PanelPreview({ panelsReady }: Props) {
  return (
    <div
      className="mx-auto grid w-full max-w-[280px] grid-cols-2 gap-1.5 opacity-90"
      aria-hidden="true"
    >
      {[0, 1, 2, 3].map((i) => {
        const done = panelsReady > i;
        return (
          <div
            key={i}
            className={cn(
              "relative aspect-square overflow-hidden rounded-md transition-all duration-500",
              done
                ? "bg-[color:var(--accent)] opacity-90"
                : "panel-cook",
            )}
          >
            {done && (
              <div
                className="absolute inset-0 [background-image:var(--dream-gradient)]"
                style={{ opacity: 0.85 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
