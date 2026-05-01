export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDriverStandings,
  getConstructorStandings,
  getRaceSchedule,
  getAllSeasonResults,
  getNextScheduledSession,
  getRaceDate,
} from "@/lib/api";
import { buildStudioRaceCardData } from "@/lib/raceCards";
import SidebarNav from "@/components/SidebarNav";
import LeaderHero from "@/components/LeaderHero";
import ChampionshipBar from "@/components/ChampionshipBar";
import StudioDriverRow from "@/components/StudioDriverRow";
import StudioConstructorRow from "@/components/StudioConstructorRow";
import StudioRaceCard from "@/components/StudioRaceCard";
import type { StudioRaceCardData } from "@/components/StudioRaceCard";
import StudioNextRaceCard from "@/components/StudioNextRaceCard";
import LiveSessionBanner from "@/components/LiveSessionBanner";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

export const metadata: Metadata = {
  title: "Dashboard — F1 2026",
  description:
    "Season overview with championship standings and race results for the 2026 season",
};

async function DashboardContent() {
  const [driverStandings, constructorStandings, races, allResults, nextSession] =
    await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
      getRaceSchedule(),
      getAllSeasonResults(),
      getNextScheduledSession(),
    ]);

  // Single pass over the schedule: classify completed vs upcoming and find
  // the next race in one walk so we don't re-parse race dates three times.
  const now = new Date();
  let completedCount = 0;
  let nextRace: typeof races[number] | undefined;
  for (const r of races) {
    if (getRaceDate(r) <= now) completedCount++;
    else if (!nextRace) nextRace = r;
  }
  const totalRaces = races.length;

  // Compute recent form: last 5 race positions per driver
  const completedWithResults = allResults.filter((r) => (r.Results?.length ?? 0) > 0);
  const recentRacesForForm = completedWithResults.slice(-5);
  const formData: Record<string, number[]> = {};
  for (const race of recentRacesForForm) {
    for (const result of race.Results ?? []) {
      const driverId = result.Driver.driverId;
      const pos = parseInt(result.position, 10);
      if (!formData[driverId]) formData[driverId] = [];
      formData[driverId].push(isNaN(pos) ? 20 : pos);
    }
  }

  // Recent race cards (last 3 completed, newest first)
  const recentRaces: StudioRaceCardData[] = completedWithResults
    .slice(-3)
    .reverse()
    .map(buildStudioRaceCardData);

  const leader = driverStandings[0];
  const second = driverStandings[1];
  const maxConstructorPts = constructorStandings[0]
    ? parseFloat(constructorStandings[0].points)
    : 0;
  const leaderPts = leader ? parseFloat(leader.points) : 0;
  const nextSessionISO = nextSession?.date.toISOString() ?? "";

  if (!leader || !second) {
    return (
      <main style={{ marginLeft: 224, flex: 1, padding: "40px 28px", color: "#555", fontFamily: DM }}>
        Season data not yet available. Check back soon.
      </main>
    );
  }

  return (
    <main style={{ marginLeft: 224, flex: 1, padding: "24px 26px 48px", minWidth: 0 }}>
      <Suspense fallback={null}>
        <LiveSessionBanner />
      </Suspense>

      <LeaderHero
        leader={leader}
        second={second}
        completedRaces={completedCount}
        totalRaces={totalRaces}
      />

      {/* Championship stacked bar */}
      {constructorStandings.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #1c1c1c",
            background: "#131313",
            padding: "14px 18px",
            marginBottom: 18,
          }}
        >
          <ChampionshipBar standings={constructorStandings} />
        </div>
      )}

      {/* 3-column grid: standings (×2) + next race */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 18,
        }}
      >
        {/* Driver standings — spans 2 cols */}
        <div
          style={{
            gridColumn: "span 2",
            borderRadius: 12,
            border: "1px solid #1c1c1c",
            background: "#131313",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: "1px solid #1c1c1c",
            }}
          >
            <span
              style={{
                fontFamily: BC,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: "0.04em",
              }}
            >
              Driver Standings
            </span>
            <span
              style={{
                fontSize: 9,
                color: "#3a3a3a",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: DM,
              }}
            >
              pts · last 5 form
            </span>
          </div>
          {driverStandings.slice(0, 10).map((s, i) => (
            <StudioDriverRow
              key={s.Driver.driverId}
              standing={s}
              rank={i + 1}
              form={formData[s.Driver.driverId] ?? []}
              leaderPts={leaderPts}
              delay={i * 45 + 150}
            />
          ))}
        </div>

        {/* Next race card */}
        {nextRace ? (
          <StudioNextRaceCard race={nextRace} nextSessionDate={nextSessionISO} />
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #1c1c1c",
              background: "#131313",
              padding: 18,
              color: "#555",
              fontFamily: DM,
              fontSize: 12,
            }}
          >
            No upcoming race scheduled.
          </div>
        )}
      </div>

      {/* 2-column: constructors + recent results */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Constructor standings */}
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #1c1c1c",
            background: "#131313",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #1c1c1c" }}>
            <span
              style={{
                fontFamily: BC,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: "0.04em",
              }}
            >
              Constructors
            </span>
          </div>
          {constructorStandings.map((s, i) => (
            <StudioConstructorRow
              key={s.Constructor.constructorId}
              standing={s}
              maxPts={maxConstructorPts}
              delay={i * 50 + 200}
            />
          ))}
        </div>

        {/* Recent race results */}
        <div>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "0.04em",
              marginBottom: 11,
            }}
          >
            Recent Results
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentRaces.map((r, i) => (
              <StudioRaceCard key={r.round} race={r} delay={i * 80 + 200} />
            ))}
            {recentRaces.length === 0 && (
              <div style={{ color: "#555", fontFamily: DM, fontSize: 12, padding: "16px 0" }}>
                No race results yet this season.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function Home() {
  const driverStandings = await getDriverStandings();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SidebarNav standings={driverStandings} />
      <Suspense
        fallback={
          <main
            style={{ marginLeft: 224, flex: 1, padding: "24px 26px" }}
            className="space-y-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-f1-card animate-pulse" />
            ))}
          </main>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
