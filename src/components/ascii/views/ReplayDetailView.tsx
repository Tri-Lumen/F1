import type { LiveLap, LiveSession, LiveStint, LiveTimingDriver } from "@/lib/types";
import { LocalDate, LocalTime } from "@/components/LocalDateTime";
import { AsciiHeader, Panel, Swatch } from "../kit";
import "@/app/ascii/replay-detail.css";

/*
 * ASCII view of a replay session: the session header and a timing summary (laps, best lap
 * and tyre strategy per driver). The scrubbable timing board stays in the Standard style.
 * Plain data from the server page; row styles live in src/app/ascii/replay-detail.css.
 */

export interface ReplayDetailViewProps {
  session: LiveSession;
  drivers: LiveTimingDriver[];
  laps: LiveLap[];
  stints: LiveStint[];
  radioCount: number;
  raceControlCount: number;
  weatherCount: number;
}

function lapTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

export default function ReplayDetailView({
  session,
  drivers,
  laps,
  stints,
  radioCount,
  raceControlCount,
  weatherCount,
}: ReplayDetailViewProps) {
  // Per-driver summary: laps completed, best lap and tyre strategy (compound initials).
  const rows = drivers.map((d) => {
    const own = laps.filter((l) => l.driver_number === d.driver_number);
    const times = own.map((l) => l.lap_duration).filter((t): t is number => t != null && t > 0);
    const best = times.length > 0 ? Math.min(...times) : null;
    const strategy = stints
      .filter((s) => s.driver_number === d.driver_number)
      .sort((a, b) => a.stint_number - b.stint_number)
      .map((s) => (s.compound ? s.compound.charAt(0).toUpperCase() : "?"))
      .join("-");
    return {
      key: d.driver_number,
      acronym: d.name_acronym,
      name: d.full_name,
      team: d.team_name,
      color: d.team_colour ? `#${d.team_colour}` : "var(--color-f1-text-muted)",
      laps: own.length,
      best,
      strategy: strategy || "—",
    };
  });
  rows.sort((a, b) => {
    if (a.best == null) return 1;
    if (b.best == null) return -1;
    return a.best - b.best;
  });

  return (
    <div className="f1-ascii-dash f1-ascii-replay-detail">
      <AsciiHeader
        title={`${session.country_name} — ${session.session_name}`}
        subtitle={`${session.circuit_short_name} · ${session.year}`}
      />
      <p className="f1-a-muted rd-meta">
        <LocalDate iso={session.date_start} /> · <LocalTime iso={session.date_start} />
      </p>

      <Panel label="Session data">
        <div className="rd-stats">
          <span><span className="f1-a-muted">DRIVERS</span> <span className="f1-a-accent">{drivers.length}</span></span>
          <span><span className="f1-a-muted">LAPS</span> <span className="f1-a-accent">{laps.length}</span></span>
          <span><span className="f1-a-muted">STINTS</span> <span className="f1-a-accent">{stints.length}</span></span>
          <span><span className="f1-a-muted">RADIO</span> <span className="f1-a-accent">{radioCount}</span></span>
          <span><span className="f1-a-muted">RACE CONTROL</span> <span className="f1-a-accent">{raceControlCount}</span></span>
          <span><span className="f1-a-muted">WEATHER</span> <span className="f1-a-accent">{weatherCount}</span></span>
        </div>
      </Panel>

      {rows.length === 0 ? (
        <p className="f1-a-muted">No timing data for this session.</p>
      ) : (
        <Panel label="Timing summary · best lap order">
          <div className="f1-a-table">
            <div className="rd-row rd-head">
              <span className="rd-pos">#</span>
              <span>DRIVER</span>
              <span className="f1-a-hide-s">TEAM</span>
              <span className="rd-num">LAPS</span>
              <span className="rd-num">BEST</span>
              <span className="f1-a-hide-s">TYRES</span>
            </div>
            {rows.map((r, i) => (
              <div key={r.key} className="rd-row">
                <span className="rd-pos f1-a-muted">{i + 1}</span>
                <span className="rd-name">
                  <Swatch color={r.color} /> {r.acronym}
                  <span className="rd-sub f1-a-muted">{r.name}</span>
                </span>
                <span className="f1-a-hide-s f1-a-muted rd-cell">{r.team}</span>
                <span className="rd-num">{r.laps}</span>
                <span className="rd-num rd-best">{r.best != null ? lapTime(r.best) : "—"}</span>
                <span className="f1-a-hide-s rd-cell">{r.strategy}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
