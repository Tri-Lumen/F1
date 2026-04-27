"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/FavoritesContext";
import { getTeamColor } from "@/lib/api";
import type { DriverStanding, ConstructorStanding, Race } from "@/lib/types";
import {
  getDriverNumber,
  getDriverConstructorId,
  getDriverConstructorName,
} from "@/lib/driverOverrides";

interface Props {
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  seasonResults: Race[];
}

/** Small badge showing a race finish position with contextual colour. */
function PositionBadge({ position, title }: { position: string; title: string }) {
  const pos = parseInt(position, 10);
  const isNumeric = !isNaN(pos);

  let classes = "bg-f1-dark text-f1-text-muted";
  const label = isNumeric ? `P${pos}` : "DNF";

  if (!isNumeric) {
    classes = "bg-f1-red/20 text-f1-red";
  } else if (pos === 1) {
    classes = "bg-yellow-500/20 text-yellow-400";
  } else if (pos === 2) {
    classes = "bg-gray-400/20 text-gray-300";
  } else if (pos === 3) {
    classes = "bg-amber-700/20 text-amber-500";
  } else if (pos <= 10) {
    classes = "bg-f1-card text-f1-text";
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold ${classes}`}
    >
      {label}
    </span>
  );
}

/** Skeleton shown while localStorage is being read on first render. */
function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 rounded-xl bg-f1-card animate-pulse" />
      ))}
    </div>
  );
}

/** Compute extended driver stats from season results. */
function computeDriverExtras(driverId: string, sortedRaces: Race[]) {
  let podiums = 0;
  let totalPts = 0;
  let racesEntered = 0;
  const avgPositions: number[] = [];

  for (const race of sortedRaces) {
    const r = race.Results?.find((res) => res.Driver.driverId === driverId);
    if (!r) continue;
    racesEntered++;
    const pos = parseInt(r.position);
    const pts = parseFloat(r.points);
    totalPts += pts;
    if (pos <= 3) podiums++;
    avgPositions.push(pos);
  }

  // Form trend: compare average of last 3 vs previous 3
  let trend: "up" | "down" | "stable" = "stable";
  if (avgPositions.length >= 4) {
    const recent = avgPositions.slice(-3);
    const previous = avgPositions.slice(-6, -3);
    if (previous.length >= 2) {
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgPrev = previous.reduce((a, b) => a + b, 0) / previous.length;
      // Lower position number = better, so if recent avg is lower, trending up
      if (avgRecent < avgPrev - 0.5) trend = "up";
      else if (avgRecent > avgPrev + 0.5) trend = "down";
    }
  }

  const ppr = racesEntered > 0 ? totalPts / racesEntered : 0;
  const projectedPts = racesEntered > 0 ? Math.round(ppr * 24) : 0; // ~24 races

  return { podiums, ppr, trend, projectedPts, racesEntered };
}

/** Compute constructor extended stats. */
function computeTeamExtras(constructorId: string, sortedRaces: Race[]) {
  let podiums = 0;
  let totalPts = 0;
  let racesEntered = 0;
  let doublePoints = 0; // both drivers in top 10

  for (const race of sortedRaces) {
    const teamResults = race.Results?.filter(
      (r) => r.Constructor.constructorId === constructorId
    ) ?? [];
    if (teamResults.length === 0) continue;
    racesEntered++;
    let inPoints = 0;
    for (const r of teamResults) {
      const pos = parseInt(r.position);
      const pts = parseFloat(r.points);
      totalPts += pts;
      if (pos <= 3) podiums++;
      if (pos <= 10) inPoints++;
    }
    if (inPoints >= 2) doublePoints++;
  }

  const ppr = racesEntered > 0 ? totalPts / racesEntered : 0;

  return { podiums, ppr, doublePoints, racesEntered };
}

export default function FavoritesClient({
  driverStandings,
  constructorStandings,
  seasonResults,
}: Props) {
  const { favoriteDriverIds, favoriteTeamIds, hasAnyFavorites, mounted } =
    useFavorites();

  // Show skeleton until localStorage read completes to avoid empty-state flash
  if (!mounted) return <LoadingSkeleton />;

  if (!hasAnyFavorites) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 text-5xl">🏎</div>
        <h2 className="text-2xl font-black mb-2">No favourites yet</h2>
        <p className="text-f1-text-muted mb-6 max-w-sm text-sm">
          Head to Settings to pick up to 3 drivers and 2 teams. They&apos;ll
          appear here with live standings and recent race results.
        </p>
        <Link
          href="/settings"
          className="rounded-lg bg-f1-red px-5 py-2.5 text-sm font-bold text-white hover:bg-f1-red-dark transition-colors"
        >
          Go to Settings →
        </Link>
      </div>
    );
  }

  const favoriteDrivers = driverStandings.filter((s) =>
    favoriteDriverIds.includes(s.Driver.driverId)
  );
  const favoriteTeams = constructorStandings.filter((s) =>
    favoriteTeamIds.includes(s.Constructor.constructorId)
  );

  // Sort all completed races by round number ascending
  const sortedRaces = [...seasonResults].sort(
    (a, b) => parseInt(a.round) - parseInt(b.round)
  );

  function getDriverRecentResults(driverId: string) {
    const out: { raceName: string; position: string }[] = [];
    for (const race of sortedRaces) {
      const r = race.Results?.find((res) => res.Driver.driverId === driverId);
      if (r) out.push({ raceName: race.raceName, position: r.positionText });
    }
    return out.slice(-5);
  }

  function getTeamBestResults(constructorId: string) {
    const out: { raceName: string; position: string }[] = [];
    for (const race of sortedRaces) {
      const teamResults =
        race.Results?.filter(
          (r) => r.Constructor.constructorId === constructorId
        ) ?? [];
      if (teamResults.length > 0) {
        const best = teamResults.reduce((a, b) => {
          const posA = parseInt(a.position) || 99;
          const posB = parseInt(b.position) || 99;
          return posA < posB ? a : b;
        });
        out.push({ raceName: race.raceName, position: best.positionText });
      }
    }
    return out.slice(-5);
  }

  function getTeamDriverNames(constructorId: string): string[] {
    return driverStandings
      .filter((s) =>
        s.Constructors.some((c) => c.constructorId === constructorId)
      )
      .map((s) => `${s.Driver.givenName} ${s.Driver.familyName}`);
  }

  /** Get the gap (in points) to the driver immediately ahead and behind. */
  function getDriverGaps(driverId: string) {
    const idx = driverStandings.findIndex((s) => s.Driver.driverId === driverId);
    if (idx < 0) return { ahead: null, behind: null };
    const pts = parseFloat(driverStandings[idx].points);
    const ahead = idx > 0 ? {
      name: driverStandings[idx - 1].Driver.familyName,
      gap: parseFloat(driverStandings[idx - 1].points) - pts,
    } : null;
    const behind = idx < driverStandings.length - 1 ? {
      name: driverStandings[idx + 1].Driver.familyName,
      gap: pts - parseFloat(driverStandings[idx + 1].points),
    } : null;
    return { ahead, behind };
  }

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-1">
        <span className="text-f1-red">My</span> Favourites
      </h1>
      <p className="text-sm text-f1-text-muted mb-8">
        Your selected drivers and teams at a glance.{" "}
        <Link href="/settings" className="text-f1-accent hover:underline">
          Edit in Settings →
        </Link>
      </p>

      {/* ── Favourite Drivers ── */}
      {favoriteDrivers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">Drivers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteDrivers.map((standing) => {
              const { Driver, Constructors } = standing;
              const constructorId = getDriverConstructorId(Driver.driverId, Constructors[0]?.constructorId) ?? "";
              const constructorName = getDriverConstructorName(Driver.driverId, Constructors[0]?.name) ?? "—";
              const displayNumber = getDriverNumber(Driver.driverId, Driver.permanentNumber);
              const teamColor = getTeamColor(constructorId);
              const recent = getDriverRecentResults(Driver.driverId);
              const extras = computeDriverExtras(Driver.driverId, sortedRaces);
              const gaps = getDriverGaps(Driver.driverId);

              return (
                <div
                  key={Driver.driverId}
                  className="rounded-xl border bg-f1-card overflow-hidden"
                  style={{ borderColor: teamColor + "55" }}
                >
                  {/* Team colour strip */}
                  <div className="h-1" style={{ backgroundColor: teamColor }} />
                  <div className="p-4">
                    {/* Driver header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        {displayNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-lg leading-tight">
                            {Driver.givenName} {Driver.familyName}
                          </p>
                          {extras.trend === "up" && (
                            <span className="text-green-400 text-sm font-bold" title="Improving form">&#9650;</span>
                          )}
                          {extras.trend === "down" && (
                            <span className="text-red-400 text-sm font-bold" title="Declining form">&#9660;</span>
                          )}
                        </div>
                        <p className="text-sm text-f1-text-muted">
                          {constructorName}
                        </p>
                      </div>
                    </div>

                    {/* Stat tiles */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-lg bg-f1-dark p-2.5 text-center">
                        <p className="text-xs text-f1-text-muted mb-0.5">Position</p>
                        <p
                          className="text-xl font-black"
                          style={{ color: teamColor }}
                        >
                          P{standing.position}
                        </p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-2.5 text-center">
                        <p className="text-xs text-f1-text-muted mb-0.5">Points</p>
                        <p className="text-xl font-black">{standing.points}</p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-2.5 text-center">
                        <p className="text-xs text-f1-text-muted mb-0.5">Wins</p>
                        <p className="text-xl font-black">{standing.wins}</p>
                      </div>
                    </div>

                    {/* Extended stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-lg bg-f1-dark p-2.5 text-center">
                        <p className="text-xs text-f1-text-muted mb-0.5">Podiums</p>
                        <p className="text-lg font-black">{extras.podiums}</p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-2.5 text-center">
                        <p className="text-xs text-f1-text-muted mb-0.5">PPR</p>
                        <p className="text-lg font-black">{extras.ppr.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-2.5 text-center">
                        <p className="text-xs text-f1-text-muted mb-0.5">Proj. Pts</p>
                        <p className="text-lg font-black">{extras.projectedPts}</p>
                      </div>
                    </div>

                    {/* Championship gap context */}
                    {(gaps.ahead || gaps.behind) && (
                      <div className="flex gap-3 mb-4 text-xs">
                        {gaps.ahead && (
                          <span className="text-f1-text-muted">
                            <span className="text-red-400 font-bold">-{gaps.ahead.gap}</span> to {gaps.ahead.name}
                          </span>
                        )}
                        {gaps.behind && (
                          <span className="text-f1-text-muted">
                            <span className="text-green-400 font-bold">+{gaps.behind.gap}</span> over {gaps.behind.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Recent results */}
                    {recent.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-2 font-semibold">
                          Last {recent.length} Races
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {recent.map((r, i) => (
                            <PositionBadge
                              key={i}
                              position={r.position}
                              title={r.raceName}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Favourite Constructors ── */}
      {favoriteTeams.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">Constructors</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {favoriteTeams.map((standing) => {
              const { Constructor } = standing;
              const teamColor = getTeamColor(Constructor.constructorId);
              const recent = getTeamBestResults(Constructor.constructorId);
              const drivers = getTeamDriverNames(Constructor.constructorId);
              const teamExtras = computeTeamExtras(Constructor.constructorId, sortedRaces);

              return (
                <div
                  key={Constructor.constructorId}
                  className="rounded-xl border bg-f1-card overflow-hidden"
                  style={{ borderColor: teamColor + "55" }}
                >
                  {/* Team colour strip */}
                  <div className="h-1.5" style={{ backgroundColor: teamColor }} />
                  <div className="p-4">
                    {/* Team header */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div>
                        <p className="font-black text-xl">{Constructor.name}</p>
                        {drivers.length > 0 && (
                          <p className="text-sm text-f1-text-muted">
                            {drivers.join(" · ")}
                          </p>
                        )}
                      </div>
                      <span
                        className="flex-shrink-0 text-xs font-black px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        P{standing.position}
                      </span>
                    </div>

                    {/* Stat tiles */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="rounded-lg bg-f1-dark p-3">
                        <p className="text-xs text-f1-text-muted mb-0.5">Points</p>
                        <p className="text-2xl font-black">{standing.points}</p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-3">
                        <p className="text-xs text-f1-text-muted mb-0.5">Wins</p>
                        <p className="text-2xl font-black">{standing.wins}</p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-3">
                        <p className="text-xs text-f1-text-muted mb-0.5">Podiums</p>
                        <p className="text-2xl font-black">{teamExtras.podiums}</p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-3">
                        <p className="text-xs text-f1-text-muted mb-0.5">PPR</p>
                        <p className="text-2xl font-black">{teamExtras.ppr.toFixed(1)}</p>
                      </div>
                    </div>

                    {/* Double points finishes indicator */}
                    {teamExtras.doublePoints > 0 && (
                      <p className="text-xs text-f1-text-muted mb-4">
                        Both drivers in points in <span className="font-bold text-f1-text">{teamExtras.doublePoints}</span> of {teamExtras.racesEntered} races
                      </p>
                    )}

                    {/* Best recent results */}
                    {recent.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-2 font-semibold">
                          Best of Last {recent.length} Races
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {recent.map((r, i) => (
                            <PositionBadge
                              key={i}
                              position={r.position}
                              title={r.raceName}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
