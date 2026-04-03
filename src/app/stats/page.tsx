export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getAllSeasonResults,
  getAllSprintResults,
  getDriverStandings,
  getConstructorStandings,
  getPitStops,
  getTeamColor,
  getCountryFlag,
  CURRENT_YEAR,
} from "@/lib/api";
import RefreshButton from "@/components/RefreshButton";

export const metadata: Metadata = {
  title: "Season Stats — F1 2026",
  description: "Win distributions, podium leaders, points trends, and pit stop analysis",
};

async function StatsContent() {
  const [allRaces, sprintRaces, driverStandings, constructorStandings] = await Promise.all([
    getAllSeasonResults(),
    getAllSprintResults(),
    getDriverStandings(),
    getConstructorStandings(),
  ]);

  // Fetch pit stops for all completed races in parallel
  const completedRounds = allRaces
    .filter((r) => (r.Results?.length ?? 0) > 0)
    .map((r) => r.round);
  const pitStopsByRound = await Promise.all(
    completedRounds.map(async (round) => ({ round, stops: await getPitStops(round) }))
  );

  const completedRaces = allRaces.filter((r) => (r.Results?.length ?? 0) > 0);
  const completedSprints = sprintRaces.filter((r) => (r.SprintResults?.length ?? 0) > 0);

  if (completedRaces.length === 0 && completedSprints.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center">
        <p className="text-f1-text-muted">No race data available yet for {CURRENT_YEAR}.</p>
      </div>
    );
  }

  // --- Compute stats ---

  // Positions gained/lost per driver (aggregate across season)
  const posGainMap = new Map<string, { name: string; constructorId: string; nationality: string; gained: number; races: number }>();
  // Most positions gained in a single race
  let biggestGain = { driverName: "", gain: 0, raceName: "", constructorId: "" };
  let biggestLoss = { driverName: "", loss: 0, raceName: "", constructorId: "" };
  // DNFs per team
  const teamDNFMap = new Map<string, { name: string; constructorId: string; dnfs: number }>();
  // Total points scored this season
  let totalPoints = 0;
  // Laps led approximation (count race wins + gaps)
  const lapsLedMap = new Map<string, { name: string; constructorId: string; nationality: string; laps: number }>();
  // Points per race per driver
  const pprMap = new Map<string, { name: string; constructorId: string; nationality: string; totalPts: number; races: number }>();
  // Overtakes (positions gained) per race
  const overtakesByRace: { raceName: string; round: string; total: number }[] = [];

  for (const race of completedRaces) {
    const results = race.Results ?? [];
    let raceOvertakes = 0;

    for (const r of results) {
      const id = r.Driver.driverId;
      const name = `${r.Driver.givenName} ${r.Driver.familyName}`;
      const cid = r.Constructor.constructorId;
      const pos = parseInt(r.position);
      const grid = parseInt(r.grid);
      const pts = parseFloat(r.points);
      const isDnf = r.status !== "Finished" && !r.status.startsWith("+");

      totalPoints += pts;

      // Position gain/loss
      if (grid > 0 && pos > 0) {
        const gain = grid - pos; // positive = moved forward
        raceOvertakes += Math.max(0, gain);

        const existing = posGainMap.get(id) ?? { name, constructorId: cid, nationality: r.Driver.nationality, gained: 0, races: 0 };
        posGainMap.set(id, { ...existing, gained: existing.gained + gain, races: existing.races + 1 });

        if (gain > biggestGain.gain) biggestGain = { driverName: name, gain, raceName: race.raceName, constructorId: cid };
        if (gain < -biggestLoss.loss) biggestLoss = { driverName: name, loss: -gain, raceName: race.raceName, constructorId: cid };
      }

      // DNFs per team
      if (isDnf) {
        const t = teamDNFMap.get(cid) ?? { name: r.Constructor.name, constructorId: cid, dnfs: 0 };
        teamDNFMap.set(cid, { ...t, dnfs: t.dnfs + 1 });
      }

      // PPR
      const ppr = pprMap.get(id) ?? { name, constructorId: cid, nationality: r.Driver.nationality, totalPts: 0, races: 0 };
      pprMap.set(id, { ...ppr, totalPts: ppr.totalPts + pts, races: ppr.races + 1 });

      // Laps led (approximate: winner led most laps; use race laps as proxy for P1)
      if (pos === 1) {
        const laps = parseInt(r.laps) || 0;
        const ll = lapsLedMap.get(id) ?? { name, constructorId: cid, nationality: r.Driver.nationality, laps: 0 };
        lapsLedMap.set(id, { ...ll, laps: ll.laps + laps });
      }
    }

    overtakesByRace.push({ raceName: race.raceName.replace(" Grand Prix", " GP"), round: race.round, total: raceOvertakes });
  }

  // Include sprint results in stats
  for (const sprintRace of completedSprints) {
    const results = sprintRace.SprintResults ?? [];

    for (const r of results) {
      const id = r.Driver.driverId;
      const name = `${r.Driver.givenName} ${r.Driver.familyName}`;
      const cid = r.Constructor.constructorId;
      const pos = parseInt(r.position);
      const grid = parseInt(r.grid);
      const pts = parseFloat(r.points);
      const isDnf = r.status !== "Finished" && !r.status.startsWith("+");

      totalPoints += pts;

      // Position gain/loss from sprint
      if (grid > 0 && pos > 0) {
        const gain = grid - pos;
        const existing = posGainMap.get(id) ?? { name, constructorId: cid, nationality: r.Driver.nationality, gained: 0, races: 0 };
        posGainMap.set(id, { ...existing, gained: existing.gained + gain, races: existing.races + 1 });
      }

      // DNFs from sprint
      if (isDnf) {
        const t = teamDNFMap.get(cid) ?? { name: r.Constructor.name, constructorId: cid, dnfs: 0 };
        teamDNFMap.set(cid, { ...t, dnfs: t.dnfs + 1 });
      }

      // PPR — add sprint points to the driver total but don't increment race count
      // (sprint is part of the same race weekend, not a separate entry)
      const ppr = pprMap.get(id) ?? { name, constructorId: cid, nationality: r.Driver.nationality, totalPts: 0, races: 0 };
      pprMap.set(id, { ...ppr, totalPts: ppr.totalPts + pts });
    }
  }

  // Sorted lists
  const posGainSorted = [...posGainMap.values()]
    .map((d) => ({ ...d, avgGain: d.gained / d.races }))
    .sort((a, b) => b.gained - a.gained)
    .slice(0, 10);

  const teamDNFSorted = [...teamDNFMap.values()].sort((a, b) => b.dnfs - a.dnfs);
  const pprSorted = [...pprMap.values()]
    .filter((d) => d.races >= 1)
    .map((d) => ({ ...d, ppr: d.totalPts / d.races }))
    .sort((a, b) => b.ppr - a.ppr)
    .slice(0, 10);

  const lapsLedSorted = [...lapsLedMap.values()].sort((a, b) => b.laps - a.laps);

  const overtakesByRaceSorted = [...overtakesByRace].sort((a, b) => b.total - a.total);

  // --- Pit stop stats ---
  // Build a map of driverId -> constructorId from race results
  const driverTeamMap = new Map<string, string>();
  const driverNameMap = new Map<string, string>();
  for (const race of completedRaces) {
    for (const r of race.Results ?? []) {
      driverTeamMap.set(r.Driver.driverId, r.Constructor.constructorId);
      driverNameMap.set(r.Driver.driverId, r.Constructor.name);
    }
  }

  const teamPitMap = new Map<string, { name: string; constructorId: string; totalDuration: number; count: number; fastest: number }>();
  let fastestPitStop = { driverId: "", raceName: "", duration: Infinity, constructorId: "" };
  let totalPitStops = 0;

  // Build round -> race lookup map to avoid O(n²) .find() inside the loop
  const raceByRound = new Map(completedRaces.map((r) => [r.round, r]));

  for (const { round, stops } of pitStopsByRound) {
    const race = raceByRound.get(round);
    for (const stop of stops) {
      const dur = parseFloat(stop.duration);
      if (isNaN(dur) || dur <= 0) continue;
      totalPitStops++;

      const cid = driverTeamMap.get(stop.driverId) ?? "";
      const cname = driverNameMap.get(stop.driverId) ?? "";

      if (cid) {
        const t = teamPitMap.get(cid) ?? { name: cname, constructorId: cid, totalDuration: 0, count: 0, fastest: Infinity };
        teamPitMap.set(cid, {
          ...t,
          totalDuration: t.totalDuration + dur,
          count: t.count + 1,
          fastest: Math.min(t.fastest, dur),
        });
      }

      if (dur < fastestPitStop.duration) {
        fastestPitStop = { driverId: stop.driverId, raceName: race?.raceName ?? "", duration: dur, constructorId: cid };
      }
    }
  }

  const teamPitSorted = [...teamPitMap.values()]
    .filter((t) => t.count >= 2)
    .map((t) => ({ ...t, avg: t.totalDuration / t.count }))
    .sort((a, b) => a.avg - b.avg);

  // --- Consistency stats (finish position variance) ---
  const consistencyMap = new Map<string, { name: string; constructorId: string; nationality: string; positions: number[] }>();
  for (const race of completedRaces) {
    for (const r of race.Results ?? []) {
      const id = r.Driver.driverId;
      const pos = parseInt(r.position);
      const isDnf = r.status !== "Finished" && !r.status.startsWith("+");
      if (isDnf) continue; // exclude DNFs from consistency
      const existing = consistencyMap.get(id) ?? {
        name: `${r.Driver.givenName} ${r.Driver.familyName}`,
        constructorId: r.Constructor.constructorId,
        nationality: r.Driver.nationality,
        positions: [],
      };
      existing.positions.push(pos);
      consistencyMap.set(id, existing);
    }
  }

  const consistencySorted = [...consistencyMap.values()]
    .filter((d) => d.positions.length >= 3)
    .map((d) => {
      const avg = d.positions.reduce((a, b) => a + b, 0) / d.positions.length;
      const variance = d.positions.reduce((s, p) => s + (p - avg) ** 2, 0) / d.positions.length;
      const stdDev = Math.sqrt(variance);
      return { ...d, avg, stdDev };
    })
    .sort((a, b) => a.stdDev - b.stdDev)
    .slice(0, 10);

  // --- Championship Evolution (points after each round, top 8 drivers) ---
  // Build a map: driverId -> { name, constructorId, cumulativePoints[] }
  const champEvolutionMap = new Map<string, { driverId: string; name: string; constructorId: string; points: number[] }>();
  const driverPointsAfterRound = new Map<string, number>(); // running total per driver

  // Pre-build a driver info lookup to avoid repeated flatMap+find (O(n²) -> O(1))
  const driverInfoMap = new Map<string, { name: string; constructorId: string }>();
  for (const race of completedRaces) {
    for (const r of race.Results ?? []) {
      if (!driverInfoMap.has(r.Driver.driverId)) {
        driverInfoMap.set(r.Driver.driverId, {
          name: `${r.Driver.givenName} ${r.Driver.familyName}`,
          constructorId: r.Constructor.constructorId,
        });
      }
    }
  }

  for (const race of completedRaces) {
    // Add this round's points for each driver
    for (const r of race.Results ?? []) {
      const id = r.Driver.driverId;
      const prev = driverPointsAfterRound.get(id) ?? 0;
      driverPointsAfterRound.set(id, prev + parseFloat(r.points));
    }
    // Record snapshot for this round
    for (const [id, pts] of driverPointsAfterRound.entries()) {
      const entry = champEvolutionMap.get(id);
      if (entry) {
        entry.points.push(pts);
      } else {
        const info = driverInfoMap.get(id);
        if (info) {
          champEvolutionMap.set(id, {
            driverId: id,
            name: info.name,
            constructorId: info.constructorId,
            points: [pts],
          });
        }
      }
    }
  }
  const champEvolution = [...champEvolutionMap.values()];

  // Pad shorter series to match length
  const numRounds = completedRaces.length;
  for (const entry of champEvolution) {
    while (entry.points.length < numRounds) {
      entry.points.unshift(0); // pad start with 0 for drivers who didn't participate every round
    }
  }

  // Keep top 8 by final points total
  const top8Evolution = [...champEvolution]
    .sort((a, b) => (b.points.at(-1) ?? 0) - (a.points.at(-1) ?? 0))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Season summary KPIs */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Races Complete</p>
          <p className="text-4xl font-black">{completedRaces.length}</p>
          {completedSprints.length > 0 && (
            <p className="text-xs text-f1-text-muted mt-0.5">+ {completedSprints.length} sprint{completedSprints.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Total Points</p>
          <p className="text-4xl font-black">{Math.round(totalPoints)}</p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Total DNFs</p>
          <p className="text-4xl font-black">
            {[...teamDNFMap.values()].reduce((s, t) => s + t.dnfs, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Drivers</p>
          <p className="text-4xl font-black">{driverStandings.length}</p>
        </div>
      </div>

      {/* Biggest single-race gains and losses */}
      <div className="grid gap-4 sm:grid-cols-2">
        {biggestGain.gain > 0 && (
          <div
            className="rounded-xl border border-f1-border bg-f1-card p-5"
            style={{ borderLeftColor: getTeamColor(biggestGain.constructorId), borderLeftWidth: 4 }}
          >
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-2">Best Single-Race Gain</p>
            <p className="text-3xl font-black text-green-400">+{biggestGain.gain} pos</p>
            <p className="font-semibold mt-1">{biggestGain.driverName}</p>
            <p className="text-xs text-f1-text-muted">{biggestGain.raceName.replace(" Grand Prix", " GP")}</p>
          </div>
        )}
        {biggestLoss.loss > 0 && (
          <div
            className="rounded-xl border border-f1-border bg-f1-card p-5"
            style={{ borderLeftColor: getTeamColor(biggestLoss.constructorId), borderLeftWidth: 4 }}
          >
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-2">Worst Single-Race Drop</p>
            <p className="text-3xl font-black text-red-400">-{biggestLoss.loss} pos</p>
            <p className="font-semibold mt-1">{biggestLoss.driverName}</p>
            <p className="text-xs text-f1-text-muted">{biggestLoss.raceName.replace(" Grand Prix", " GP")}</p>
          </div>
        )}
      </div>

      {/* Positions gained season total */}
      {posGainSorted.length > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Season Positions Gained</h2>
            <p className="text-xs text-f1-text-muted mt-0.5">Total grid positions gained from start to finish across all races (positive = moved forward)</p>
          </div>
          <div className="divide-y divide-f1-border/40">
            {posGainSorted.map((d, i) => {
              const color = getTeamColor(d.constructorId);
              const maxGain = posGainSorted[0]?.gained ?? 1;
              const pct = Math.max(0, (d.gained / maxGain) * 100);
              return (
                <div key={d.name} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-f1-text-muted text-right">{i + 1}</span>
                  <span className="h-7 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{getCountryFlag(d.nationality)} {d.name}</p>
                      <p className={`text-sm font-black ${d.gained >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {d.gained >= 0 ? "+" : ""}{d.gained}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-f1-dark">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
                      />
                    </div>
                    <p className="text-xs text-f1-text-muted mt-0.5">avg {d.avgGain >= 0 ? "+" : ""}{d.avgGain.toFixed(1)} per race</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Points per race */}
      {pprSorted.length > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Points Per Race</h2>
            <p className="text-xs text-f1-text-muted mt-0.5">Average championship points scored per race entry</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-3 w-10">Rank</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3 text-right">PPR</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right hidden sm:table-cell">Races</th>
                </tr>
              </thead>
              <tbody>
                {pprSorted.map((d, i) => {
                  const color = getTeamColor(d.constructorId);
                  return (
                    <tr key={d.name} className="border-b border-f1-border/50 hover:bg-f1-card/50">
                      <td className="px-3 py-3 font-bold text-f1-text-muted">{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
                          {getCountryFlag(d.nationality)} {d.name}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-black text-f1-accent">
                        {d.ppr.toFixed(1)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold">{Math.round(d.totalPts)}</td>
                      <td className="px-3 py-3 text-right hidden sm:table-cell text-f1-text-muted">{d.races}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Team DNF breakdown */}
        {teamDNFSorted.length > 0 && (
          <div className="rounded-xl border border-f1-border bg-f1-card">
            <div className="border-b border-f1-border p-4">
              <h2 className="font-bold text-lg">DNFs by Team</h2>
            </div>
            <div className="divide-y divide-f1-border/40">
              {teamDNFSorted.map((t) => {
                const color = getTeamColor(t.constructorId);
                const maxDnf = teamDNFSorted[0]?.dnfs ?? 1;
                return (
                  <div key={t.constructorId} className="px-4 py-3 flex items-center gap-3">
                    <span className="h-6 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-sm font-black text-red-400">{t.dnfs}</p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-f1-dark">
                        <div
                          className="h-full rounded-full bg-red-500/60"
                          style={{ width: `${(t.dnfs / maxDnf) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Laps led (approximation via winner's laps) */}
        {lapsLedSorted.length > 0 && (
          <div className="rounded-xl border border-f1-border bg-f1-card">
            <div className="border-b border-f1-border p-4">
              <h2 className="font-bold text-lg">Race Winning Laps</h2>
              <p className="text-xs text-f1-text-muted mt-0.5">Total laps completed as race winner</p>
            </div>
            <div className="divide-y divide-f1-border/40">
              {lapsLedSorted.map((d, i) => {
                const color = getTeamColor(d.constructorId);
                const maxLaps = lapsLedSorted[0]?.laps ?? 1;
                return (
                  <div key={d.name} className="px-4 py-3 flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-f1-text-muted text-right">{i + 1}</span>
                    <span className="h-6 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {getCountryFlag(d.nationality)} {d.name}
                        </p>
                        <p className="text-sm font-black" style={{ color }}>{d.laps}</p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-f1-dark">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(d.laps / maxLaps) * 100}%`, backgroundColor: color, opacity: 0.75 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Overtakes by race */}
      {overtakesByRaceSorted.length > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Overtakes by Grand Prix</h2>
            <p className="text-xs text-f1-text-muted mt-0.5">Total positions gained from grid to finish across all drivers (proxy for racing action)</p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {overtakesByRaceSorted.map((r) => {
                const maxTotal = overtakesByRaceSorted[0]?.total ?? 1;
                return (
                  <div key={r.round} className="flex items-center gap-3">
                    <span className="text-xs text-f1-text-muted w-5 text-right">{r.round}</span>
                    <span className="text-xs text-f1-text truncate w-24 flex-shrink-0">{r.raceName}</span>
                    <div className="flex-1 h-5 rounded overflow-hidden bg-f1-dark flex items-center">
                      <div
                        className="h-full rounded bg-f1-accent/60 flex items-center justify-end pr-1.5 transition-all"
                        style={{ width: `${Math.max(2, (r.total / maxTotal) * 100)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{r.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pit Stop Statistics */}
      {teamPitSorted.length > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Pit Stop Performance by Team</h2>
            <p className="text-xs text-f1-text-muted mt-0.5">
              Average pit stop duration (seconds) across {totalPitStops} stops this season
            </p>
          </div>
          {fastestPitStop.duration < Infinity && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs text-f1-text-muted">
                Fastest stop: <span className="font-bold text-green-400">{fastestPitStop.duration.toFixed(1)}s</span>
                {" "}— {fastestPitStop.raceName.replace(" Grand Prix", " GP")}
              </p>
            </div>
          )}
          <div className="divide-y divide-f1-border/40">
            {teamPitSorted.map((t, i) => {
              const color = getTeamColor(t.constructorId);
              const maxAvg = teamPitSorted[teamPitSorted.length - 1]?.avg ?? 1;
              const minAvg = teamPitSorted[0]?.avg ?? 0;
              const range = maxAvg - minAvg || 1;
              // Invert: fastest team gets longest bar
              const pct = Math.max(10, ((maxAvg - t.avg) / range) * 80 + 20);
              return (
                <div key={t.constructorId} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-f1-text-muted text-right">{i + 1}</span>
                  <span className="h-6 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{t.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-f1-text-muted">{t.count} stops</span>
                        <span className="text-sm font-black" style={{ color }}>{t.avg.toFixed(2)}s</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-f1-dark">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.75 }}
                      />
                    </div>
                    <p className="text-xs text-f1-text-muted mt-0.5">fastest: {t.fastest.toFixed(1)}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Driver Consistency */}
      {consistencySorted.length > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Driver Consistency</h2>
            <p className="text-xs text-f1-text-muted mt-0.5">Lowest standard deviation in finishing position (excluding DNFs) — most consistent performers</p>
          </div>
          <div className="divide-y divide-f1-border/40">
            {consistencySorted.map((d, i) => {
              const color = getTeamColor(d.constructorId);
              const maxStd = consistencySorted[consistencySorted.length - 1]?.stdDev ?? 1;
              // Invert: lower stdDev = longer bar (more consistent)
              const pct = Math.max(10, ((maxStd - d.stdDev) / (maxStd || 1)) * 80 + 20);
              return (
                <div key={d.name} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-f1-text-muted text-right">{i + 1}</span>
                  <span className="h-7 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{getCountryFlag(d.nationality)} {d.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-f1-text-muted">avg P{d.avg.toFixed(1)}</span>
                        <span className="text-sm font-black" style={{ color }}>&plusmn;{d.stdDev.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-f1-dark">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Championship Points Evolution */}
      {top8Evolution.length > 0 && numRounds > 1 && (
        <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold text-lg">Championship Evolution</h2>
            <p className="text-xs text-f1-text-muted mt-0.5">
              Cumulative points for top drivers after each round
            </p>
          </div>
          <div className="p-4">
            {/* SVG sparkline chart */}
            {(() => {
              const W = 800;
              const H = 220;
              const PAD = { top: 16, right: 24, bottom: 32, left: 48 };
              const chartW = W - PAD.left - PAD.right;
              const chartH = H - PAD.top - PAD.bottom;
              const maxPts = Math.max(...top8Evolution.map((d) => d.points.at(-1) ?? 0));

              const xScale = (i: number) =>
                PAD.left + (i / Math.max(numRounds - 1, 1)) * chartW;
              const yScale = (pts: number) =>
                PAD.top + chartH - (pts / (maxPts || 1)) * chartH;

              return (
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full"
                  style={{ maxHeight: 240 }}
                >
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const y = PAD.top + chartH * (1 - frac);
                    const pts = Math.round(maxPts * frac);
                    return (
                      <g key={frac}>
                        <line
                          x1={PAD.left}
                          x2={W - PAD.right}
                          y1={y}
                          y2={y}
                          stroke="currentColor"
                          strokeOpacity={0.08}
                          strokeWidth={1}
                        />
                        <text
                          x={PAD.left - 6}
                          y={y + 4}
                          textAnchor="end"
                          fontSize={10}
                          fill="currentColor"
                          opacity={0.4}
                        >
                          {pts}
                        </text>
                      </g>
                    );
                  })}

                  {/* Round labels on x-axis */}
                  {completedRaces.map((race, i) => {
                    if (i % Math.max(1, Math.floor(numRounds / 8)) !== 0) return null;
                    return (
                      <text
                        key={race.round}
                        x={xScale(i)}
                        y={H - 6}
                        textAnchor="middle"
                        fontSize={9}
                        fill="currentColor"
                        opacity={0.35}
                      >
                        R{race.round}
                      </text>
                    );
                  })}

                  {/* Lines per driver */}
                  {top8Evolution.map((driver) => {
                    const color = getTeamColor(driver.constructorId);
                    const points = driver.points.map((pts, i) => ({
                      x: xScale(i),
                      y: yScale(pts),
                    }));
                    const d = points
                      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                      .join(" ");
                    const last = points.at(-1)!;
                    const shortName = driver.name.split(" ").pop() ?? driver.name;

                    return (
                      <g key={driver.driverId}>
                        <path
                          d={d}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={0.85}
                        />
                        {/* Label at end of line */}
                        <text
                          x={last.x + 4}
                          y={last.y + 4}
                          fontSize={9}
                          fill={color}
                          fontWeight="bold"
                        >
                          {shortName}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-3">
              {top8Evolution.map((d) => {
                const color = getTeamColor(d.constructorId);
                const shortName = d.name.split(" ").pop() ?? d.name;
                return (
                  <div key={d.driverId} className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full inline-block" style={{ backgroundColor: color }} />
                    <span className="text-xs text-f1-text-muted">{shortName}</span>
                    <span className="text-xs font-bold" style={{ color }}>
                      {d.points.at(-1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Season Stats</h1>
          <p className="mt-1 text-sm text-f1-text-muted">
            {CURRENT_YEAR} Season &middot; In-depth statistics and analysis
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-f1-card animate-pulse" />
            ))}
          </div>
        }
      >
        <StatsContent />
      </Suspense>
    </div>
  );
}
