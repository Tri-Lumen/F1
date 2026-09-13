/**
 * Shared parser for F1 lap/session time strings such as "1:23.456" (minutes
 * present) or "83.456" (seconds only). Consolidates what used to be two
 * independent implementations (QualifyingGapChart's `parseMs` and
 * QualifyingProgression's `toSeconds`).
 */

const LAP_TIME_RE = /^(?:(\d+):)?(\d+)(?:\.(\d+))?$/;

/** Parse a lap/session time string into seconds, or null if unparseable. */
export function parseLapTimeToSeconds(t?: string): number | null {
  if (!t) return null;
  const m = t.match(LAP_TIME_RE);
  if (!m) return null;
  const min = m[1] ? parseInt(m[1], 10) : 0;
  const sec = parseInt(m[2], 10);
  const frac = m[3] ? parseInt(m[3], 10) / Math.pow(10, m[3].length) : 0;
  return min * 60 + sec + frac;
}

/** Parse a lap/session time string into milliseconds, or null if unparseable. */
export function parseLapTimeToMs(t?: string): number | null {
  const secs = parseLapTimeToSeconds(t);
  return secs === null ? null : secs * 1000;
}
