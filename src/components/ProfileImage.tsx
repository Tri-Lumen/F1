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

interface CarImageProps {
  src: string;
  alt: string;
  className?: string;
}

/** Team car cutout with graceful hide-on-error behaviour. */
export function CarImage({ src, alt, className }: CarImageProps) {
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
