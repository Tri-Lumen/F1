export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getRaceSchedule,
  getAllSeasonResults,
  getRaceDate,
  CURRENT_YEAR,
} from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";

export const metadata: Metadata = {
  title: "Race Calendar — F1 2026",
  description: "Upcoming and completed races with results, winners, and fastest laps",
};
import RaceCard from "@/components/RaceCard";
import StudioRaceCard from "@/components/StudioRaceCard";
import type { StudioRaceCardData } from "@/components/StudioRaceCard";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

async function RacesContent() {
  const [races, allResults] = await Promise.all([
    getRaceSchedule(),
    getAllSeasonResults(),
  ]);

  const now = new Date();
  const upcoming = races.filter((r) => getRaceDate(r) > now);
  const completed = races.filter((r) => getRaceDate(r) <= now).reverse();

  // Build StudioRaceCardData for completed races
  const completedResultsMap = new Map<string, typeof allResults[0]>();
  for (const race of allResults) {
    completedResultsMap.set(race.round, race);
  }

  const completedCards: StudioRaceCardData[] = completed.map((race) => {
    const raceData = completedResultsMap.get(race.round);
    const results = raceData?.Results ?? [];
    const winner = results.find((r) => r.position === "1");
    const pole = results.find((r) => r.grid === "1");
    const fastest = results.find((r) => r.FastestLap?.rank === "1");
    const countryShort = (race.Circuit?.Location?.country ?? "???")
      .slice(0, 3)
      .toUpperCase();
    return {
      round: race.round,
      name: race.raceName.replace(" Grand Prix", " GP"),
      short: countryShort,
      date: new Date(race.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      winnerFamily: winner?.Driver.familyName.toUpperCase() ?? "—",
      winnerTeamId:
        getDriverConstructorId(
          winner?.Driver.driverId ?? "",
          winner?.Constructor.constructorId,
        ) ??
        winner?.Constructor.constructorId ??
        "",
      poleFamily: pole ? pole.Driver.familyName.toUpperCase() : null,
      fastestFamily: fastest ? fastest.Driver.familyName.toUpperCase() : null,
    };
  });

  const cardStyle = {
    borderRadius: 12,
    border: "1px solid var(--color-f1-border)",
    background: "var(--color-f1-dark)",
  };

  const sectionLabel = {
    fontFamily: BC,
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "var(--color-f1-text-muted)",
    textTransform: "uppercase" as const,
    marginBottom: 12,
  };

  return (
    <>
      {/* Season Progress Bar */}
      <div style={{ ...cardStyle, padding: "14px 18px", marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontFamily: DM, fontSize: 12, color: "var(--color-f1-text-muted)" }}>
            Season Progress
          </span>
          <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: "0.04em" }}>
            {completed.length} / {races.length} races
          </span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "var(--color-f1-black)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 2,
              background: "var(--color-f1-accent)",
              width: `${races.length > 0 ? (completed.length / races.length) * 100 : 0}%`,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Upcoming Races */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={sectionLabel}>
            Upcoming Races{" "}
            <span style={{ color: "var(--color-f1-text-muted)" }}>({upcoming.length} remaining)</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {upcoming.map((race) => (
              <RaceCard key={race.round} race={race} showSchedule />
            ))}
          </div>
        </div>
      )}

      {/* Completed Races */}
      {completedCards.length > 0 && (
        <div>
          <div style={sectionLabel}>
            Completed Races{" "}
            <span style={{ color: "var(--color-f1-text-muted)" }}>({completedCards.length} completed)</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {completedCards.map((r, i) => (
              <StudioRaceCard key={r.round} race={r} delay={i * 40} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function RacesPage() {
  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          RACE CALENDAR
        </div>
        <div style={{ fontFamily: DM, fontSize: 12, color: "var(--color-f1-text-muted)", marginTop: 4 }}>
          {CURRENT_YEAR} Season · Full schedule with results
        </div>
      </div>

      <Suspense
        fallback={
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{ height: 160, borderRadius: 10, background: "var(--color-f1-dark)" }}
              />
            ))}
          </div>
        }
      >
        <RacesContent />
      </Suspense>
    </>
  );
}
