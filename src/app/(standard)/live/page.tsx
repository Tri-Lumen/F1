export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Live Timing — F1 2026",
  description: "Real-time positions, intervals, tire strategy, team radio, and race control messages",
};
import {
  getLatestSession,
  getOngoingScheduledSession,
  getLiveDrivers,
  getLivePositions,
  getLiveIntervals,
  getLiveStints,
  getTeamRadio,
  getRaceControl,
  getWeather,
  getLiveLaps,
  isSessionLive,
} from "@/lib/api";
import OnboardButton from "@/components/OnboardButton";
import TireStrategy from "@/components/TireStrategy";
import TeamRadioFeed from "@/components/TeamRadioFeed";
import RaceControlFeed from "@/components/RaceControlFeed";
import WeatherWidget from "@/components/WeatherWidget";
import LiveLapTimes from "@/components/LiveLapTimes";
import RefreshButton from "@/components/RefreshButton";
import NextSessionCard from "@/components/NextSessionCard";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import EmptyState from "@/components/EmptyState";
import { COMPOUND_COLORS, COMPOUND_FALLBACK } from "@/lib/compounds";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

const cardStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-f1-border)",
  background: "var(--color-f1-dark)",
};

// Live timing columns. `hideClass` collapses secondary columns on small
// screens so the table never needs to scroll horizontally on a phone.
const LIVE_COLUMNS: { label: string; align: "left" | "right" | "center"; hideClass?: string }[] = [
  { label: "Pos", align: "left" },
  { label: "#", align: "left", hideClass: "hidden sm:table-cell" },
  { label: "Driver", align: "left" },
  { label: "Team", align: "left", hideClass: "hidden lg:table-cell" },
  { label: "Tire", align: "left" },
  { label: "Age", align: "left", hideClass: "hidden md:table-cell" },
  { label: "Pit Window", align: "left", hideClass: "hidden md:table-cell" },
  { label: "Interval", align: "right", hideClass: "hidden sm:table-cell" },
  { label: "Gap", align: "right" },
  { label: "Onboard", align: "center" },
];

function SectionHeader({ children }: { children: React.ReactNode }) {
  // Thin wrapper so existing call sites keep working while delegating to the
  // shared SectionHeading primitive.
  return <SectionHeading variant="card" title={children} />;
}

