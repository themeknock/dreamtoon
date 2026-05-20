"use client";

import { useEffect, useState } from "react";
import { lineFor, type Stage } from "@/lib/status-copy";
import { cn } from "@/lib/utils";

type Props = {
  stage: Stage;
  panelsReady: number;
  className?: string;
};

/**
 * One rotating poetic status line. Swaps every ~3.5s within the same stage.
 * Replaces the mechanical "Listening / Imagining / Drawing 0/4" pills with
 * the Ghibli-subtitle voice that suits the cream + gold dream aesthetic.
 */
export function StatusStream({ stage, panelsReady, className }: Props) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    setBeat(0);
    const id = window.setInterval(() => {
      setBeat((b) => b + 1);
    }, 3500);
    return () => window.clearInterval(id);
  }, [stage]);

  // For the "drawing" stage we follow Flux progress instead of the timer
  const effectiveBeat = stage === "drawing" ? Math.min(panelsReady, 3) : beat;
  const line = lineFor(stage, effectiveBeat);

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <p
        key={`${stage}-${effectiveBeat}`}
        className="font-display max-w-[36ch] animate-[panel-develop_700ms_var(--ease-dream)_forwards] text-center text-[1.1rem] italic leading-relaxed text-ink-2"
      >
        {line}
      </p>
    </div>
  );
}
