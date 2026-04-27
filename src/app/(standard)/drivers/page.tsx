export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Driver Standings — F1 2026",
  description: "Current F1 driver championship standings, stats, and points progression",
};
import Link from "next/link";
import {
  getDriverStandings,
  getAllSeasonResults,
  getRaceSchedule,
  getTeamColor,
  getCountryFlag,
  getRaceDate,
  CURRENT_YEAR,
} from "@/lib/api";
import type { Race } from "@/lib/types";
import StandingsTable from "@/components/StandingsTable";
import PointsProgressionChart from "@/components/PointsProgressionChart";
import { DriverNumber } from "@/components/ProfileImage";
import { getDriverNumberUrl } from "@/lib/profileImages";
import {
  getDriverNumber,
  getDriverConstructorId,
  getDriverConstructorName,
} from "@/lib/driverOverrides";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

interface DriverStats {
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  bestFinish: number;
  avgFinish: number;
  pointsPerRace: number;
  racesEntered: number;
}

function computeDriverStats(driverId: string, allRaces: Race[]): DriverStats {
  let podiums = 0;
  let fastestLaps = 0;
  let dnfs = 0;
  let bestFinish = 99;
  let totalPosition = 0;
  let totalPoints = 0;
  let racesEntered = 0;
  let poles = 0;

  for (const race of allRaces) {
    for (const result of race.Results ?? []) {
      if (result.Driver.driverId === driverId) {
        racesEntered++;
        const pos = parseInt(result.position);
        totalPoints += parseFloat(result.points);
        if (pos <= 3) podiums++;
        if (pos < bestFinish) bestFinish = pos;
        if (result.grid === "1") poles++;
        if (result.FastestLap?.rank === "1") fastestLaps++;
        if (result.status !== "Finished" && !result.status.startsWith("+")) dnfs++;
        totalPosition += pos;
      }
    }
  }

  return {
    podiums,
    poles,
    fastestLaps,
    dnfs,
    bestFinish: bestFinish === 99 ? 0 : bestFinish,
    avgFinish: racesEntered > 0 ? Math.round((totalPosition / racesEntered) * 10) / 10 : 0,
    pointsPerRace: racesEntered > 0 ? Math.round((totalPoints / racesEntered) * 10) / 10 : 0,
    racesEntered,
  };
}

