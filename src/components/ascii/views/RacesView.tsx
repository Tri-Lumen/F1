import Link from "next/link";
import { LocalDate } from "@/components/LocalDateTime";
import type { StudioRaceCardData } from "@/components/StudioRaceCard";
import { AsciiHeader, Bar, Panel, Swatch } from "../kit";
import "@/app/ascii/races.css";

/*
 * ASCII view of the /races page. Rendered next to the standard markup and shown only
 * under html[data-style="ascii"] (see .f1-ascii-dash in ascii.css). Receives plain data
 * from the page, so it stays a server component. Row styles live in src/app/ascii/races.css.
 */

export interface RacesViewUpcoming {
  round: string;
  name: string;
  circuit: string;
  iso: string;
}

export interface RacesViewProps {
  year: string;
  done: number;
  total: number;
  upcoming: RacesViewUpcoming[];
  completed: StudioRaceCardData[];
  teamColors: Record<string, string>;
}

const pad = (round: string) => round.padStart(2, "0");

export default function RacesView({ year, done, total, upcoming, completed, teamColors }: RacesViewProps) {
  const remaining = Math.max(0, total - done);
  const hasRaces = upcoming.length > 0 || completed.length > 0;

  return (
    <div className="f1-ascii-dash f1-ascii-races">
      <AsciiHeader title="Race Calendar" subtitle={`${year} season · full schedule with results`} />

      {/* Season progress */}
      <Panel label="Season progress">
        <div className="f1-a-season">
          <span className="f1-a-muted">RACES</span>
          <Bar frac={total ? done / total : 0} color="var(--color-f1-accent)" />
          <span className="f1-a-num">
            {String(done).padStart(2, "0")}/{total}
          </span>
        </div>
        <div className="f1-a-stats">
          <span>
            <span className="f1-a-muted">COMPLETED</span> <span className="f1-a-accent">{done}</span>
          </span>
          <span>
            <span className="f1-a-muted">REMAINING</span> <span className="f1-a-accent">{remaining}</span>
          </span>
        </div>
      </Panel>

      {!hasRaces && <p className="f1-a-muted">No races in the schedule yet.</p>}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Panel label={`Upcoming · ${upcoming.length} remaining`}>
          <div className="f1-a-table">
            <div className="rc-row rc-up rc-head">
              <span className="rc-rd">RD</span>
              <span>RACE</span>
              <span className="f1-a-hide-s">CIRCUIT</span>
              <span className="rc-date-col">DATE</span>
            </div>
            {upcoming.map((r) => (
              <Link key={r.round} href={`/race/${r.round}`} className="rc-row rc-up">
                <span className="rc-rd">{pad(r.round)}</span>
                <span className="rc-name">
                  {r.name}
                  <span className="rc-sub">
                    <LocalDate iso={r.iso} />
                  </span>
                </span>
                <span className="f1-a-hide-s f1-a-muted rc-cell">{r.circuit}</span>
                <span className="rc-date-col f1-a-muted rc-num">
                  <LocalDate iso={r.iso} />
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {/* Completed, newest first */}
      {completed.length > 0 && (
        <Panel label={`Completed · ${completed.length} completed`}>
          <div className="f1-a-table">
            <div className="rc-row rc-done rc-head">
              <span className="rc-rd">RD</span>
              <span>RACE</span>
              <span className="rc-date-col">DATE</span>
              <span>WINNER</span>
              <span className="f1-a-hide-s">POLE</span>
              <span className="f1-a-hide-s">FL</span>
            </div>
            {completed.map((r) => {
              const color = teamColors[r.winnerTeamId];
              return (
                <Link key={r.round} href={`/race/${r.round}`} className="rc-row rc-done">
                  <span className="rc-rd">{pad(r.round)}</span>
                  <span className="rc-name">
                    {r.name}
                    <span className="rc-sub">{r.date}</span>
                  </span>
                  <span className="rc-date-col f1-a-muted rc-num">{r.date}</span>
                  <span className="rc-winner" style={{ color }}>
                    <Swatch color={color} /> {r.winnerFamily}
                  </span>
                  <span className="f1-a-hide-s f1-a-driver">{r.poleFamily ?? "—"}</span>
                  <span className="f1-a-hide-s f1-a-driver">{r.fastestFamily ?? "—"}</span>
                </Link>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
