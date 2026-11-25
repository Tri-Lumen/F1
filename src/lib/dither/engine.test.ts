import { describe, it, expect } from "vitest";
import { adjust, riemersma, extractPalette, hilbertOrder, nearest, type RGB } from "./engine";

/**
 * Golden values were produced by running GRIT's own `adjust`, `nearest`, `d2xy` and
 * `riemersmaDither` (Tri-Lumen/GRIT, index.html) on the same synthetic image.
 */
const W = 48;
const H = 64;
const PAL: RGB[] = [
  [16, 16, 16], [42, 42, 42], [90, 60, 40], [200, 90, 10], [255, 128, 0], [240, 200, 150],
  [245, 245, 245], [20, 60, 90], [100, 196, 255], [232, 0, 32], [39, 244, 210], [184, 148, 28],
  [34, 153, 113], [255, 135, 188], [182, 186, 189], [70, 70, 70],
];

function synthetic(): Uint8ClampedArray {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = (x * 5 + y * 2) & 255;
      data[i + 1] = Math.round(128 + 100 * Math.sin(x / 5) * Math.cos(y / 7));
      data[i + 2] = (255 - (x * 3 + y * 4)) & 255;
      data[i + 3] = 255;
    }
  }
  return data;
}

function fnv(bytes: Uint8ClampedArray): number {
  let h = 2166136261;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

describe("dither engine matches GRIT", () => {
  it("adjust() produces GRIT's bytes", () => {
    const d = synthetic();
    adjust(d, { bright: -19, contrast: -53, gamma: 0.52 });
    expect(fnv(d)).toBe(3725726587);
  });

  it("riemersma() produces GRIT's bytes", () => {
    const d = synthetic();
    adjust(d, { bright: -19, contrast: -53, gamma: 0.52 });
    riemersma(d, W, H, PAL, 0.39);
    expect(fnv(d)).toBe(2137291181);
  });

  it("every output pixel lands exactly on a palette entry", () => {
    const d = synthetic();
    riemersma(d, W, H, PAL, 0.39);
    const keys = new Set(PAL.map((p) => p.join(",")));
    for (let i = 0; i < d.length; i += 4) {
      expect(keys.has(`${d[i]},${d[i + 1]},${d[i + 2]}`)).toBe(true);
    }
  });
});

describe("hilbertOrder", () => {
  it("visits every in-bounds cell exactly once", () => {
    const o = hilbertOrder(37, 23);
    expect(o.length).toBe(37 * 23);
    expect(new Set(o).size).toBe(37 * 23);
  });
});

describe("nearest", () => {
  it("returns the closest palette colour", () => {
    expect(nearest([[0, 0, 0], [255, 255, 255]], 200, 200, 200)).toEqual([255, 255, 255]);
    expect(nearest([[0, 0, 0], [255, 255, 255]], 30, 30, 30)).toEqual([0, 0, 0]);
  });
});

describe("extractPalette", () => {
  it("finds the dominant colours and ignores transparent pixels", () => {
    const px = new Uint8ClampedArray(16 * 4);
    for (let i = 0; i < 16; i++) {
      const o = i * 4;
      if (i < 6) px.set([255, 0, 0, 255], o);
      else if (i < 12) px.set([0, 0, 255, 255], o);
      else px.set([0, 255, 0, 0], o); // transparent, must not count
    }
    const pal = extractPalette(px, 2).map((c) => c.join(","));
    expect(pal.sort()).toEqual(["0,0,255", "255,0,0"]);
  });

  it("never returns more colours than asked for", () => {
    const d = synthetic();
    expect(extractPalette(d, 8).length).toBeLessThanOrEqual(8);
  });
});
