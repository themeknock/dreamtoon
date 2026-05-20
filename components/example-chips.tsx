"use client";

const CHIPS = [
  "a dragon who runs a bakery",
  "I was flying over a city made of bread",
  "two raccoons rob a bank",
  "my Monday morning, but underwater",
];

/**
 * Tappable prompt-stubs that solve the "I'm in public, I won't talk to my
 * phone" / blank-page problem. Tapping does NOT pre-fill audio — it sets a
 * suggested phrase the user can read aloud. Pattern from Suno + v0.dev.
 */
export function ExampleChips({
  onPick,
}: {
  onPick?: (suggestion: string) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label="Example dream suggestions"
    >
      <span className="mono mr-1 text-[10px] uppercase tracking-[0.16em] text-mute">
        Try
      </span>
      {CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onPick?.(chip)}
          className="group inline-flex items-center rounded-full border border-rule bg-paper/70 px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-stamp hover:bg-soft hover:text-ink"
        >
          <span className="font-display italic">&ldquo;{chip}&rdquo;</span>
        </button>
      ))}
    </div>
  );
}
