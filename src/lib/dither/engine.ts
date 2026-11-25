/**
 * Riemersma dithering engine, ported from Tri-Lumen/GRIT.
 *
 * Pure functions over RGBA byte arrays: no DOM, no canvas, so they run in the
 * browser and under Vitest. The arithmetic matches GRIT's `nearest`, `d2xy`,
 * `riemersmaDither`, `adjust` and median-cut `extractPalette`; the golden test in
 * `engine.test.ts` pins the output byte-for-byte against GRIT's own source.
 *
 * One deliberate difference: GRIT walks the Hilbert curve inside the dither loop,
 * we compute the in-bounds visiting order once per grid size and cache it. The
 * visiting order, and so the output, is identical.
 */

export type RGB = [number, number, number];

export interface AdjustParams {
  /** -100..100, same units as GRIT's slider */
  bright: number;
  /** -100..100 */
  contrast: number;
  /** 0.2..3; values below 1 lift the shadows */
  gamma: number;
}

/** Weighted RGB distance, GRIT's "fast" mode. */
export function nearest(pal: RGB[], r: number, g: number, b: number): RGB {
  let bi = 0;
  let bd = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const p = pal[i];
    const dr = r - p[0];
    const dg = g - p[1];
    const db = b - p[2];
    const d = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return pal[bi];
}

/** Distance along a Hilbert curve of side `n` (a power of two) to (x, y). */
export function d2xy(n: number, d: number): [number, number] {
  let rx: number;
  let ry: number;
  let t = d;
  let x = 0;
  let y = 0;
  for (let s = 1; s < n; s *= 2) {
    rx = 1 & (t >> 1);
    ry = 1 & (t ^ rx);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const tmp = x;
      x = y;
      y = tmp;
    }
    x += s * rx;
    y += s * ry;
    t >>= 2;
  }
  return [x, y];
}

const hilbertCache = new Map<string, Int32Array>();

/** Pixel indices (y*w+x) of a w*h grid, in Hilbert-curve order. */
export function hilbertOrder(w: number, h: number): Int32Array {
  const key = `${w}x${h}`;
  const hit = hilbertCache.get(key);
  if (hit) return hit;
  let n = 1;
  while (n < Math.max(w, h)) n <<= 1;
  const out = new Int32Array(w * h);
  let k = 0;
  for (let s = 0; s < n * n; s++) {
    const [x, y] = d2xy(n, s);
    if (x >= w || y >= h) continue;
    out[k++] = y * w + x;
  }
  if (hilbertCache.size >= 24) {
    const first = hilbertCache.keys().next().value;
    if (first !== undefined) hilbertCache.delete(first);
  }
  hilbertCache.set(key, out);
  return out;
}

/** Tone adjustment in place: gamma, then contrast, then brightness. Colour is kept. */
export function adjust(data: Uint8ClampedArray, p: AdjustParams): void {
  const bri = p.bright * 2.55;
  const con = p.contrast / 100;
  const k = con >= 0 ? 1 / (1 - Math.min(con, 0.99)) : 1 + con;
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.max(0, Math.min(255, Math.round(255 * Math.pow(i / 255, 1 / p.gamma))));
  }
  for (let i = 0; i < data.length; i += 4) {
    let r = lut[data[i]];
    let g = lut[data[i + 1]];
    let b = lut[data[i + 2]];
    r = (r - 128) * k + 128 + bri;
    g = (g - 128) * k + 128 + bri;
    b = (b - 128) * k + 128 + bri;
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}

/**
 * Riemersma dither in place. Error is carried along the Hilbert curve through a
 * 16-slot queue weighted 16:1 from oldest to newest, so there is no scan direction.
 * `strength` is 0..1.5 (GRIT's 0..150 slider / 100).
 */
export function riemersma(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  pal: RGB[],
  strength: number,
): void {
  const L = 16;
  const RATIO = 16;
  const wt = new Float32Array(L);
  let tot = 0;
  for (let i = 0; i < L; i++) {
    wt[i] = Math.pow(RATIO, i / (L - 1));
    tot += wt[i];
  }
  for (let i = 0; i < L; i++) wt[i] /= tot;
  const order = hilbertOrder(w, h);
  const qr = new Float32Array(L);
  const qg = new Float32Array(L);
  const qb = new Float32Array(L);
  let qi = 0;
  for (let s = 0; s < order.length; s++) {
    let er = 0;
    let eg = 0;
    let eb = 0;
    for (let k = 0; k < L; k++) {
      const j = (qi + k) % L;
      er += qr[j] * wt[k];
      eg += qg[j] * wt[k];
      eb += qb[j] * wt[k];
    }
    const i = order[s] * 4;
    const sr = data[i] + er;
    const sg = data[i + 1] + eg;
    const sb = data[i + 2] + eb;
    const c = nearest(pal, sr, sg, sb);
    data[i] = c[0];
    data[i + 1] = c[1];
    data[i + 2] = c[2];
    qr[qi] = (sr - c[0]) * strength;
    qg[qi] = (sg - c[1]) * strength;
    qb[qi] = (sb - c[2]) * strength;
    qi = (qi + 1) % L;
  }
}

/**
 * GRIT's median-cut palette extraction. Takes RGBA bytes and skips pixels that are
 * mostly transparent, so a transparent cutout does not add a black swatch.
 */
export function extractPalette(rgba: Uint8ClampedArray, n: number): RGB[] {
  const px: RGB[] = [];
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] >= 128) px.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
  }
  if (px.length === 0) return [[0, 0, 0]];
  let boxes: RGB[][] = [px];
  while (boxes.length < n) {
    boxes.sort((x, y) => y.length - x.length);
    const b = boxes.shift();
    if (!b || b.length < 2) {
      if (b) boxes.push(b);
      break;
    }
    let ch = 0;
    let best = -1;
    for (let c = 0; c < 3; c++) {
      let mn = 255;
      let mx = 0;
      for (const p of b) {
        if (p[c] < mn) mn = p[c];
        if (p[c] > mx) mx = p[c];
      }
      if (mx - mn > best) {
        best = mx - mn;
        ch = c;
      }
    }
    b.sort((p, q) => p[ch] - q[ch]);
    const mid = b.length >> 1;
    boxes = boxes.concat([b.slice(0, mid), b.slice(mid)]);
  }
  return boxes
    .filter((b) => b.length)
    .map((b) => {
      const t = [0, 0, 0];
      for (const p of b) {
        t[0] += p[0];
        t[1] += p[1];
        t[2] += p[2];
      }
      return t.map((x) => Math.round(x / b.length)) as RGB;
    });
}
