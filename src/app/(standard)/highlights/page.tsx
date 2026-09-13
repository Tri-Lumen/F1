export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  getAllSeasonResults,
  getDriverStandings,
  getTeamColor,
  getCountryFlag,
  getCountryFlagByCountry,
  getCurrentYear,
} from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";
import RefreshButton from "@/components/RefreshButton";

export const metadata: Metadata = {
  title: "Season Highlights — F1 2026",
  description: "Key moments from the 2026 season: first wins, poles, fastest laps, and records",
};

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

interface Highlight {
  type: "win" | "pole" | "fastest-lap" | "dnf" | "milestone";
  round: string;
  raceName: string;
  raceFlag: string;
  driverName: string;
  driverNationality: string;
  constructorId: string;
  constructorName: string;
  detail: string;
  isFirst?: boolean;
}

async function HighlightsContent() {
  const [allRaces, driverStandings] = await Promise.all([
    getAllSeasonResults(),
    getDriverStandings(),
  ]);

  const completedRaces = allRaces.filter((r) => (r.Results?.length ?? 0) > 0);

  if (completedRaces.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center">
        <p className="text-f1-text-muted">No race data available yet for {getCurrentYear()}.</p>
      </div>
    );
  }

  const highlights: Highlight[] = [];

  // Track firsts
  const firstWinBy = new Set<string>();
  const firstPoleBy = new Set<string>();
  const firstFLBy = new Set<string>();
  const teamFirstWin = new Set<string>();

  // Count wins, poles, fastest laps per driver
  const winCounts = new Map<string, number>();
  const dnfCounts = new Map<string, number>();

  for (const race of completedRaces) {
    const results = race.Results ?? [];
    const raceFlag = getCountryFlagByCountry(race.Circuit.Location.country);

    // Winner
    const winner = results.find((r) => r.position === "1");
    if (winner) {
      const id = winner.Driver.driverId;
      const cid = getDriverConstructorId(id, winner.Constructor.constructorId) ?? winner.Constructor.constructorId;
      winCounts.set(id, (winCounts.get(id) ?? 0) + 1);

      if (!firstWinBy.has(id)) {
        firstWinBy.add(id);
        highlights.push({
          type: "win",
          round: race.round,
          raceName: race.raceName,
          raceFlag,
          driverName: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
          driverNationality: winner.Driver.nationality,
          constructorId: cid,
          constructorName: winner.Constructor.name,
          detail: `${winner.Time?.time ?? "Race Winner"}`,
          isFirst: true,
        });
      } else if (winCounts.get(id) === 5) {
        highlights.push({
          type: "milestone",
          round: race.round,
          raceName: race.raceName,
          raceFlag,
          driverName: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
          driverNationality: winner.Driver.nationality,
          constructorId: cid,
          constructorName: winner.Constructor.name,
          detail: "5th win of the season",
        });
      }

      if (!teamFirstWin.has(cid)) {
        teamFirstWin.add(cid);
      }
    }

    // Pole (grid position 1)
    const poleDriver = results.find((r) => r.grid === "1");
    if (poleDriver) {
      const id = poleDriver.Driver.driverId;
      const cid = getDriverConstructorId(id, poleDriver.Constructor.constructorId) ?? poleDriver.Constructor.constructorId;
      if (!firstPoleBy.has(id)) {
        firstPoleBy.add(id);
        highlights.push({
          type: "pole",
          round: race.round,
          raceName: race.raceName,
          raceFlag,
          driverName: `${poleDriver.Driver.givenName} ${poleDriver.Driver.familyName}`,
          driverNationality: poleDriver.Driver.nationality,
          constructorId: cid,
          constructorName: poleDriver.Constructor.name,
          detail: "Pole position",
          isFirst: true,
        });
      }
    }

    // Fastest lap
    const fl = results.find((r) => r.FastestLap?.rank === "1");
    if (fl) {
      const id = fl.Driver.driverId;
      const cid = getDriverConstructorId(id, fl.Constructor.constructorId) ?? fl.Constructor.constructorId;
      if (!firstFLBy.has(id)) {
        firstFLBy.add(id);
        highlights.push({
          type: "fastest-lap",
          round: race.round,
          raceName: race.raceName,
          raceFlag,
          driverName: `${fl.Driver.givenName} ${fl.Driver.familyName}`,
          driverNationality: fl.Driver.nationality,
          constructorId: cid,
          constructorName: fl.Constructor.name,
          detail: fl.FastestLap?.Time?.time ? `Fastest: ${fl.FastestLap.Time.time}` : "Fastest lap",
          isFirst: true,
        });
      }
    }

    // Notable DNFs (mechanical failures, not collisions — status not starting with "+")
    for (const r of results) {
      const isDnf = r.status !== "Finished" && !r.status.startsWith("+");
      if (!isDnf) continue;
      const pos = parseInt(r.position);
      const id = r.Driver.driverId;
      const cid = getDriverConstructorId(id, r.Constructor.constructorId) ?? r.Constructor.constructorId;

      dnfCounts.set(id, (dnfCounts.get(id) ?? 0) + 1);

      // Highlight DNFs from points positions (top 5)
      if (pos <= 5) {
        highlights.push({
          type: "dnf",
          round: race.round,
          raceName: race.raceName,
          raceFlag,
          driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
          driverNationality: r.Driver.nationality,
          constructorId: cid,
          constructorName: r.Constructor.name,
          detail: `Retired from P${pos} — ${r.status}`,
        });
      }
    }
  }

  // Season summary stats
  const uniqueWinners = firstWinBy.size;
  const uniquePolesitters = firstPoleBy.size;
  const totalDNFs = [...dnfCounts.values()].reduce((a, b) => a + b, 0);
  const mostWins = [...winCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  // Highlight type config
  const typeConfig = {
    win:          { emoji: "🏆", label: "Race Win",     color: "#FFD700" },
    pole:         { emoji: "🎯", label: "Pole Position", color: "#A855F7" },
    "fastest-lap":{ emoji: "⚡", label: "Fastest Lap",  color: "#8B5CF6" },
    dnf:          { emoji: "💥", label: "DNF",          color: "#EF4444" },
    milestone:    { emoji: "🌟", label: "Milestone",    color: "var(--color-f1-accent)" },
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Races Complete</p>
          <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36 }}>{completedRaces.length}</p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Different Winners</p>
          <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36 }}>{uniqueWinners}</p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Different Polesitters</p>
          <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36 }}>{uniquePolesitters}</p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Total DNFs</p>
          <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36, color: "#ef4444" }}>{totalDNFs}</p>
        </div>
      </div>

      {/* Most wins callout */}
      {mostWins && mostWins[1] >= 2 && (() => {
        const id = mostWins[0];
        const standing = driverStandings.find((s) => s.Driver.driverId === id);
        const cid = standing ? (getDriverConstructorId(id, standing.Constructors[0]?.constructorId) ?? "") : "";
        const color = getTeamColor(cid);
        return (
          <div
            className="rounded-xl border p-5 flex items-center gap-4"
            style={{ borderColor: `${color}50`, background: `${color}0d` }}
          >
            <span style={{ fontSize: 40 }}>🏆</span>
            <div>
              <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Season Dominance</p>
              <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 20, color }}>
                {standing ? `${standing.Driver.givenName} ${standing.Driver.familyName}` : id.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-f1-text-muted">{mostWins[1]} wins this season</p>
            </div>
          </div>
        );
      })()}

      {/* Timeline */}
      <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
        <div className="border-b border-f1-border p-4">
          <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: "0.04em" }}>
            Season Timeline
          </h2>
          <p className="text-xs text-f1-text-muted mt-0.5">
            Key moments from each race — first wins, poles, fastest laps, and notable DNFs
          </p>
        </div>

        {highlights.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-f1-text-muted text-sm">No highlights extracted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-f1-border/40">
            {highlights.map((h, i) => {
              const cfg = typeConfig[h.type];
              const teamColor = getTeamColor(h.constructorId);
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-f1-dark/20 transition-colors"
                >
                  {/* Type badge */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-0.5">
                    <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                  </div>
                  {/* Color bar */}
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: `${cfg.color}20`, color: cfg.color }}
                      >
                        {cfg.label}{h.isFirst ? " (First)" : ""}
                      </span>
                      <span className="text-xs text-f1-text-muted">
                        {h.raceFlag} R{h.round} · {h.raceName.replace(" Grand Prix", " GP")}
                      </span>
                    </div>
                    <Link
                      href={`/race/${h.round}`}
                      className="block mt-1 hover:text-f1-accent transition-colors"
                    >
                      <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 15, letterSpacing: "0.02em" }}>
                        {getCountryFlag(h.driverNationality)} {h.driverName}
                      </span>
                      <span className="ml-2 text-xs text-f1-text-muted">{h.constructorName}</span>
                    </Link>
                    <p className="text-xs text-f1-text-muted mt-0.5">{h.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DNF driver summary */}
      {dnfCounts.size > 0 && (
        <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
          <div className="border-b border-f1-border p-4">
            <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: "0.04em" }}>
              DNF Tally
            </h2>
            <p className="text-xs text-f1-text-muted mt-0.5">Non-finish incidents per driver this season</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2 text-right">DNFs</th>
                </tr>
              </thead>
              <tbody>
                {[...dnfCounts.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, count]) => {
                    const standing = driverStandings.find((s) => s.Driver.driverId === id);
                    const cid = standing ? (getDriverConstructorId(id, standing.Constructors[0]?.constructorId) ?? "") : "";
                    const color = getTeamColor(cid);
                    const name = standing
                      ? `${standing.Driver.givenName} ${standing.Driver.familyName}`
                      : id.replace(/_/g, " ");
                    const nat = standing?.Driver.nationality ?? "";
                    return (
                      <tr key={id} className="border-b border-f1-border/40 hover:bg-f1-dark/20">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
                            <span>{getCountryFlag(nat)} {name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-black text-red-400">{count}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HighlightsPage() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div style={{ fontFamily: BC, fontWeight: 900, fontSize: 28, letterSpacing: "0.02em", lineHeight: 1 }}>
            SEASON HIGHLIGHTS
          </div>
          <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 4 }}>
            {getCurrentYear()} Season · First wins, poles, fastest laps, and notable DNFs
          </div>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-f1-card animate-pulse" />
            ))}
          </div>
        }
      >
        <HighlightsContent />
      </Suspense>
    </div>
  );
}
