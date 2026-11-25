import Link from "next/link";
import { AsciiHeader, Bar, Panel, Swatch } from "../kit";
import "@/app/ascii/race-detail.css";

/*
 * ASCII view of the /race/[round] page. Rendered next to the standard markup and shown
 * only under html[data-style="ascii"] (see .f1-ascii-dash in ascii.css). The page computes
 * every derived value and passes plain strings and numbers in, so this stays a server
 * component. Row styles live in src/app/ascii/race-detail.css.
 */

export interface RaceDetailDriver {
  driverId: string;
  /** "DNF" for retirements, otherwise the classified position. */
  position: string;
  isDnf: boolean;
  flag: string;
  givenName: string;
  familyName: string;
  teamColor: string;
  teamName: string;
  grid: string;
  /** Places gained (positive) or lost (negative) from the grid; 0 hides it. */
  gridDiff: number;
  laps: string;
  timeOrStatus: string;
  /** Empty when the driver scored no points. */
  points: string;
  /** Fastest lap time, or "" unless this driver set it. */
  fastestLap: string;
}

export interface RaceDetailQuali {
  driverId: string;
  position: string;
  flag: string;
  givenName: string;
  familyName: string;
  teamColor: string;
  teamName: string;
  q1: string;
  q2: string;
  q3: string;
}

export interface RaceDetailPitSummary {
  driverId: string;
  name: string;
  color: string;
  stops: number;
  /** Fastest stop, already formatted to three decimals (seconds). */
  duration: string;
  lap: string;
  isFastest: boolean;
}

export interface RaceDetailPitStop {
  key: string;
  lap: string;
  name: string;
  color: string;
  stop: string;
  duration: string;
  isPitBox: boolean;
  timeOfDay: string;
}

export interface RaceDetailPace {
  driverId: string;
  position: number;
  name: string;
  color: string;
  lapTime: string;
  /** Gap to the fastest lap as x.xxx (no sign); null for the fastest driver. */
  delta: string | null;
  /** Bar fill, 0 to 1. */
  barFrac: number;
  isFastest: boolean;
}

export interface RaceDetailViewProps {
  round: string;
  title: string;
  circuit: string;
  location: string;
  flag: string;
  dateLabel: string;
  f1tvUrl: string;
  wikiUrl: string;
  prevRound: string | null;
  nextRound: string | null;
  hasResults: boolean;
  podium?: RaceDetailDriver[];
  results?: RaceDetailDriver[];
  sprint?: RaceDetailDriver[];
  qualifying?: RaceDetailQuali[];
  pitSummaries?: RaceDetailPitSummary[];
  pitTimeline?: RaceDetailPitStop[];
  /** Fastest pit stop line, e.g. "box" or "lane". Null when there are no stops. */
  fastestPit?: { kind: "box" | "lane"; duration: string; name: string; lap: string } | null;
  pace?: RaceDetailPace[];
}

const pad = (round: string) => round.padStart(2, "0");

function DriverName({ d }: { d: { flag: string; givenName: string; familyName: string } }) {
  return (
    <>
      {d.flag} {d.givenName} <strong>{d.familyName}</strong>
    </>
  );
}

