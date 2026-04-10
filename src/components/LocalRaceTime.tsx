"use client";

import { useEffect, useState } from "react";

export default function LocalRaceTime({ date, time }: { date: string; time?: string }) {
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    if (!time) { setLocalTime(null); return; }
    const ts = time.endsWith("Z") ? time : `${time}Z`;
    const d = new Date(`${date}T${ts}`);
    setLocalTime(
      d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    );
  }, [date, time]);

  if (!localTime) return null;

  return (
    <p className="mt-0.5 text-xs text-f1-text-muted">
      Local: {localTime}
    </p>
  );
}
