"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/FavoritesContext";
import { getTeamColor } from "@/lib/api";
import type { DriverStanding, ConstructorStanding, Race } from "@/lib/types";

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
              const constructorId = Constructors[0]?.constructorId ?? "";
              const teamColor = getTeamColor(constructorId);
              const recent = getDriverRecentResults(Driver.driverId);

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
                        {Driver.permanentNumber}
                      </span>
                      <div>
                        <p className="font-black text-lg leading-tight">
                          {Driver.givenName} {Driver.familyName}
                        </p>
                        <p className="text-sm text-f1-text-muted">
                          {Constructors[0]?.name ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Stat tiles */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
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
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-lg bg-f1-dark p-3">
                        <p className="text-xs text-f1-text-muted mb-0.5">Points</p>
                        <p className="text-2xl font-black">{standing.points}</p>
                      </div>
                      <div className="rounded-lg bg-f1-dark p-3">
                        <p className="text-xs text-f1-text-muted mb-0.5">Wins</p>
                        <p className="text-2xl font-black">{standing.wins}</p>
                      </div>
                    </div>

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
