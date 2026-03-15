"use client";

import { useState, useMemo } from "react";
import type { DriverStanding, Race } from "@/lib/types";
import { getTeamColor, getCountryFlag } from "@/lib/api";

interface DriverStats {
  position: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  bestFinish: number;
  avgFinish: number;
  avgGrid: number;
  pointsPerRace: number;
  racesEntered: number;
  raceResults: {
    round: string;
    raceName: string;
    position: number;
    grid: number;
    points: number;
    status: string;
  }[];
}

function computeStats(
  driverId: string,
  standing: DriverStanding,
  allRaces: Race[]
): DriverStats {
  let podiums = 0;
  let fastestLaps = 0;
  let dnfs = 0;
  let bestFinish = 99;
  let totalPosition = 0;
  let totalGrid = 0;
  let gridRaces = 0;
  let totalPoints = 0;
  let racesEntered = 0;
  let poles = 0;
  const raceResults: DriverStats["raceResults"] = [];

  for (const race of allRaces) {
    for (const result of race.Results ?? []) {
      if (result.Driver.driverId === driverId) {
        racesEntered++;
        const pos = parseInt(result.position);
        const grid = parseInt(result.grid);
        totalPoints += parseFloat(result.points);

        if (pos <= 3) podiums++;
        if (pos < bestFinish) bestFinish = pos;
        if (grid === 1) poles++;
        if (result.FastestLap?.rank === "1") fastestLaps++;
        if (
          result.status !== "Finished" &&
          !result.status.startsWith("+")
        )
          dnfs++;

        totalPosition += pos;
        // Exclude pit-lane starts (grid=0) from average grid calculation
        if (grid > 0) {
          totalGrid += grid;
          gridRaces++;
        }

        raceResults.push({
          round: race.round,
          raceName: race.raceName,
          position: pos,
          grid,
          points: parseFloat(result.points),
          status: result.status,
        });
      }
    }
  }

  return {
    position: parseInt(standing.position),
    points: parseFloat(standing.points),
    wins: parseInt(standing.wins),
    podiums,
    poles,
    fastestLaps,
    dnfs,
    bestFinish: bestFinish === 99 ? 0 : bestFinish,
    avgFinish:
      racesEntered > 0
        ? Math.round((totalPosition / racesEntered) * 10) / 10
        : 0,
    avgGrid:
      gridRaces > 0
        ? Math.round((totalGrid / gridRaces) * 10) / 10
        : 0,
    pointsPerRace:
      racesEntered > 0
        ? Math.round((totalPoints / racesEntered) * 10) / 10
        : 0,
    racesEntered,
    raceResults,
  };
}

