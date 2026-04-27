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
import type { Metadata } from "next";
import RefreshButton from "@/components/RefreshButton";
import { DriverImage, DriverNumber } from "@/components/ProfileImage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ driverId: string }>;
}): Promise<Metadata> {
  const { driverId } = await params;
  const standings = await getDriverStandings();
  const standing = standings.find((s) => s.Driver.driverId === driverId);
  const name = standing
    ? `${standing.Driver.givenName} ${standing.Driver.familyName}`
    : driverId;
  return {
    title: `${name} — F1 2026`,
    description: `Season results, points progression, and stats for ${name}`,
  };
}
import { getDriverImageUrl, getDriverImageFallbackUrl, getDriverNumberUrl } from "@/lib/profileImages";
import {
  getDriverNumber,
  getDriverConstructorId,
  getDriverConstructorName,
} from "@/lib/driverOverrides";

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
  const constructorId = getDriverConstructorId(driver.driverId, constructor?.constructorId) ?? "";
  const constructorName = getDriverConstructorName(driver.driverId, constructor?.name) ?? "";
  const displayNumber = getDriverNumber(driver.driverId, driver.permanentNumber);
  const teamColor = getTeamColor(constructorId);

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

  // Extended stats
  let totalGrid = 0;
  let gridRaces = 0;
  let totalPositionsGained = 0;
  let frontRowStarts = 0;
  let pointsFinishes = 0;
  let poleToWins = 0;
  let poleCount = poles;

  for (const race of races) {
    const r = race.Results?.[0];
    if (!r) continue;
    const pos = parseInt(r.position);
    const grid = parseInt(r.grid);
    if (grid > 0) {
      totalGrid += grid;
      gridRaces++;
      totalPositionsGained += grid - pos;
      if (grid <= 2) frontRowStarts++;
      if (grid === 1 && pos === 1) poleToWins++;
    }
    if (pos <= 10) pointsFinishes++;
  }

  const racesEntered = races.length;
  const avgFinish =
    racesEntered > 0
      ? Math.round((totalPos / racesEntered) * 10) / 10
      : 0;
  const avgGrid =
    gridRaces > 0
      ? Math.round((totalGrid / gridRaces) * 10) / 10
      : 0;
  const ppr = racesEntered > 0 ? totalPoints / racesEntered : 0;
  const poleConversion = poleCount > 0 ? Math.round((poleToWins / poleCount) * 100) : null;
  const pointsRate = racesEntered > 0 ? Math.round((pointsFinishes / racesEntered) * 100) : 0;

  const last5 = races.slice(-5);
  const driverImageUrl = getDriverImageUrl(driver.driverId);
  const driverImageFallbackUrl = getDriverImageFallbackUrl(driver.driverId);
  const driverNumberUrl = getDriverNumberUrl(driver.driverId);

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
                  {constructorName}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {driverNumberUrl ? (
                    <DriverNumber
                      src={driverNumberUrl}
                      number={displayNumber}
                      className="h-10 w-auto opacity-80"
                      color={teamColor}
                    />
                  ) : (
                    <span className="text-4xl font-black italic leading-none opacity-25" style={{ color: teamColor }}>
                      {displayNumber}
                    </span>
                  )}
                  <span className="text-xs text-f1-text-muted font-mono">
                    {driver.code}
                  </span>
                </div>
              </div>
            </div>
            {driverImageUrl && (
              <div className="shrink-0 self-end">
                <DriverImage
                  src={driverImageUrl}
                  fallbackSrc={driverImageFallbackUrl}
                  alt={`${driver.givenName} ${driver.familyName}`}
                  className="h-44 w-auto object-contain object-bottom drop-shadow-lg"
                />
              </div>
            )}
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
          { label: "AVG GRID", value: gridRaces > 0 ? avgGrid : "—" },
          { label: "PPR", value: racesEntered > 0 ? ppr.toFixed(1) : "—" },
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

      {/* Performance Insights */}
      {racesEntered > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-f1-border bg-f1-card p-3 text-center">
            <p className="text-xs text-f1-text-muted mb-1">POSITIONS GAINED</p>
            <p className={`text-2xl font-black ${totalPositionsGained >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalPositionsGained >= 0 ? "+" : ""}{totalPositionsGained}
            </p>
            <p className="text-xs text-f1-text-muted mt-0.5">
              avg {gridRaces > 0 ? (totalPositionsGained / gridRaces >= 0 ? "+" : "") + (totalPositionsGained / gridRaces).toFixed(1) : "0"} / race
            </p>
          </div>
          <div className="rounded-xl border border-f1-border bg-f1-card p-3 text-center">
            <p className="text-xs text-f1-text-muted mb-1">IN POINTS</p>
            <p className="text-2xl font-black">{pointsRate}%</p>
            <p className="text-xs text-f1-text-muted mt-0.5">{pointsFinishes} of {racesEntered} races</p>
          </div>
          {poleConversion !== null && (
            <div className="rounded-xl border border-f1-border bg-f1-card p-3 text-center">
              <p className="text-xs text-f1-text-muted mb-1">POLE CONVERSION</p>
              <p className="text-2xl font-black">{poleConversion}%</p>
              <p className="text-xs text-f1-text-muted mt-0.5">{poleToWins} wins from {poleCount} poles</p>
            </div>
          )}
          <div className="rounded-xl border border-f1-border bg-f1-card p-3 text-center">
            <p className="text-xs text-f1-text-muted mb-1">FRONT ROW</p>
            <p className="text-2xl font-black">{frontRowStarts}</p>
            <p className="text-xs text-f1-text-muted mt-0.5">P1/P2 starts</p>
          </div>
        </div>
      )}

      {/* Position Trajectory Sparkline */}
      {races.length >= 2 && (() => {
        const racePositions = races
          .map((race) => {
            const r = race.Results?.[0];
            if (!r) return null;
            const isDNF = r.status !== "Finished" && !r.status.startsWith("+");
            return { round: race.round, pos: isDNF ? 21 : parseInt(r.position), isDNF, isWin: r.position === "1", isPodium: parseInt(r.position) <= 3 };
          })
          .filter(Boolean) as { round: string; pos: number; isDNF: boolean; isWin: boolean; isPodium: boolean }[];

        if (racePositions.length < 2) return null;

        const W = 600, H = 84;
        const PAD = { top: 6, right: 8, bottom: 18, left: 26 };
        const cW = W - PAD.left - PAD.right;
        const cH = H - PAD.top - PAD.bottom;
        const n = racePositions.length;
        const xOf = (i: number) => PAD.left + (n === 1 ? cW / 2 : (i / (n - 1)) * cW);
        const yOf = (pos: number) => PAD.top + ((Math.min(pos, 20) - 1) / 19) * cH;

        const pathD = racePositions
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)},${yOf(p.pos).toFixed(1)}`)
          .join(" ");

        return (
          <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-5">
            <h2 className="text-sm font-bold text-f1-text-muted mb-3 uppercase tracking-wider">
              Position Trajectory
            </h2>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} aria-hidden="true">
              {[1, 5, 10, 15, 20].map((v) => (
                <g key={v}>
                  <line x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
                    stroke="currentColor" strokeOpacity={v === 1 ? 0.15 : 0.06} strokeWidth="1" />
                  <text x={PAD.left - 4} y={yOf(v)} textAnchor="end" dominantBaseline="middle"
                    fontSize="8" fill="currentColor" fillOpacity="0.35">P{v}</text>
                </g>
              ))}
              <path d={pathD} fill="none" stroke={teamColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
              {racePositions.map((p, i) => (
                <g key={i}>
                  <circle cx={xOf(i)} cy={yOf(p.pos)} r="4"
                    fill={p.isDNF ? "#ef4444" : p.isWin ? "#eab308" : p.isPodium ? "#9ca3af" : teamColor}
                    fillOpacity="0.9" />
                  <text x={xOf(i)} y={H - PAD.bottom + 12} textAnchor="middle"
                    fontSize="7.5" fill="currentColor" fillOpacity="0.3">R{p.round}</text>
                </g>
              ))}
            </svg>
            <div className="mt-1 flex items-center gap-4 text-xs text-f1-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Win</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />Podium</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />DNF</span>
            </div>
          </div>
        );
      })()}

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
                  <th className="px-5 py-3 text-center hidden sm:table-cell">+/-</th>
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
                      <td className="px-5 py-3 text-center hidden sm:table-cell">
                        {(() => {
                          const g = parseInt(r.grid);
                          const p = parseInt(r.position);
                          if (g <= 0 || isDNF) return <span className="text-f1-text-muted/40">—</span>;
                          const diff = g - p;
                          if (diff > 0) return <span className="text-green-400 font-bold text-xs">+{diff}</span>;
                          if (diff < 0) return <span className="text-red-400 font-bold text-xs">{diff}</span>;
                          return <span className="text-f1-text-muted text-xs">0</span>;
                        })()}
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

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const { driverId } = await params;

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
        <DriverProfileContent driverId={driverId} />
      </Suspense>
    </div>
  );
}
