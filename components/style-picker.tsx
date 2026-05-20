"use client";

import { STYLES, type DreamStyle } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Props = {
  value: DreamStyle;
  onChange: (s: DreamStyle) => void;
  disabled?: boolean;
};

/**
 * Compact style picker — chips, single select. Kept quiet so it doesn't
 * dominate the 30-second loop. Default is "Comic" (watercolor).
 */
export function StylePicker({ value, onChange, disabled }: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2"
      role="radiogroup"
      aria-label="Comic style"
    >
      {STYLES.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            title={s.hint}
            onClick={() => onChange(s.id)}
            className={cn(
              "mono inline-flex h-8 items-center rounded-full border px-3 text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-50",
              active
                ? "border-transparent text-paper [background-image:var(--dream-gradient)]"
                : "border-rule bg-paper/70 text-mute hover:border-stamp hover:text-ink",
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
