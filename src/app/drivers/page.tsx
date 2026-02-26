export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  getDriverStandings,
  getAllSeasonResults,
  getTeamColor,
  getCountryFlag,
  CURRENT_YEAR,
} from "@/lib/api";
import StandingsTable from "@/components/StandingsTable";
import RefreshButton from "@/components/RefreshButton";
import PointsProgressionChart from "@/components/PointsProgressionChart";

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
  allRaces: any[]
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
  const [standings, allRaces] = await Promise.all([
    getDriverStandings(),
    getAllSeasonResults(),
  ]);

  // Completed races only (have Results)
  const completedRaces = allRaces.filter((r) => (r.Results?.length ?? 0) > 0);

  return (
    <>
      {/* Full Standings Table */}
      <div className="mb-10 rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border p-4">
          <h2 className="font-bold text-lg">Championship Standings</h2>
        </div>
        <StandingsTable standings={standings} />
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
                <div className="text-right">
                  <span className="text-3xl font-black text-f1-text-muted/30">
                    {s.Driver.permanentNumber || "#"}
                  </span>
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
