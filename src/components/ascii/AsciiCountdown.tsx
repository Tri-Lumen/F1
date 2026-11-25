"use client";

import { useSyncExternalStore } from "react";
import BigDigits from "./BigDigits";

const LABELS = ["DAYS", "HRS", "MIN", "SEC"];

/** Block-digit countdown to `target` (ISO). Renders "00" until mounted so SSR and the first paint match. */
export default function AsciiCountdown({ target }: { target: string }) {
  // Null on the server and during hydration, then the live clock once mounted.
  const now = useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, 1000);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => null,
  );

  const total = now === null ? 0 : Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  const values = [
    Math.floor(total / 86400),
    Math.floor((total % 86400) / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ].map((v) => String(v).padStart(2, "0"));

  const text = `${values[0]}:${values[1]}:${values[2]}:${values[3]}`;

  return (
    <div className="f1-a-count">
      <span className="sr-only">
        {values[0]} days, {values[1]} hours, {values[2]} minutes, {values[3]} seconds
      </span>
      {values.map((v, i) => (
        <div key={LABELS[i]} className="f1-a-count-cell">
          <BigDigits text={v} />
          <span className="f1-a-count-label">{LABELS[i]}</span>
        </div>
      ))}
      <span className="sr-only">{text}</span>
    </div>
  );
}
