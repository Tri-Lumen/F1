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
  title: "Highlights & Incidents — F1 2026",
  description:
    "Season highlights — first wins, poles, fastest laps, and records — plus the full incident log of retirements and DNFs",
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

interface IncidentRecord {
  round: string;
  raceName: string;
  raceFlag: string;
  driverId: string;
  driverName: string;
  driverNationality: string;
  constructorId: string;
  constructorName: string;
  position: string;
  status: string;
  category: "collision" | "mechanical" | "other";
}

function categorizeStatus(status: string): IncidentRecord["category"] {
  const s = status.toLowerCase();
  if (s.includes("collision") || s.includes("accident") || s.includes("spun") || s.includes("crash")) return "collision";
  if (
    s.includes("engine") || s.includes("gearbox") || s.includes("hydraulics") ||
    s.includes("brakes") || s.includes("mechanical") || s.includes("power unit") ||
    s.includes("suspension") || s.includes("wheel") || s.includes("electrical") ||
    s.includes("fuel") || s.includes("fire") || s.includes("exhaust")
  ) return "mechanical";
  return "other";
}

const CATEGORY_CONFIG = {
  collision: { label: "Collision / Accident", color: "#ef4444", emoji: "💥" },
  mechanical: { label: "Mechanical Failure",  color: "#f97316", emoji: "🔧" },
  other:      { label: "Retirement / Other",  color: "#6b7280", emoji: "🚫" },
};

