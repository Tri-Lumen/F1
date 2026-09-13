"use client";

import { memo, useEffect, useState } from "react";
import { calcTimeLeft, type TimeLeft } from "@/lib/countdown";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

function StudioCountdownTiles({ target }: { target: string }) {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const targetDate = new Date(target);
    if (!Number.isFinite(targetDate.getTime())) {
      setTime({ total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    let timeoutId: ReturnType<typeof setTimeout>;
    function tick() {
      const t = calcTimeLeft(targetDate);
      setTime(t);
      const interval = t.total > 3_600_000 ? 60_000 : 1_000;
      timeoutId = setTimeout(tick, interval);
    }
    tick();
    return () => clearTimeout(timeoutId);
  }, [target]);

  if (!time) return null;

  // Above 1h remaining, tick() only fires every 60s — a "Sec" tile would sit
  // visibly frozen for up to a minute at a time, so drop it in that mode.
  const showSeconds = time.total <= 3_600_000;
  const segments = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hrs" },
    { value: time.minutes, label: "Min" },
    ...(showSeconds ? [{ value: time.seconds, label: "Sec" }] : []),
  ];

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {segments.map(({ value, label }) => (
        <div
          key={label}
          style={{
            flex: 1,
            textAlign: "center",
            background: "var(--color-f1-black)",
            borderRadius: 7,
            padding: "8px 4px",
          }}
        >
          <div
            style={{
              fontFamily: BC,
              fontWeight: 900,
              fontSize: 26,
              lineHeight: 1,
              color: "var(--color-f1-accent)",
            }}
          >
            {String(value).padStart(2, "0")}
          </div>
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.1em",
              color: "var(--color-f1-text-muted)",
              textTransform: "uppercase",
              marginTop: 2,
              fontFamily: DM,
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(StudioCountdownTiles);
