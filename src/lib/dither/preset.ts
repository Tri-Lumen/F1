import type { AdjustParams } from "./engine";

/**
 * The ASCII style's image look: Riemersma, 16 colours extracted from each image.
 * Tuned in the Dither Tuner against the real driver and car renders.
 */
export const ASCII_DITHER = {
  /** Colours taken from the image by median cut. */
  colors: 16,
  /** GRIT's 39% diffusion strength, as a 0..1.5 multiplier. */
  strength: 0.39,
  adjust: { bright: -19, contrast: -53, gamma: 0.52 } satisfies AdjustParams,
  /** Size of one dither cell in CSS pixels. */
  cellPx: 2,
  /** Tone the transparent background is flattened onto before dithering. */
  flatten: "#2a2a2a",
} as const;
