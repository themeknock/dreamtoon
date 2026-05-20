export type Stage =
  | "idle"
  | "requesting"
  | "recording"
  | "uploading"
  | "listening"
  | "imagining"
  | "drawing"
  | "composing"
  | string;

/**
 * Poetic streaming status lines. One per ~3-4s, swap to the next, no loop.
 * Ghibli-subtitle tone, not Pixar-cute. Specific verbs, dream-vocabulary.
 */
export const STATUS_LINES: Record<string, string[]> = {
  uploading: ["Holding onto the words…"],
  listening: [
    "Listening to your dream…",
    "Catching the colors before they fade…",
  ],
  imagining: [
    "Finding the light in your dream…",
    "Mixing the watercolor…",
    "Setting the scene…",
  ],
  drawing: [
    "Drawing the first thing you saw…",
    "And the second…",
    "And the strange thing that happened next…",
    "Almost done — the last panel is cooking…",
  ],
  composing: [
    "Pressing it into gold leaf…",
    "Stitching the four panels together…",
  ],
};

export function lineFor(stage: Stage, beat: number): string {
  const lines = STATUS_LINES[stage] ?? ["A moment…"];
  return lines[beat % lines.length] ?? lines[0]!;
}
