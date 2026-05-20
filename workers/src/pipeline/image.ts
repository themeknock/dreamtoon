import {
  PhotonImage,
  resize,
  watermark,
  SamplingFilter,
} from "@cf-wasm/photon";
import type { Scene } from "./compose";

const CELL = 1024;
const CANVAS = CELL * 2;
const POS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [CELL, 0],
  [0, CELL],
  [CELL, CELL],
];

/**
 * Compose 4 panel images (JPEG from Flux) into a 2048×2048 2×2 grid PNG.
 *
 * Robust path: no hand-crafted canvas/watermark PNGs (those panic photon
 * with "unreachable"). We resize panel 0 to the full canvas as a base — it's
 * fully covered by the 4 cells — then composite each 1024² cell on top.
 *
 * TODO(polish): cream gutters + baked "dreamtoon.app" watermark. Needs a
 * valid pre-encoded PNG asset or an SVG→PNG step (@resvg/resvg-wasm).
 */
export async function composeImage(
  panels: Uint8Array[],
  _scene: Scene,
  _comicId: string,
): Promise<Uint8Array> {
  if (panels.length !== 4) throw new Error("composeImage_requires_4_panels");

  const first = PhotonImage.new_from_byteslice(panels[0]!);
  const base = resize(first, CANVAS, CANVAS, SamplingFilter.Nearest);
  first.free();

  for (let i = 0; i < 4; i++) {
    const src = PhotonImage.new_from_byteslice(panels[i]!);
    const cell = resize(src, CELL, CELL, SamplingFilter.Lanczos3);
    src.free();
    const [x, y] = POS[i]!;
    watermark(base, cell, BigInt(x), BigInt(y));
    cell.free();
  }

  const out = base.get_bytes();
  base.free();
  return out;
}
