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
import RefreshButton from "@/components/RefreshButton";
import PointsProgressionChart from "@/components/PointsProgressionChart";
import { DriverNumber } from "@/components/ProfileImage";
import { getDriverNumberUrl } from "@/lib/profileImages";

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

function computeDriverStats(
  driverId: string,
  allRaces: Race[]
): DriverStats {
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
        if (
          result.FastestLap?.rank === "1"
        )
          fastestLaps++;
        if (
          result.status !== "Finished" &&
          !result.status.startsWith("+")
        )
          dnfs++;

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
    avgFinish:
      racesEntered > 0
        ? Math.round((totalPosition / racesEntered) * 10) / 10
        : 0,
    pointsPerRace:
      racesEntered > 0
        ? Math.round((totalPoints / racesEntered) * 10) / 10
        : 0,
    racesEntered,
  };
}

async function DriversContent() {
  const [standings, allRaces, schedule] = await Promise.all([
    getDriverStandings(),
    getAllSeasonResults(),
    getRaceSchedule(),
  ]);

  // Completed races only (have Results)
  const completedRaces = allRaces.filter((r) => (r.Results?.length ?? 0) > 0);

  // --- Feature 1: Recent Form (last 5 results per driver) ---
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

  // --- Feature 2: Championship Clinch Status ---
  const now = new Date();
  const remainingSchedule = schedule.filter((r) => getRaceDate(r) > now);
  const remainingRaces = remainingSchedule.length;
  // 25 pts for race win; +8 for sprint win only on sprint weekends
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

  // --- Feature 4: Season Highlights ---
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
  // Win streak
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

  return (
    <>
      {/* Feature 2: Championship Clinch Status */}
      {clinchInfo && completedRaces.length > 0 && (
        <div className="mb-8 rounded-xl border border-f1-border bg-f1-card p-4">
          <h2 className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-2">Championship Status</h2>
          {clinchInfo.clinched ? (
            <p className="text-sm font-bold text-f1-accent">
              🏆 {clinchInfo.leaderName} has clinched the {CURRENT_YEAR} World Championship!
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm">
                <span className="font-bold">{clinchInfo.leaderName}</span>{" "}
                leads by <span className="font-bold text-f1-accent">{clinchInfo.gap} pts</span>
              </p>
              <p className="text-sm text-f1-text-muted">
                Needs <span className="font-semibold text-f1-text">{clinchInfo.ptsNeeded} pts</span> to clinch mathematically
              </p>
              <p className="text-sm text-f1-text-muted">
                {clinchInfo.remaining} races left &middot; {clinchInfo.maxAvailable} pts available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feature 4: Season Highlights */}
      {highlights.length > 0 && completedRaces.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-f1-text-muted font-bold">Season Highlights</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {highlights.map((h) => (
              <div key={h.label} className="rounded-xl border border-f1-border bg-f1-card p-3 text-center">
                <p className="text-lg">{h.icon}</p>
                <p className="text-xs text-f1-text-muted mt-1">{h.label}</p>
                <p className="text-xl font-black">{h.value}</p>
                <p className="text-xs text-f1-text-muted truncate">{h.name.split(" ").at(-1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Standings Table */}
      <div className="mb-10 rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border p-4">
          <h2 className="font-bold text-lg">Championship Standings</h2>
        </div>
        <StandingsTable standings={standings} recentForm={recentFormMap} />
      </div>

      {/* Points Progression Chart */}
      {completedRaces.length > 0 && (
        <div className="mb-10">
          <PointsProgressionChart
            completedRaces={completedRaces}
            driverStandings={standings}
            getTeamColor={getTeamColor}
          />
        </div>
      )}

      {/* Detailed Driver Cards */}
      <h2 className="mb-4 text-lg font-bold text-f1-text-muted">
        Driver Profiles &amp; Stats
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {standings.map((s) => {
          const stats = computeDriverStats(s.Driver.driverId, allRaces);
          const teamColor = getTeamColor(
            s.Constructors[0]?.constructorId ?? ""
          );

          return (
            <div
              key={s.Driver.driverId}
              id={s.Driver.driverId}
              className="group rounded-xl border border-f1-border bg-f1-card p-5 transition-all hover:border-f1-border hover:bg-f1-card-hover"
            >
              <div
                className="h-0.5 w-full rounded-full mb-4 -mt-1"
                style={{ backgroundColor: teamColor }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-10 w-1.5 rounded-full"
                      style={{ backgroundColor: teamColor }}
                    />
                    <div>
                      <p className="text-sm text-f1-text-muted">
                        {getCountryFlag(s.Driver.nationality)}{" "}
                        {s.Driver.givenName}
                      </p>
                      <p className="text-xl font-black uppercase tracking-tight">
                        {s.Driver.familyName}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-f1-text-muted">
                    {s.Constructors[0]?.name ?? ""}
                  </p>
                </div>
                <div className="text-right flex items-start">
                  {getDriverNumberUrl(s.Driver.driverId) ? (
                    <DriverNumber
                      src={getDriverNumberUrl(s.Driver.driverId)!}
                      number={s.Driver.permanentNumber || "#"}
                      className="h-9 w-auto opacity-30"
                      color={teamColor}
                    />
                  ) : (
                    <span className="text-3xl font-black italic text-f1-text-muted/30">
                      {s.Driver.permanentNumber || "#"}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">POS</p>
                  <p className="text-lg font-black">{s.position}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">PTS</p>
                  <p className="text-lg font-black">{s.points}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">WINS</p>
                  <p className="text-lg font-black">{s.wins}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">PODS</p>
                  <p className="text-lg font-black">{stats.podiums}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">POLES</p>
                  <p className="text-lg font-black">{stats.poles}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">FL</p>
                  <p className="text-lg font-black">{stats.fastestLaps}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">DNFs</p>
                  <p className="text-lg font-black">{stats.dnfs}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">AVG</p>
                  <p className="text-lg font-black">{stats.avgFinish}</p>
                </div>
                <div className="rounded-lg bg-f1-dark p-2 text-center">
                  <p className="text-xs text-f1-text-muted">PPR</p>
                  <p className="text-lg font-black">{stats.pointsPerRace}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Link
                  href={`/drivers/${s.Driver.driverId}`}
                  className="text-xs font-medium text-f1-accent hover:underline"
                >
                  View Profile &rarr;
                </Link>
                <a
                  href={s.Driver.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-f1-text-muted hover:underline"
                >
                  Wikipedia
                </a>
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Drivers Championship
          </h1>
          <p className="mt-1 text-sm text-f1-text-muted">
            {CURRENT_YEAR} Season &middot; Full driver stats and standings
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-f1-card animate-pulse"
              />
            ))}
          </div>
        }
      >
        <DriversContent />
      </Suspense>
    </div>
  );
}
