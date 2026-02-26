import Link from "next/link";
import type { Race } from "@/lib/types";
import { getCountryFlagByCountry, getF1TVRaceUrl } from "@/lib/api";
import CircuitMap from "@/components/CircuitMap";

function formatDate(dateStr: string, timeStr?: string): string {
  const d = new Date(timeStr ? `${dateStr}T${timeStr}` : dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isRacePast(race: Race): boolean {
  const raceDate = new Date(
    race.time ? `${race.date}T${race.time}` : race.date
  );
  return raceDate < new Date();
}

function isRaceWeekend(race: Race): boolean {
  const now = new Date();
  const firstDay = race.FirstPractice
    ? new Date(`${race.FirstPractice.date}T${race.FirstPractice.time}`)
    : new Date(race.date);
  const raceDay = new Date(
    race.time ? `${race.date}T${race.time}` : race.date
  );
  // Add 3 hours after race for "live" window
  const endWindow = new Date(raceDay.getTime() + 3 * 60 * 60 * 1000);
  return now >= firstDay && now <= endWindow;
}

export default function RaceCard({ race }: { race: Race }) {
  const past = isRacePast(race);
  const live = isRaceWeekend(race);
  const flag = getCountryFlagByCountry(race.Circuit.Location.country);

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        live
          ? "border-f1-accent bg-f1-accent/5 shadow-lg shadow-f1-accent/15"
          : past
          ? "border-f1-border/50 bg-f1-card/50"
          : "border-f1-border bg-f1-card hover:bg-f1-card-hover hover:border-f1-accent/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded bg-f1-dark px-2 py-0.5 text-xs font-bold text-f1-text-muted">
              R{race.round}
            </span>
            {live && (
              <span className="flex items-center gap-1 rounded-full bg-f1-accent px-2 py-0.5 text-xs font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-live" />
                LIVE
              </span>
            )}
            {past && !live && (
              <span className="text-xs text-f1-text-muted">COMPLETED</span>
            )}
          </div>

          <h3 className="mt-2 font-bold text-lg leading-tight">
            {flag} {race.raceName}
          </h3>
          <p className="text-sm text-f1-text-muted">
            {race.Circuit.circuitName} &middot;{" "}
            {race.Circuit.Location.locality},{" "}
            {race.Circuit.Location.country}
          </p>
          <p className="mt-1 text-sm text-f1-text-muted">
            {formatDate(race.date, race.time)}
          </p>
        </div>

        {/* Circuit map */}
        <CircuitMap
          circuitId={race.Circuit.circuitId}
          className={`w-24 h-16 shrink-0 ${
            live ? "opacity-80" : "opacity-40"
          }`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {past && (
          <Link
            href={`/race/${race.round}`}
            className="rounded-lg bg-f1-dark px-3 py-1.5 text-xs font-medium text-f1-text hover:bg-f1-border transition-colors"
          >
            View Results
          </Link>
        )}
        {live && (
          <Link
            href={`/race/${race.round}`}
            className="rounded-lg bg-f1-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-f1-red-dark transition-colors"
          >
            Live Timing
          </Link>
        )}
        <a
          href={getF1TVRaceUrl(race)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-f1-dark px-3 py-1.5 text-xs font-medium text-f1-accent hover:bg-f1-border transition-colors"
        >
          Watch on F1TV &rarr;
        </a>
        {race.Sprint && (
          <span className="rounded-lg bg-f1-accent-secondary/15 px-3 py-1.5 text-xs font-medium text-f1-accent-secondary border border-f1-accent-secondary/25">
            Sprint Weekend
          </span>
        )}
      </div>
    </div>
  );
}
