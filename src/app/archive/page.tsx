import Link from "next/link";
import { ARCHIVE_SEASONS, getTeamColor } from "@/lib/api";

export const metadata = {
  title: "F1 Archive — Season History",
  description: "Historical F1 season results from 2016 to 2025",
};

interface SeasonSummary {
  driverChampion: string;
  constructorChampion: string;
  constructorId: string;
  races: number;
}

const SEASON_DATA: Record<string, SeasonSummary> = {
  "2025": { driverChampion: "Lando Norris",    constructorChampion: "McLaren",            constructorId: "mclaren",       races: 24 },
  "2024": { driverChampion: "Max Verstappen",  constructorChampion: "McLaren",            constructorId: "mclaren",       races: 24 },
  "2023": { driverChampion: "Max Verstappen",  constructorChampion: "Red Bull Racing",    constructorId: "red_bull",      races: 23 },
  "2022": { driverChampion: "Max Verstappen",  constructorChampion: "Red Bull Racing",    constructorId: "red_bull",      races: 22 },
  "2021": { driverChampion: "Max Verstappen",  constructorChampion: "Mercedes",           constructorId: "mercedes",      races: 22 },
  "2020": { driverChampion: "Lewis Hamilton",  constructorChampion: "Mercedes",           constructorId: "mercedes",      races: 17 },
  "2019": { driverChampion: "Lewis Hamilton",  constructorChampion: "Mercedes",           constructorId: "mercedes",      races: 21 },
  "2018": { driverChampion: "Lewis Hamilton",  constructorChampion: "Mercedes",           constructorId: "mercedes",      races: 21 },
  "2017": { driverChampion: "Lewis Hamilton",  constructorChampion: "Mercedes",           constructorId: "mercedes",      races: 20 },
  "2016": { driverChampion: "Nico Rosberg",    constructorChampion: "Mercedes",           constructorId: "mercedes",      races: 21 },
};

export default function ArchivePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-f1-red">F1</span> Archive
        </h1>
        <p className="mt-1 text-sm text-f1-text-muted">
          Championship standings and race results from 2016 to 2025
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ARCHIVE_SEASONS.map((season) => {
          const info = SEASON_DATA[season];
          const teamColor = info ? getTeamColor(info.constructorId) : "#888";
          const lastName = info?.driverChampion.split(" ").pop();

          return (
            <Link
              key={season}
              href={`/archive/${season}`}
              className="group relative rounded-xl border border-f1-border bg-f1-card overflow-hidden transition-all hover:border-f1-accent hover:shadow-lg hover:shadow-f1-accent/10"
            >
              {/* Colour strip */}
              <div
                className="h-1 w-full"
                style={{ backgroundColor: teamColor }}
              />

              <div className="p-5">
                {/* Year + race count */}
                <div className="flex items-start justify-between mb-4">
                  <p className="text-4xl font-black group-hover:text-f1-accent transition-colors">
                    {season}
                  </p>
                  {info && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-f1-text-muted bg-f1-dark px-2 py-1 rounded-full mt-1">
                      {info.races} races
                    </span>
                  )}
                </div>

                {info ? (
                  <div className="space-y-2">
                    {/* Driver champion */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-f1-text-muted/60 w-16 shrink-0">Driver</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="h-3.5 w-1 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span className="font-bold text-sm truncate">{lastName}</span>
                      </div>
                    </div>
                    {/* Constructor champion */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-f1-text-muted/60 w-16 shrink-0">Team</span>
                      <span className="text-sm text-f1-text-muted truncate">{info.constructorChampion}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-f1-text-muted">Season data</p>
                )}

                <p className="mt-4 text-[10px] text-f1-accent/70 font-semibold uppercase tracking-wider group-hover:text-f1-accent transition-colors">
                  View season →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
