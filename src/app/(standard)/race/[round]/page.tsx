export const revalidate = 60;

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRaceWithResults,
  getQualifyingResults,
  getSprintResults,
  getPitStops,
  getRaceSchedule,
  getTeamColor,
  getCountryFlag,
  getCountryFlagByCountry,
  getF1TVRaceUrl,
  getRaceDate,
  getOpenF1SessionKeyForRace,
  getOpenF1PitStops,
  getLiveDrivers,
  getCurrentYear,
} from "@/lib/api";
import type { Metadata } from "next";
import type { Race, RaceResult, QualifyingResult } from "@/lib/types";
import { parseLapTimeToMs, parseLapTimeToSeconds } from "@/lib/lapTime";
import { getDriverConstructorId } from "@/lib/driverOverrides";
import RaceDetailView, {
  type RaceDetailDriver,
  type RaceDetailGridRow,
  type RaceDetailPace,
  type RaceDetailPitStop,
  type RaceDetailPitSummary,
  type RaceDetailQuali,
  type RaceDetailQualGap,
  type RaceDetailQualZone,
} from "@/components/ascii/views/RaceDetailView";
import RefreshButton from "@/components/RefreshButton";
import QualifyingGapChart from "@/components/QualifyingGapChart";
import QualifyingProgression from "@/components/QualifyingProgression";
import SectionLabel from "@/components/SectionLabel";
import Breadcrumbs from "@/components/Breadcrumbs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ round: string }>;
}): Promise<Metadata> {
  const { round } = await params;
  const race = await getRaceWithResults(round);
  return {
    title: race ? `${race.raceName} — F1 2026` : `Round ${round} — F1 2026`,
    description: race
      ? `Results, qualifying, pit stops, and analysis for the ${race.raceName}`
      : `Race results for round ${round} of the 2026 F1 season`,
  };
}

/* Header fields shared by the Standard and ASCII race views. */
function raceHeaderProps(race: Race) {
  return {
    title: race.raceName,
    circuit: race.Circuit.circuitName,
    location: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
    flag: getCountryFlagByCountry(race.Circuit.Location.country),
    dateLabel: getRaceDate(race).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    f1tvUrl: getF1TVRaceUrl(race),
    wikiUrl: race.url,
  };
}

/* One result row as the ASCII view shows it. Sprint rows never show DNF or fastest lap. */
function toDetailDriver(r: RaceResult, sprint = false): RaceDetailDriver {
  const isDnf = !sprint && r.status !== "Finished" && !r.status.startsWith("+");
  const gridPos = parseInt(r.grid);
  const gridDiff = gridPos > 0 ? gridPos - parseInt(r.position) : 0;
  return {
    driverId: r.Driver.driverId,
    position: isDnf ? "DNF" : r.position,
    isDnf,
    flag: getCountryFlag(r.Driver.nationality),
    givenName: r.Driver.givenName,
    familyName: r.Driver.familyName,
    teamColor: getTeamColor(r.Constructor.constructorId),
    teamName: r.Constructor.name,
    grid: r.grid,
    gridDiff,
    laps: r.laps,
    timeOrStatus: r.Time?.time ?? r.status,
    points: r.points !== "0" ? r.points : "",
    fastestLap:
      !sprint && r.FastestLap?.rank === "1" ? r.FastestLap?.Time?.time ?? "" : "",
  };
}

