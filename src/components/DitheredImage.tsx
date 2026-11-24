"use client";

import { useEffect, useRef, useState } from "react";
import { ditherToCanvas } from "@/lib/dither/render";
import { ASCII_DITHER } from "@/lib/dither/preset";

interface Props {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  /** Called when the image cannot be loaded at all (not when only dithering fails). */
  onError?: () => void;
}

/**
 * Draws `src` through the ASCII style's Riemersma dither. The grid is sized from the
 * element's rendered width so each dither cell is about 2 CSS pixels at any size.
 * If the canvas is tainted (no CORS) it falls back to the plain image, so an
 * unreachable dither never hides a portrait.
 */
export default function DitheredImage({ src, alt, className, onLoad, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The src whose dither failed; keyed by src so a new src automatically gets a fresh canvas.
  const [rawFor, setRawFor] = useState<string | null>(null);
  const raw = rawFor === src;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const box = canvas.getBoundingClientRect();
      const aspect = img.naturalWidth / img.naturalHeight;
      // Width the picture is drawn at: object-cover fills the box, so take the larger fit.
      const drawW = Math.max(box.width, box.height * aspect) || img.naturalWidth / 3;
      const cols = Math.max(16, Math.min(img.naturalWidth, Math.round(drawW / ASCII_DITHER.cellPx)));
      const rows = Math.max(8, Math.round(cols / aspect));
      try {
        ditherToCanvas(img, canvas, cols, rows, src);
        onLoad?.();
      } catch {
        setRawFor(src);
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      // A CORS-less host fails the anonymous request; try once without it for the plain image.
      const plain = new Image();
      plain.onload = () => {
        if (!cancelled) setRawFor(src);
      };
      plain.onerror = () => {
        if (!cancelled) onError?.();
      };
      plain.src = src;
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
    // onLoad/onError are intentionally excluded: callers pass fresh closures each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return raw ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onLoad={onLoad} onError={onError} />
  ) : (
    <canvas ref={canvasRef} role="img" aria-label={alt} className={`f1-dither ${className ?? ""}`} />
  );
}
