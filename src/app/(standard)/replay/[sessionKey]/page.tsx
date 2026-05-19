export const revalidate = 86400;

import type { Metadata } from "next";
import Link from "next/link";
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

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

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
  if (!Number.isFinite(key)) {
    return (
      <NotFoundBlock message={`"${sessionKey}" is not a valid session key.`} />
    );
  }

  const session = await getSessionByKey(key);
  if (!session) {
    return <NotFoundBlock message={`Session ${key} was not found on OpenF1.`} />;
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

function NotFoundBlock({ message }: { message: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--color-f1-border)",
        background: "var(--color-f1-dark)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: BC,
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: "0.02em",
          marginBottom: 6,
        }}
      >
        Replay unavailable
      </p>
      <p
        style={{
          fontFamily: DM,
          fontSize: 12,
          color: "var(--color-f1-text-muted)",
          marginBottom: 14,
        }}
      >
        {message}
      </p>
      <Link
        href="/replay"
        style={{
          fontFamily: DM,
          fontSize: 12,
          color: "var(--color-f1-accent)",
        }}
      >
        Back to replay index
      </Link>
    </div>
  );
}
