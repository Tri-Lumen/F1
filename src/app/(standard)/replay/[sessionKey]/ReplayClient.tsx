"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  LiveSession,
  LiveTimingDriver,
  LivePosition,
  LiveInterval,
  LiveStint,
  TeamRadio,
  RaceControlMessage,
  LiveLap,
  WeatherData,
} from "@/lib/types";
import { COMPOUND_COLORS, COMPOUND_FALLBACK } from "@/lib/compounds";
import TireStrategy from "@/components/TireStrategy";
import TeamRadioFeed from "@/components/TeamRadioFeed";
import RaceControlFeed from "@/components/RaceControlFeed";
import WeatherWidget from "@/components/WeatherWidget";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--color-f1-border)",
  background: "var(--color-f1-dark)",
};

interface Props {
  session: LiveSession;
  drivers: LiveTimingDriver[];
  positions: LivePosition[];
  intervals: LiveInterval[];
  stints: LiveStint[];
  radio: TeamRadio[];
  raceControl: RaceControlMessage[];
  laps: LiveLap[];
  weatherSeries: WeatherData[];
}

const SPEED_OPTIONS = [1, 2, 5, 10, 25] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

/** Linear scan finding the last entry whose date <= cutoff. */
function snapshotMap<T extends { driver_number: number; date: string }>(
  rows: T[],
  cutoffMs: number,
): Map<number, T> {
  const out = new Map<number, T>();
  for (const row of rows) {
    if (new Date(row.date).getTime() > cutoffMs) break;
    out.set(row.driver_number, row);
  }
  return out;
}

interface DerivedOrder {
  positions: Map<number, number>;
  intervals: Map<number, { gap: number | null; interval: number | null }>;
}

/**
 * Backup running order when OpenF1's position/interval feeds are missing for a
 * session. Reconstructs the grid from lap data: the car on the highest lap — and
 * within a lap, the one that crossed the line earliest — is ahead. Gaps are
 * approximated from start/finish-line crossing deltas on the lead lap; lapped
 * cars get a null gap (shown as "—"). `sortedLaps` must be ascending by
 * `date_start`.
 */
function deriveOrderFromLaps(
  sortedLaps: LiveLap[],
  cutoffMs: number,
): DerivedOrder {
  const current = new Map<number, { lap: number; startMs: number }>();
  for (const lap of sortedLaps) {
    const startMs = new Date(lap.date_start).getTime();
    if (startMs > cutoffMs) break;
    const prev = current.get(lap.driver_number);
    if (!prev || lap.lap_number > prev.lap) {
      current.set(lap.driver_number, { lap: lap.lap_number, startMs });
    }
  }

  const order = [...current.entries()].sort((a, b) => {
    if (b[1].lap !== a[1].lap) return b[1].lap - a[1].lap;
    return a[1].startMs - b[1].startMs;
  });

  const positions = new Map<number, number>();
  const intervals = new Map<number, { gap: number | null; interval: number | null }>();
  const leader = order[0]?.[1];
  let prev: { lap: number; startMs: number } | null = null;
  order.forEach(([num, entry], i) => {
    positions.set(num, i + 1);
    if (i === 0 || !leader) {
      intervals.set(num, { gap: null, interval: null });
    } else if (entry.lap === leader.lap) {
      const gap = (entry.startMs - leader.startMs) / 1000;
      const interval =
        prev && entry.lap === prev.lap ? (entry.startMs - prev.startMs) / 1000 : null;
      intervals.set(num, { gap, interval });
    } else {
      intervals.set(num, { gap: null, interval: null });
    }
    prev = entry;
  });

  return { positions, intervals };
}

