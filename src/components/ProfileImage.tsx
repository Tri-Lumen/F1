"use client";

import { useState } from "react";

interface DriverImageProps {
  src: string;
  alt: string;
  /** Tailwind classes applied to the <img> element */
  className?: string;
}

/** Driver headshot with graceful hide-on-error behaviour. */
export function DriverImage({ src, alt, className }: DriverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

interface DriverNumberProps {
  src: string;
  number: string;
  /** Tailwind classes applied to the wrapper */
  className?: string;
  /** Color to use for the fallback text number */
  color?: string;
}

/**
 * Official F1 stylized driver number logo with a bold-italic text fallback.
 * Falls back to a styled <span> if the CDN image fails to load.
 */
export function DriverNumber({ src, number, className, color }: DriverNumberProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`font-black italic leading-none select-none ${className ?? ""}`}
        style={{ color: color ?? "currentColor", fontStyle: "italic" }}
      >
        {number}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`#${number}`}
      className={className}
      onError={() => setFailed(true)}
      style={{ objectFit: "contain" }}
    />
  );
}

interface CarImageProps {
  src: string;
  /** Optional fallback URLs to try if the primary src fails to load */
  fallbackUrls?: string[];
  alt: string;
  className?: string;
}

/** Team car cutout with automatic fallback to alternative URLs. */
export function CarImage({ src, fallbackUrls, alt, className }: CarImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (fallbackUrls && fallbackIndex < fallbackUrls.length) {
          setCurrentSrc(fallbackUrls[fallbackIndex]);
          setFallbackIndex((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
