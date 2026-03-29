export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  getRaceWithResults,
  getQualifyingResults,
  getSprintResults,
  getPitStops,
  getTeamColor,
  getCountryFlag,
  getCountryFlagByCountry,
  getF1TVRaceUrl,
  getRaceDate,
  getOpenF1SessionKeyForRace,
  getOpenF1PitStops,
  getLiveDrivers,
  CURRENT_YEAR,
} from "@/lib/api";
import RefreshButton from "@/components/RefreshButton";
import QualifyingGapChart from "@/components/QualifyingGapChart";

async function RaceContent({ round }: { round: string }) {
  const [race, qualifying, sprint, pitStops] = await Promise.all([
    getRaceWithResults(round),
    getQualifyingResults(round),
    getSprintResults(round),
    getPitStops(round),
  ]);

  if (!race) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center">
        <p className="text-f1-text-muted">
          No results available for this race yet.
        </p>
        <Link
          href="/races"
          className="mt-3 inline-block text-sm text-f1-accent hover:underline"
        >
          &larr; Back to races
        </Link>
      </div>
    );
  }

  const results = race.Results ?? [];
  const flag = getCountryFlagByCountry(race.Circuit.Location.country);

  // Fetch OpenF1 pit box times (stationary duration) when available
  let pitBoxTimes = new Map<string, { duration: number; lap: number }[]>();
  const sessionKey = await getOpenF1SessionKeyForRace(race);
  if (sessionKey) {
    const [openF1Pits, openF1Drivers] = await Promise.all([
      getOpenF1PitStops(sessionKey),
      getLiveDrivers(sessionKey),
    ]);
    // Map driver_number -> driverId (from Ergast) via name matching
    const numberToId = new Map<number, string>();
    for (const d of openF1Drivers) {
      // Match by acronym to Ergast results
      const match = results.find(
        (r) =>
          r.Driver.code === d.name_acronym ||
          r.Driver.familyName.toUpperCase() === d.broadcast_name?.split(" ").pop()?.toUpperCase()
      );
      if (match) numberToId.set(d.driver_number, match.Driver.driverId);
    }
    for (const p of openF1Pits) {
      if (p.pit_duration == null) continue;
      const driverId = numberToId.get(p.driver_number);
      if (!driverId) continue;
      const arr = pitBoxTimes.get(driverId) ?? [];
      arr.push({ duration: p.pit_duration, lap: p.lap_number });
      pitBoxTimes.set(driverId, arr);
    }
  }

  return (
    <>
      {/* Race Header */}
      <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-f1-dark px-2 py-0.5 text-xs font-bold text-f1-text-muted">
                ROUND {race.round}
              </span>
            </div>
            <h2 className="text-2xl font-black">
              {flag} {race.raceName}
            </h2>
            <p className="mt-1 text-sm text-f1-text-muted">
              {race.Circuit.circuitName} &middot;{" "}
              {race.Circuit.Location.locality},{" "}
              {race.Circuit.Location.country}
            </p>
            <p className="mt-1 text-sm text-f1-text-muted">
              {getRaceDate(race).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={getF1TVRaceUrl(race)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-f1-red px-4 py-2 text-sm font-bold text-white hover:bg-f1-red-dark transition-colors"
            >
              Watch on F1TV &rarr;
            </a>
            <a
              href={race.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-f1-dark px-4 py-2 text-sm font-medium text-f1-accent hover:bg-f1-border transition-colors"
            >
              Wikipedia
            </a>
          </div>
        </div>

        {/* Podium */}
        {results.length >= 3 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[results[1], results[0], results[2]].map((r, i) => {
              const podiumPos = [2, 1, 3][i];
              const teamColor = getTeamColor(r.Constructor.constructorId);
              const heights = ["h-24", "h-32", "h-20"];

              return (
                <div key={r.Driver.driverId} className="text-center">
                  <p className="text-sm font-medium">
                    {getCountryFlag(r.Driver.nationality)}{" "}
                    {r.Driver.givenName}{" "}
                    <span className="font-bold uppercase">
                      {r.Driver.familyName}
                    </span>
                  </p>
                  <p className="text-xs text-f1-text-muted">
                    {r.Constructor.name}
                  </p>
                  {r.Time && (
                    <p className="text-xs text-f1-text-muted mt-0.5">
                      {r.Time.time}
                    </p>
                  )}
                  <div
                    className={`mt-2 ${heights[i]} rounded-t-lg flex items-center justify-center`}
                    style={{ backgroundColor: teamColor + "33" }}
                  >
                    <span
                      className="text-4xl font-black"
                      style={{ color: teamColor }}
                    >
                      {podiumPos}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Race Results */}
      {results.length > 0 && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h3 className="font-bold text-lg">Race Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-3 w-12">Pos</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Team</th>
                  <th className="px-3 py-3 text-center">Grid</th>
                  <th className="px-3 py-3 text-center hidden md:table-cell">
                    Laps
                  </th>
                  <th className="px-3 py-3">Time / Status</th>
                  <th className="px-3 py-3 text-right">Points</th>
                  <th className="px-3 py-3 text-center hidden lg:table-cell">
                    FL
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const teamColor = getTeamColor(r.Constructor.constructorId);
                  const gridPos = parseInt(r.grid);
                  const gridDiff = gridPos > 0 ? gridPos - parseInt(r.position) : 0;
                  const isFastestLap = r.FastestLap?.rank === "1";

                  return (
                    <tr
                      key={r.Driver.driverId}
                      className={`border-b border-f1-border/50 transition-colors hover:bg-f1-card/50 ${
                        isFastestLap ? "bg-purple-500/5" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-bold">{r.position}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-6 w-1 rounded-full"
                            style={{ backgroundColor: teamColor }}
                          />
                          <span>
                            {getCountryFlag(r.Driver.nationality)}{" "}
                            {r.Driver.givenName}{" "}
                            <span className="font-bold uppercase">
                              {r.Driver.familyName}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-f1-text-muted">
                        {r.Constructor.name}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span>{r.grid}</span>
                        {gridDiff !== 0 && (
                          <span
                            className={`ml-1 text-xs ${
                              gridDiff > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {gridDiff > 0 ? `+${gridDiff}` : gridDiff}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center hidden md:table-cell text-f1-text-muted">
                        {r.laps}
                      </td>
                      <td className="px-3 py-3 text-f1-text-muted">
                        {r.Time?.time ?? r.status}
                      </td>
                      <td className="px-3 py-3 text-right font-bold">
                        {r.points !== "0" ? r.points : ""}
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        {isFastestLap && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-400">
                            {r.FastestLap?.Time?.time}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sprint Race Results */}
      {sprint.length > 0 && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4 flex items-center gap-2">
            <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">SPRINT</span>
            <h3 className="font-bold text-lg">Sprint Race Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-3 w-12">Pos</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Team</th>
                  <th className="px-3 py-3 text-center">Grid</th>
                  <th className="px-3 py-3 hidden md:table-cell text-center">Laps</th>
                  <th className="px-3 py-3">Time / Status</th>
                  <th className="px-3 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {sprint.map((r) => {
                  const teamColor = getTeamColor(r.Constructor.constructorId);
                  const gridPos = parseInt(r.grid);
                  const gridDiff = gridPos > 0 ? gridPos - parseInt(r.position) : 0;
                  return (
                    <tr
                      key={r.Driver.driverId}
                      className="border-b border-f1-border/50 transition-colors hover:bg-f1-card/50"
                    >
                      <td className="px-3 py-3 font-bold">{r.position}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-1 rounded-full" style={{ backgroundColor: teamColor }} />
                          <span>
                            {getCountryFlag(r.Driver.nationality)}{" "}
                            {r.Driver.givenName}{" "}
                            <span className="font-bold uppercase">{r.Driver.familyName}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-f1-text-muted">{r.Constructor.name}</td>
                      <td className="px-3 py-3 text-center">
                        <span>{r.grid}</span>
                        {gridDiff !== 0 && (
                          <span className={`ml-1 text-xs ${gridDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                            {gridDiff > 0 ? `+${gridDiff}` : gridDiff}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-center text-f1-text-muted">{r.laps}</td>
                      <td className="px-3 py-3 text-f1-text-muted">{r.Time?.time ?? r.status}</td>
                      <td className="px-3 py-3 text-right font-bold">{r.points !== "0" ? r.points : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pit Stop Statistics */}
      {pitStops.length > 0 && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h3 className="font-bold text-lg">Pit Stop Analysis</h3>
          </div>
          <div className="p-4">
            {(() => {
              const hasPitBox = pitBoxTimes.size > 0;

              // Build per-driver summaries using pit box times when available
              const byDriver = new Map<string, typeof pitStops>();
              for (const p of pitStops) {
                const arr = byDriver.get(p.driverId) ?? [];
                arr.push(p);
                byDriver.set(p.driverId, arr);
              }

              const driverSummaries = [...byDriver.entries()]
                .map(([id, stops]) => {
                  const boxStops = pitBoxTimes.get(id);
                  const fastestBox = boxStops?.reduce((best, s) => s.duration < best.duration ? s : best);
                  const fastestLane = stops.reduce((best, s) => parseFloat(s.duration) < parseFloat(best.duration) ? s : best);
                  return {
                    driverId: id,
                    stops: stops.length,
                    // Prefer pit box time from OpenF1; fall back to pit lane time from Ergast
                    fastestDuration: fastestBox ? fastestBox.duration : parseFloat(fastestLane.duration),
                    fastestLap: fastestBox ? String(fastestBox.lap) : fastestLane.lap,
                    fastestStop: fastestLane.stop,
                    isPitBox: !!fastestBox,
                  };
                })
                .sort((a, b) => a.fastestDuration - b.fastestDuration);

              const fastest = driverSummaries[0];

              return (
                <>
                  {/* Fastest stop highlight */}
                  {fastest && (
                    <div className="mb-4 rounded-lg bg-f1-dark p-3 flex items-center gap-4">
                      <div>
                        <p className="text-xs text-f1-text-muted uppercase tracking-wider font-bold mb-0.5">
                          Fastest Pit {hasPitBox ? "Box" : "Lane"} Time
                        </p>
                        <p className="font-bold text-f1-accent">{fastest.driverId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-2xl font-black">{fastest.fastestDuration.toFixed(3)}s</p>
                        <p className="text-xs text-f1-text-muted">Lap {fastest.fastestLap} &middot; Stop {fastest.fastestStop}</p>
                      </div>
                    </div>
                  )}
                  {/* Per-driver summary */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                          <th className="px-2 py-2">Driver</th>
                          <th className="px-2 py-2 text-center">Stops</th>
                          <th className="px-2 py-2 text-right">
                            {hasPitBox ? "Pit Box Time" : "Pit Lane Time"}
                          </th>
                          <th className="px-2 py-2 text-right hidden sm:table-cell">On Lap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverSummaries.map((d) => {
                          const raceResult = results.find((r) => r.Driver.driverId === d.driverId);
                          const color = raceResult ? getTeamColor(raceResult.Constructor.constructorId) : "#888";
                          const isFastest = d.driverId === fastest?.driverId;
                          return (
                            <tr key={d.driverId} className={`border-b border-f1-border/50 ${isFastest ? "bg-f1-accent/5" : ""}`}>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
                                  <span className="capitalize">{d.driverId.replace(/_/g, " ")}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center">{d.stops}</td>
                              <td className={`px-2 py-2 text-right font-mono font-bold ${isFastest ? "text-f1-accent" : ""}`}>
                                {d.fastestDuration.toFixed(3)}s
                              </td>
                              <td className="px-2 py-2 text-right hidden sm:table-cell text-f1-text-muted">
                                {d.fastestLap}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Qualifying Gap Chart */}
      <QualifyingGapChart qualifying={qualifying} />

      {/* Qualifying Results */}
      {qualifying.length > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h3 className="font-bold text-lg">Qualifying Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-3 w-12">Pos</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Team</th>
                  <th className="px-3 py-3 text-right">Q1</th>
                  <th className="px-3 py-3 text-right">Q2</th>
                  <th className="px-3 py-3 text-right">Q3</th>
                </tr>
              </thead>
              <tbody>
                {qualifying.map((q) => {
                  const teamColor = getTeamColor(
                    q.Constructor.constructorId
                  );
                  return (
                    <tr
                      key={q.Driver.driverId}
                      className="border-b border-f1-border/50 transition-colors hover:bg-f1-card/50"
                    >
                      <td className="px-3 py-3 font-bold">{q.position}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-6 w-1 rounded-full"
                            style={{ backgroundColor: teamColor }}
                          />
                          <span>
                            {getCountryFlag(q.Driver.nationality)}{" "}
                            {q.Driver.givenName}{" "}
                            <span className="font-bold uppercase">
                              {q.Driver.familyName}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-f1-text-muted">
                        {q.Constructor.name}
                      </td>
                      <td className="px-3 py-3 text-right text-f1-text-muted">
                        {q.Q1 ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-right text-f1-text-muted">
                        {q.Q2 ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {q.Q3 ?? "-"}
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

export default async function RacePage({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round } = await params;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/races"
            className="text-sm text-f1-accent hover:underline"
          >
            &larr; Back to calendar
          </Link>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Race Details
          </h1>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-48 rounded-xl bg-f1-card animate-pulse" />
            <div className="h-96 rounded-xl bg-f1-card animate-pulse" />
          </div>
        }
      >
        <RaceContent round={round} />
      </Suspense>
    </div>
  );
}
