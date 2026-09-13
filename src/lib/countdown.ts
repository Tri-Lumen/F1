/**
 * Shared "ms remaining until a target Date" breakdown, used by every
 * countdown-style component (CountdownTimer, StudioCountdownTiles,
 * SessionPill) so the days/hours/minutes/seconds math lives in one place.
 */
export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function calcTimeLeft(target: Date): TimeLeft {
  const total = Math.max(0, target.getTime() - Date.now());
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor(total / 3600000) % 24,
    minutes: Math.floor(total / 60000) % 60,
    seconds: Math.floor(total / 1000) % 60,
  };
}
