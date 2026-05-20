import {
  PhotonImage,
  resize,
  watermark,
  SamplingFilter,
} from "@cf-wasm/photon";
import type { Scene } from "./compose";
import {
  WATERMARK_B64,
  WATERMARK_W,
  WATERMARK_H,
} from "../assets/watermark";

const CELL = 1024;
const CANVAS = CELL * 2;
const POS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [CELL, 0],
  [0, CELL],
  [CELL, CELL],
];
const WM_PAD = 44;

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Compose 4 panel images (JPEG from Flux) into a 2048×2048 2×2 grid PNG,
 * then bake the "dreamtoon.app" watermark into the bottom-right corner.
 *
 * Base = panel 0 upscaled to full canvas (fully covered by the 4 cells), so
 * no fragile hand-crafted canvas PNG. Watermark is a real pre-encoded PNG
 * asset (photon panics on invalid bytes).
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

  // Bottom-right brand watermark.
  try {
    const wm = PhotonImage.new_from_byteslice(b64ToBytes(WATERMARK_B64));
    const wmX = CANVAS - WATERMARK_W - WM_PAD;
    const wmY = CANVAS - WATERMARK_H - WM_PAD;
    watermark(base, wm, BigInt(wmX), BigInt(wmY));
    wm.free();
  } catch (e) {
    console.warn("watermark_composite_failed", String(e));
  }

  const out = base.get_bytes();
  base.free();
  return out;
}