export default function ReplayClient({
  session,
  drivers,
  positions,
  intervals,
  stints,
  radio,
  raceControl,
  laps,
  weatherSeries,
}: Props) {
  // Pre-sort so the snapshot scans are linear in cutoff.
  const sortedPositions = useMemo(
    () => [...positions].sort((a, b) => a.date.localeCompare(b.date)),
    [positions],
  );
  const sortedIntervals = useMemo(
    () => [...intervals].sort((a, b) => a.date.localeCompare(b.date)),
    [intervals],
  );
  const sortedRadio = useMemo(
    () => [...radio].sort((a, b) => a.date.localeCompare(b.date)),
    [radio],
  );
  const sortedRaceControl = useMemo(
    () => [...raceControl].sort((a, b) => a.date.localeCompare(b.date)),
    [raceControl],
  );
  const sortedWeather = useMemo(
    () => [...weatherSeries].sort((a, b) => a.date.localeCompare(b.date)),
    [weatherSeries],
  );
  const sortedLaps = useMemo(
    () => [...laps].sort((a, b) => a.date_start.localeCompare(b.date_start)),
    [laps],
  );

  const sessionStartMs = new Date(session.date_start).getTime();
  const sessionEndMs = new Date(session.date_end).getTime();
  const sessionDurationMs = Math.max(sessionEndMs - sessionStartMs, 1);

  const [currentMs, setCurrentMs] = useState<number>(sessionStartMs);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<Speed>(5);

  // Playback loop — driven by requestAnimationFrame so it scales with the
  // user's refresh rate without queueing setTimeout backlog.
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    lastTickRef.current = performance.now();
    function tick(now: number) {
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      setCurrentMs((prev) => {
        const next = prev + elapsed * speed;
        if (next >= sessionEndMs) {
          setPlaying(false);
          return sessionEndMs;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, sessionEndMs]);

  // When OpenF1 ships position/interval rows we use them; otherwise fall back
  // to a lap-derived order so the grid still populates.
  const hasRealPositions = sortedPositions.length > 0;
  const hasRealIntervals = sortedIntervals.length > 0;

  // Derived snapshot at currentMs — recomputed on every scrub or tick.
  const snapshot = useMemo(() => {
    const latestPos = snapshotMap(sortedPositions, currentMs);
    const latestIv = snapshotMap(sortedIntervals, currentMs);
    const derived =
      !hasRealPositions || !hasRealIntervals
        ? deriveOrderFromLaps(sortedLaps, currentMs)
        : null;

    const visibleRadio: TeamRadio[] = [];
    for (const r of sortedRadio) {
      if (new Date(r.date).getTime() > currentMs) break;
      visibleRadio.push(r);
    }

    const visibleRaceControl: RaceControlMessage[] = [];
    for (const r of sortedRaceControl) {
      if (new Date(r.date).getTime() > currentMs) break;
      visibleRaceControl.push(r);
    }

    let currentWeather: WeatherData | null = null;
    for (const w of sortedWeather) {
      if (new Date(w.date).getTime() > currentMs) break;
      currentWeather = w;
    }

    // Stints up to the lap derived from currentMs.
    let lapCount = 0;
    for (const l of sortedLaps) {
      if (new Date(l.date_start).getTime() > currentMs) break;
      lapCount = Math.max(lapCount, l.lap_number);
    }
    // Filter stints by lap progress (no date on stints), keep per-driver
    // latest stint visible.
    const visibleStints: LiveStint[] = [];
    for (const s of stints) {
      if (s.lap_start <= lapCount) {
        visibleStints.push({
          ...s,
          lap_end: s.lap_end != null && s.lap_end <= lapCount ? s.lap_end : lapCount,
        });
      }
    }

    const latestPositions = hasRealPositions
      ? new Map<number, number>(
          [...latestPos.entries()].map(([num, p]) => [num, p.position]),
        )
      : derived?.positions ?? new Map<number, number>();

    const latestIntervals = hasRealIntervals
      ? new Map<number, { gap: number | null; interval: number | null }>(
          [...latestIv.entries()].map(([num, iv]) => [
            num,
            { gap: iv.gap_to_leader, interval: iv.interval },
          ]),
        )
      : derived?.intervals ?? new Map<number, { gap: number | null; interval: number | null }>();

    return {
      latestPositions,
      latestIntervals,
      visibleRadio,
      visibleRaceControl,
      currentWeather,
      lapCount,
      visibleStints,
    };
  }, [
    sortedPositions,
    sortedIntervals,
    sortedRadio,
    sortedRaceControl,
    sortedWeather,
    sortedLaps,
    stints,
    currentMs,
    hasRealPositions,
    hasRealIntervals,
  ]);

  // Current tire compound per driver (latest stint at lap T)
  const currentStint = useMemo(() => {
    const out = new Map<number, { compound: string; age: number }>();
    const latestNum = new Map<number, number>();
    for (const s of snapshot.visibleStints) {
      const prev = latestNum.get(s.driver_number) ?? -1;
      if (s.stint_number > prev) {
        latestNum.set(s.driver_number, s.stint_number);
        const end = s.lap_end ?? snapshot.lapCount;
        out.set(s.driver_number, {
          compound: s.compound,
          age: s.tyre_age_at_start + Math.max(end - s.lap_start, 0),
        });
      }
    }
    return out;
  }, [snapshot.visibleStints, snapshot.lapCount]);

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      const posA = snapshot.latestPositions.get(a.driver_number) ?? 99;
      const posB = snapshot.latestPositions.get(b.driver_number) ?? 99;
      return posA - posB;
    });
  }, [drivers, snapshot.latestPositions]);

  const progress = (currentMs - sessionStartMs) / sessionDurationMs;
  const elapsedSec = Math.max(0, Math.floor((currentMs - sessionStartMs) / 1000));
  const totalSec = Math.floor(sessionDurationMs / 1000);
  const isRace = session.session_type === "Race";

  // Data-availability notice. OpenF1 sometimes ships only a subset of feeds for
  // a session; surface that instead of silently rendering a grid of "—".
  const noTimingData = drivers.length === 0 && laps.length === 0;
  const positionsReconstructed = !hasRealPositions && laps.length > 0;
  const unavailableFeeds = [
    !hasRealPositions && laps.length === 0 && "positions",
    !hasRealIntervals && laps.length === 0 && "intervals",
    stints.length === 0 && "tyre data",
    radio.length === 0 && "team radio",
    raceControl.length === 0 && "race control",
  ].filter((x): x is string => Boolean(x));

  function formatClock(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  }

  function jump(deltaMs: number) {
    setCurrentMs((prev) => {
      const next = prev + deltaMs;
      return Math.max(sessionStartMs, Math.min(sessionEndMs, next));
    });
  }

  return (
    <>
      {/* Header */}
      <div style={{ ...cardStyle, padding: "18px 20px", marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Link
              href="/replay"
              style={{
                fontFamily: DM,
                fontSize: 11,
                color: "var(--color-f1-text-muted)",
                textDecoration: "none",
              }}
            >
              ← All replays
            </Link>
            <div
              style={{
                fontFamily: BC,
                fontWeight: 900,
                fontSize: 22,
                lineHeight: 1.1,
                letterSpacing: "0.02em",
                marginTop: 4,
              }}
            >
              {session.country_name} — {session.session_name}
            </div>
            <div
              style={{
                fontFamily: DM,
                fontSize: 12,
                color: "var(--color-f1-text-muted)",
                marginTop: 2,
              }}
            >
              {session.circuit_short_name}
            </div>
          </div>
          {isRace && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 900,
                  fontSize: 32,
                  lineHeight: 1,
                  color: "var(--color-f1-accent)",
                }}
              >
                {snapshot.lapCount}
              </div>
              <div
                style={{
                  fontFamily: DM,
                  fontSize: 9,
                  color: "var(--color-f1-text-muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Lap
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrubber */}
      <div style={{ ...cardStyle, padding: "14px 16px", marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            style={{
              background: "var(--color-f1-accent)",
              border: "none",
              color: "#fff",
              fontFamily: BC,
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.08em",
              padding: "6px 16px",
              borderRadius: 99,
              cursor: "pointer",
              minWidth: 80,
            }}
          >
            {playing ? "PAUSE" : "PLAY"}
          </button>
          <button
            type="button"
            onClick={() => jump(-30_000)}
            title="Back 30s"
            style={scrubBtn}
          >
            -30s
          </button>
          <button
            type="button"
            onClick={() => jump(30_000)}
            title="Forward 30s"
            style={scrubBtn}
          >
            +30s
          </button>
          <button
            type="button"
            onClick={() => setCurrentMs(sessionStartMs)}
            style={scrubBtn}
          >
            RESTART
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginLeft: "auto",
            }}
          >
            <span
              style={{
                fontFamily: DM,
                fontSize: 10,
                color: "var(--color-f1-text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginRight: 6,
              }}
            >
              Speed
            </span>
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSpeed(opt)}
                style={{
                  ...scrubBtn,
                  background:
                    opt === speed ? "var(--color-f1-accent)" : "var(--color-f1-card)",
                  color: opt === speed ? "#fff" : "var(--color-f1-text-muted)",
                  minWidth: 38,
                }}
              >
                {opt}×
              </button>
            ))}
          </div>
        </div>
        <input
          type="range"
          min={sessionStartMs}
          max={sessionEndMs}
          value={currentMs}
          onChange={(e) => setCurrentMs(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--color-f1-accent)" }}
          aria-label="Session timeline"
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "monospace",
            fontSize: 11,
            color: "var(--color-f1-text-muted)",
            marginTop: 4,
          }}
        >
          <span>{formatClock(elapsedSec)}</span>
          <span>{Math.round(progress * 100)}%</span>
          <span>{formatClock(totalSec)}</span>
        </div>
      </div>

      {/* Data-availability notice */}
      {noTimingData ? (
        <div
          style={{
            ...cardStyle,
            border: "1px solid rgba(202,138,4,0.3)",
            background: "rgba(202,138,4,0.05)",
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <p style={{ fontFamily: DM, fontSize: 13, color: "#ca8a04", fontWeight: 600 }}>
            No timing data is available for this session from OpenF1 yet. The
            provider may not have published this session&apos;s data.
          </p>
        </div>
      ) : (
        (positionsReconstructed || unavailableFeeds.length > 0) && (
          <div
            style={{
              ...cardStyle,
              border: "1px solid rgba(202,138,4,0.2)",
              background: "rgba(202,138,4,0.04)",
              padding: "10px 14px",
              marginBottom: 16,
            }}
          >
            <p style={{ fontFamily: DM, fontSize: 11, color: "rgba(202,138,4,0.85)" }}>
              {positionsReconstructed &&
                "OpenF1 has no live position feed for this session — running order and gaps are reconstructed from lap data (approximate). "}
              {unavailableFeeds.length > 0 &&
                `Unavailable from OpenF1: ${unavailableFeeds.join(", ")}.`}
            </p>
          </div>
        )
      )}

      {/* Timing Table */}
      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 16 }}>
        <div
          style={{
            fontFamily: BC,
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "0.04em",
            padding: "12px 14px",
            borderBottom: "1px solid var(--color-f1-border)",
          }}
        >
          Timing
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-f1-border)" }}>
                {["Pos", "#", "Driver", "Team", "Tire", "Age", "Interval", "Gap"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 12px",
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        color: "var(--color-f1-text-muted)",
                        textTransform: "uppercase",
                        textAlign: h === "Gap" || h === "Interval" ? "right" : "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {sortedDrivers.map((driver) => {
                const pos = snapshot.latestPositions.get(driver.driver_number);
                const iv = snapshot.latestIntervals.get(driver.driver_number);
                const tire = currentStint.get(driver.driver_number);
                const compound = tire
                  ? COMPOUND_COLORS[tire.compound?.toUpperCase()] ?? COMPOUND_FALLBACK
                  : null;
                return (
                  <tr
                    key={driver.driver_number}
                    style={{ borderBottom: "1px solid var(--color-f1-border)" }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontFamily: BC,
                          fontWeight: 900,
                          fontSize: 16,
                          color: "var(--color-f1-text)",
                        }}
                      >
                        {pos ?? "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "var(--color-f1-text-muted)",
                      }}
                    >
                      {driver.driver_number}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 3,
                            height: 24,
                            borderRadius: 2,
                            background: driver.team_colour
                              ? `#${driver.team_colour}`
                              : "var(--color-f1-text-muted)",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: BC,
                            fontWeight: 800,
                            fontSize: 16,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {driver.name_acronym}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: DM,
                        fontSize: 12,
                        color: "var(--color-f1-text-muted)",
                      }}
                    >
                      {driver.team_name}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {tire && compound && (
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${compound.bg} text-xs font-black text-black`}
                          title={tire.compound}
                        >
                          {compound.label}
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "monospace",
                        fontSize: 12,
                      }}
                    >
                      {tire ? `${tire.age}L` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        textAlign: "right",
                      }}
                    >
                      {iv?.interval != null ? `+${iv.interval.toFixed(3)}` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        textAlign: "right",
                      }}
                    >
                      {iv?.gap != null ? `+${iv.gap.toFixed(3)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary panels */}
      <div className="grid gap-4 lg:grid-cols-2" style={{ marginBottom: 16 }}>
        <TireStrategy
          stints={snapshot.visibleStints}
          drivers={drivers}
          latestPositions={snapshot.latestPositions}
        />
        <div className="flex flex-col gap-4">
          <WeatherWidget weather={snapshot.currentWeather} />
          <RaceControlFeed messages={snapshot.visibleRaceControl} />
        </div>
      </div>

      <TeamRadioFeed messages={snapshot.visibleRadio} drivers={drivers} />
    </>
  );
}

const scrubBtn: React.CSSProperties = {
  background: "var(--color-f1-card)",
  border: "1px solid var(--color-f1-border)",
  color: "var(--color-f1-text-muted)",
  fontFamily: BC,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: "0.08em",
  padding: "4px 10px",
  borderRadius: 99,
  cursor: "pointer",
};
