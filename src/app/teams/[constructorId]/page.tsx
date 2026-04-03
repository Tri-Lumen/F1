export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getConstructorStandings,
  getDriverStandings,
  getAllSeasonResults,
  getPitStops,
  getTeamColor,
  getCountryFlag,
  CURRENT_YEAR,
} from "@/lib/api";
import RefreshButton from "@/components/RefreshButton";
import { CarImage, DriverImage } from "@/components/ProfileImage";
import { getTeamCarImageUrls, getDriverImageUrl } from "@/lib/profileImages";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function finishCell(pos: string, status: string) {
  const isDNF = status !== "Finished" && !status.startsWith("+");
  const p = parseInt(pos);
  if (isDNF) return <span className="text-red-400 font-bold text-xs">DNF</span>;
  if (p === 1) return <span className="text-yellow-300 font-black">P1</span>;
  if (p <= 3) return <span className="text-f1-text font-bold">P{p}</span>;
  return <span className="text-f1-text-muted">P{p}</span>;
}

async function TeamDetailContent({ constructorId }: { constructorId: string }) {
  const [constructorStandings, driverStandings, allRaces] = await Promise.all([
    getConstructorStandings(),
    getDriverStandings(),
    getAllSeasonResults(),
  ]);

  const standing = constructorStandings.find(
    (s) => s.Constructor.constructorId === constructorId
  );
  if (!standing) notFound();

  const teamColor = getTeamColor(constructorId);
  const carImageUrls = getTeamCarImageUrls(constructorId);
  const drivers = driverStandings.filter(
    (d) => d.Constructors[0]?.constructorId === constructorId
  );

  // Compute team stats
  let podiums = 0, poles = 0, oneTwo = 0, fastestLaps = 0, dnfs = 0;
  let totalPos = 0, resultCount = 0, doublePoints = 0;

  const teamRaces = allRaces.filter((race) =>
    (race.Results ?? []).some((r) => r.Constructor.constructorId === constructorId)
  );

  for (const race of teamRaces) {
    const results = (race.Results ?? []).filter(
      (r) => r.Constructor.constructorId === constructorId
    );
    const positions = results.map((r) => parseInt(r.position));

    if (positions.includes(1) && positions.includes(2)) oneTwo++;
    if (positions.length >= 2 && positions.every((p: number) => p <= 10)) doublePoints++;

    for (const r of results) {
      resultCount++;
      const pos = parseInt(r.position);
      totalPos += pos;
      if (pos <= 3) podiums++;
      if (r.grid === "1") poles++;
      if (r.FastestLap?.rank === "1") fastestLaps++;
      if (r.status !== "Finished" && !r.status.startsWith("+")) dnfs++;
    }
  }

  const avgFinish =
    resultCount > 0 ? Math.round((totalPos / resultCount) * 10) / 10 : 0;
  const ppr = teamRaces.length > 0 ? parseFloat(standing.points) / teamRaces.length : 0;

  // Reliability breakdown: categorize DNFs
  const dnfReasons: { driver: string; status: string; raceName: string }[] = [];
  for (const race of teamRaces) {
    for (const r of (race.Results ?? []).filter((r) => r.Constructor.constructorId === constructorId)) {
      if (r.status !== "Finished" && !r.status.startsWith("+")) {
        dnfReasons.push({
          driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
          status: r.status,
          raceName: race.raceName.replace(" Grand Prix", " GP"),
        });
      }
    }
  }

  // Fetch pit stops for the team
  const pitStopData = await Promise.all(
    teamRaces.map(async (race) => {
      const stops = await getPitStops(race.round);
      return stops.filter((s) =>
        drivers.some((d) => d.Driver.driverId === s.driverId)
      );
    })
  );
  const allTeamStops = pitStopData.flat();
  const validStops = allTeamStops.filter((s) => {
    const dur = parseFloat(s.duration);
    return !isNaN(dur) && dur > 0;
  });
  const avgPitDuration = validStops.length > 0
    ? validStops.reduce((sum, s) => sum + parseFloat(s.duration), 0) / validStops.length
    : 0;
  const fastestPit = validStops.length > 0
    ? Math.min(...validStops.map((s) => parseFloat(s.duration)))
    : 0;

  // Build combined race table: for each race, get both drivers' results
  const raceRows = teamRaces.map((race) => {
    const results = (race.Results ?? []).filter(
      (r) => r.Constructor.constructorId === constructorId
    );
    // Sort by position
    results.sort((a, b) => parseInt(a.position) - parseInt(b.position));
    return { race, results };
  });

  return (
    <>
      {/* Team Header */}
      <div className="mb-6 rounded-xl border border-f1-border bg-f1-card overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: teamColor }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="w-1.5 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: teamColor }}
              />
              <div className="min-w-0">
                <p className="text-sm text-f1-text-muted">
                  {standing.Constructor.nationality} Constructor
                </p>
                <h1
                  className="text-4xl font-black uppercase tracking-tight leading-none mt-1"
                  style={{ color: teamColor }}
                >
                  {standing.Constructor.name}
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded bg-f1-dark px-2 py-0.5 text-xs font-bold text-f1-text-muted">
                    P{standing.position}
                  </span>
                  <span className="text-sm font-bold" style={{ color: teamColor }}>
                    {standing.points} pts
                  </span>
                  <span className="text-sm text-f1-text-muted">
                    {standing.wins} wins
                  </span>
                </div>
              </div>
            </div>
            {carImageUrls && carImageUrls.length > 0 && (
              <div className="shrink-0 self-end">
                <CarImage
                  src={carImageUrls[0]}
                  fallbackUrls={carImageUrls.slice(1)}
                  alt={`${standing.Constructor.name} car`}
                  className="h-28 w-auto object-contain object-right drop-shadow-lg sm:h-36"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Season Stats */}
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-4 gap-3">
        {[
          { label: "PODIUMS", value: podiums },
          { label: "POLES", value: poles },
          { label: "1-2 FINISHES", value: oneTwo },
          { label: "FASTEST LAPS", value: fastestLaps },
          { label: "DNFs", value: dnfs },
          { label: "2× POINTS", value: doublePoints },
          { label: "AVG FINISH", value: teamRaces.length > 0 ? avgFinish : "—" },
          { label: "RACES", value: teamRaces.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-f1-border bg-f1-card p-3 text-center"
          >
            <p className="text-xs text-f1-text-muted mb-1">{label}</p>
            <p className="text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Drivers */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {drivers.map((d) => {
          const driverImg = getDriverImageUrl(d.Driver.driverId);
          return (
            <Link
              key={d.Driver.driverId}
              href={`/drivers/${d.Driver.driverId}`}
              className="group rounded-xl border border-f1-border bg-f1-card overflow-hidden transition-all hover:bg-f1-card-hover hover:border-f1-accent/30"
            >
              <div className="flex items-end justify-between gap-2 px-4 pt-4">
                <div className="flex items-center gap-3 pb-4">
                  <span
                    className="text-3xl font-black opacity-25"
                    style={{ color: teamColor }}
                  >
                    {d.Driver.permanentNumber}
                  </span>
                  <div>
                    <p className="text-sm text-f1-text-muted">
                      {getCountryFlag(d.Driver.nationality)} {d.Driver.code}
                    </p>
                    <p className="font-black uppercase tracking-tight">
                      {d.Driver.givenName}{" "}
                      <span style={{ color: teamColor }}>{d.Driver.familyName}</span>
                    </p>
                    <p className="mt-1 text-xl font-black">{d.points} <span className="text-xs font-normal text-f1-text-muted">pts · P{d.position} · {d.wins}W</span></p>
                  </div>
                </div>
                {driverImg && (
                  <DriverImage
                    src={driverImg}
                    alt={`${d.Driver.givenName} ${d.Driver.familyName}`}
                    className="h-28 w-auto object-contain object-bottom shrink-0"
                  />
                )}
              </div>
              <div className="border-t border-f1-border/50 px-4 py-2">
                <p className="text-xs text-f1-accent group-hover:underline">
                  View Profile &rarr;
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pit Stop & Reliability */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* Pit Stop Performance */}
        {validStops.length > 0 && (
          <div className="rounded-xl border border-f1-border bg-f1-card p-5">
            <h2 className="text-sm font-bold text-f1-text-muted mb-3 uppercase tracking-wider">
              Pit Stop Performance
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-f1-text-muted mb-0.5">Avg Stop</p>
                <p className="text-xl font-black" style={{ color: teamColor }}>
                  {avgPitDuration.toFixed(2)}s
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-f1-text-muted mb-0.5">Fastest</p>
                <p className="text-xl font-black text-green-400">
                  {fastestPit.toFixed(1)}s
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-f1-text-muted mb-0.5">Total Stops</p>
                <p className="text-xl font-black">{validStops.length}</p>
              </div>
            </div>
            {/* Per-driver pit breakdown */}
            <div className="mt-3 pt-3 border-t border-f1-border/30 space-y-2">
              {drivers.map((d) => {
                const driverStops = validStops.filter((s) => s.driverId === d.Driver.driverId);
                if (driverStops.length === 0) return null;
                const driverAvg = driverStops.reduce((sum, s) => sum + parseFloat(s.duration), 0) / driverStops.length;
                return (
                  <div key={d.Driver.driverId} className="flex items-center justify-between text-xs">
                    <span className="text-f1-text-muted">{d.Driver.code}</span>
                    <span className="font-bold">{driverAvg.toFixed(2)}s avg ({driverStops.length} stops)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reliability Log */}
        {dnfReasons.length > 0 && (
          <div className="rounded-xl border border-f1-border bg-f1-card p-5">
            <h2 className="text-sm font-bold text-f1-text-muted mb-3 uppercase tracking-wider">
              Reliability Log
            </h2>
            <p className="text-3xl font-black text-red-400 mb-3">{dnfReasons.length} <span className="text-sm font-normal text-f1-text-muted">retirements</span></p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {dnfReasons.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-f1-border/20 pb-1.5">
                  <div>
                    <span className="font-medium">{d.driver.split(" ").at(-1)}</span>
                    <span className="text-f1-text-muted ml-1.5">{d.raceName}</span>
                  </div>
                  <span className="text-red-400 font-medium">{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points per race */}
        {teamRaces.length > 0 && (
          <div className="rounded-xl border border-f1-border bg-f1-card p-5">
            <h2 className="text-sm font-bold text-f1-text-muted mb-3 uppercase tracking-wider">
              Points Per Race
            </h2>
            <p className="text-3xl font-black" style={{ color: teamColor }}>{ppr.toFixed(1)}</p>
            <p className="text-xs text-f1-text-muted mt-1">
              {standing.points} pts across {teamRaces.length} races
            </p>
            {/* Driver contribution */}
            <div className="mt-3 pt-3 border-t border-f1-border/30">
              <p className="text-xs text-f1-text-muted mb-2">Driver Contribution</p>
              {drivers.map((d) => {
                const dPts = parseFloat(d.points);
                const teamPts = parseFloat(standing.points) || 1;
                const pct = Math.round((dPts / teamPts) * 100);
                return (
                  <div key={d.Driver.driverId} className="mb-1.5">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium">{d.Driver.code}</span>
                      <span className="text-f1-text-muted">{d.points} pts ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-f1-dark overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: teamColor, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Race-by-Race Table */}
      <div className="rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border px-5 py-4">
          <h2 className="font-bold text-lg">{CURRENT_YEAR} Race Results</h2>
        </div>

        {raceRows.length === 0 ? (
          <div className="p-8 text-center text-f1-text-muted">
            No results yet this season.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-xs text-f1-text-muted uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Round</th>
                  <th className="px-5 py-3 text-left">Race</th>
                  {drivers.map((d) => (
                    <th key={d.Driver.driverId} className="px-4 py-3 text-center">
                      {d.Driver.code}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {raceRows.map(({ race, results }) => {
                  const totalPts = results.reduce(
                    (sum, r) => sum + parseFloat(r.points),
                    0
                  );
                  return (
                    <tr
                      key={race.round}
                      className="border-b border-f1-border/50 last:border-0 hover:bg-f1-card-hover transition-colors"
                    >
                      <td className="px-5 py-3 text-f1-text-muted font-mono text-xs">
                        R{race.round}
                        <span className="block text-f1-text-muted/50">
                          {formatDate(race.date)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium max-w-[160px]">
                        <span className="truncate block">{race.raceName}</span>
                        <span className="text-xs text-f1-text-muted">
                          {race.Circuit.Location.country}
                        </span>
                      </td>
                      {drivers.map((d) => {
                        const r = results.find(
                          (res) => res.Driver.driverId === d.Driver.driverId
                        );
                        return (
                          <td key={d.Driver.driverId} className="px-4 py-3 text-center">
                            {r ? finishCell(r.position, r.status) : (
                              <span className="text-f1-text-muted/40">—</span>
                            )}
                            {r && (
                              <span className="block text-xs text-f1-text-muted">
                                {r.points}pts
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-black">
                        {totalPts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <a
          href={standing.Constructor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-f1-accent hover:underline"
        >
          Wikipedia &rarr;
        </a>
      </div>
    </>
  );
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ constructorId: string }>;
}) {
  const { constructorId } = await params;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/teams"
          className="text-sm text-f1-text-muted hover:text-f1-text transition-colors"
        >
          &larr; All Teams
        </Link>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-36 rounded-xl bg-f1-card animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-f1-card animate-pulse" />
              ))}
            </div>
            <div className="h-48 rounded-xl bg-f1-card animate-pulse" />
          </div>
        }
      >
        <TeamDetailContent constructorId={constructorId} />
      </Suspense>
    </div>
  );
}
