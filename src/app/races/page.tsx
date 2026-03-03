export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getRaceSchedule, getAllSeasonResults, getRaceDate, CURRENT_YEAR } from "@/lib/api";
import RaceCard from "@/components/RaceCard";
import type { RaceResultSummary } from "@/components/RaceCard";
import RefreshButton from "@/components/RefreshButton";

async function RacesContent() {
  const [races, allResults] = await Promise.all([
    getRaceSchedule(),
    getAllSeasonResults(),
  ]);

  // Build result summary map keyed by round
  const resultSummaryMap = new Map<string, RaceResultSummary>();
  for (const race of allResults) {
    const results = race.Results ?? [];
    const winner = results.find((r: any) => r.position === "1");
    const pole = results.find((r: any) => r.grid === "1");
    const fl = results.find((r: any) => r.FastestLap?.rank === "1");
    resultSummaryMap.set(race.round, {
      winner: winner ? {
        name: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
        constructorId: winner.Constructor.constructorId,
        time: winner.Time?.time,
      } : undefined,
      pole: pole ? {
        name: `${pole.Driver.givenName} ${pole.Driver.familyName}`,
        constructorId: pole.Constructor.constructorId,
      } : undefined,
      fastestLap: fl?.FastestLap ? {
        name: `${fl.Driver.givenName} ${fl.Driver.familyName}`,
        constructorId: fl.Constructor.constructorId,
        time: fl.FastestLap.Time.time,
      } : undefined,
    });
  }

  const now = new Date();
  const upcoming = races.filter((r) => getRaceDate(r) > now);
  const completed = races.filter((r) => getRaceDate(r) <= now).reverse();

  return (
    <>
      {/* Season Progress Bar */}
      <div className="mb-8 rounded-xl border border-f1-border bg-f1-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-f1-text-muted">Season Progress</span>
          <span className="font-bold">
            {completed.length} / {races.length} races
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-f1-dark overflow-hidden">
          <div
            className="h-full rounded-full bg-f1-red transition-all"
            style={{
              width: `${(completed.length / races.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Upcoming Races */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-bold">
            Upcoming Races
            <span className="ml-2 text-sm font-normal text-f1-text-muted">
              ({upcoming.length} remaining)
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((race) => (
              <RaceCard key={race.round} race={race} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Races */}
      {completed.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold">
            Completed Races
            <span className="ml-2 text-sm font-normal text-f1-text-muted">
              ({completed.length} completed)
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((race) => (
              <RaceCard
                key={race.round}
                race={race}
                resultSummary={resultSummaryMap.get(race.round)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function RacesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Race Calendar
          </h1>
          <p className="mt-1 text-sm text-f1-text-muted">
            {CURRENT_YEAR} Season &middot; Full schedule with F1TV links
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-f1-card animate-pulse"
              />
            ))}
          </div>
        }
      >
        <RacesContent />
      </Suspense>
    </div>
  );
}
