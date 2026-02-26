export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDriverStandings,
  getDriverResults,
  getTeamColor,
  getCountryFlag,
  CURRENT_YEAR,
} from "@/lib/api";
import RefreshButton from "@/components/RefreshButton";

function positionBadge(pos: string, status: string) {
  const p = parseInt(pos);
  const isDNF =
    status !== "Finished" && !status.startsWith("+");

  if (isDNF) {
    return (
      <span className="inline-flex items-center justify-center w-10 h-8 rounded text-xs font-black bg-red-900/40 text-red-400 border border-red-800/50">
        DNF
      </span>
    );
  }
  if (p === 1) {
    return (
      <span className="inline-flex items-center justify-center w-10 h-8 rounded text-xs font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
        P1
      </span>
    );
  }
  if (p <= 3) {
    return (
      <span className="inline-flex items-center justify-center w-10 h-8 rounded text-xs font-black bg-f1-border/60 text-f1-text border border-f1-border">
        P{p}
      </span>
    );
  }
  if (p <= 10) {
    return (
      <span className="inline-flex items-center justify-center w-10 h-8 rounded text-xs font-black bg-f1-dark text-f1-text border border-f1-border/50">
        P{p}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-10 h-8 rounded text-xs font-bold bg-f1-dark text-f1-text-muted border border-f1-border/30">
      P{p}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function DriverProfileContent({ driverId }: { driverId: string }) {
  const [standings, races] = await Promise.all([
    getDriverStandings(),
    getDriverResults(driverId),
  ]);

  const standing = standings.find((s) => s.Driver.driverId === driverId);
  if (!standing) notFound();

  const driver = standing.Driver;
  const constructor = standing.Constructors[0];
  const teamColor = getTeamColor(constructor?.constructorId ?? "");

  // Compute season stats from race results
  let podiums = 0;
  let poles = 0;
  let fastestLaps = 0;
  let dnfs = 0;
  let totalPos = 0;
  let totalPoints = 0;

  for (const race of races) {
    const r = race.Results?.[0];
    if (!r) continue;
    const pos = parseInt(r.position);
    totalPoints += parseFloat(r.points);
    if (pos <= 3) podiums++;
    if (r.grid === "1") poles++;
    if (r.FastestLap?.rank === "1") fastestLaps++;
    if (r.status !== "Finished" && !r.status.startsWith("+")) dnfs++;
    totalPos += pos;
  }

  const racesEntered = races.length;
  const avgFinish =
    racesEntered > 0
      ? Math.round((totalPos / racesEntered) * 10) / 10
      : 0;

  const last5 = races.slice(-5);

  const age = driver.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(driver.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <>
      {/* Driver Header */}
      <div className="mb-6 rounded-xl border border-f1-border bg-f1-card overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: teamColor }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-1.5 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: teamColor }}
              />
              <div>
                <p className="text-sm text-f1-text-muted">
                  {getCountryFlag(driver.nationality)} {driver.nationality}
                  {age !== null && (
                    <span className="ml-2 text-f1-text-muted/60">
                      · Age {age}
                    </span>
                  )}
                </p>
                <h1 className="text-4xl font-black uppercase tracking-tight leading-none mt-1">
                  {driver.givenName}{" "}
                  <span style={{ color: teamColor }}>{driver.familyName}</span>
                </h1>
                <p className="mt-1 text-sm font-medium" style={{ color: teamColor }}>
                  {constructor?.name ?? ""}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className="text-6xl font-black leading-none opacity-20"
                style={{ color: teamColor }}
              >
                {driver.permanentNumber || "#"}
              </span>
              <p className="text-xs text-f1-text-muted mt-1 font-mono">
                {driver.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Season Stats */}
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: "POSITION", value: `P${standing.position}` },
          { label: "POINTS", value: standing.points },
          { label: "WINS", value: standing.wins },
          { label: "PODIUMS", value: podiums },
          { label: "POLES", value: poles },
          { label: "FASTEST LAPS", value: fastestLaps },
          { label: "DNFs", value: dnfs },
          { label: "AVG FINISH", value: racesEntered > 0 ? avgFinish : "—" },
          { label: "RACES", value: racesEntered },
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

      {/* Recent Form */}
      {last5.length > 0 && (
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-5">
          <h2 className="text-sm font-bold text-f1-text-muted mb-3 uppercase tracking-wider">
            Recent Form
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {last5.map((race) => {
              const r = race.Results?.[0];
              if (!r) return null;
              return (
                <div key={race.round} className="flex flex-col items-center gap-1">
                  {positionBadge(r.position, r.status)}
                  <span className="text-xs text-f1-text-muted/60">
                    R{race.round}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Race-by-Race Results */}
      <div className="rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border px-5 py-4">
          <h2 className="font-bold text-lg">
            {CURRENT_YEAR} Race Results
          </h2>
        </div>

        {races.length === 0 ? (
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
                  <th className="px-5 py-3 text-center">Grid</th>
                  <th className="px-5 py-3 text-center">Finish</th>
                  <th className="px-5 py-3 text-center">Pts</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 text-center hidden sm:table-cell">FL</th>
                </tr>
              </thead>
              <tbody>
                {races.map((race) => {
                  const r = race.Results?.[0];
                  if (!r) return null;
                  const isDNF =
                    r.status !== "Finished" && !r.status.startsWith("+");
                  const isWin = r.position === "1";
                  const isPodium = parseInt(r.position) <= 3;
                  const hasFastestLap = r.FastestLap?.rank === "1";

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
                      <td className="px-5 py-3 text-center font-mono">
                        {r.grid === "0" ? "PL" : `P${r.grid}`}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`font-black text-base ${
                            isWin
                              ? "text-yellow-300"
                              : isPodium
                              ? "text-f1-text"
                              : isDNF
                              ? "text-red-400"
                              : "text-f1-text-muted"
                          }`}
                        >
                          {isDNF ? "DNF" : `P${r.position}`}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold">
                        {r.points}
                      </td>
                      <td className="px-5 py-3 text-f1-text-muted hidden sm:table-cell text-xs">
                        {r.status}
                      </td>
                      <td className="px-5 py-3 text-center hidden sm:table-cell">
                        {hasFastestLap && (
                          <span className="text-purple-400 font-bold text-xs">
                            ⚡ FL
                          </span>
                        )}
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
          href={driver.url}
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

export default function DriverProfilePage({
  params,
}: {
  params: { driverId: string };
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/drivers"
          className="text-sm text-f1-text-muted hover:text-f1-text transition-colors"
        >
          &larr; All Drivers
        </Link>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-36 rounded-xl bg-f1-card animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-f1-card animate-pulse" />
              ))}
            </div>
            <div className="h-48 rounded-xl bg-f1-card animate-pulse" />
          </div>
        }
      >
        <DriverProfileContent driverId={params.driverId} />
      </Suspense>
    </div>
  );
}
