"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const total = Math.max(0, target.getTime() - Date.now());
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor(total / 3600000) % 24,
    minutes: Math.floor(total / 60000) % 60,
    seconds: Math.floor(total / 1000) % 60,
  };
}

interface Props {
  /** ISO date string for the countdown target */
  target: string;
  /** Show compact single-line format (e.g. "2d 5h") instead of full blocks */
  compact?: boolean;
}

export default function CountdownTimer({ target, compact = false }: Props) {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const targetDate = new Date(target);
    let timeoutId: ReturnType<typeof setTimeout>;

    function tick() {
      const t = calcTimeLeft(targetDate);
      setTime(t);
      // Use 60s intervals when more than 1 hour remains (seconds don't matter at that scale)
      const interval = t.total > 3_600_000 ? 60_000 : 1_000;
      timeoutId = setTimeout(tick, interval);
    }

    tick();
    return () => clearTimeout(timeoutId);
  }, [target]);

  // Avoid hydration mismatch — render nothing until client-side mounts
  if (!time) return null;

  if (compact) {
    const { days, hours, minutes } = time;
    if (days > 0)
      return (
        <span>
          {days}d {hours}h
        </span>
      );
    if (hours > 0)
      return (
        <span>
          {hours}h {minutes}m
        </span>
      );
    if (minutes > 0) return <span>{minutes}m</span>;
    return <span>{time.seconds}s</span>;
  }

  const segments = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hrs" },
    { value: time.minutes, label: "Min" },
    { value: time.seconds, label: "Sec" },
  ];

  return (
    <div className="flex gap-4">
      {segments.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-3xl font-black tabular-nums text-f1-accent leading-none">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-xs text-f1-text-muted uppercase tracking-wider mt-1.5">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