function StatBar({
  label,
  valA,
  valB,
  colorA,
  colorB,
  higherIsBetter = true,
  format,
}: {
  label: string;
  valA: number;
  valB: number;
  colorA: string;
  colorB: string;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
}) {
  const fmt = format ?? ((v: number) => String(v));
  const max = Math.max(valA, valB, 1);
  const pctA = (valA / max) * 100;
  const pctB = (valB / max) * 100;

  const aWins = higherIsBetter ? valA > valB : valA < valB;
  const bWins = higherIsBetter ? valB > valA : valA > valB;
  const tie = valA === valB;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-sm font-bold ${
            aWins && !tie ? "text-f1-text" : "text-f1-text-muted"
          }`}
        >
          {fmt(valA)}
        </span>
        <span className="text-xs uppercase tracking-wider text-f1-text-muted">
          {label}
        </span>
        <span
          className={`text-sm font-bold ${
            bWins && !tie ? "text-f1-text" : "text-f1-text-muted"
          }`}
        >
          {fmt(valB)}
        </span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 flex justify-end">
          <div
            className="h-full rounded-l-full transition-all"
            style={{
              width: `${pctA}%`,
              backgroundColor: aWins && !tie ? colorA : undefined,
            }}
          >
            {!(aWins && !tie) && (
              <div className="h-full w-full rounded-l-full bg-f1-border" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <div
            className="h-full rounded-r-full transition-all"
            style={{
              width: `${pctB}%`,
              backgroundColor: bWins && !tie ? colorB : undefined,
            }}
          >
            {!(bWins && !tie) && (
              <div className="h-full w-full rounded-r-full bg-f1-border" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompareClient({
  standings,
  allRaces,
}: {
  standings: DriverStanding[];
  allRaces: Race[];
}) {
  const [driverA, setDriverA] = useState(standings[0]?.Driver.driverId ?? "");
  const [driverB, setDriverB] = useState(standings[1]?.Driver.driverId ?? "");

  const standingA = standings.find((s) => s.Driver.driverId === driverA);
  const standingB = standings.find((s) => s.Driver.driverId === driverB);

  const statsA = useMemo(
    () => (standingA ? computeStats(driverA, standingA, allRaces) : null),
    [driverA, standingA, allRaces]
  );
  const statsB = useMemo(
    () => (standingB ? computeStats(driverB, standingB, allRaces) : null),
    [driverB, standingB, allRaces]
  );

  const teamColorA = getTeamColor(
    standingA?.Constructors[0]?.constructorId ?? ""
  );
  const teamColorB = getTeamColor(
    standingB?.Constructors[0]?.constructorId ?? ""
  );

  // Head-to-head race results
  const h2hResults = useMemo(() => {
    if (!statsA || !statsB) return [];
    const resultsA = new Map(statsA.raceResults.map((r) => [r.round, r]));
    return statsB.raceResults
      .filter((r) => resultsA.has(r.round))
      .map((rb) => ({
        round: rb.round,
        raceName: rb.raceName,
        a: resultsA.get(rb.round)!,
        b: rb,
      }));
  }, [statsA, statsB]);

  const h2hWinsA = useMemo(() => h2hResults.filter((r) => r.a.position < r.b.position).length, [h2hResults]);
  const h2hWinsB = useMemo(() => h2hResults.filter((r) => r.b.position < r.a.position).length, [h2hResults]);

  // Qualifying H2H (grid position, skip pit-lane starts where grid=0)
  const h2hQualA = useMemo(() => h2hResults.filter((r) => r.a.grid > 0 && r.b.grid > 0 && r.a.grid < r.b.grid).length, [h2hResults]);
  const h2hQualB = useMemo(() => h2hResults.filter((r) => r.a.grid > 0 && r.b.grid > 0 && r.b.grid < r.a.grid).length, [h2hResults]);

  // Cumulative points series for chart
  const cumulativePointsA = useMemo(() => {
    let total = 0;
    return statsA?.raceResults.map((r) => { total += r.points; return total; }) ?? [];
  }, [statsA]);
  const cumulativePointsB = useMemo(() => {
    let total = 0;
    return statsB?.raceResults.map((r) => { total += r.points; return total; }) ?? [];
  }, [statsB]);

  return (
    <>
      {/* Driver Selectors */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-f1-border bg-f1-card p-4">
          <label className="block text-xs uppercase tracking-wider text-f1-text-muted mb-2">
            Driver 1
          </label>
          <select
            value={driverA}
            onChange={(e) => setDriverA(e.target.value)}
            className="w-full rounded-lg bg-f1-dark border border-f1-border px-3 py-2 text-sm text-f1-text focus:outline-none focus:border-f1-accent"
          >
            {standings.map((s) => (
              <option key={s.Driver.driverId} value={s.Driver.driverId}>
                {s.Driver.givenName} {s.Driver.familyName} (
                {s.Constructors[0]?.name})
              </option>
            ))}
          </select>
          {standingA && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-8 w-1.5 rounded-full"
                style={{ backgroundColor: teamColorA }}
              />
              <div>
                <p className="font-black text-lg uppercase">
                  {getCountryFlag(standingA.Driver.nationality)}{" "}
                  {standingA.Driver.familyName}
                </p>
                <p className="text-xs text-f1-text-muted">
                  {standingA.Constructors[0]?.name} &middot; P
                  {standingA.position} &middot; {standingA.points} pts
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-f1-border bg-f1-card p-4">
          <label className="block text-xs uppercase tracking-wider text-f1-text-muted mb-2">
            Driver 2
          </label>
          <select
            value={driverB}
            onChange={(e) => setDriverB(e.target.value)}
            className="w-full rounded-lg bg-f1-dark border border-f1-border px-3 py-2 text-sm text-f1-text focus:outline-none focus:border-f1-accent"
          >
            {standings.map((s) => (
              <option key={s.Driver.driverId} value={s.Driver.driverId}>
                {s.Driver.givenName} {s.Driver.familyName} (
                {s.Constructors[0]?.name})
              </option>
            ))}
          </select>
          {standingB && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-8 w-1.5 rounded-full"
                style={{ backgroundColor: teamColorB }}
              />
              <div>
                <p className="font-black text-lg uppercase">
                  {getCountryFlag(standingB.Driver.nationality)}{" "}
                  {standingB.Driver.familyName}
                </p>
                <p className="text-xs text-f1-text-muted">
                  {standingB.Constructors[0]?.name} &middot; P
                  {standingB.position} &middot; {standingB.points} pts
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {statsA && statsB && (
        <>
          {/* Stats Comparison */}
          <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-bold"
                style={{ color: teamColorA }}
              >
                {standingA?.Driver.code}
              </span>
              <h3 className="font-bold text-lg">Season Stats</h3>
              <span
                className="text-sm font-bold"
                style={{ color: teamColorB }}
              >
                {standingB?.Driver.code}
              </span>
            </div>

            <div className="divide-y divide-f1-border/30">
              <StatBar
                label="Championship Position"
                valA={statsA.position}
                valB={statsB.position}
                colorA={teamColorA}
                colorB={teamColorB}
                higherIsBetter={false}
              />
              <StatBar label="Points" valA={statsA.points} valB={statsB.points} colorA={teamColorA} colorB={teamColorB} />
              <StatBar label="Wins" valA={statsA.wins} valB={statsB.wins} colorA={teamColorA} colorB={teamColorB} />
              <StatBar label="Podiums" valA={statsA.podiums} valB={statsB.podiums} colorA={teamColorA} colorB={teamColorB} />
              <StatBar label="Poles" valA={statsA.poles} valB={statsB.poles} colorA={teamColorA} colorB={teamColorB} />
              <StatBar
                label="Fastest Laps"
                valA={statsA.fastestLaps}
                valB={statsB.fastestLaps}
                colorA={teamColorA}
                colorB={teamColorB}
              />
              <StatBar
                label="Avg Finish"
                valA={statsA.avgFinish}
                valB={statsB.avgFinish}
                colorA={teamColorA}
                colorB={teamColorB}
                higherIsBetter={false}
                format={(v) => v.toFixed(1)}
              />
              <StatBar
                label="Avg Grid"
                valA={statsA.avgGrid}
                valB={statsB.avgGrid}
                colorA={teamColorA}
                colorB={teamColorB}
                higherIsBetter={false}
                format={(v) => v.toFixed(1)}
              />
              <StatBar
                label="Points / Race"
                valA={statsA.pointsPerRace}
                valB={statsB.pointsPerRace}
                colorA={teamColorA}
                colorB={teamColorB}
                format={(v) => v.toFixed(1)}
              />
              <StatBar
                label="DNFs"
                valA={statsA.dnfs}
                valB={statsB.dnfs}
                colorA={teamColorA}
                colorB={teamColorB}
                higherIsBetter={false}
              />
            </div>
          </div>

          {/* Cumulative Points Chart */}
          {cumulativePointsA.length > 1 && cumulativePointsB.length > 1 && (
            <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-6">
              <h3 className="font-bold text-lg mb-4">Points Progression</h3>
              {(() => {
                const W = 600, H = 160;
                const PAD = { top: 8, right: 48, bottom: 24, left: 36 };
                const cW = W - PAD.left - PAD.right;
                const cH = H - PAD.top - PAD.bottom;
                const nA = cumulativePointsA.length;
                const nB = cumulativePointsB.length;
                const maxPts = Math.max(...cumulativePointsA, ...cumulativePointsB, 1);
                const yMax = Math.ceil(maxPts / 25) * 25 || 25;
                const nMax = Math.max(nA, nB);
                const xOf = (i: number, n: number) => PAD.left + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW);
                const yOf = (pts: number) => PAD.top + cH - (pts / yMax) * cH;
                const yTicks = [0, Math.round(yMax / 2), yMax];
                const pathA = cumulativePointsA.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i, nA).toFixed(1)},${yOf(p).toFixed(1)}`).join(" ");
                const pathB = cumulativePointsB.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i, nB).toFixed(1)},${yOf(p).toFixed(1)}`).join(" ");
                const lastA = cumulativePointsA[nA - 1] ?? 0;
                const lastB = cumulativePointsB[nB - 1] ?? 0;
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} aria-hidden="true">
                    {yTicks.map((v) => (
                      <g key={v}>
                        <line x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                        <text x={PAD.left - 4} y={yOf(v)} textAnchor="end" dominantBaseline="middle" fontSize="8" fill="currentColor" fillOpacity="0.35">{v}</text>
                      </g>
                    ))}
                    {[...Array(nMax)].map((_, i) => {
                      if (i % Math.max(1, Math.floor(nMax / 8)) !== 0 && i !== nMax - 1) return null;
                      return <text key={i} x={xOf(i, nMax)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.3">R{i + 1}</text>;
                    })}
                    <path d={pathA} fill="none" stroke={teamColorA} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={pathB} fill="none" stroke={teamColorB} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {cumulativePointsA.map((p, i) => <circle key={i} cx={xOf(i, nA)} cy={yOf(p)} r="3" fill={teamColorA} fillOpacity="0.85" />)}
                    {cumulativePointsB.map((p, i) => <circle key={i} cx={xOf(i, nB)} cy={yOf(p)} r="3" fill={teamColorB} fillOpacity="0.85" />)}
                    <text x={xOf(nA - 1, nA) + 5} y={yOf(lastA)} dominantBaseline="middle" fontSize="9" fontWeight="bold" fill={teamColorA}>{standingA?.Driver.code}</text>
                    <text x={xOf(nB - 1, nB) + 5} y={yOf(lastB)} dominantBaseline="middle" fontSize="9" fontWeight="bold" fill={teamColorB}>{standingB?.Driver.code}</text>
                  </svg>
                );
              })()}
            </div>
          )}

          {/* Head-to-Head Summary */}
          {h2hResults.length > 0 && (
            <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-6">
              <h3 className="font-bold text-lg mb-4">
                Head-to-Head
              </h3>

              {/* Race finishes + Qualifying scores */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg bg-f1-dark p-4">
                  <p className="text-xs text-f1-text-muted uppercase tracking-wider mb-3 text-center">Race Finishes</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: teamColorA }}>{h2hWinsA}</p>
                      <p className="text-xs text-f1-text-muted">{standingA?.Driver.code}</p>
                    </div>
                    <p className="text-sm text-f1-text-muted">vs</p>
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: teamColorB }}>{h2hWinsB}</p>
                      <p className="text-xs text-f1-text-muted">{standingB?.Driver.code}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-f1-dark p-4">
                  <p className="text-xs text-f1-text-muted uppercase tracking-wider mb-3 text-center">Qualifying</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: teamColorA }}>{h2hQualA}</p>
                      <p className="text-xs text-f1-text-muted">{standingA?.Driver.code}</p>
                    </div>
                    <p className="text-sm text-f1-text-muted">vs</p>
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: teamColorB }}>{h2hQualB}</p>
                      <p className="text-xs text-f1-text-muted">{standingB?.Driver.code}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Race-by-Race Results */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                      <th className="px-3 py-2">Race</th>
                      <th className="px-3 py-2 text-center hidden sm:table-cell">Grid</th>
                      <th className="px-3 py-2 text-center">
                        {standingA?.Driver.code} Pos
                      </th>
                      <th className="px-3 py-2 text-center hidden sm:table-cell">Grid</th>
                      <th className="px-3 py-2 text-center">
                        {standingB?.Driver.code} Pos
                      </th>
                      <th className="px-3 py-2 text-center">
                        {standingA?.Driver.code} Pts
                      </th>
                      <th className="px-3 py-2 text-center">
                        {standingB?.Driver.code} Pts
                      </th>
                      <th className="px-3 py-2 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {h2hResults.map((r) => {
                      const aWon = r.a.position < r.b.position;
                      const bWon = r.b.position < r.a.position;
                      const aQualAhead = r.a.grid > 0 && r.b.grid > 0 && r.a.grid < r.b.grid;
                      const bQualAhead = r.a.grid > 0 && r.b.grid > 0 && r.b.grid < r.a.grid;

                      return (
                        <tr
                          key={r.round}
                          className="border-b border-f1-border/30 hover:bg-f1-dark/30 transition-colors"
                        >
                          <td className="px-3 py-2 text-f1-text-muted text-xs">
                            R{r.round} {r.raceName.replace(" Grand Prix", "")}
                          </td>
                          <td className={`px-3 py-2 text-center text-xs hidden sm:table-cell ${aQualAhead ? "" : "text-f1-text-muted"}`}>
                            {r.a.grid === 0 ? "PL" : `P${r.a.grid}`}
                            {aQualAhead && <span className="ml-0.5 text-green-400">▲</span>}
                          </td>
                          <td
                            className={`px-3 py-2 text-center font-bold ${
                              aWon ? "text-f1-text" : "text-f1-text-muted"
                            }`}
                          >
                            P{r.a.position}
                          </td>
                          <td className={`px-3 py-2 text-center text-xs hidden sm:table-cell ${bQualAhead ? "" : "text-f1-text-muted"}`}>
                            {r.b.grid === 0 ? "PL" : `P${r.b.grid}`}
                            {bQualAhead && <span className="ml-0.5 text-green-400">▲</span>}
                          </td>
                          <td
                            className={`px-3 py-2 text-center font-bold ${
                              bWon ? "text-f1-text" : "text-f1-text-muted"
                            }`}
                          >
                            P{r.b.position}
                          </td>
                          <td className="px-3 py-2 text-center text-f1-text-muted text-xs">
                            {r.a.points}
                          </td>
                          <td className="px-3 py-2 text-center text-f1-text-muted text-xs">
                            {r.b.points}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {aWon && (
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: teamColorA }} />
                            )}
                            {bWon && (
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: teamColorB }} />
                            )}
                            {!aWon && !bWon && (
                              <span className="text-xs text-f1-text-muted">Tie</span>
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
        </>
      )}
    </>
  );
}