async function DriversContent() {
  const [standings, allRaces, schedule] = await Promise.all([
    getDriverStandings(),
    getAllSeasonResults(),
    getRaceSchedule(),
  ]);

  const completedRaces = allRaces.filter((r) => (r.Results?.length ?? 0) > 0);

  const recentFormMap = new Map<string, { pos: number; status: string }[]>();
  for (const s of standings) {
    const results: { pos: number; status: string }[] = [];
    for (let i = completedRaces.length - 1; i >= 0 && results.length < 5; i--) {
      const result = completedRaces[i].Results?.find(
        (r) => r.Driver.driverId === s.Driver.driverId
      );
      if (result) results.unshift({ pos: parseInt(result.position), status: result.status });
    }
    recentFormMap.set(s.Driver.driverId, results);
  }

  const now = new Date();
  const remainingSchedule = schedule.filter((r) => getRaceDate(r) > now);
  const remainingRaces = remainingSchedule.length;
  const maxAvailable = remainingSchedule.reduce(
    (sum, r) => sum + 25 + (r.Sprint ? 8 : 0),
    0
  );
  const leader = standings[0];
  const second = standings[1];
  let clinchInfo: {
    clinched: boolean;
    leaderName: string;
    gap: number;
    ptsNeeded?: number;
    remaining: number;
    maxAvailable: number;
  } | null = null;
  if (leader && second) {
    const leaderPts = parseFloat(leader.points);
    const secondPts = parseFloat(second.points);
    const gap = leaderPts - secondPts;
    const maxSecondCanScore = secondPts + maxAvailable;
    const leaderName = `${leader.Driver.givenName} ${leader.Driver.familyName}`;
    if (leaderPts > maxSecondCanScore) {
      clinchInfo = { clinched: true, leaderName, gap, remaining: remainingRaces, maxAvailable };
    } else {
      const ptsNeeded = maxSecondCanScore - leaderPts + 1;
      clinchInfo = { clinched: false, leaderName, gap, ptsNeeded, remaining: remainingRaces, maxAvailable };
    }
  }

  const winsMap = new Map<string, { name: string; count: number }>();
  const polesMap = new Map<string, { name: string; count: number }>();
  const flMap = new Map<string, { name: string; count: number }>();
  const dnfMap = new Map<string, { name: string; count: number }>();
  const posMap = new Map<string, { name: string; total: number; count: number }>();
  for (const race of completedRaces) {
    for (const result of race.Results ?? []) {
      const id = result.Driver.driverId;
      const name = `${result.Driver.givenName} ${result.Driver.familyName}`;
      const pos = parseInt(result.position);
      const isDnf = result.status !== "Finished" && !result.status.startsWith("+");
      if (pos === 1) { const e = winsMap.get(id) ?? { name, count: 0 }; winsMap.set(id, { name, count: e.count + 1 }); }
      if (result.grid === "1") { const e = polesMap.get(id) ?? { name, count: 0 }; polesMap.set(id, { name, count: e.count + 1 }); }
      if (result.FastestLap?.rank === "1") { const e = flMap.get(id) ?? { name, count: 0 }; flMap.set(id, { name, count: e.count + 1 }); }
      if (isDnf) { const e = dnfMap.get(id) ?? { name, count: 0 }; dnfMap.set(id, { name, count: e.count + 1 }); }
      const ep = posMap.get(id) ?? { name, total: 0, count: 0 };
      posMap.set(id, { name, total: ep.total + pos, count: ep.count + 1 });
    }
  }
  let streakName = "";
  let streakCount = 0;
  for (let i = completedRaces.length - 1; i >= 0; i--) {
    const winner = completedRaces[i].Results?.find((r) => r.position === "1");
    if (!winner) continue;
    const name = `${winner.Driver.givenName} ${winner.Driver.familyName}`;
    if (streakCount === 0) { streakName = name; streakCount = 1; }
    else if (name === streakName) streakCount++;
    else break;
  }
  const topWins = [...winsMap.values()].sort((a, b) => b.count - a.count)[0];
  const topPoles = [...polesMap.values()].sort((a, b) => b.count - a.count)[0];
  const topFL = [...flMap.values()].sort((a, b) => b.count - a.count)[0];
  const topDNF = [...dnfMap.values()].sort((a, b) => b.count - a.count)[0];
  const bestAvg = [...posMap.values()]
    .filter((v) => v.count >= 3)
    .sort((a, b) => a.total / a.count - b.total / b.count)[0];

  const highlights = [
    topWins && { label: "Most Wins", value: topWins.count, name: topWins.name, icon: "🏆" },
    topPoles && { label: "Most Poles", value: topPoles.count, name: topPoles.name, icon: "⚡" },
    topFL && { label: "Fastest Laps", value: topFL.count, name: topFL.name, icon: "🟣" },
    streakCount > 1 && { label: "Win Streak", value: streakCount, name: streakName, icon: "🔥" },
    topDNF && { label: "Most DNFs", value: topDNF.count, name: topDNF.name, icon: "🔧" },
    bestAvg && { label: "Best Avg Finish", value: (bestAvg.total / bestAvg.count).toFixed(1), name: bestAvg.name, icon: "📊" },
  ].filter(Boolean) as { label: string; value: string | number; name: string; icon: string }[];

  const cardStyle = {
    borderRadius: 12,
    border: "1px solid #1c1c1c",
    background: "#131313",
  };

  return (
    <>
      {/* Championship Status */}
      {clinchInfo && completedRaces.length > 0 && (
        <div style={{ ...cardStyle, padding: "14px 18px", marginBottom: 18 }}>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "#555",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Championship Status
          </div>
          {clinchInfo.clinched ? (
            <p style={{ fontFamily: BC, fontWeight: 800, fontSize: 15, color: "#e10600" }}>
              🏆 {clinchInfo.leaderName} has clinched the {CURRENT_YEAR} World Championship!
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 24px" }}>
              <span style={{ fontFamily: DM, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{clinchInfo.leaderName}</span>{" "}
                leads by{" "}
                <span style={{ fontWeight: 700, color: "#e10600" }}>{clinchInfo.gap} pts</span>
              </span>
              <span style={{ fontFamily: DM, fontSize: 12, color: "#555" }}>
                Needs <span style={{ color: "#ccc" }}>{clinchInfo.ptsNeeded} pts</span> to clinch
              </span>
              <span style={{ fontFamily: DM, fontSize: 12, color: "#555" }}>
                {clinchInfo.remaining} races left · {clinchInfo.maxAvailable} pts available
              </span>
            </div>
          )}
        </div>
      )}

      {/* Season Highlights */}
      {highlights.length > 0 && completedRaces.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "#555",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Season Highlights
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 8,
            }}
          >
            {highlights.map((h) => (
              <div
                key={h.label}
                style={{ ...cardStyle, padding: "12px 10px", textAlign: "center" }}
              >
                <div style={{ fontSize: 18 }}>{h.icon}</div>
                <div
                  style={{
                    fontFamily: DM,
                    fontSize: 9,
                    color: "#555",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  {h.label}
                </div>
                <div
                  style={{
                    fontFamily: BC,
                    fontWeight: 900,
                    fontSize: 22,
                    lineHeight: 1.1,
                    marginTop: 2,
                  }}
                >
                  {h.value}
                </div>
                <div style={{ fontFamily: DM, fontSize: 10, color: "#555", marginTop: 2 }}>
                  {h.name.split(" ").at(-1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Championship Standings Table */}
      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px",
            borderBottom: "1px solid #1c1c1c",
          }}
        >
          <span
            style={{ fontFamily: BC, fontWeight: 800, fontSize: 14, letterSpacing: "0.04em" }}
          >
            Championship Standings
          </span>
        </div>
        <StandingsTable standings={standings} recentForm={recentFormMap} />
      </div>

      {/* Points Progression Chart */}
      {completedRaces.length > 0 && (
        <div style={{ ...cardStyle, padding: 18, marginBottom: 18 }}>
          <PointsProgressionChart
            completedRaces={completedRaces}
            driverStandings={standings}
            getTeamColor={getTeamColor}
          />
        </div>
      )}

      {/* Driver Profile Cards */}
      <div
        style={{
          fontFamily: BC,
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: "0.1em",
          color: "#555",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Driver Profiles &amp; Stats
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {standings.map((s) => {
          const stats = computeDriverStats(s.Driver.driverId, allRaces);
          const constructorId =
            getDriverConstructorId(s.Driver.driverId, s.Constructors[0]?.constructorId) ?? "";
          const constructorName =
            getDriverConstructorName(s.Driver.driverId, s.Constructors[0]?.name) ?? "";
          const displayNumber = getDriverNumber(s.Driver.driverId, s.Driver.permanentNumber);
          const teamColor = getTeamColor(constructorId);

          return (
            <div
              key={s.Driver.driverId}
              id={s.Driver.driverId}
              style={{ ...cardStyle, overflow: "hidden" }}
            >
              <div style={{ height: 2, background: teamColor }} />
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 3,
                        height: 40,
                        borderRadius: 2,
                        background: teamColor,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontFamily: DM, fontSize: 11, color: "#555" }}>
                        {getCountryFlag(s.Driver.nationality)} {s.Driver.givenName}
                      </div>
                      <div
                        style={{
                          fontFamily: BC,
                          fontWeight: 900,
                          fontSize: 20,
                          lineHeight: 1.1,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {s.Driver.familyName.toUpperCase()}
                      </div>
                      <div style={{ fontFamily: DM, fontSize: 10, color: "#555", marginTop: 1 }}>
                        {constructorName}
                      </div>
                    </div>
                  </div>
                  <div>
                    {getDriverNumberUrl(s.Driver.driverId) ? (
                      <DriverNumber
                        src={getDriverNumberUrl(s.Driver.driverId)!}
                        number={displayNumber}
                        className="h-9 w-auto opacity-20"
                        color={teamColor}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: BC,
                          fontWeight: 900,
                          fontSize: 32,
                          color: "#1e1e1e",
                          fontStyle: "italic",
                          lineHeight: 1,
                        }}
                      >
                        {displayNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {[
                    ["POS", s.position],
                    ["PTS", s.points],
                    ["WINS", s.wins],
                    ["PODS", stats.podiums],
                    ["POLES", stats.poles],
                    ["FL", stats.fastestLaps],
                    ["DNFs", stats.dnfs],
                    ["AVG", stats.avgFinish],
                    ["PPR", stats.pointsPerRace],
                  ].map(([label, val]) => (
                    <div
                      key={String(label)}
                      style={{
                        background: "#0e0e0e",
                        borderRadius: 6,
                        padding: "6px 4px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: DM,
                          fontSize: 8,
                          color: "#555",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: BC,
                          fontWeight: 900,
                          fontSize: 18,
                          lineHeight: 1.2,
                        }}
                      >
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Link
                    href={`/drivers/${s.Driver.driverId}`}
                    style={{
                      fontFamily: DM,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#e10600",
                      textDecoration: "none",
                    }}
                  >
                    View Profile →
                  </Link>
                  <a
                    href={s.Driver.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: DM, fontSize: 11, color: "#444" }}
                  >
                    Wikipedia
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function DriversPage() {
  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          DRIVERS CHAMPIONSHIP
        </div>
        <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 4 }}>
          {CURRENT_YEAR} Season · Full driver stats and standings
        </div>
      </div>

      <Suspense
        fallback={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{ height: 64, borderRadius: 10, background: "#131313" }}
              />
            ))}
          </div>
        }
      >
        <DriversContent />
      </Suspense>
    </>
  );
}
