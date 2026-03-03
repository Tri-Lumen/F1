export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import {
  getDriverStandings,
  getConstructorStandings,
  getRaceSchedule,
  getRaceDate,
  CURRENT_YEAR,
} from "@/lib/api";
import StandingsTable from "@/components/StandingsTable";
import ConstructorStandingsTable from "@/components/ConstructorStandingsTable";
import RaceCard from "@/components/RaceCard";
import LiveSessionBanner from "@/components/LiveSessionBanner";
import NextSessionCard from "@/components/NextSessionCard";
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

  // Find next race (event-level, not session-level)
  const now = new Date();
  const nextRace = races.find((r) => getRaceDate(r) > now);

  // Completed races — single filter pass for both display and count
  const allCompleted = races.filter((r) => getRaceDate(r) <= now);
  const completedRaces = allCompleted.slice(-3).reverse();
  const totalRaces = races.length;
  const completedCount = allCompleted.length;

  return (
    <>
      <Suspense fallback={null}>
        <LiveSessionBanner />
      </Suspense>

      {/* Season Progress */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-f1-border/50 bg-f1-card/60 acrylic p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Season
          </p>
          <p className="mt-1 text-2xl font-black">{CURRENT_YEAR}</p>
          <div className="mt-2 h-1 rounded-full bg-f1-dark overflow-hidden">
            <div
              className="h-full rounded-full bg-f1-red"
              style={{ width: `${totalRaces > 0 ? (completedCount / totalRaces) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-f1-text-muted">{completedCount}/{totalRaces} races</p>
        </div>
        <div className="rounded-xl border border-f1-border/50 border-t-2 border-t-f1-accent bg-f1-card/60 acrylic p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Championship Leader
          </p>
          {driverStandings[0] ? (
            <>
              <p className="mt-1 text-base font-black text-f1-accent leading-tight">
                {driverStandings[0].Driver.familyName.toUpperCase()}
              </p>
              <p className="text-xs text-f1-text-muted mt-0.5">{driverStandings[0].points} pts</p>
              {driverStandings[1] && (
                <p className="text-xs text-f1-text-muted/60">
                  +{(parseFloat(driverStandings[0].points) - parseFloat(driverStandings[1].points)).toFixed(0)} over {driverStandings[1].Driver.familyName}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-lg font-black text-f1-accent">TBD</p>
          )}
        </div>
        <div className="rounded-xl border border-f1-border/50 border-t-2 border-t-f1-accent-secondary bg-f1-card/60 acrylic p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Top Constructor
          </p>
          {constructorStandings[0] ? (
            <>
              <p className="mt-1 text-base font-black text-f1-accent-secondary leading-tight">
                {constructorStandings[0].Constructor.name}
              </p>
              <p className="text-xs text-f1-text-muted mt-0.5">{constructorStandings[0].points} pts</p>
              {constructorStandings[1] && (
                <p className="text-xs text-f1-text-muted/60">
                  +{(parseFloat(constructorStandings[0].points) - parseFloat(constructorStandings[1].points)).toFixed(0)} over {constructorStandings[1].Constructor.name.split(" ").at(-1)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-lg font-black text-f1-accent-secondary">TBD</p>
          )}
        </div>
        <div className="rounded-xl border border-f1-border/50 bg-f1-card/60 acrylic p-4">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted">
            Wins Leader
          </p>
          {driverStandings[0] ? (
            <>
              <p className="mt-1 text-2xl font-black">
                {parseInt(driverStandings[0].wins)}
                <span className="text-sm font-normal text-f1-text-muted ml-1">wins</span>
              </p>
              <p className="text-xs text-f1-text-muted mt-0.5">{driverStandings[0].Driver.familyName}</p>
            </>
          ) : (
            <p className="mt-1 text-2xl font-black">—</p>
          )}
        </div>
      </div>

      {/* Next Race (event-level context with links) */}
      {nextRace && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <span className="w-1 h-5 rounded-full bg-f1-accent" />
            Next Race
          </h2>
          <RaceCard race={nextRace} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Driver Standings */}
        <div className="rounded-xl border border-f1-border/50 bg-f1-card/60 acrylic">
          <div className="flex items-center justify-between border-b border-f1-border/40 p-4">
            <h2 className="flex items-center gap-2 font-bold">
              <span className="w-1 h-4 rounded-full bg-f1-accent" />
              Driver Standings
            </h2>
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
        <div className="rounded-xl border border-f1-border/50 bg-f1-card/60 acrylic">
          <div className="flex items-center justify-between border-b border-f1-border/40 p-4">
            <h2 className="flex items-center gap-2 font-bold">
              <span className="w-1 h-4 rounded-full bg-f1-accent-secondary" />
              Constructor Standings
            </h2>
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
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="w-1 h-5 rounded-full bg-f1-accent-secondary" />
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

      {/* Next session countdown with circuit map */}
      <Suspense
        fallback={
          <div className="mb-8 h-60 rounded-xl bg-f1-card/60 animate-pulse" />
        }
      >
        <NextSessionCard />
      </Suspense>

      {/* Season standings, recent races, etc. */}
      <Suspense fallback={<LoadingSkeleton rows={10} />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