async function LiveContent() {
  // Fetch OpenF1 session and Ergast schedule fallback in parallel
  const [session, ongoingScheduled] = await Promise.all([
    getLatestSession(),
    getOngoingScheduledSession(),
  ]);

  if (!session) {
    // If Ergast says a session should be underway but OpenF1 hasn't responded,
    // show a "connecting" state instead of the misleading next-session countdown
    if (ongoingScheduled) {
      return (
        <div style={{ ...cardStyle, padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
          <p
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: "0.04em",
              marginBottom: 8,
            }}
          >
            {ongoingScheduled.raceName} — {ongoingScheduled.type}
          </p>
          <p
            style={{
              fontFamily: DM,
              fontSize: 13,
              color: "var(--color-f1-text-muted)",
              maxWidth: 400,
              margin: "0 auto 8px",
            }}
          >
            Session is in progress. Connecting to live timing data&hellip;
          </p>
          <p style={{ fontFamily: DM, fontSize: 12, color: "var(--color-f1-text-muted)" }}>
            This page refreshes automatically every 15&nbsp;seconds.
          </p>
        </div>
      );
    }

    return (
      <div>
        <EmptyState
          className="mb-4"
          title="No session is currently active"
          hint="Live timing appears here once a session goes green."
          action={
            <Link
              href="/races"
              className="rounded-lg bg-f1-dark px-3 py-1.5 text-xs font-medium text-f1-accent hover:bg-f1-border transition-colors"
            >
              View race calendar
            </Link>
          }
        />
        <NextSessionCard />
      </div>
    );
  }

  const isLive = isSessionLive(session);

  const [drivers, positions, intervals, stints, radio, raceControl, weather, laps] =
    await Promise.all([
      getLiveDrivers(session.session_key),
      getLivePositions(session.session_key),
      getLiveIntervals(session.session_key),
      getLiveStints(session.session_key),
      getTeamRadio(session.session_key),
      getRaceControl(session.session_key),
      getWeather(session.session_key),
      getLiveLaps(session.session_key),
    ]);

  const dataStatus = {
    drivers: drivers.length > 0,
    positions: positions.length > 0,
    intervals: intervals.length > 0,
    stints: stints.length > 0,
    radio: radio.length > 0,
  };
  const hasAnyData = dataStatus.drivers || dataStatus.positions;

  const latestPositions = new Map<number, number>();
  for (const p of positions) latestPositions.set(p.driver_number, p.position);

  const latestIntervals = new Map<number, { gap: number | null; interval: number | null }>();
  for (const iv of intervals)
    latestIntervals.set(iv.driver_number, { gap: iv.gap_to_leader, interval: iv.interval });

  const currentLap =
    laps.length > 0 ? Math.max(...laps.map((l) => l.lap_number)) : null;

  const currentStints = new Map<number, { compound: string; age: number }>();
  const latestStintNums = new Map<number, number>();
  for (const stint of stints) {
    const prev = latestStintNums.get(stint.driver_number) ?? -1;
    if (stint.stint_number > prev) {
      latestStintNums.set(stint.driver_number, stint.stint_number);
      // For an in-progress stint (no lap_end) tire age runs from lap_start to
      // the current race lap — not a hardcoded guess.
      const lapEnd = stint.lap_end ?? currentLap ?? stint.lap_start;
      currentStints.set(stint.driver_number, {
        compound: stint.compound,
        age: stint.tyre_age_at_start + Math.max(lapEnd - stint.lap_start, 0),
      });
    }
  }

  const sortedDrivers = [...drivers].sort((a, b) => {
    const posA = latestPositions.get(a.driver_number) ?? 99;
    const posB = latestPositions.get(b.driver_number) ?? 99;
    return posA - posB;
  });

  const latestFlagMsg = [...raceControl]
    .reverse()
    .find((m) => m.flag && m.flag !== "");
  const currentFlag = latestFlagMsg?.flag ?? null;

  const flagStyles: Record<string, { bg: string; color: string; label: string }> = {
    GREEN: { bg: "#16a34a", color: "#fff", label: "GREEN FLAG" },
    YELLOW: { bg: "#ca8a04", color: "#000", label: "YELLOW FLAG" },
    DOUBLE_YELLOW: { bg: "#ca8a04", color: "#000", label: "DOUBLE YELLOW" },
    RED: { bg: "#dc2626", color: "#fff", label: "RED FLAG" },
    BLUE: { bg: "#2563eb", color: "#fff", label: "BLUE FLAG" },
    CHEQUERED: { bg: "#f5f5f5", color: "#000", label: "CHEQUERED" },
    CLEAR: { bg: "#16a34a", color: "#fff", label: "TRACK CLEAR" },
    SAFETY_CAR: { bg: "#d97706", color: "#000", label: "SAFETY CAR" },
    VIRTUAL_SAFETY_CAR: { bg: "#ca8a04", color: "#000", label: "VSC" },
  };

  return (
    <>
      {/* Session Header */}
      <div style={{ ...cardStyle, padding: "18px 20px", marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, marginTop: 2 }}>
              {isLive ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--color-f1-accent)",
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontFamily: BC,
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    color: "#fff",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#fff",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  LIVE
                </span>
              ) : (
                <span
                  style={{
                    background: "var(--color-f1-card)",
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    color: "var(--color-f1-text-muted)",
                  }}
                >
                  SESSION ENDED
                </span>
              )}
              {currentFlag && flagStyles[currentFlag] && (
                <span
                  style={{
                    background: flagStyles[currentFlag].bg,
                    color: flagStyles[currentFlag].color,
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontFamily: BC,
                    fontWeight: 800,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                  }}
                >
                  {flagStyles[currentFlag].label}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 900,
                  fontSize: 22,
                  lineHeight: 1.1,
                  letterSpacing: "0.02em",
                }}
              >
                {session.country_name} — {session.session_name}
              </div>
              <div style={{ fontFamily: DM, fontSize: 12, color: "var(--color-f1-text-muted)", marginTop: 2 }}>
                {session.circuit_short_name}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            {currentLap !== null && session.session_type === "Race" && (
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
                  {currentLap}
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
      </div>

      {/* Data warnings */}
      {isLive && !hasAnyData && (
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
            Unable to fetch live timing data from OpenF1. The data provider may be experiencing
            high traffic or the session data is not yet available.
          </p>
        </div>
      )}
      {isLive && hasAnyData && (!dataStatus.intervals || !dataStatus.stints) && (
        <div
          style={{
            ...cardStyle,
            border: "1px solid rgba(202,138,4,0.2)",
            background: "rgba(202,138,4,0.04)",
            padding: "10px 14px",
            marginBottom: 16,
          }}
        >
          <p style={{ fontFamily: DM, fontSize: 11, color: "rgba(202,138,4,0.8)" }}>
            Some live data is temporarily unavailable (
            {[
              !dataStatus.intervals && "intervals",
              !dataStatus.stints && "tire data",
              !dataStatus.radio && "team radio",
            ]
              .filter(Boolean)
              .join(", ")}
            ). Will retry on next refresh.
          </p>
        </div>
      )}

      {/* Live Timing Table */}
      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 16 }}>
        <SectionHeader>Live Timing</SectionHeader>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <caption className="sr-only">
              Live timing — position, driver, tire, pit window, interval and gap
            </caption>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-f1-border)" }}>
                {LIVE_COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    scope="col"
                    className={col.hideClass}
                    style={{
                      padding: "8px 12px",
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      color: "var(--color-f1-text-muted)",
                      textTransform: "uppercase",
                      textAlign: col.align,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDrivers.map((driver) => {
                const pos = latestPositions.get(driver.driver_number);
                const iv = latestIntervals.get(driver.driver_number);
                const tire = currentStints.get(driver.driver_number);
                const compound = tire
                  ? (COMPOUND_COLORS[tire.compound?.toUpperCase()] ?? COMPOUND_FALLBACK)
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
                        {pos}
                      </span>
                    </td>
                    <td
                      className="hidden sm:table-cell"
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
                      className="hidden lg:table-cell"
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
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            fontFamily: BC,
                            fontWeight: 900,
                            fontSize: 11,
                            color: "#000",
                          }}
                          className={compound.bg}
                          title={`${tire.compound} - ${tire.age} laps`}
                        >
                          {compound.label}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell" style={{ padding: "10px 12px" }}>
                      {tire?.age != null ? (
                        <span
                          title={`${tire.age} laps on current tyre`}
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              tire.age > 25
                                ? "#fb923c"
                                : tire.age > 15
                                ? "#eab308"
                                : "var(--color-f1-text-muted)",
                          }}
                        >
                          {tire.age}L
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-f1-text-muted)", fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell" style={{ padding: "10px 12px" }}>
                      {tire?.age != null && (
                        <span
                          style={{
                            fontFamily: BC,
                            fontWeight: 700,
                            fontSize: 9,
                            letterSpacing: "0.06em",
                            padding: "2px 6px",
                            borderRadius: 4,
                            ...(tire.age >= 15 && tire.age <= 30
                              ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
                              : tire.age > 30
                              ? { background: "rgba(251,146,60,0.15)", color: "#fb923c" }
                              : { color: "var(--color-f1-text-muted)", background: "transparent" })
                          }}
                        >
                          {tire.age >= 15 && tire.age <= 30
                            ? "IN WINDOW"
                            : tire.age > 30
                            ? "OVERDUE"
                            : `~${15 - tire.age}L`}
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell" style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "var(--color-f1-text-muted)",
                        }}
                      >
                        {pos === 1
                          ? ""
                          : iv?.interval != null
                          ? `+${iv.interval.toFixed(3)}`
                          : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: pos === 1 ? "var(--color-f1-accent)" : "var(--color-f1-text-muted)",
                          fontWeight: pos === 1 ? 700 : 400,
                        }}
                      >
                        {pos === 1
                          ? "LEADER"
                          : iv?.gap != null
                          ? `+${iv.gap.toFixed(3)}`
                          : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <OnboardButton
                        driverNumber={driver.driver_number}
                        acronym={driver.name_acronym}
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lap Times */}
      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 16 }}>
        <SectionHeader>Lap Times</SectionHeader>
        <div style={{ padding: "0 0 8px" }}>
          <LiveLapTimes laps={laps} drivers={drivers} latestPositions={latestPositions} />
        </div>
      </div>

      {/* Weather + Tire Strategy */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <SectionHeader>Weather</SectionHeader>
          <div style={{ padding: 14 }}>
            <WeatherWidget weather={weather} />
          </div>
        </div>
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <SectionHeader>Tire Strategy</SectionHeader>
          <div style={{ padding: 14 }}>
            <TireStrategy
              stints={stints}
              drivers={drivers}
              latestPositions={latestPositions}
            />
          </div>
        </div>
      </div>

      {/* Race Control + Team Radio */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <SectionHeader>Race Control</SectionHeader>
          <div style={{ padding: 14 }}>
            <RaceControlFeed messages={raceControl} />
          </div>
        </div>
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <SectionHeader>Team Radio</SectionHeader>
          <div style={{ padding: 14 }}>
            <TeamRadioFeed messages={radio} drivers={drivers} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function LivePage() {
  return (
    <>
      <PageHeader
        title={
          <>
            <span style={{ color: "var(--color-f1-accent)" }}>LIVE</span> SESSION
          </>
        }
        subtitle="Real-time timing, tire strategy, team radio & onboard cameras"
        actions={<RefreshButton intervalMs={15000} />}
      />

      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <div style={{ height: 96, borderRadius: 12, background: "var(--color-f1-dark)" }} />
            <div style={{ height: 384, borderRadius: 12, background: "var(--color-f1-dark)" }} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div style={{ height: 256, borderRadius: 12, background: "var(--color-f1-dark)" }} />
              <div style={{ height: 256, borderRadius: 12, background: "var(--color-f1-dark)" }} />
            </div>
          </div>
        }
      >
        <LiveContent />
      </Suspense>
    </>
  );
}