async function HighlightsIncidentsContent() {
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

  // --- Highlights: first wins/poles/fastest-laps, milestones, notable DNFs ---
  const highlights: Highlight[] = [];
  const firstWinBy = new Set<string>();
  const firstPoleBy = new Set<string>();
  const firstFLBy = new Set<string>();
  const winCounts = new Map<string, number>();

  // --- Incidents: every retirement this season, categorized ---
  const incidents: IncidentRecord[] = [];
  const dnfCountByDriver = new Map<string, number>();
  const dnfCountByCategory = new Map<IncidentRecord["category"], number>([
    ["collision", 0], ["mechanical", 0], ["other", 0],
  ]);

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
          detail: "Grid P1",
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

    // Retirements — feed both the highlights timeline (notable top-5 DNFs) and
    // the full incident log below.
    for (const r of results) {
      const isDnf = r.status !== "Finished" && !r.status.startsWith("+");
      if (!isDnf) continue;
      const pos = parseInt(r.position);
      const id = r.Driver.driverId;
      const cid = getDriverConstructorId(id, r.Constructor.constructorId) ?? r.Constructor.constructorId;
      const category = categorizeStatus(r.status);

      dnfCountByDriver.set(id, (dnfCountByDriver.get(id) ?? 0) + 1);
      dnfCountByCategory.set(category, (dnfCountByCategory.get(category) ?? 0) + 1);

      incidents.push({
        round: race.round,
        raceName: race.raceName,
        raceFlag,
        driverId: id,
        driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
        driverNationality: r.Driver.nationality,
        constructorId: cid,
        constructorName: r.Constructor.name,
        position: r.position,
        status: r.status,
        category,
      });

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

  // Incident log: most recent race first, then by finishing position
  incidents.sort((a, b) => {
    const rd = parseInt(b.round) - parseInt(a.round);
    if (rd !== 0) return rd;
    return parseInt(a.position) - parseInt(b.position);
  });

  // Season summary stats
  const uniqueWinners = firstWinBy.size;
  const uniquePolesitters = firstPoleBy.size;
  const mostWins = [...winCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const totalDNFs = incidents.length;
  const mechDNFs = dnfCountByCategory.get("mechanical") ?? 0;
  const collisionDNFs = dnfCountByCategory.get("collision") ?? 0;
  const otherDNFs = dnfCountByCategory.get("other") ?? 0;
  const mostDNFs = [...dnfCountByDriver.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostDNFStanding = mostDNFs ? driverStandings.find((s) => s.Driver.driverId === mostDNFs[0]) : null;

  // Highlight type config
  const typeConfig = {
    win:          { emoji: "🏆", label: "Race Win",     color: "#FFD700" },
    pole:         { emoji: "🎯", label: "Grid P1",       color: "#A855F7" },
    "fastest-lap":{ emoji: "⚡", label: "Fastest Lap",  color: "#8B5CF6" },
    dnf:          { emoji: "💥", label: "DNF",          color: "#EF4444" },
    milestone:    { emoji: "🌟", label: "Milestone",    color: "var(--color-f1-accent)" },
  };

  return (
    <div className="space-y-6">
      {/* Section nav */}
      <nav className="sticky top-0 z-10 -mx-4 mb-2 overflow-x-auto bg-f1-black/90 px-4 py-2 backdrop-blur flex gap-2 border-b border-f1-border/40">
        {[
          { href: "#highlights", label: "Highlights" },
          { href: "#incidents",  label: "Incidents" },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="flex-shrink-0 rounded-full border border-f1-border bg-f1-dark px-3 py-1 text-xs font-semibold text-f1-text-muted hover:border-f1-accent hover:text-f1-text transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ── Highlights ────────────────────────────────────────────────── */}
      <div id="highlights" className="space-y-6 scroll-mt-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Races Complete</p>
            <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36 }}>{completedRaces.length}</p>
          </div>
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Different Winners</p>
            <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36 }}>{uniqueWinners}</p>
          </div>
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Different Grid P1s</p>
            <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36 }}>{uniquePolesitters}</p>
          </div>
        </div>

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
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-f1-dark/20 transition-colors">
                    <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-0.5">
                      <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                    </div>
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
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
                      <Link href={`/race/${h.round}`} className="block mt-1 hover:text-f1-accent transition-colors">
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
      </div>

      {/* ── Incidents ─────────────────────────────────────────────────── */}
      <div id="incidents" className="space-y-6 scroll-mt-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Total DNFs</p>
            <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36, color: "#ef4444" }}>{totalDNFs}</p>
          </div>
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Collisions</p>
            <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36, color: "#ef4444" }}>{collisionDNFs}</p>
          </div>
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Mechanical</p>
            <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36, color: "#f97316" }}>{mechDNFs}</p>
          </div>
          <div className="rounded-xl border border-f1-border bg-f1-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-1">Other</p>
            <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 36 }}>{otherDNFs}</p>
          </div>
        </div>

        {mostDNFs && mostDNFs[1] >= 2 && mostDNFStanding && (() => {
          const cid = getDriverConstructorId(mostDNFs[0], mostDNFStanding.Constructors[0]?.constructorId) ?? "";
          const color = getTeamColor(cid);
          return (
            <div
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{ borderColor: `${color}40`, background: `${color}0d` }}
            >
              <span style={{ fontSize: 32 }}>🔥</span>
              <div>
                <p className="text-xs uppercase tracking-wider text-f1-text-muted font-bold mb-0.5">Most DNFs This Season</p>
                <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 18, color }}>
                  {getCountryFlag(mostDNFStanding.Driver.nationality)}{" "}
                  {mostDNFStanding.Driver.givenName} {mostDNFStanding.Driver.familyName}
                </p>
                <p className="text-xs text-f1-text-muted">{mostDNFs[1]} non-finishes</p>
              </div>
            </div>
          );
        })()}

        <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
          <div className="border-b border-f1-border p-4">
            <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: "0.04em" }}>
              Incident Log
            </h2>
            <p className="text-xs text-f1-text-muted mt-0.5">
              All race retirements — {completedRaces.length} races · sorted by most recent
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-2 w-16">Round</th>
                  <th className="px-3 py-2">Race</th>
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2 hidden sm:table-cell">Team</th>
                  <th className="px-3 py-2 text-center w-16">Pos</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2 text-center w-8">Type</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, i) => {
                  const teamColor = getTeamColor(inc.constructorId);
                  const cfg = CATEGORY_CONFIG[inc.category];
                  return (
                    <tr key={i} className="border-b border-f1-border/40 hover:bg-f1-dark/20 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-xs text-f1-text-muted">
                        <Link href={`/race/${inc.round}`} className="hover:text-f1-accent transition-colors">
                          R{inc.round}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-f1-text-muted max-w-[120px] truncate">
                        {inc.raceFlag} {inc.raceName.replace(" Grand Prix", " GP")}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                          <span className="font-medium">
                            {getCountryFlag(inc.driverNationality)} {inc.driverName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-f1-text-muted">
                        {inc.constructorName}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-bold text-f1-text-muted">
                        P{inc.position}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: cfg.color }}>
                        {inc.status}
                      </td>
                      <td className="px-3 py-2.5 text-center text-base" title={cfg.label}>
                        {cfg.emoji}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {dnfCountByDriver.size > 0 && (
          <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
            <div className="border-b border-f1-border p-4">
              <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: "0.04em" }}>
                DNFs per Driver
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                    <th className="px-3 py-2">Driver</th>
                    <th className="px-3 py-2 text-right">DNFs</th>
                    <th className="px-3 py-2 text-right hidden sm:table-cell">Reliability %</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dnfCountByDriver.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([id, count]) => {
                      const standing = driverStandings.find((s) => s.Driver.driverId === id);
                      const cid = standing ? (getDriverConstructorId(id, standing.Constructors[0]?.constructorId) ?? "") : "";
                      const color = getTeamColor(cid);
                      const name = standing
                        ? `${standing.Driver.givenName} ${standing.Driver.familyName}`
                        : id.replace(/_/g, " ");
                      const nat = standing?.Driver.nationality ?? "";
                      const racesEntered = completedRaces.filter((r) =>
                        (r.Results ?? []).some((res) => res.Driver.driverId === id)
                      ).length;
                      const reliability = racesEntered > 0 ? Math.round(((racesEntered - count) / racesEntered) * 100) : 100;
                      return (
                        <tr key={id} className="border-b border-f1-border/40 hover:bg-f1-dark/20">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
                              <span>{getCountryFlag(nat)} {name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-black text-red-400">{count}</td>
                          <td className="px-3 py-2 text-right hidden sm:table-cell">
                            <span className={reliability >= 90 ? "text-green-400" : reliability >= 75 ? "text-yellow-400" : "text-red-400"}>
                              {reliability}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HighlightsPage() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div style={{ fontFamily: BC, fontWeight: 900, fontSize: 28, letterSpacing: "0.02em", lineHeight: 1 }}>
            HIGHLIGHTS &amp; INCIDENTS
          </div>
          <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 4 }}>
            {getCurrentYear()} Season · First wins, poles, fastest laps, and the full incident log
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
        <HighlightsIncidentsContent />
      </Suspense>
    </div>
  );
}