function ResultsTable({
  rows,
  variant,
}: {
  rows: RaceDetailDriver[];
  variant: "race" | "sprint";
}) {
  const finishers = rows.filter((r) => !r.isDnf);
  const dnfs = rows.filter((r) => r.isDnf);
  const renderRow = (d: RaceDetailDriver) => (
    <div
      key={d.driverId}
      className={`rd-row${d.isDnf ? " rd-dnf" : ""}${d.fastestLap ? " rd-fl" : ""}`}
    >
      <span className="rd-pos">{d.isDnf ? <span className="rd-red">DNF</span> : d.position}</span>
      <span className="rd-driver">
        <Swatch color={d.teamColor} />
        <span className="rd-name">
          <DriverName d={d} />
        </span>
      </span>
      <span className="f1-a-hide-s f1-a-muted rd-ell">{d.teamName}</span>
      <span className="f1-a-hide-s rd-grid">
        {d.grid}
        {d.gridDiff !== 0 && (
          <span className="rd-delta">{d.gridDiff > 0 ? `+${d.gridDiff}` : d.gridDiff}</span>
        )}
      </span>
      <span className="f1-a-hide-s f1-a-muted rd-num">{d.laps}</span>
      <span className={`rd-time ${d.isDnf ? "rd-red" : "f1-a-muted"}`}>{d.timeOrStatus}</span>
      <span className="rd-pts">{d.points}</span>
      {variant === "race" && (
        <span className="f1-a-hide-s rd-num rd-fl-time">{d.fastestLap}</span>
      )}
    </div>
  );

  return (
    <div className={`rd-tbl rd-${variant === "race" ? "cls" : "spr"}`}>
      <div className="rd-row rd-head">
        <span className="rd-pos">POS</span>
        <span>DRIVER</span>
        <span className="f1-a-hide-s">TEAM</span>
        <span className="f1-a-hide-s rd-grid">GRID</span>
        <span className="f1-a-hide-s rd-num">LAPS</span>
        <span>TIME / STATUS</span>
        <span className="rd-pts">PTS</span>
        {variant === "race" && <span className="f1-a-hide-s rd-num">FL</span>}
      </div>
      {finishers.map(renderRow)}
      {dnfs.length > 0 && (
        <>
          <div className="rd-row rd-sub">Did not finish ({dnfs.length})</div>
          {dnfs.map(renderRow)}
        </>
      )}
    </div>
  );
}

