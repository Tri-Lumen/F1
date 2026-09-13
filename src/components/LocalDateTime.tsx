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

/**
 * HH:MM:SS 24-hour clock in the viewer's local timezone, used for live/racing
 * feeds (e.g. race control messages) that want a compact timestamp-only
 * display without a date.
 */
export function LocalClockTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(
      new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, [iso]);

  return <>{text}</>;
}

/**
 * Weekday + 24-hour clock time (e.g. "Sat · 15:00"), matching the compact
 * schedule-row format used by the "Studio" home-page widgets.
 */
export function LocalWeekdayTime24({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date(iso);
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setText(`${day} · ${time}`);
  }, [iso]);

  return <>{text}</>;
}
