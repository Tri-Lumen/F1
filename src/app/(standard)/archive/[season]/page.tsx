import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSeasonDriverStandings,
  getSeasonConstructorStandings,
  getSeasonSchedule,
  getSeasonRaceResults,
  ARCHIVE_SEASONS,
  getCountryFlag,
  getCountryFlagByCountry,
  getTeamColor,
  getF1TVRaceUrl,
} from "@/lib/api";
import CircuitMap from "@/components/CircuitMap";

// Historical seasons never change, so cache aggressively rather than
// rendering fully dynamically on every request.
export const revalidate = 86400;

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

  const [driverStandings, constructorStandings, races, raceResults] = await Promise.all([
    getSeasonDriverStandings(season),
    getSeasonConstructorStandings(season),
    getSeasonSchedule(season),
    getSeasonRaceResults(season),
  ]);

  // Build winner map from race results
  const winnerMap = new Map<string, { name: string; constructorId: string; time?: string; fastestLap?: string }>();
  for (const race of raceResults) {
    const results = race.Results ?? [];
    const winner = results.find((r) => r.position === "1");
    const fl = results.find((r) => r.FastestLap?.rank === "1");
    if (winner) {
      winnerMap.set(race.round, {
        name: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
        constructorId: winner.Constructor.constructorId,
        time: winner.Time?.time,
        fastestLap:
          fl && fl.FastestLap?.Time?.time
            ? `${fl.Driver.familyName} ${fl.FastestLap.Time.time}`
            : undefined,
      });
    }
  }

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

      {/* Season Champion highlight */}
      {driverStandings[0] && (() => {
        const champ = driverStandings[0];
        const teamColor = getTeamColor(champ.Constructors[0]?.constructorId ?? "");
        const teamName = champ.Constructors[0]?.name ?? "";
        return (
          <div
            className="mb-8 rounded-xl border overflow-hidden"
            style={{ borderColor: `${teamColor}50`, background: `linear-gradient(135deg, ${teamColor}12, ${teamColor}06, transparent)` }}
          >
            <div className="px-6 py-5 flex items-center gap-5">
              <div
                className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full text-3xl"
                style={{ background: `${teamColor}20`, border: `2px solid ${teamColor}50` }}
              >
                🏆
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${teamColor}30`, color: teamColor }}
                  >
                    {season} World Champion
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight" style={{ color: teamColor }}>
                  {getCountryFlag(champ.Driver.nationality)}{" "}
                  {champ.Driver.givenName} {champ.Driver.familyName}
                </h2>
                <p className="text-sm text-f1-text-muted mt-0.5">{teamName}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-3xl font-black" style={{ color: teamColor }}>{champ.points}</div>
                <div className="text-xs text-f1-text-muted">points</div>
                <div className="text-lg font-black mt-1">{champ.wins}</div>
                <div className="text-xs text-f1-text-muted">wins</div>
              </div>
            </div>
          </div>
        );
      })()}

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
                  className={`flex items-center gap-3 px-4 py-3 ${s.position === "1" ? "border-l-2 border-yellow-400" : ""}`}
                >
                  <span className={`w-6 shrink-0 text-center text-sm font-bold ${s.position === "1" ? "text-yellow-400" : "text-f1-text-muted"}`}>
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
                  className={`flex items-center gap-3 px-4 py-3 ${s.position === "1" ? "border-l-2 border-yellow-400" : ""}`}
                >
                  <span className={`w-6 shrink-0 text-center text-sm font-bold ${s.position === "1" ? "text-yellow-400" : "text-f1-text-muted"}`}>
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
                className="rounded-xl border border-f1-border bg-f1-card p-4 flex flex-col gap-2"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-f1-text-muted uppercase tracking-wider">
                      Round {race.round}
                    </p>
                    <p className="font-bold mt-1 leading-tight">{race.raceName}</p>
                    <p className="text-xs text-f1-text-muted mt-0.5">
                      {getCountryFlagByCountry(race.Circuit.Location.country)}{" "}
                      {race.Circuit.Location.country} &middot; {race.date}
                    </p>
                    {winnerMap.has(race.round) && (() => {
                      const w = winnerMap.get(race.round)!;
                      const color = getTeamColor(w.constructorId);
                      return (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="h-3.5 w-1 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs font-bold" style={{ color }}>
                            {w.name.split(" ").pop()?.toUpperCase()}
                          </span>
                          {w.time && (
                            <span className="text-xs text-f1-text-muted font-mono">{w.time}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <CircuitMap
                    circuitId={race.Circuit.circuitId}
                    className="w-20 h-14 shrink-0 opacity-40"
                  />
                </div>
                <a
                  href={getF1TVRaceUrl(race)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start rounded-lg bg-f1-dark px-3 py-1 text-xs font-medium text-f1-accent hover:bg-f1-border transition-colors"
                >
                  Watch on F1TV &rarr;
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
