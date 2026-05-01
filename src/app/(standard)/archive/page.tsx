import Link from "next/link";
import { ARCHIVE_SEASONS, getTeamColor } from "@/lib/api";

export const metadata = {
  title: "F1 Archive — Season History",
  description: "Historical F1 season results from 2016 to 2025",
};

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

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
      <div className="mb-6">
        <div
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          ARCHIVE
        </div>
        <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 4 }}>
          Championship standings and race results from 2016 to 2025
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ARCHIVE_SEASONS.map((season) => {
          const info = SEASON_DATA[season];
          const teamColor = info ? getTeamColor(info.constructorId) : "var(--color-f1-text-muted)";
          const lastName = info?.driverChampion.split(" ").pop();

          return (
            <Link
              key={season}
              href={`/archive/${season}`}
              className="group relative overflow-hidden rounded-xl border border-[#1c1c1c] bg-[#131313] transition-all hover:-translate-y-0.5"
              style={{ transition: "transform 0.2s, border-color 0.2s" }}
            >
              {/* Team-colour strip */}
              <div
                className="h-[3px] w-full"
                style={{
                  background: `linear-gradient(90deg, ${teamColor}, ${teamColor}55)`,
                }}
              />

              <div className="p-5">
                {/* Year + race count */}
                <div className="flex items-start justify-between mb-4">
                  <p
                    style={{
                      fontFamily: BC,
                      fontWeight: 900,
                      fontSize: 36,
                      letterSpacing: "0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {season}
                  </p>
                  {info && (
                    <span
                      className="rounded-full bg-[#0e0e0e] px-2 py-1 text-[10px]"
                      style={{
                        fontFamily: BC,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "#666",
                      }}
                    >
                      {info.races} RACES
                    </span>
                  )}
                </div>

                {info ? (
                  <div className="space-y-2">
                    {/* Driver champion */}
                    <div className="flex items-center gap-2">
                      <span
                        className="w-16 shrink-0 text-[9px]"
                        style={{
                          fontFamily: DM,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          color: "#3a3a3a",
                          textTransform: "uppercase",
                        }}
                      >
                        Driver
                      </span>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-3.5 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span
                          className="truncate"
                          style={{
                            fontFamily: BC,
                            fontWeight: 800,
                            fontSize: 14,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {lastName?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {/* Constructor champion */}
                    <div className="flex items-center gap-2">
                      <span
                        className="w-16 shrink-0 text-[9px]"
                        style={{
                          fontFamily: DM,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          color: "#3a3a3a",
                          textTransform: "uppercase",
                        }}
                      >
                        Team
                      </span>
                      <span
                        className="truncate text-sm"
                        style={{ fontFamily: DM, color: "#888" }}
                      >
                        {info.constructorChampion}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontFamily: DM, fontSize: 12, color: "#555" }}>
                    Season data
                  </p>
                )}

                <p
                  className="mt-4 text-[10px] transition-colors"
                  style={{
                    fontFamily: BC,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    color: teamColor,
                    opacity: 0.7,
                  }}
                >
                  VIEW SEASON →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
