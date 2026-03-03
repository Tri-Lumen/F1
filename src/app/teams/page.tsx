export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  getConstructorStandings,
  getDriverStandings,
  getAllSeasonResults,
  getTeamColor,
  getCountryFlag,
  CURRENT_YEAR,
} from "@/lib/api";
import ConstructorStandingsTable from "@/components/ConstructorStandingsTable";
import RefreshButton from "@/components/RefreshButton";
import TeammateH2H from "@/components/TeammateH2H";
import ConstructorPointsChart from "@/components/ConstructorPointsChart";

interface TeamStats {
  podiums: number;
  poles: number;
  oneTwo: number;
  fastestLaps: number;
  dnfs: number;
  bestFinish: number;
  avgFinish: number;
  racesEntered: number;
  doublePoints: number;
}

function computeTeamStats(
  constructorId: string,
  allRaces: any[]
): TeamStats {
  let podiums = 0;
  let poles = 0;
  let fastestLaps = 0;
  let dnfs = 0;
  let bestFinish = 99;
  let totalPosition = 0;
  let resultCount = 0;
  let racesEntered = 0;
  let oneTwo = 0;
  let doublePoints = 0;

  for (const race of allRaces) {
    const teamResults = (race.Results ?? []).filter(
      (r: any) => r.Constructor.constructorId === constructorId
    );
    if (teamResults.length > 0) racesEntered++;

    // Check 1-2 finish
    const positions = teamResults.map((r: any) => parseInt(r.position));
    if (positions.includes(1) && positions.includes(2)) oneTwo++;

    // Check double points (both drivers in top 10)
    if (positions.length >= 2 && positions.every((p: number) => p <= 10))
      doublePoints++;

    for (const result of teamResults) {
      resultCount++;
      const pos = parseInt(result.position);
      totalPosition += pos;

      if (pos <= 3) podiums++;
      if (pos < bestFinish) bestFinish = pos;
      if (result.grid === "1") poles++;
      if (result.FastestLap?.rank === "1") fastestLaps++;
      if (result.status !== "Finished" && !result.status.startsWith("+"))
        dnfs++;
    }
  }

  return {
    podiums,
    poles,
    oneTwo,
    fastestLaps,
    dnfs,
    bestFinish: bestFinish === 99 ? 0 : bestFinish,
    avgFinish:
      resultCount > 0
        ? Math.round((totalPosition / resultCount) * 10) / 10
        : 0,
    racesEntered,
    doublePoints,
  };
}

async function TeamsContent() {
  const [constructorStandings, driverStandings, allRaces] = await Promise.all([
    getConstructorStandings(),
    getDriverStandings(),
    getAllSeasonResults(),
  ]);

  // Map drivers to teams
  const teamDrivers = new Map<string, typeof driverStandings>();
  for (const d of driverStandings) {
    const teamId = d.Constructors[0]?.constructorId;
    if (teamId) {
      const existing = teamDrivers.get(teamId) ?? [];
      existing.push(d);
      teamDrivers.set(teamId, existing);
    }
  }

  return (
    <>
      {/* Full Standings Table */}
      <div className="mb-10 rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border p-4">
          <h2 className="font-bold text-lg">Championship Standings</h2>
        </div>
        <ConstructorStandingsTable standings={constructorStandings} />
      </div>

      {/* Constructor Points Progression */}
      {allRaces.filter((r) => (r.Results?.length ?? 0) > 0).length > 0 && (
        <div className="mb-10">
          <ConstructorPointsChart
            completedRaces={allRaces.filter((r) => (r.Results?.length ?? 0) > 0)}
            constructorStandings={constructorStandings}
            getTeamColor={getTeamColor}
          />
        </div>
      )}

      {/* Teammate H2H */}
      <TeammateH2H driverStandings={driverStandings} allRaces={allRaces} />

      {/* Team Cards */}
      <h2 className="mb-4 text-lg font-bold text-f1-text-muted">
        Team Profiles &amp; Stats
      </h2>
      <div className="grid gap-6">
        {constructorStandings.map((s) => {
          const teamColor = getTeamColor(s.Constructor.constructorId);
          const stats = computeTeamStats(
            s.Constructor.constructorId,
            allRaces
          );
          const drivers = teamDrivers.get(s.Constructor.constructorId) ?? [];

          return (
            <div
              key={s.Constructor.constructorId}
              id={s.Constructor.constructorId}
              className="rounded-xl border border-f1-border bg-f1-card overflow-hidden"
            >
              {/* Team Header */}
              <div
                className="p-5"
                style={{
                  borderLeft: `4px solid ${teamColor}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-f1-dark px-2 py-1 text-xs font-bold text-f1-text-muted">
                        P{s.position}
                      </span>
                      <h3 className="text-2xl font-black">
                        {s.Constructor.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-f1-text-muted">
                      {s.Constructor.nationality}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black" style={{ color: teamColor }}>
                      {s.points}
                    </p>
                    <p className="text-xs text-f1-text-muted">POINTS</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
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
                    <p className="text-xs text-f1-text-muted">1-2</p>
                    <p className="text-lg font-black">{stats.oneTwo}</p>
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
                    <p className="text-xs text-f1-text-muted">2xPTS</p>
                    <p className="text-lg font-black">{stats.doublePoints}</p>
                  </div>
                </div>

                {/* Drivers */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {drivers.map((d) => {
                    const teamPts = parseFloat(s.points);
                    const driverPts = parseFloat(d.points);
                    const pct = teamPts > 0 ? Math.round((driverPts / teamPts) * 100) : 0;
                    return (
                    <Link
                      key={d.Driver.driverId}
                      href={`/drivers/${d.Driver.driverId}`}
                      className="flex flex-col rounded-lg bg-f1-dark p-3 transition-colors hover:bg-f1-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {getCountryFlag(d.Driver.nationality)}
                          </span>
                          <div>
                            <p className="font-medium">
                              {d.Driver.givenName}{" "}
                              <span className="font-bold uppercase">
                                {d.Driver.familyName}
                              </span>
                            </p>
                            <p className="text-xs text-f1-text-muted">
                              #{d.Driver.permanentNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{d.points} pts</p>
                          <p className="text-xs text-f1-text-muted">
                            P{d.position} &middot; {d.wins} wins
                          </p>
                        </div>
                      </div>
                      {teamPts > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-f1-text-muted mb-1">
                            <span>Contribution</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-f1-border overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: teamColor }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href={`/teams/${s.Constructor.constructorId}`}
                    className="text-xs font-medium text-f1-accent hover:underline"
                  >
                    View Team &rarr;
                  </Link>
                  <a
                    href={s.Constructor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-f1-text-muted hover:underline"
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

export default function TeamsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Constructors Championship
          </h1>
          <p className="mt-1 text-sm text-f1-text-muted">
            {CURRENT_YEAR} Season &middot; Full team stats and standings
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-lg bg-f1-card animate-pulse"
              />
            ))}
          </div>
        }
      >
        <TeamsContent />
      </Suspense>
    </div>
  );
}
