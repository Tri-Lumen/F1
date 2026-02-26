import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSeasonDriverStandings,
  getSeasonConstructorStandings,
  getSeasonSchedule,
  ARCHIVE_SEASONS,
  getCountryFlag,
  getCountryFlagByCountry,
} from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  return {
    title: `F1 ${season} Season — Archive`,
    description: `Driver standings, constructor standings, and race calendar for the ${season} F1 season`,
  };
}

export default async function ArchiveSeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;

  if (!ARCHIVE_SEASONS.includes(season)) {
    notFound();
  }

  const [driverStandings, constructorStandings, races] = await Promise.all([
    getSeasonDriverStandings(season),
    getSeasonConstructorStandings(season),
    getSeasonSchedule(season),
  ]);

  const champion = driverStandings[0];
  const constructorChampion = constructorStandings[0];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-f1-text-muted">
        <Link href="/archive" className="hover:text-f1-text transition-colors">
          Archive
        </Link>
        <span>/</span>
        <span className="text-f1-text">{season}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-f1-red">{season}</span> Season
        </h1>
        <p className="mt-1 text-sm text-f1-text-muted">
          {races.length} race{races.length !== 1 ? "s" : ""} · Final standings
        </p>
      </div>

      {/* Champion highlight */}
      {(champion || constructorChampion) && (
        <div className="mb-8 rounded-xl border border-f1-border bg-f1-card p-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {champion && (
              <div>
                <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-2 font-semibold">
                  Drivers&apos; Champion
                </p>
                <p className="text-xl font-black leading-tight">
                  {getCountryFlag(champion.Driver.nationality)}{" "}
                  {champion.Driver.givenName} {champion.Driver.familyName}
                </p>
                <p className="text-sm text-f1-text-muted mt-1">
                  {champion.Constructors[0]?.name} &middot;{" "}
                  {champion.points} pts &middot; {champion.wins} wins
                </p>
              </div>
            )}
            {constructorChampion && (
              <div>
                <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-2 font-semibold">
                  Constructors&apos; Champion
                </p>
                <p className="text-xl font-black leading-tight">
                  {constructorChampion.Constructor.name}
                </p>
                <p className="text-sm text-f1-text-muted mt-1">
                  {constructorChampion.points} pts &middot;{" "}
                  {constructorChampion.wins} wins
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standings grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-10">
        {/* Driver Standings */}
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold">Driver Standings</h2>
          </div>
          {driverStandings.length === 0 ? (
            <div className="p-8 text-center text-sm text-f1-text-muted">
              No data available
            </div>
          ) : (
            <div className="divide-y divide-f1-border">
              {driverStandings.slice(0, 10).map((s) => (
                <div
                  key={s.Driver.driverId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-f1-text-muted">
                    {s.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight">
                      {getCountryFlag(s.Driver.nationality)}{" "}
                      {s.Driver.givenName} {s.Driver.familyName}
                    </p>
                    <p className="text-xs text-f1-text-muted truncate">
                      {s.Constructors[0]?.name ?? "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-black">{s.points}</span>
                    <span className="text-xs text-f1-text-muted ml-1">pts</span>
                  </div>
                </div>
              ))}
              {driverStandings.length > 10 && (
                <p className="px-4 py-2 text-xs text-f1-text-muted">
                  +{driverStandings.length - 10} more drivers
                </p>
              )}
            </div>
          )}
        </div>

        {/* Constructor Standings */}
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="border-b border-f1-border p-4">
            <h2 className="font-bold">Constructor Standings</h2>
          </div>
          {constructorStandings.length === 0 ? (
            <div className="p-8 text-center text-sm text-f1-text-muted">
              No data available
            </div>
          ) : (
            <div className="divide-y divide-f1-border">
              {constructorStandings.map((s) => (
                <div
                  key={s.Constructor.constructorId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-f1-text-muted">
                    {s.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {s.Constructor.name}
                    </p>
                    <p className="text-xs text-f1-text-muted">
                      {s.wins} win{s.wins !== "1" ? "s" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-black">{s.points}</span>
                    <span className="text-xs text-f1-text-muted ml-1">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Race calendar */}
      {races.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">
            Race Calendar ({races.length} rounds)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {races.map((race) => (
              <div
                key={race.round}
                className="rounded-xl border border-f1-border bg-f1-card p-4"
              >
                <p className="text-xs text-f1-text-muted uppercase tracking-wider">
                  Round {race.round}
                </p>
                <p className="font-bold mt-1 leading-tight">{race.raceName}</p>
                <p className="text-xs text-f1-text-muted mt-0.5">
                  {getCountryFlagByCountry(race.Circuit.Location.country)}{" "}
                  {race.Circuit.Location.country} &middot; {race.date}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
