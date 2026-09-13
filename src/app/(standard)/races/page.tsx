export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getRaceSchedule,
  getAllSeasonResults,
  getRaceDate,
  getCurrentYear,
} from "@/lib/api";
import { buildStudioRaceCardData } from "@/lib/raceCards";

export const metadata: Metadata = {
  title: "Race Calendar — F1 2026",
  description: "Upcoming and completed races with results, winners, and fastest laps",
};
import RaceCard from "@/components/RaceCard";
import StudioRaceCard from "@/components/StudioRaceCard";
import type { StudioRaceCardData } from "@/components/StudioRaceCard";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import SectionHeading from "@/components/SectionHeading";
import Grid from "@/components/Grid";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

async function RacesContent() {
  const [races, allResults] = await Promise.all([
    getRaceSchedule(),
    getAllSeasonResults(),
  ]);

  // Walk the schedule once, splitting into upcoming/completed without
  // re-parsing each race date for every filter pass.
  const now = new Date();
  const upcoming: typeof races = [];
  const completed: typeof races = [];
  for (const r of races) {
    if (getRaceDate(r) > now) upcoming.push(r);
    else completed.push(r);
  }
  completed.reverse();

  // Index results by round so each completed race is a single Map lookup
  // instead of an O(n) scan.
  const resultsByRound = new Map<string, typeof allResults[0]>();
  for (const race of allResults) {
    resultsByRound.set(race.round, race);
  }

  const completedCards: StudioRaceCardData[] = completed.map((race) =>
    buildStudioRaceCardData(resultsByRound.get(race.round) ?? race),
  );

  return (
    <>
      {/* Season Progress Bar */}
      <CardShell className="mb-[22px] px-[18px] py-3.5">
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
      </CardShell>

      {/* Upcoming Races */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHeading
            variant="label"
            title={`Upcoming Races (${upcoming.length} remaining)`}
          />
          <Grid minColWidth={280} gap={12}>
            {upcoming.map((race) => (
              <RaceCard key={race.round} race={race} showSchedule />
            ))}
          </Grid>
        </div>
      )}

      {/* Completed Races */}
      {completedCards.length > 0 && (
        <div>
          <SectionHeading
            variant="label"
            title={`Completed Races (${completedCards.length} completed)`}
          />
          <Grid minColWidth={280} gap={12}>
            {completedCards.map((r, i) => (
              <StudioRaceCard key={r.round} race={r} delay={i * 40} />
            ))}
          </Grid>
        </div>
      )}
    </>
  );
}

export default function RacesPage() {
  return (
    <>
      <PageHeader
        title="Race Calendar"
        subtitle={`${getCurrentYear()} Season · Full schedule with results`}
      />

      <Suspense
        fallback={
          <Grid minColWidth={280} gap={12}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-f1-card animate-pulse" />
            ))}
          </Grid>
        }
      >
        <RacesContent />
      </Suspense>
    </>
  );
}
