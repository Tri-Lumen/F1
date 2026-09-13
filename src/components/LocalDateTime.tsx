"use client";

import { useEffect, useState } from "react";

/**
 * `toLocaleDateString`/`toLocaleTimeString` resolve against the process's
 * timezone when called during server rendering, not the viewer's — every
 * visitor worldwide would see the same (wrong) wall-clock time. Rendering
 * from a client component lets these resolve against the browser's actual
 * local timezone instead.
 */

export function LocalDate({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(
      new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  }, [iso]);

  return <>{text}</>;
}

export function LocalTime({ iso, withZone = false }: { iso: string; withZone?: boolean }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(
      new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        ...(withZone ? { timeZoneName: "short" as const } : {}),
      })
    );
  }, [iso, withZone]);

  return <>{text}</>;
}
