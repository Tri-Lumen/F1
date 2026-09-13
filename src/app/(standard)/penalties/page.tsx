export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
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
import Link from "next/link";

export const metadata: Metadata = {
  title: "Penalties & Incidents — F1 2026",
  description: "Race retirements, DNF reasons, and incident log for the 2026 season",
};

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

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

async function PenaltiesContent() {
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

  const incidents: IncidentRecord[] = [];
  const dnfCountByDriver = new Map<string, number>();
  const dnfCountByCategory = new Map<IncidentRecord["category"], number>([
    ["collision", 0], ["mechanical", 0], ["other", 0],
  ]);

  for (const race of completedRaces) {
    const raceFlag = getCountryFlagByCountry(race.Circuit.Location.country);
    for (const r of race.Results ?? []) {
      const isDnf = r.status !== "Finished" && !r.status.startsWith("+");
      if (!isDnf) continue;

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
    }
  }

  // Sort by round (most recent first), then by position
  incidents.sort((a, b) => {
    const rd = parseInt(b.round) - parseInt(a.round);
    if (rd !== 0) return rd;
    return parseInt(a.position) - parseInt(b.position);
  });

  const totalDNFs = incidents.length;
  const mechDNFs = dnfCountByCategory.get("mechanical") ?? 0;
  const collisionDNFs = dnfCountByCategory.get("collision") ?? 0;
  const otherDNFs = dnfCountByCategory.get("other") ?? 0;

  // Most affected driver
  const mostDNFs = [...dnfCountByDriver.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostDNFStanding = mostDNFs
    ? driverStandings.find((s) => s.Driver.driverId === mostDNFs[0])
    : null;

  return (
    <div className="space-y-6">
      {/* KPI row */}
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

      {/* Most unlucky driver */}
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

      {/* Incident log */}
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

      {/* Driver DNF table */}
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
                    // Approximate races entered
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
  );
}

export default function PenaltiesPage() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div style={{ fontFamily: BC, fontWeight: 900, fontSize: 28, letterSpacing: "0.02em", lineHeight: 1 }}>
            INCIDENTS & DNFs
          </div>
          <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 4 }}>
            {getCurrentYear()} Season · Retirements, collisions, and mechanical failures
          </div>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-f1-card animate-pulse" />
            ))}
          </div>
        }
      >
        <PenaltiesContent />
      </Suspense>
    </div>
  );
}
