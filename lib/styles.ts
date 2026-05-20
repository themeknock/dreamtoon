export type DreamStyle =
  | "watercolor"
  | "line-art"
  | "oil"
  | "pixel"
  | "realistic";

export const STYLES: { id: DreamStyle; label: string; hint: string }[] = [
  { id: "watercolor", label: "Comic", hint: "soft watercolor — the default" },
  { id: "realistic", label: "Realistic", hint: "cinematic, photographic" },
  { id: "line-art", label: "Ink", hint: "clean black linework" },
  { id: "oil", label: "Oil", hint: "thick painterly strokes" },
  { id: "pixel", label: "Pixel", hint: "16-bit pixel art" },
];

export const DEFAULT_STYLE: DreamStyle = "watercolor";