export default function RaceDetailView({
  round,
  title,
  circuit,
  location,
  flag,
  dateLabel,
  f1tvUrl,
  wikiUrl,
  prevRound,
  nextRound,
  hasResults,
  podium = [],
  results = [],
  sprint = [],
  qualifying = [],
  pitSummaries = [],
  pitTimeline = [],
  fastestPit = null,
  pace = [],
}: RaceDetailViewProps) {
  return (
    <div className="f1-ascii-dash f1-ascii-race">
      <nav className="rd-nav" aria-label="Race navigation">
        <Link href="/races">&lt; races</Link>
        <span className="rd-nav-mid">
          {prevRound && <Link href={`/race/${prevRound}`}>&lt; RD {pad(prevRound)}</Link>}
          {nextRound && <Link href={`/race/${nextRound}`}>RD {pad(nextRound)} &gt;</Link>}
        </span>
      </nav>

      <AsciiHeader
        title={title}
        subtitle={`Round ${round} · ${circuit} · ${location}`}
      />

      <Panel label="Event">
        <dl className="rd-info">
          <dt>ROUND</dt>
          <dd>{pad(round)}</dd>
          <dt>CIRCUIT</dt>
          <dd>{circuit}</dd>
          <dt>LOCATION</dt>
          <dd>
            {flag} {location}
          </dd>
          <dt>DATE</dt>
          <dd>{dateLabel}</dd>
        </dl>
        <p className="rd-links">
          <a href={f1tvUrl} target="_blank" rel="noopener noreferrer" className="f1-a-accent">
            [ WATCH ON F1TV &rarr; ]
          </a>
          <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="f1-a-accent">
            [ WIKIPEDIA ]
          </a>
        </p>
        {!hasResults && (
          <p className="f1-a-muted rd-note">No results available for this race yet.</p>
        )}
      </Panel>

      {podium.length >= 3 && (
        <Panel label="Podium">
          <ol className="rd-podium">
            {podium.map((d) => (
              <li key={d.driverId} className="rd-pod-row">
                <span className="rd-pos" style={{ color: d.teamColor }}>
                  P{d.position}
                </span>
                <Swatch color={d.teamColor} />
                <span className="rd-name">
                  <DriverName d={d} />
                </span>
                <span className="f1-a-hide-s f1-a-muted rd-ell">{d.teamName}</span>
                <span className="rd-time f1-a-muted">{d.timeOrStatus}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {results.length > 0 && (
        <Panel label="Race results">
          <ResultsTable rows={results} variant="race" />
        </Panel>
      )}

      {sprint.length > 0 && (
        <Panel label="Sprint results">
          <ResultsTable rows={sprint} variant="sprint" />
        </Panel>
      )}

      {pitSummaries.length > 0 && (
        <Panel label="Pit stop analysis">
          {fastestPit && (
            <p className="f1-a-muted rd-note">
              Fastest {fastestPit.kind}:{" "}
              <span className="f1-a-accent">{fastestPit.duration}s</span> — {fastestPit.name} Lap{" "}
              {fastestPit.lap}
            </p>
          )}
          <div className="rd-tbl rd-pit">
            <div className="rd-row rd-head">
              <span>DRIVER</span>
              <span className="rd-num">STOPS</span>
              <span className="rd-num">{fastestPit?.kind === "lane" ? "PIT LANE" : "PIT BOX"}</span>
              <span className="f1-a-hide-s rd-num">ON LAP</span>
            </div>
            {pitSummaries.map((d) => (
              <div key={d.driverId} className={`rd-row${d.isFastest ? " rd-fl" : ""}`}>
                <span className="rd-driver">
                  <Swatch color={d.color} />
                  <span className="rd-name rd-cap">{d.name}</span>
                </span>
                <span className="rd-num">{d.stops}</span>
                <span className={`rd-num rd-mono${d.isFastest ? " f1-a-accent" : ""}`}>
                  {d.duration}s
                </span>
                <span className="f1-a-hide-s rd-num f1-a-muted">{d.lap}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {pitTimeline.length > 0 && (
        <Panel label="Pit stop timeline">
          <div className="rd-tbl rd-tl">
            <div className="rd-row rd-head">
              <span>LAP</span>
              <span>DRIVER</span>
              <span className="f1-a-hide-s rd-num">STOP</span>
              <span className="rd-num">DURATION</span>
              <span className="f1-a-hide-s rd-num">TIME OF DAY</span>
            </div>
            {pitTimeline.map((p) => (
              <div key={p.key} className="rd-row">
                <span className="rd-mono f1-a-accent">L{p.lap}</span>
                <span className="rd-driver">
                  <Swatch color={p.color} />
                  <span className="rd-name">{p.name}</span>
                </span>
                <span className="f1-a-hide-s rd-num f1-a-muted">#{p.stop}</span>
                <span className="rd-num rd-mono">
                  {p.duration}s{p.isPitBox && <span className="rd-box"> box</span>}
                </span>
                <span className="f1-a-hide-s rd-num rd-mono f1-a-muted">{p.timeOfDay}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {qualifying.length > 0 && (
        <Panel label="Qualifying results">
          <div className="rd-tbl rd-qual">
            <div className="rd-row rd-head">
              <span className="rd-pos">POS</span>
              <span>DRIVER</span>
              <span className="f1-a-hide-s">TEAM</span>
              <span className="f1-a-hide-s rd-num">Q1</span>
              <span className="rd-num">Q2</span>
              <span className="rd-num">Q3</span>
            </div>
            {qualifying.map((q) => (
              <div key={q.driverId} className="rd-row">
                <span className="rd-pos">{q.position}</span>
                <span className="rd-driver">
                  <Swatch color={q.teamColor} />
                  <span className="rd-name">
                    <DriverName d={q} />
                  </span>
                </span>
                <span className="f1-a-hide-s f1-a-muted rd-ell">{q.teamName}</span>
                <span className="f1-a-hide-s rd-num rd-mono f1-a-muted">{q.q1}</span>
                <span className="rd-num rd-mono f1-a-muted">{q.q2}</span>
                <span className="rd-num rd-mono">{q.q3}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {pace.length > 0 && (
        <Panel label="Race pace">
          <p className="f1-a-muted rd-note">Fastest lap comparison, ranked by lap time</p>
          <div className="rd-tbl rd-pace">
            {pace.map((d) => (
              <div key={d.driverId} className={`rd-row${d.isFastest ? " rd-fl" : ""}`}>
                <span className="rd-pos">{d.position}</span>
                <span className="rd-driver">
                  <Swatch color={d.color} />
                  <span className="rd-name">
                    {d.isFastest && <span className="f1-a-accent">● </span>}
                    {d.name}
                  </span>
                </span>
                <span className="f1-a-hide-s">
                  <Bar frac={d.barFrac} color={d.isFastest ? "var(--ascii-hi)" : d.color} />
                </span>
                <span className="rd-num rd-mono">{d.lapTime}</span>
                <span className="rd-num rd-mono f1-a-muted">{d.delta ? `+${d.delta}` : ""}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/*
        Not shown in ASCII: the Grid vs Finish SVG chart, the qualifying gap chart and the
        qualifying progression chart. They remain in the standard markup only.
      */}
    </div>
  );
}
