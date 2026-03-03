export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  getAllSeasonResults,
  getTeamColor,
  getCountryFlag,
  CURRENT_YEAR,
} from "@/lib/api";
import RefreshButton from "@/components/RefreshButton";

interface FastestLapEntry {
  round: string;
  raceName: string;
  country: string;
  driverName: string;
  driverId: string;
  nationality: string;
  team: string;
  constructorId: string;
  lapTime: string;
  lap: string;
  avgSpeed: string;
  racePosition: string;
}

async function FastestLapsContent() {
  const allRaces = await getAllSeasonResults();
  const completedRaces = allRaces.filter((r) => (r.Results?.length ?? 0) > 0);

  const entries: FastestLapEntry[] = [];

  for (const race of completedRaces) {
    const fl = (race.Results ?? []).find((r: any) => r.FastestLap?.rank === "1");
    if (!fl) continue;
    entries.push({
      round: race.round,
      raceName: race.raceName,
      country: race.Circuit.Location.country,
      driverName: `${fl.Driver.givenName} ${fl.Driver.familyName}`,
      driverId: fl.Driver.driverId,
      nationality: fl.Driver.nationality,
      team: fl.Constructor.name,
      constructorId: fl.Constructor.constructorId,
      lapTime: fl.FastestLap?.Time.time ?? "",
      lap: fl.FastestLap?.lap ?? "",
      avgSpeed: fl.FastestLap?.AverageSpeed?.speed
        ? `${fl.FastestLap.AverageSpeed.speed} ${fl.FastestLap.AverageSpeed.units}`
        : "",
      racePosition: fl.position,
    });
  }

  // Tally per driver
  const countMap = new Map<string, { name: string; constructorId: string; team: string; nationality: string; count: number }>();
  for (const e of entries) {
    const existing = countMap.get(e.driverId) ?? { name: e.driverName, constructorId: e.constructorId, team: e.team, nationality: e.nationality, count: 0 };
    countMap.set(e.driverId, { ...existing, count: existing.count + 1 });
  }
  const leaderboard = [...countMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count);

  // Fastest overall lap time
  let fastestEntry: FastestLapEntry | null = null;
  for (const e of entries) {
    if (!e.lapTime) continue;
    if (!fastestEntry) { fastestEntry = e; continue; }
    // Compare lap times (format: M:SS.mmm)
    const toMs = (t: string) => {
      const parts = t.split(":");
      if (parts.length === 2) return parseFloat(parts[0]) * 60000 + parseFloat(parts[1]) * 1000;
      return parseFloat(t) * 1000;
    };
    if (toMs(e.lapTime) < toMs(fastestEntry.lapTime)) fastestEntry = e;
  }

  if (completedRaces.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center">
        <p className="text-f1-text-muted">No race data available yet for {CURRENT_YEAR}.</p>
      </div>
    );
  }

  return (
    <>
      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Fastest lap leaderboard top driver */}
        {leaderboard[0] && (
          <div
            className="rounded-xl border border-f1-border bg-f1-card p-4"
            style={{ borderLeftColor: getTeamColor(leaderboard[0].constructorId), borderLeftWidth: 4 }}
          >
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Most Fastest Laps</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black">
                  {getCountryFlag(leaderboard[0].nationality)} {leaderboard[0].name.split(" ").at(-1)?.toUpperCase()}
                </p>
                <p className="text-xs text-f1-text-muted">{leaderboard[0].team}</p>
              </div>
              <p className="text-4xl font-black" style={{ color: getTeamColor(leaderboard[0].constructorId) }}>
                {leaderboard[0].count}
              </p>
            </div>
          </div>
        )}

        {/* Fastest lap of season */}
        {fastestEntry && (
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 border-l-4 border-l-purple-500">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Fastest Lap of Season</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-purple-400">{fastestEntry.lapTime}</p>
                <p className="text-xs text-f1-text-muted">
                  {getCountryFlag(fastestEntry.nationality)} {fastestEntry.driverName.split(" ").at(-1)?.toUpperCase()} &middot; {fastestEntry.raceName}
                </p>
              </div>
              {fastestEntry.avgSpeed && (
                <p className="text-xs text-f1-text-muted text-right">{fastestEntry.avgSpeed}</p>
              )}
            </div>
          </div>
        )}

        {/* Total races with FL data */}
        <div className="rounded-xl border border-f1-border bg-f1-card p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Races Recorded</p>
          <p className="text-4xl font-black">{entries.length}</p>
          <p className="text-xs text-f1-text-muted">of {completedRaces.length} completed</p>
        </div>
      </div>

      {/* Driver leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Fastest Lap Leaderboard</h2>
          </div>
          <div className="divide-y divide-f1-border/40">
            {leaderboard.map((d, i) => {
              const color = getTeamColor(d.constructorId);
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-6 text-sm font-bold text-f1-text-muted text-right">{i + 1}</span>
                  <span className="h-8 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">
                      {getCountryFlag(d.nationality)} {d.name}
                    </p>
                    <p className="text-xs text-f1-text-muted">{d.team}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: d.count }).map((_, j) => (
                      <span
                        key={j}
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color, opacity: 0.85 }}
                      />
                    ))}
                    <span className="ml-1 text-lg font-black" style={{ color }}>
                      {d.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-race fastest laps table */}
      {entries.length > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Race-by-Race Fastest Laps</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-3 w-12">Rd</th>
                  <th className="px-3 py-3">Grand Prix</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Team</th>
                  <th className="px-3 py-3 text-right">Time</th>
                  <th className="px-3 py-3 text-right hidden md:table-cell">Lap</th>
                  <th className="px-3 py-3 text-right hidden lg:table-cell">Avg Speed</th>
                  <th className="px-3 py-3 text-right hidden lg:table-cell">Race Pos</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const color = getTeamColor(e.constructorId);
                  const isFastest = e === fastestEntry;
                  return (
                    <tr
                      key={e.round}
                      className={`border-b border-f1-border/50 transition-colors hover:bg-f1-card/50 ${isFastest ? "bg-purple-500/5" : ""}`}
                    >
                      <td className="px-3 py-3 text-f1-text-muted font-bold">{e.round}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/race/${e.round}`}
                          className="hover:text-f1-accent transition-colors"
                        >
                          {e.raceName.replace(" Grand Prix", " GP")}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
                          <span>
                            {getCountryFlag(e.nationality)} {e.driverName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-f1-text-muted">{e.team}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-mono font-bold ${isFastest ? "text-purple-400" : ""}`}>
                          {e.lapTime}
                        </span>
                        {isFastest && (
                          <span className="ml-1 text-xs text-purple-400">★</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right hidden md:table-cell text-f1-text-muted">
                        {e.lap}
                      </td>
                      <td className="px-3 py-3 text-right hidden lg:table-cell text-f1-text-muted">
                        {e.avgSpeed}
                      </td>
                      <td className="px-3 py-3 text-right hidden lg:table-cell font-bold">
                        P{e.racePosition}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default function FastestLapsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Fastest Laps</h1>
          <p className="mt-1 text-sm text-f1-text-muted">
            {CURRENT_YEAR} Season &middot; Purple lap records race by race
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-24 rounded-xl bg-f1-card animate-pulse" />
            <div className="h-96 rounded-xl bg-f1-card animate-pulse" />
          </div>
        }
      >
        <FastestLapsContent />
      </Suspense>
    </div>
  );
}
