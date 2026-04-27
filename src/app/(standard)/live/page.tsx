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
import { COMPOUND_COLORS, COMPOUND_FALLBACK } from "@/lib/compounds";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

const cardStyle = {
  borderRadius: 12,
  border: "1px solid #1c1c1c",
  background: "#131313",
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: BC,
        fontWeight: 800,
        fontSize: 14,
        letterSpacing: "0.04em",
        padding: "12px 14px",
        borderBottom: "1px solid #1c1c1c",
      }}
    >
      {children}
    </div>
  );
}

async function LiveContent() {
  const session = await getLatestSession();

  if (!session) {
    return (
      <div>
        <div style={{ ...cardStyle, padding: "24px", textAlign: "center", marginBottom: 16 }}>
          <p style={{ fontFamily: DM, fontSize: 13, color: "#555" }}>
            No session is currently active.{" "}
            <Link href="/races" style={{ color: "#e10600" }}>
              View race calendar
            </Link>
          </p>
        </div>
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

  const currentStints = new Map<number, { compound: string; age: number }>();
  const latestStintNums = new Map<number, number>();
  for (const stint of stints) {
    const prev = latestStintNums.get(stint.driver_number) ?? -1;
    if (stint.stint_number > prev) {
      latestStintNums.set(stint.driver_number, stint.stint_number);
      const lapEnd = stint.lap_end ?? stint.lap_start + 5;
      currentStints.set(stint.driver_number, {
        compound: stint.compound,
        age: stint.tyre_age_at_start + (lapEnd - stint.lap_start),
      });
    }
  }

  const sortedDrivers = [...drivers].sort((a, b) => {
    const posA = latestPositions.get(a.driver_number) ?? 99;
    const posB = latestPositions.get(b.driver_number) ?? 99;
    return posA - posB;
  });

  const currentLap =
    laps.length > 0 ? Math.max(...laps.map((l) => l.lap_number)) : null;

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
                    background: "#e10600",
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
                    background: "#1a1a1a",
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    color: "#555",
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
              <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 2 }}>
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
                    color: "#e10600",
                  }}
                >
                  {currentLap}
                </div>
                <div
                  style={{
                    fontFamily: DM,
                    fontSize: 9,
                    color: "#555",
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
            <thead>
              <tr style={{ borderBottom: "1px solid #1c1c1c" }}>
                {["Pos", "#", "Driver", "Team", "Tire", "Age", "Interval", "Gap", "Onboard"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 12px",
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        color: "#3a3a3a",
                        textTransform: "uppercase",
                        textAlign: h === "Gap" || h === "Interval" ? "right" : "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
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
                    style={{ borderBottom: "1px solid #111" }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontFamily: BC,
                          fontWeight: 900,
                          fontSize: 16,
                          color: "#ccc",
                        }}
                      >
                        {pos}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#3a3a3a",
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
                              : "#555",
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
                        color: "#555",
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
                    <td style={{ padding: "10px 12px" }}>
                      {tire?.age != null ? (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              tire.age > 25
                                ? "#fb923c"
                                : tire.age > 15
                                ? "#eab308"
                                : "#555",
                          }}
                        >
                          {tire.age}L
                        </span>
                      ) : (
                        <span style={{ color: "#333", fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "#555",
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
                          color: pos === 1 ? "#e10600" : "#555",
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#e10600" }}>LIVE</span> SESSION
          </div>
          <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 4 }}>
            Real-time timing, tire strategy, team radio &amp; onboard cameras
          </div>
        </div>
        <RefreshButton intervalMs={15000} />
      </div>

      <Suspense
        fallback={
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ height: 96, borderRadius: 12, background: "#131313" }} />
            <div style={{ height: 384, borderRadius: 12, background: "#131313" }} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={{ height: 256, borderRadius: 12, background: "#131313" }} />
              <div style={{ height: 256, borderRadius: 12, background: "#131313" }} />
            </div>
          </div>
        }
      >
        <LiveContent />
      </Suspense>
    </>
  );
}
