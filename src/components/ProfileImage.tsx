"use client";

import { useState, useEffect } from "react";

interface DriverImageProps {
  src: string;
  alt: string;
  /** Tailwind classes applied to the <img> element */
  className?: string;
}

/** Driver headshot with a silhouette placeholder on load failure. */
export function DriverImage({ src, alt, className }: DriverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Extract initials from alt text (e.g. "Max Verstappen" → "MV")
    const initials = alt
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        className={`relative flex items-end justify-center bg-gradient-to-b from-f1-border/30 to-f1-border/60 rounded-lg ${className ?? ""}`}
        aria-label={alt}
      >
        <svg
          viewBox="0 0 64 80"
          className="w-3/5 h-3/5 opacity-20"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="32" cy="22" r="14" />
          <path d="M8 80 C8 56 56 56 56 80Z" />
        </svg>
        <span className="absolute text-xs font-bold text-f1-text-muted/50 mb-1">
          {initials}
        </span>
      </div>
    );
  }

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

/** Team car cutout with automatic fallback to alternative URLs, then a placeholder. */
export function CarImage({ src, fallbackUrls, alt, className }: CarImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  // Reset state when src prop changes (e.g. switching between drivers)
  useEffect(() => {
    setCurrentSrc(src);
    setFallbackIndex(0);
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-r from-f1-border/20 to-f1-border/40 rounded-lg ${className ?? ""}`}
        aria-label={alt}
      >
        <svg
          viewBox="0 0 120 40"
          className="w-4/5 h-auto opacity-15"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="10" y="18" width="100" height="12" rx="4" />
          <circle cx="30" cy="34" r="6" />
          <circle cx="90" cy="34" r="6" />
          <path d="M25 18 L40 8 L80 8 L95 18Z" />
        </svg>
      </div>
    );
  }

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