async function RaceContent({ round }: { round: string }) {
  // Validate round is a reasonable numeric value
  const roundNum = parseInt(round);
  if (isNaN(roundNum) || roundNum < 1 || roundNum > 30) {
    notFound();
  }

  const [race, qualifying, sprint, pitStops, schedule] = await Promise.all([
    getRaceWithResults(round),
    getQualifyingResults(round),
    getSprintResults(round),
    getPitStops(round),
    getRaceSchedule(),
  ]);

  const totalRounds = schedule.length;
  const prevRound = roundNum > 1 ? roundNum - 1 : null;
  const nextRound = roundNum < totalRounds ? roundNum + 1 : null;

  if (!race) {
    // A round number outside the actual schedule (e.g. this season only has
    // 24 rounds and someone requests round 27) genuinely doesn't exist —
    // that's a real 404, distinct from a scheduled round that just hasn't
    // been run yet (which legitimately has no results and isn't an error).
    const scheduledRace = schedule.find((r) => r.round === round);
    if (!scheduledRace) notFound();
    return (
      <>
        <div className="f1-std-only">
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
        </div>
        <RaceDetailView
          round={round}
          {...raceHeaderProps(scheduledRace)}
          prevRound={prevRound ? String(prevRound) : null}
          nextRound={nextRound ? String(nextRound) : null}
          hasResults={false}
        />
      </>
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

  const hasPitBox = pitBoxTimes.size > 0;
  const pitByDriver = new Map<string, typeof pitStops>();
  for (const p of pitStops) {
    const arr = pitByDriver.get(p.driverId) ?? [];
    arr.push(p);
    pitByDriver.set(p.driverId, arr);
  }
  const pitDriverSummaries = [...pitByDriver.entries()]
    .map(([id, stops]) => {
      const boxStops = pitBoxTimes.get(id);
      const fastestBox = boxStops?.reduce((best, s) => s.duration < best.duration ? s : best);
      const fastestLane = stops.reduce((best, s) => parseFloat(s.duration) < parseFloat(best.duration) ? s : best);
      return {
        driverId: id,
        stops: stops.length,
        fastestDuration: fastestBox ? fastestBox.duration : parseFloat(fastestLane.duration),
        fastestLap: fastestBox ? String(fastestBox.lap) : fastestLane.lap,
        fastestStop: fastestLane.stop,
        isPitBox: !!fastestBox,
      };
    })
    .sort((a, b) => a.fastestDuration - b.fastestDuration);
  const fastestPit = pitDriverSummaries[0];

  // Race pace analysis: sort finishers by fastest lap time
  const paceData = results
    .filter((r) => r.FastestLap?.Time?.time)
    .map((r) => {
      const [min, secMs] = r.FastestLap!.Time!.time.split(":");
      const [sec, ms] = secMs.split(".");
      const totalMs = parseInt(min) * 60000 + parseInt(sec) * 1000 + parseInt(ms.padEnd(3, "0").slice(0, 3));
      return {
        driverId: r.Driver.driverId,
        name: `${r.Driver.givenName} ${r.Driver.familyName}`,
        code: r.Driver.code,
        constructorId: r.Constructor.constructorId,
        lapTime: r.FastestLap!.Time!.time,
        lapMs: totalMs,
        position: parseInt(r.position),
        avgSpeed: r.FastestLap!.AverageSpeed?.speed ?? "",
      };
    })
    .sort((a, b) => a.lapMs - b.lapMs);

  // ASCII view data: the same derived values as the standard markup below, as plain data.
  const paceRange =
    paceData.length > 1 ? paceData[paceData.length - 1].lapMs - paceData[0].lapMs : 0;
  const asciiPace: RaceDetailPace[] = paceData.map((d, i) => {
    const delta = d.lapMs - paceData[0].lapMs;
    const barWidth =
      i === 0 || paceRange === 0 ? 100 : Math.max(20, 100 - (delta / paceRange) * 80);
    return {
      driverId: d.driverId,
      position: i + 1,
      name: d.name,
      color: getTeamColor(d.constructorId),
      lapTime: d.lapTime,
      delta: i > 0 ? (delta / 1000).toFixed(3) : null,
      barFrac: barWidth / 100,
      isFastest: i === 0,
    };
  });
  const asciiPitSummaries: RaceDetailPitSummary[] = pitDriverSummaries.map((d) => {
    const raceResult = results.find((r) => r.Driver.driverId === d.driverId);
    return {
      driverId: d.driverId,
      name: d.driverId.replace(/_/g, " "),
      color: raceResult ? getTeamColor(raceResult.Constructor.constructorId) : "var(--color-f1-text-muted)",
      stops: d.stops,
      duration: d.fastestDuration.toFixed(3),
      lap: d.fastestLap,
      isFastest: d.driverId === fastestPit?.driverId,
    };
  });
  const asciiPitTimeline: RaceDetailPitStop[] = [...pitStops]
    .sort((a, b) => parseInt(a.lap) - parseInt(b.lap))
    .map((p, i) => {
      const raceResult = results.find((r) => r.Driver.driverId === p.driverId);
      const boxStop = pitBoxTimes.get(p.driverId)?.find((b) => b.lap === parseInt(p.lap));
      return {
        key: `${p.lap}-${p.driverId}-${i}`,
        lap: p.lap,
        name: raceResult
          ? `${raceResult.Driver.givenName} ${raceResult.Driver.familyName}`
          : p.driverId.replace(/_/g, " "),
        color: raceResult ? getTeamColor(raceResult.Constructor.constructorId) : "var(--color-f1-text-muted)",
        stop: String(parseInt(p.stop)),
        duration: boxStop ? boxStop.duration.toFixed(3) : parseFloat(p.duration).toFixed(3),
        isPitBox: !!boxStop,
        timeOfDay: p.time,
      };
    });

  // Qualifying gap to pole: same series and rules as QualifyingGapChart.
  const qualClassified = qualifying
    .map((q) => ({
      q,
      ms: parseLapTimeToMs(q.Q3) ?? parseLapTimeToMs(q.Q2) ?? parseLapTimeToMs(q.Q1),
    }))
    .filter((x): x is { q: QualifyingResult; ms: number } => x.ms !== null)
    .sort((a, b) => a.ms - b.ms);
  const qualPoleMs = qualClassified[0]?.ms ?? 0;
  const qualMaxGap = qualClassified.length > 0 ? qualClassified[qualClassified.length - 1].ms - qualPoleMs : 0;
  const asciiQualGap: RaceDetailQualGap[] =
    qualClassified.length >= 2 && qualMaxGap > 0
      ? qualClassified.map(({ q, ms }) => {
          const gap = ms - qualPoleMs;
          return {
            driverId: q.Driver.driverId,
            position: q.position,
            code: q.Driver.code,
            color: getTeamColor(q.Constructor.constructorId),
            bestTime: q.Q3 ?? q.Q2 ?? q.Q1 ?? "-",
            gap: gap === 0 ? "POLE" : `+${(gap / 1000).toFixed(3)}`,
            barFrac: gap === 0 ? 0.02 : Math.max(0.01, (gap / qualMaxGap) * 0.95),
          };
        })
      : [];

  // Qualifying progression: each driver's decisive segment, grouped by elimination zone
  // (same grouping and gap rules as QualifyingProgression).
  const qualSorted = [...qualifying].sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10));
  const qualZoneDefs: {
    key: string;
    title: string;
    caption: string;
    color: string;
    seg: (q: QualifyingResult) => string | undefined;
    rows: QualifyingResult[];
  }[] = [
    {
      key: "q3",
      title: "Q3 · Top-10 shootout",
      caption: "Pole position fight",
      color: "var(--color-f1-accent)",
      seg: (q) => q.Q3,
      rows: qualSorted.filter((q) => q.Q3),
    },
    {
      key: "q2",
      title: "Q2 · Knocked out",
      caption: "Eliminated P11–15",
      color: "#f59e0b",
      seg: (q) => q.Q2,
      rows: qualSorted.filter((q) => !q.Q3 && q.Q2),
    },
    {
      key: "q1",
      title: "Q1 · Knocked out",
      caption: "Eliminated P16+",
      color: "#9ca3af",
      seg: (q) => q.Q1,
      rows: qualSorted.filter((q) => !q.Q3 && !q.Q2),
    },
  ];
  const asciiQualZones: RaceDetailQualZone[] = qualZoneDefs
    .filter((z) => z.rows.length > 0)
    .map((z) => {
      const secs = z.rows
        .map((q) => parseLapTimeToSeconds(z.seg(q)))
        .filter((t): t is number => t !== null);
      const best = secs.length ? Math.min(...secs) : null;
      return {
        key: z.key,
        title: z.title,
        caption: z.caption,
        color: z.color,
        rows: z.rows.map((q) => {
          const t = parseLapTimeToSeconds(z.seg(q));
          const gap = t !== null && best !== null ? t - best : null;
          return {
            driverId: q.Driver.driverId,
            position: q.position,
            name: q.Driver.familyName.toUpperCase(),
            color: getTeamColor(getDriverConstructorId(q.Driver.driverId, q.Constructor.constructorId) ?? ""),
            time: z.seg(q) ?? "-",
            gap:
              gap === null
                ? ""
                : gap > 0.0005
                  ? `+${gap.toFixed(3)}`
                  : z.key === "q3"
                    ? "POLE"
                    : "FASTEST",
          };
        }),
      };
    });

  // Grid vs finish: drivers with a grid slot (pit-lane starters are excluded, as in the chart).
  const asciiGridVsFinish: RaceDetailGridRow[] = results
    .filter((r) => parseInt(r.grid) > 0)
    .map((r) => {
      const grid = parseInt(r.grid);
      const finish = parseInt(r.position);
      return {
        driverId: r.Driver.driverId,
        name: r.Driver.familyName.toUpperCase(),
        color: getTeamColor(r.Constructor.constructorId),
        grid: String(grid),
        finish: String(finish),
        isDnf: r.status !== "Finished" && !r.status.startsWith("+"),
        gained: grid - finish,
      };
    });

  return (
    <>
      <div className="f1-std-only">
      {/* Prev/Next race navigation */}
      {(prevRound || nextRound) && (
        <div className="mb-4 flex items-center justify-between text-sm">
          {prevRound ? (
            <Link
              href={`/race/${prevRound}`}
              className="flex items-center gap-1.5 text-f1-text-muted hover:text-f1-accent transition-colors"
            >
              <span>←</span>
              <span>Round {prevRound}</span>
            </Link>
          ) : <span />}
          {nextRound ? (
            <Link
              href={`/race/${nextRound}`}
              className="flex items-center gap-1.5 text-f1-text-muted hover:text-f1-accent transition-colors"
            >
              <span>Round {nextRound}</span>
              <span>→</span>
            </Link>
          ) : <span />}
        </div>
      )}

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
                {(() => {
                  const finishers = results.filter((r) => r.status === "Finished" || r.status.startsWith("+"));
                  const dnfs = results.filter((r) => r.status !== "Finished" && !r.status.startsWith("+"));
                  const renderRow = (r: typeof results[0]) => {
                    const teamColor = getTeamColor(r.Constructor.constructorId);
                    const gridPos = parseInt(r.grid);
                    const gridDiff = gridPos > 0 ? gridPos - parseInt(r.position) : 0;
                    const isFastestLap = r.FastestLap?.rank === "1";
                    const isDnf = r.status !== "Finished" && !r.status.startsWith("+");
                    return (
                      <tr
                        key={r.Driver.driverId}
                        className={`border-b border-f1-border/50 transition-colors hover:bg-f1-card/50 ${
                          isFastestLap ? "bg-purple-500/5" : isDnf ? "opacity-60" : ""
                        }`}
                      >
                        <td className="px-3 py-3 font-bold">{isDnf ? <span className="text-red-400 text-xs">DNF</span> : r.position}</td>
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
                        <td className="px-3 py-3 text-center hidden md:table-cell text-f1-text-muted">{r.laps}</td>
                        <td className={`px-3 py-3 ${isDnf ? "text-red-400 font-medium" : "text-f1-text-muted"}`}>
                          {r.Time?.time ?? r.status}
                        </td>
                        <td className="px-3 py-3 text-right font-bold">{r.points !== "0" ? r.points : ""}</td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          {isFastestLap && (
                            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-400">
                              {r.FastestLap?.Time?.time}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  };
                  return (
                    <>
                      {finishers.map(renderRow)}
                      {dnfs.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={8} className="px-3 py-2 bg-red-950/20">
                              <span className="text-xs font-bold uppercase tracking-wider text-red-400/70">
                                Did Not Finish ({dnfs.length})
                              </span>
                            </td>
                          </tr>
                          {dnfs.map(renderRow)}
                        </>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid vs Finish — position change chart */}
      {results.length > 0 && results.some((r) => parseInt(r.grid) > 0) && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card overflow-hidden">
          <div className="border-b border-f1-border p-4">
            <h3 className="font-bold text-lg">Grid vs Finish</h3>
            <p className="text-xs text-f1-text-muted mt-0.5">Starting position compared to race result — lines rising = positions gained</p>
          </div>
          <div className="p-4">
            {(() => {
              const W = 560;
              const H = 200;
              const PAD = { left: 32, right: 32, top: 12, bottom: 12 };
              const gridded = results.filter((r) => parseInt(r.grid) > 0);
              const n = gridded.length;
              const xLeft = PAD.left;
              const xRight = W - PAD.right;
              const chartH = H - PAD.top - PAD.bottom;

              // Plot by rank within this filtered set rather than the raw grid/
              // finish numbers — pit-lane starters (grid=0) are excluded above,
              // which can leave gaps in the remaining cars' actual position
              // numbers (e.g. a pit-lane starter finishing P5 among 20 plotted
              // cars can push the highest finish position to 22). Using the raw
              // number as pos-1 / (n-1) would then plot past chartH and get
              // clipped by this card's overflow-hidden. Ranking within the
              // plotted set keeps every dot within [0, chartH] while still
              // showing the real grid/finish numbers as text labels.
              const gridRank = new Map(
                [...gridded]
                  .sort((a, b) => parseInt(a.grid) - parseInt(b.grid))
                  .map((r, i) => [r.Driver.driverId, i + 1])
              );
              const finishRank = new Map(
                [...gridded]
                  .sort((a, b) => parseInt(a.position) - parseInt(b.position))
                  .map((r, i) => [r.Driver.driverId, i + 1])
              );
              const yForRank = (rank: number) =>
                PAD.top + ((rank - 1) / Math.max(n - 1, 1)) * chartH;

              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
                  {/* Column labels */}
                  <text x={xLeft} y={H - 2} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>GRID</text>
                  <text x={xRight} y={H - 2} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>FINISH</text>

                  {gridded
                    .map((r) => {
                      const grid = parseInt(r.grid);
                      const finish = parseInt(r.position);
                      const color = getTeamColor(r.Constructor.constructorId);
                      const isDnf = r.status !== "Finished" && !r.status.startsWith("+");
                      const gained = grid - finish;
                      const yStart = yForRank(gridRank.get(r.Driver.driverId)!);
                      const yEnd = yForRank(finishRank.get(r.Driver.driverId)!);
                      const lastName = r.Driver.familyName.slice(0, 3).toUpperCase();

                      return (
                        <g key={r.Driver.driverId}>
                          {/* Connector line */}
                          <line
                            x1={xLeft + 10} y1={yStart}
                            x2={xRight - 10} y2={yEnd}
                            stroke={color}
                            strokeWidth={gained > 3 ? 2 : gained < -3 ? 2 : 1.2}
                            strokeOpacity={isDnf ? 0.3 : 0.7}
                            strokeDasharray={isDnf ? "4,3" : undefined}
                          />
                          {/* Grid dot + label */}
                          <circle cx={xLeft + 10} cy={yStart} r={3} fill={color} opacity={0.8} />
                          <text x={xLeft - 2} y={yStart + 3.5} textAnchor="end" fontSize={8} fill="currentColor" opacity={0.5}>{grid}</text>
                          {/* Finish dot + label */}
                          <circle cx={xRight - 10} cy={yEnd} r={3} fill={color} opacity={isDnf ? 0.3 : 1} />
                          <text x={xRight + 2} y={yEnd + 3.5} textAnchor="start" fontSize={7} fill={color} opacity={isDnf ? 0.4 : 0.8} fontWeight="bold">
                            {isDnf ? "DNF" : finish}
                          </text>
                        </g>
                      );
                    })}
                </svg>
              );
            })()}
            {/* Quick gain/loss legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-f1-text-muted">
              <span>Steeper rise = more positions gained</span>
              <span className="opacity-50">Dashed = DNF</span>
            </div>
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
            {fastestPit && (
              <p className="text-xs text-f1-text-muted mt-0.5">
                Fastest {hasPitBox ? "box" : "lane"}: <span className="font-bold text-f1-accent">{fastestPit.fastestDuration.toFixed(3)}s</span>
                {" "}— <span className="capitalize">{fastestPit.driverId.replace(/_/g, " ")}</span>
                {" "}Lap {fastestPit.fastestLap}
              </p>
            )}
          </div>
          <div className="p-4 overflow-x-auto">
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
                {pitDriverSummaries.map((d) => {
                  const raceResult = results.find((r) => r.Driver.driverId === d.driverId);
                  const color = raceResult ? getTeamColor(raceResult.Constructor.constructorId) : "var(--color-f1-text-muted)";
                  const isFastest = d.driverId === fastestPit?.driverId;
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
        </div>
      )}

      {/* Pit Stop Timeline — all stops in lap order */}
      {pitStops.length > 0 && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h3 className="font-bold text-lg">Pit Stop Timeline</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-2 w-16">Lap</th>
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2 text-center w-16">Stop #</th>
                  <th className="px-3 py-2 text-right">Duration</th>
                  <th className="px-3 py-2 text-right hidden sm:table-cell">Time of Day</th>
                </tr>
              </thead>
              <tbody>
                {[...pitStops]
                  .sort((a, b) => parseInt(a.lap) - parseInt(b.lap))
                  .map((p, i) => {
                    const raceResult = results.find((r) => r.Driver.driverId === p.driverId);
                    const color = raceResult ? getTeamColor(raceResult.Constructor.constructorId) : "var(--color-f1-text-muted)";
                    const driverName = raceResult
                      ? `${raceResult.Driver.givenName} ${raceResult.Driver.familyName}`
                      : p.driverId.replace(/_/g, " ");
                    // Look up pit box time from OpenF1 if available
                    const boxStops = pitBoxTimes.get(p.driverId);
                    const stopNum = parseInt(p.stop);
                    const boxStop = boxStops?.find((b) => b.lap === parseInt(p.lap));
                    const displayDuration = boxStop
                      ? boxStop.duration.toFixed(3)
                      : parseFloat(p.duration).toFixed(3);
                    const isPitBox = !!boxStop;
                    return (
                      <tr key={i} className="border-b border-f1-border/40 hover:bg-f1-dark/20 transition-colors">
                        <td className="px-3 py-2 font-mono font-bold text-f1-accent text-xs">
                          L{p.lap}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-medium">{driverName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-f1-text-muted text-xs">
                          #{stopNum}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold">
                          {displayDuration}s
                          {isPitBox && (
                            <span className="ml-1 text-[10px] text-purple-400 font-normal">box</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-f1-text-muted hidden sm:table-cell">
                          {p.time}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Race Pace Analysis */}
      {paceData.length > 0 && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card overflow-hidden">
          <div className="border-b border-f1-border p-4">
            <h3 className="font-bold">Race Pace</h3>
            <p className="text-xs text-f1-text-muted mt-0.5">Fastest lap comparison — ranked by lap time</p>
          </div>
          <div className="divide-y divide-f1-border">
            {(() => {
              // paceData is sorted ascending by lapMs (fastest first), so the
              // spread between the fastest and slowest lap is the real
              // denominator for bar width — not a driver's raw lap time,
              // which is ~90,000ms and dwarfs the (much smaller) gap between
              // drivers, flattening every bar to 95-100% regardless of delta.
              const paceRange =
                paceData.length > 1
                  ? paceData[paceData.length - 1].lapMs - paceData[0].lapMs
                  : 0;
              return paceData.map((d, i) => {
                const color = getTeamColor(d.constructorId);
                const delta = d.lapMs - paceData[0].lapMs;
                const deltaSec = (delta / 1000).toFixed(3);
                const barWidth =
                  i === 0 || paceRange === 0
                    ? 100
                    : Math.max(20, 100 - (delta / paceRange) * 80);
                return (
                <div key={d.driverId} className={`flex items-center gap-3 px-4 py-2.5 ${i === 0 ? "bg-purple-950/20" : ""}`}>
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-f1-text-muted">{i + 1}</span>
                  <span className="h-4 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">
                      {i === 0 && <span className="text-purple-400 mr-1">●</span>}
                      {d.name}
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-f1-dark overflow-hidden" style={{ width: "100%" }}>
                      <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: i === 0 ? "#c084fc" : color + "99" }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-xs font-mono font-bold ${i === 0 ? "text-purple-400" : "text-f1-text"}`}>{d.lapTime}</p>
                    {i > 0 && <p className="text-[10px] text-f1-text-muted font-mono">+{deltaSec}</p>}
                  </div>
                </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Qualifying Gap Chart */}
      <QualifyingGapChart qualifying={qualifying} />

      {/* Qualifying Progression — elimination zones */}
      {qualifying.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Qualifying Progression</SectionLabel>
          <QualifyingProgression qualifying={qualifying} />
        </div>
      )}

      {/* Qualifying Results */}
      {qualifying.length > 0 && (
        <div className="mt-6 rounded-xl border border-f1-border bg-f1-card">
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
      </div>

      <RaceDetailView
        round={round}
        {...raceHeaderProps(race)}
        prevRound={prevRound ? String(prevRound) : null}
        nextRound={nextRound ? String(nextRound) : null}
        hasResults={results.length > 0}
        podium={results.length >= 3 ? results.slice(0, 3).map((r) => ({ ...toDetailDriver(r), timeOrStatus: r.Time?.time ?? "" })) : []}
        results={results.map((r) => toDetailDriver(r))}
        sprint={sprint.map((r) => toDetailDriver(r, true))}
        qualifying={qualifying.map((q): RaceDetailQuali => ({
          driverId: q.Driver.driverId,
          position: q.position,
          flag: getCountryFlag(q.Driver.nationality),
          givenName: q.Driver.givenName,
          familyName: q.Driver.familyName,
          teamColor: getTeamColor(q.Constructor.constructorId),
          teamName: q.Constructor.name,
          q1: q.Q1 ?? "-",
          q2: q.Q2 ?? "-",
          q3: q.Q3 ?? "-",
        }))}
        pitSummaries={asciiPitSummaries}
        pitTimeline={asciiPitTimeline}
        fastestPit={
          fastestPit
            ? {
                kind: hasPitBox ? "box" : "lane",
                duration: fastestPit.fastestDuration.toFixed(3),
                name: fastestPit.driverId.replace(/_/g, " "),
                lap: fastestPit.fastestLap,
              }
            : null
        }
        pace={asciiPace}
        qualGap={asciiQualGap}
        qualZones={asciiQualZones}
        gridVsFinish={asciiGridVsFinish}
      />
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
      <div className="f1-std-only">
        <Breadcrumbs
          items={[
            { label: "Races", href: "/races" },
            { label: `Round ${round}` },
          ]}
        />
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight">Race Details</h1>
          <RefreshButton />
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="f1-std-only h-48 rounded-xl bg-f1-card animate-pulse" />
            <div className="f1-std-only h-96 rounded-xl bg-f1-card animate-pulse" />
          </div>
        }
      >
        <RaceContent round={round} />
      </Suspense>
    </div>
  );
}
