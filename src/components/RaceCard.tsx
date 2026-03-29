import Link from "next/link";
import type { Race } from "@/lib/types";
import { getCountryFlagByCountry, getF1TVRaceUrl, getRaceDate, getTeamColor } from "@/lib/api";
import CircuitMap from "@/components/CircuitMap";
import LocalRaceTime from "@/components/LocalRaceTime";

export interface RaceResultSummary {
  winner?: { name: string; constructorId: string; time?: string };
  pole?: { name: string; constructorId: string };
  fastestLap?: { name: string; constructorId: string; time: string };
}

function formatDate(dateStr: string, timeStr?: string): string {
  const d = new Date(timeStr ? `${dateStr}T${timeStr}` : dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isRacePast(race: Race): boolean {
  return getRaceDate(race) < new Date();
}

function isRaceWeekend(race: Race): boolean {
  const now = new Date();
  const firstDay = race.FirstPractice
    ? new Date(`${race.FirstPractice.date}T${race.FirstPractice.time}`)
    : new Date(race.date);
  const raceDay = getRaceDate(race);
  // Add 3 hours after race for "live" window
  const endWindow = new Date(raceDay.getTime() + 3 * 60 * 60 * 1000);
  return now >= firstDay && now <= endWindow;
}

function formatSessionTime(dateStr: string, timeStr: string): string {
  const ts = timeStr.endsWith("Z") ? timeStr : `${timeStr}Z`;
  const d = new Date(`${dateStr}T${ts}`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function RaceCard({ race, resultSummary, showSchedule }: { race: Race; resultSummary?: RaceResultSummary; showSchedule?: boolean }) {
  const past = isRacePast(race);
  const live = isRaceWeekend(race);
  const flag = getCountryFlagByCountry(race.Circuit.Location.country);

  return (
    <div
      className={`rounded-xl border p-4 transition-all acrylic ${
        live
          ? "border-f1-accent/60 bg-f1-accent/8 shadow-lg shadow-f1-accent/20"
          : past
          ? "border-f1-border/30 bg-f1-card/40"
          : "border-f1-border/50 bg-f1-card/60 hover:bg-f1-card-hover/60 hover:border-f1-accent/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded bg-f1-dark/60 px-2 py-0.5 text-xs font-bold text-f1-text-muted">
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
          <LocalRaceTime date={race.date} time={race.time} />
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
            className="rounded-lg bg-f1-dark/60 acrylic px-3 py-1.5 text-xs font-medium text-f1-text hover:bg-f1-border/60 transition-colors"
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
          className="rounded-lg bg-f1-dark/60 acrylic px-3 py-1.5 text-xs font-medium text-f1-accent hover:bg-f1-border/60 transition-colors"
        >
          Watch on F1TV &rarr;
        </a>
        {race.Sprint && (
          <span className="rounded-lg bg-f1-accent-secondary/15 px-3 py-1.5 text-xs font-medium text-f1-accent-secondary border border-f1-accent-secondary/25">
            Sprint Weekend
          </span>
        )}
      </div>

      {/* Session schedule for upcoming races */}
      {showSchedule && !past && (() => {
        const sessions: { label: string; date: string; time: string }[] = [];
        if (race.FirstPractice) sessions.push({ label: "FP1", ...race.FirstPractice });
        if (race.SecondPractice) sessions.push({ label: "FP2", ...race.SecondPractice });
        if (race.ThirdPractice) sessions.push({ label: "FP3", ...race.ThirdPractice });
        if (race.SprintQualifying) sessions.push({ label: "Sprint Quali", ...race.SprintQualifying });
        if (race.Sprint) sessions.push({ label: "Sprint", ...race.Sprint });
        if (race.Qualifying) sessions.push({ label: "Qualifying", ...race.Qualifying });
        if (race.time) sessions.push({ label: "Race", date: race.date, time: race.time });

        if (sessions.length === 0) return null;
        return (
          <div className="mt-3 pt-3 border-t border-f1-border/30">
            <p className="text-[10px] uppercase tracking-wider text-f1-text-muted mb-1.5 font-semibold">Session Schedule</p>
            <div className="space-y-1">
              {sessions.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${s.label === "Race" ? "text-f1-accent" : s.label === "Qualifying" ? "text-f1-text" : "text-f1-text-muted"}`}>
                    {s.label}
                  </span>
                  <span className="text-f1-text-muted font-mono text-[11px]">
                    {formatSessionTime(s.date, s.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Race result summary for completed races */}
      {past && resultSummary && (resultSummary.winner || resultSummary.pole || resultSummary.fastestLap) && (
        <div className="mt-3 pt-3 border-t border-f1-border/30 grid grid-cols-3 gap-2">
          {resultSummary.winner && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-f1-text-muted mb-0.5">Winner</p>
              <p className="text-xs font-bold truncate" style={{ color: getTeamColor(resultSummary.winner.constructorId) }}>
                {resultSummary.winner.name.split(" ").at(-1)?.toUpperCase()}
              </p>
              {resultSummary.winner.time && (
                <p className="text-[10px] text-f1-text-muted font-mono">{resultSummary.winner.time}</p>
              )}
            </div>
          )}
          {resultSummary.pole && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-f1-text-muted mb-0.5">Pole</p>
              <p className="text-xs font-bold truncate" style={{ color: getTeamColor(resultSummary.pole.constructorId) }}>
                {resultSummary.pole.name.split(" ").at(-1)?.toUpperCase()}
              </p>
            </div>
          )}
          {resultSummary.fastestLap && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-purple-400 mb-0.5">Fastest Lap</p>
              <p className="text-xs font-bold text-purple-400 truncate">
                {resultSummary.fastestLap.name.split(" ").at(-1)?.toUpperCase()}
              </p>
              <p className="text-[10px] text-purple-400/70 font-mono">{resultSummary.fastestLap.time}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
