import Link from "next/link";
import { LocalDate, LocalTime } from "@/components/LocalDateTime";
import { AsciiHeader, Panel } from "../kit";
import "@/app/ascii/replay.css";

/*
 * ASCII view of the /replay session list. The server page groups completed sessions by
 * weekend (as the standard cards do) and passes plain rows here. Row styles live in
 * src/app/ascii/replay.css.
 */

export interface ReplayViewSession {
  key: number;
  name: string;
  dateISO: string;
}

export interface ReplayViewWeekend {
  key: number;
  country: string;
  circuit: string;
  dateISO: string;
  sessions: ReplayViewSession[];
}

export interface ReplayViewProps {
  year: string;
  weekends: ReplayViewWeekend[];
}

export default function ReplayView({ year, weekends }: ReplayViewProps) {
  return (
    <div className="f1-ascii-dash f1-ascii-replay">
      <AsciiHeader
        title="Session Replay"
        subtitle={`Scrub through any completed session of the ${year} season.`}
      />

      {weekends.length === 0 && (
        <p className="f1-a-muted">
          No completed sessions yet for the {year} season.{" "}
          <Link href="/races" className="rp-link">View the calendar</Link>.
        </p>
      )}

      {weekends.map((w) => (
        <Panel
          key={w.key}
          label={`${w.country.toUpperCase()} · ${w.sessions.length} session${w.sessions.length > 1 ? "s" : ""}`}
        >
          <p className="f1-a-muted rp-meta">
            {w.circuit} · <LocalDate iso={w.dateISO} />
          </p>
          <ul className="rp-list">
            {w.sessions.map((s) => (
              <li key={s.key}>
                <Link href={`/replay/${s.key}`} className="rp-row">
                  <span className="rp-name">{s.name}</span>
                  <span className="rp-when f1-a-muted">
                    <LocalDate iso={s.dateISO} /> · <LocalTime iso={s.dateISO} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
