export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import {
  getDriverStandings,
  getConstructorStandings,
  getRaceSchedule,
  CURRENT_YEAR,
} from "@/lib/api";
import StandingsTable from "@/components/StandingsTable";
import ConstructorStandingsTable from "@/components/ConstructorStandingsTable";
import RaceCard from "@/components/RaceCard";
import LiveSessionBanner from "@/components/LiveSessionBanner";
import RefreshButton from "@/components/RefreshButton";

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-f1-card animate-pulse"
        />
      ))}
    </div>
  );
}

async function DashboardContent() {
  const [driverStandings, constructorStandings, races] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
    getRaceSchedule(),
  ]);

  // Find next race
  const now = new Date();
  const nextRace = races.find((r) => {
    const raceDate = new Date(r.time ? `${r.date}T${r.time}` : r.date);
    return raceDate > now;
  });

  // Recent completed races (last 3)
  const completedRaces = races
    .filter((r) => {
      const raceDate = new Date(r.time ? `${r.date}T${r.time}` : r.date);
      return raceDate <= now;
    })
    .reverse()
    .slice(0, 3);

  const totalRaces = races.length;
  const completedCount = races.filter((r) => {
    const raceDate = new Date(r.time ? `${r.date}T${r.time}` : r.date);
    return raceDate <= now;
  }).length;

  return (
    <>
      <Suspense fallback={null}>
        <LiveSessionBanner />
      </Suspense>

      {/* Season Progress */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-f1-border bg-f1-card p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Season
          </p>
          <p className="mt-1 text-2xl font-black">{CURRENT_YEAR}</p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Races Completed
          </p>
          <p className="mt-1 text-2xl font-black">
            {completedCount}
            <span className="text-sm font-normal text-f1-text-muted">
              /{totalRaces}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Championship Leader
          </p>
          <p className="mt-1 text-lg font-black">
            {driverStandings[0]
              ? `${driverStandings[0].Driver.givenName} ${driverStandings[0].Driver.familyName}`
              : "TBD"}
          </p>
        </div>
        <div className="rounded-xl border border-f1-border bg-f1-card p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Top Constructor
          </p>
          <p className="mt-1 text-lg font-black">
            {constructorStandings[0]?.Constructor.name ?? "TBD"}
          </p>
        </div>
      </div>

      {/* Next Race */}
      {nextRace && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-f1-text-muted">
            Next Race
          </h2>
          <RaceCard race={nextRace} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Driver Standings */}
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="flex items-center justify-between border-b border-f1-border p-4">
            <h2 className="font-bold">Driver Standings</h2>
            <Link
              href="/drivers"
              className="text-xs text-f1-accent hover:underline"
            >
              View All &rarr;
            </Link>
          </div>
          <StandingsTable standings={driverStandings} limit={10} />
        </div>

        {/* Constructor Standings */}
        <div className="rounded-xl border border-f1-border bg-f1-card">
          <div className="flex items-center justify-between border-b border-f1-border p-4">
            <h2 className="font-bold">Constructor Standings</h2>
            <Link
              href="/teams"
              className="text-xs text-f1-accent hover:underline"
            >
              View All &rarr;
            </Link>
          </div>
          <ConstructorStandingsTable standings={constructorStandings} />
        </div>
      </div>

      {/* Recent Races */}
      {completedRaces.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-f1-text-muted">
              Recent Races
            </h2>
            <Link
              href="/races"
              className="text-xs text-f1-accent hover:underline"
            >
              View Full Calendar &rarr;
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedRaces.map((race) => (
              <RaceCard key={race.round} race={race} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-f1-red">F1</span> Dashboard
          </h1>
          <p className="mt-1 text-sm text-f1-text-muted">
            Live stats, standings, and results for the {CURRENT_YEAR} season
          </p>
        </div>
        <RefreshButton intervalMs={60000} />
      </div>

      <Suspense fallback={<LoadingSkeleton rows={10} />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
