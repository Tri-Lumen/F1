export const revalidate = 300;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDriverStandings,
  getRaceSchedule,
  getAllSeasonResults,
  getQualifyingResults,
  getRaceDate,
  getCurrentYear,
} from "@/lib/api";
import type { QualifyingResult, Race, RaceResult } from "@/lib/types";
import PredictionsClient, { type RoundInfo } from "./PredictionsClient";

export const metadata: Metadata = {
  title: "Pick'em — F1 2026",
  description:
    "Predict pole position, podium, and fastest lap each race weekend. Score is tallied locally against the official results.",
};

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

async function PredictionsContent() {
  const [driverStandings, schedule, allResults] = await Promise.all([
    getDriverStandings(),
    getRaceSchedule(),
    getAllSeasonResults(),
  ]);

  // Build a results index from the season-wide results fetch (1 request)
  // so we don't fan out one per round.
  const resultsByRound = new Map<string, RaceResult[]>();
  for (const race of allResults) {
    if (race.Results) resultsByRound.set(race.round, race.Results);
  }

  // For rounds that have completed qualifying but not the race yet, we need
  // the pole sitter so post-quali predictions can be partially locked /
  // pole-scored. Fetch quali per such round in parallel.
  const now = new Date();
  const qualiNeededRounds = schedule.filter((r) => {
    const raceDate = getRaceDate(r);
    return raceDate > now && !resultsByRound.has(r.round) && r.Qualifying != null;
  });
  const qualiResults = await Promise.all(
    qualiNeededRounds.map(async (r) => ({
      round: r.round,
      results: await getQualifyingResults(r.round),
    })),
  );
  const qualiByRound = new Map<string, QualifyingResult[]>();
  for (const q of qualiResults) {
    qualiByRound.set(q.round, q.results);
  }

  const rounds: RoundInfo[] = schedule.map((race: Race) => {
    const raceResults = resultsByRound.get(race.round) ?? null;
    // For completed races, pole = grid position 1 in race results (canonical).
    // For pre-race rounds with qualifying done, look up the quali pole.
    let polePosition: string | undefined;
    if (raceResults && raceResults.length > 0) {
      polePosition = raceResults.find((r) => r.grid === "1")?.Driver.driverId;
    } else {
      const quali = qualiByRound.get(race.round);
      polePosition = quali?.find((q) => q.position === "1")?.Driver.driverId;
    }
    const raceDate = getRaceDate(race);
    const qualiDate = race.Qualifying
      ? new Date(`${race.Qualifying.date}T${(race.Qualifying.time ?? "00:00:00Z").endsWith("Z") ? race.Qualifying.time ?? "00:00:00Z" : `${race.Qualifying.time}Z`}`)
      : raceDate;

    return {
      round: race.round,
      raceName: race.raceName,
      country: race.Circuit.Location.country,
      raceDateISO: raceDate.toISOString(),
      qualifyingDateISO: qualiDate.toISOString(),
      polePosition,
      raceResults,
    };
  });

  return (
    <PredictionsClient
      rounds={rounds}
      drivers={driverStandings}
      season={getCurrentYear()}
    />
  );
}

export default function PredictionsPage() {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: "0.02em",
            margin: 0,
          }}
        >
          Pick&apos;em
        </h1>
        <p
          style={{
            fontFamily: DM,
            fontSize: 12,
            color: "var(--color-f1-text-muted)",
            marginTop: 4,
          }}
        >
          Predict pole, podium, and fastest lap. Scored locally against the
          official {getCurrentYear()} results.
        </p>
      </div>
      <Suspense
        fallback={<div className="h-48 rounded-xl bg-f1-card animate-pulse" />}
      >
        <PredictionsContent />
      </Suspense>
    </>
  );
}
