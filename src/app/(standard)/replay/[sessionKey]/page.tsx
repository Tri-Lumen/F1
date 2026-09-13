export const revalidate = 86400;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSessionByKey,
  getLiveDrivers,
  getLivePositions,
  getLiveIntervals,
  getLiveStints,
  getTeamRadio,
  getRaceControl,
  getLiveLaps,
  getWeatherSeries,
} from "@/lib/api";
import ReplayClient from "./ReplayClient";

interface PageProps {
  params: Promise<{ sessionKey: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionKey } = await params;
  const session = await getSessionByKey(Number(sessionKey));
  if (!session) return { title: "Replay — F1 2026" };
  return {
    title: `${session.country_name} ${session.session_name} Replay — F1 2026`,
    description: `Replay the ${session.session_name} session at ${session.circuit_short_name}.`,
  };
}

export default async function ReplayPage({ params }: PageProps) {
  const { sessionKey } = await params;
  const key = Number(sessionKey);
  // A session key either resolves to a real OpenF1 session or it doesn't —
  // unlike a race round, there's no "scheduled but hasn't happened yet"
  // middle state, so both cases are genuine 404s.
  if (!Number.isFinite(key)) {
    notFound();
  }

  const session = await getSessionByKey(key);
  if (!session) {
    notFound();
  }

  // All data fetched once, in parallel. OpenF1 returns full history when
  // queried by session_key, so this single round-trip set powers the whole
  // scrubber timeline.
  const [drivers, positions, intervals, stints, radio, raceControl, laps, weatherSeries] =
    await Promise.all([
      getLiveDrivers(key),
      getLivePositions(key),
      getLiveIntervals(key),
      getLiveStints(key),
      getTeamRadio(key),
      getRaceControl(key),
      getLiveLaps(key),
      getWeatherSeries(key),
    ]);

  return (
    <ReplayClient
      session={session}
      drivers={drivers}
      positions={positions}
      intervals={intervals}
      stints={stints}
      radio={radio}
      raceControl={raceControl}
      laps={laps}
      weatherSeries={weatherSeries}
    />
  );
}
