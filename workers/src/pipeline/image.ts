import {
  PhotonImage,
  resize,
  watermark,
  SamplingFilter,
} from "@cf-wasm/photon";
import type { Scene } from "./compose";

const CANVAS = 2048;
const PANEL = 992;
const GUTTER = 24;
const POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [GUTTER, GUTTER],
  [GUTTER + PANEL + GUTTER * 2, GUTTER],
  [GUTTER, GUTTER + PANEL + GUTTER * 2],
  [GUTTER + PANEL + GUTTER * 2, GUTTER + PANEL + GUTTER * 2],
];

/**
 * Compose 4 panel PNGs into a 2048×2048 final PNG.
 *
 * Layout: 2×2 grid on cream paper background, 24px gutters, watermark
 * baked into bottom-right. Uses @cf-wasm/photon for resize + composite.
 *
 * Returns PNG bytes (Uint8Array).
 */
export async function composeImage(
  panels: Uint8Array[],
  _scene: Scene,
  _comicId: string,
): Promise<Uint8Array> {
  if (panels.length !== 4) throw new Error("composeImage_requires_4_panels");

  // Base canvas: cream 2048×2048. We start from a 1×1 cream PNG and upscale.
  // Lanczos3 on a solid color is identical to nearest-neighbor — produces a
  // perfectly flat cream surface at the target size.
  const baseTiny = PhotonImage.new_from_byteslice(CREAM_1x1_PNG);
  const base = resize(baseTiny, CANVAS, CANVAS, SamplingFilter.Nearest);
  baseTiny.free();

  // Composite each panel.
  for (let i = 0; i < 4; i++) {
    const src = PhotonImage.new_from_byteslice(panels[i]!);
    const fitted = resize(src, PANEL, PANEL, SamplingFilter.Lanczos3);
    src.free();
    const [x, y] = POSITIONS[i]!;
    watermark(base, fitted, BigInt(x), BigInt(y));
    fitted.free();
  }

  // Watermark — pre-baked "dreamtoon.app" mark.
  const wm = PhotonImage.new_from_byteslice(WATERMARK_PNG);
  const wmW = wm.get_width();
  const wmH = wm.get_height();
  const wmX = CANVAS - wmW - 28;
  const wmY = CANVAS - wmH - 28;
  watermark(base, wm, BigInt(wmX), BigInt(wmY));
  wm.free();

  const out = base.get_bytes();
  base.free();
  return out;
}

// 1×1 cream pixel PNG (#fbf7ee). Generated once; embedded so we don't ship
// extra wasm calls just to make a flat background. ~70 bytes.
// prettier-ignore
const CREAM_1x1_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
  0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xfa, 0xff, 0xff, 0x3f,
  0x00, 0x05, 0xfe, 0x02, 0xfe, 0xd0, 0x6e, 0xed, 0x95, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

// "dreamtoon.app" watermark PNG, 280×60 ink-on-cream. Pre-baked.
// Bytes are imported at deploy time from /workers/assets/watermark.png if
// present; otherwise we fall back to a tiny placeholder. To regenerate:
//   pnpm tsx scripts/gen-watermark.ts > workers/assets/watermark.b64
// For now: 16×16 ink dot as a visual placeholder. Replace before launch.
// prettier-ignore
const WATERMARK_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68, 0x36, 0x00, 0x00, 0x00,
  0x14, 0x49, 0x44, 0x41, 0x54, 0x28, 0x91, 0x63, 0x6c, 0x68, 0x68, 0xf8,
  0xcf, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0x60, 0x06, 0x00, 0x00,
  0xc1, 0x00, 0x33, 0xe2, 0xe2, 0xb5, 0x47, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);
