export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  getLatestSession,
  getLiveDrivers,
  getLivePositions,
  getLiveIntervals,
  getLiveStints,
  getTeamRadio,
  getRaceControl,
  getWeather,
  isSessionLive,
} from "@/lib/api";
import OnboardButton from "@/components/OnboardButton";
import TireStrategy from "@/components/TireStrategy";
import TeamRadioFeed from "@/components/TeamRadioFeed";
import RaceControlFeed from "@/components/RaceControlFeed";
import WeatherWidget from "@/components/WeatherWidget";
import RefreshButton from "@/components/RefreshButton";
import NextSessionCard from "@/components/NextSessionCard";
import { COMPOUND_COLORS, COMPOUND_FALLBACK } from "@/lib/compounds";

async function LiveContent() {
  const session = await getLatestSession();

  if (!session) {
    return (
      <div>
        <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-6 text-center">
          <p className="text-f1-text-muted text-sm">
            No session is currently active.{" "}
            <Link href="/races" className="text-f1-accent hover:underline">
              View race calendar
            </Link>
          </p>
        </div>
        <NextSessionCard />
      </div>
    );
  }

  const isLive = isSessionLive(session);

  // Fetch each endpoint independently so partial failures don't break the whole page
  const [drivers, positions, intervals, stints, radio, raceControl, weather] = await Promise.all([
    getLiveDrivers(session.session_key),
    getLivePositions(session.session_key),
    getLiveIntervals(session.session_key),
    getLiveStints(session.session_key),
    getTeamRadio(session.session_key),
    getRaceControl(session.session_key),
    getWeather(session.session_key),
  ]);

  // Track which data sources are available for user feedback
  const dataStatus = {
    drivers: drivers.length > 0,
    positions: positions.length > 0,
    intervals: intervals.length > 0,
    stints: stints.length > 0,
    radio: radio.length > 0,
  };
  const hasAnyData = dataStatus.drivers || dataStatus.positions;

  // Get latest position for each driver
  const latestPositions = new Map<number, number>();
  for (const p of positions) {
    latestPositions.set(p.driver_number, p.position);
  }

  // Get latest interval for each driver
  const latestIntervals = new Map<
    number,
    { gap: number | null; interval: number | null }
  >();
  for (const iv of intervals) {
    latestIntervals.set(iv.driver_number, {
      gap: iv.gap_to_leader,
      interval: iv.interval,
    });
  }

  // Get current stint (latest) for each driver — O(n) single pass
  const currentStints = new Map<number, { compound: string; age: number }>();
  const latestStintNums = new Map<number, number>();
  for (const stint of stints) {
    const prev = latestStintNums.get(stint.driver_number) ?? -1;
    if (stint.stint_number > prev) {
      latestStintNums.set(stint.driver_number, stint.stint_number);
      const lapEnd = stint.lap_end ?? stint.lap_start + 5;
      currentStints.set(stint.driver_number, {
        compound: stint.compound,
        age: stint.tyre_age_at_start + (lapEnd - stint.lap_start),
      });
    }
  }

  // Sort drivers by position
  const sortedDrivers = [...drivers].sort((a, b) => {
    const posA = latestPositions.get(a.driver_number) ?? 99;
    const posB = latestPositions.get(b.driver_number) ?? 99;
    return posA - posB;
  });

  return (
    <>
      {/* Session Header */}
      <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-f1-red px-3 py-1 text-sm font-bold text-white">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse-live" />
                LIVE
              </span>
            )}
            {!isLive && (
              <span className="rounded-full bg-f1-dark px-3 py-1 text-sm font-bold text-f1-text-muted">
                SESSION ENDED
              </span>
            )}
            <div>
              <h2 className="text-xl font-black">
                {session.country_name} &mdash; {session.session_name}
              </h2>
              <p className="text-sm text-f1-text-muted">
                {session.circuit_short_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-f1-text-muted">
            <span className="hidden sm:block">
              MultiViewer integration enabled
            </span>
            <svg
              className="h-4 w-4 text-f1-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Data availability warning */}
      {isLive && !hasAnyData && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-400 font-medium">
            Unable to fetch live timing data from OpenF1. The data provider may be experiencing high traffic or the session data is not yet available. The page will automatically retry.
          </p>
        </div>
      )}
      {isLive && hasAnyData && (!dataStatus.intervals || !dataStatus.stints) && (
        <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
          <p className="text-xs text-yellow-400/80">
            Some live data is temporarily unavailable ({[
              !dataStatus.intervals && "intervals",
              !dataStatus.stints && "tire data",
              !dataStatus.radio && "team radio",
            ].filter(Boolean).join(", ")}). Will retry on next refresh.
          </p>
        </div>
      )}

      {/* Live Timing Table */}
      <div className="mb-6 rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border p-4">
          <h3 className="font-bold text-lg">Live Timing</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                <th className="px-3 py-3 w-12">Pos</th>
                <th className="px-3 py-3 hidden xs:table-cell w-10 text-center">#</th>
                <th className="px-3 py-3">Driver</th>
                <th className="px-3 py-3 hidden sm:table-cell">Team</th>
                <th className="px-3 py-3 text-center">Tire</th>
                <th className="px-3 py-3 text-center hidden sm:table-cell w-14">Age</th>
                <th className="px-3 py-3 text-right hidden md:table-cell">
                  Interval
                </th>
                <th className="px-3 py-3 text-right hidden md:table-cell">
                  Gap
                </th>
                <th className="px-3 py-3 text-center w-16">Onboard</th>
              </tr>
            </thead>
            <tbody>
              {sortedDrivers.map((driver) => {
                const pos = latestPositions.get(driver.driver_number);
                const iv = latestIntervals.get(driver.driver_number);
                const tire = currentStints.get(driver.driver_number);
                const compound = tire
                  ? (COMPOUND_COLORS[tire.compound?.toUpperCase()] ?? COMPOUND_FALLBACK)
                  : null;
                const compoundBg = compound?.bg ?? null;
                const compoundLabel = compound?.label ?? null;

                return (
                  <tr
                    key={driver.driver_number}
                    className="border-b border-f1-border/50 transition-colors hover:bg-f1-dark/30"
                  >
                    <td className="px-3 py-3 font-bold text-f1-text-muted">
                      {pos}
                    </td>
                    <td className="px-3 py-3 hidden xs:table-cell text-center text-xs font-mono text-f1-text-muted/50">
                      {driver.driver_number}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-6 w-1 rounded-full"
                          style={{
                            backgroundColor: driver.team_colour
                              ? `#${driver.team_colour}`
                              : "#888",
                          }}
                        />
                        <div>
                          <span className="font-bold">
                            {driver.name_acronym}
                          </span>
                          <span className="ml-2 text-xs text-f1-text-muted sm:hidden">
                            {driver.team_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-f1-text-muted">
                      {driver.team_name}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {tire && compoundBg && (
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${compoundBg} text-xs font-black text-black`}
                          title={`${tire.compound} - ${tire.age} laps`}
                        >
                          {compoundLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      {tire && tire.age != null ? (
                        <span className={`text-xs font-mono font-bold ${tire.age > 25 ? "text-orange-400" : tire.age > 15 ? "text-yellow-400" : "text-f1-text-muted"}`}>
                          {tire.age}L
                        </span>
                      ) : (
                        <span className="text-xs text-f1-text-muted/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell text-f1-text-muted font-mono text-xs">
                      {pos === 1
                        ? ""
                        : iv?.interval != null
                        ? `+${iv.interval.toFixed(3)}`
                        : "-"}
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell text-f1-text-muted font-mono text-xs">
                      {pos === 1
                        ? "LEADER"
                        : iv?.gap != null
                        ? `+${iv.gap.toFixed(3)}`
                        : "-"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <OnboardButton
                        driverNumber={driver.driver_number}
                        acronym={driver.name_acronym}
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weather + Tire Strategy row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <WeatherWidget weather={weather} />
        <TireStrategy
          stints={stints}
          drivers={drivers}
          latestPositions={latestPositions}
        />
      </div>

      {/* Race Control + Team Radio row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RaceControlFeed messages={raceControl} />
        <TeamRadioFeed messages={radio} drivers={drivers} />
      </div>
    </>
  );
}

export default function LivePage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-f1-red">Live</span> Session
          </h1>
          <p className="mt-1 text-sm text-f1-text-muted">
            Real-time timing, tire strategy, team radio &amp; onboard cameras
          </p>
        </div>
        <RefreshButton intervalMs={15000} />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-24 rounded-xl bg-f1-card animate-pulse" />
            <div className="h-96 rounded-xl bg-f1-card animate-pulse" />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64 rounded-xl bg-f1-card animate-pulse" />
              <div className="h-64 rounded-xl bg-f1-card animate-pulse" />
            </div>
          </div>
        }
      >
        <LiveContent />
      </Suspense>
    </div>
  );
}
