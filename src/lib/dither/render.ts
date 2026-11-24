import { adjust, extractPalette, riemersma } from "./engine";
import { ASCII_DITHER } from "./preset";

const cache = new Map<string, HTMLCanvasElement>();

/**
 * Dither `img` into `canvas` on a `cols` x `rows` grid using the ASCII image look.
 * Throws if the image is cross-origin without CORS headers (the canvas is tainted),
 * so callers can fall back to the plain image.
 */
export function ditherToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  cols: number,
  rows: number,
  cacheKey?: string,
): void {
  const key = cacheKey ? `${cacheKey}|${cols}x${rows}` : "";
  const hit = key ? cache.get(key) : undefined;
  if (hit) {
    canvas.width = hit.width;
    canvas.height = hit.height;
    canvas.getContext("2d")?.drawImage(hit, 0, 0);
    return;
  }

  const work = document.createElement("canvas");
  work.width = cols;
  work.height = rows;
  const ctx = work.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Alpha mask first: which cells belong to the cutout.
  ctx.drawImage(img, 0, 0, cols, rows);
  const alpha = ctx.getImageData(0, 0, cols, rows).data;
  const mask = new Uint8Array(cols * rows);
  for (let i = 0; i < mask.length; i++) mask[i] = alpha[i * 4 + 3] >= 115 ? 1 : 0;

  // Then flatten onto a neutral tone so transparent edges do not dither to black.
  ctx.clearRect(0, 0, cols, rows);
  ctx.fillStyle = ASCII_DITHER.flatten;
  ctx.fillRect(0, 0, cols, rows);
  ctx.drawImage(img, 0, 0, cols, rows);
  const frame = ctx.getImageData(0, 0, cols, rows);

  const palette = extractPalette(alpha, ASCII_DITHER.colors);
  adjust(frame.data, ASCII_DITHER.adjust);
  riemersma(frame.data, cols, rows, palette, ASCII_DITHER.strength);
  for (let i = 0; i < mask.length; i++) frame.data[i * 4 + 3] = mask[i] ? 255 : 0;
  ctx.putImageData(frame, 0, 0);

  canvas.width = cols;
  canvas.height = rows;
  canvas.getContext("2d")?.drawImage(work, 0, 0);

  if (key) {
    if (cache.size >= 60) {
      const first = cache.keys().next().value;
      if (first !== undefined) cache.delete(first);
    }
    cache.set(key, work);
  }
}
