import Link from "next/link";
import { AsciiHeader, Bar, Panel, Swatch, spark } from "@/components/ascii/kit";
import "@/app/ascii/team-detail.css";

/*
 * Terminal-grid team detail page for the ASCII visual style. Rendered beside the standard
 * markup on /teams/[constructorId] and shown only under html[data-style="ascii"] (see
 * app/ascii/team-detail.css). Receives plain data from the page, so it stays a server component.
 * The standard-only charts (per-round points breakdown) are not shown in ASCII.
 */

export interface AsciiTeamDetailDriver {
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  number: string;
  points: string;
  position: string;
  wins: string;
  /** Share of the team's points, 0-1. */
  share: number;
  /** Most recent finishing positions, oldest first. */
  form: number[];
  /** Average pit stop duration label, or null when no valid stops. */
  pitAvg: string | null;
  pitStops: number;
}

export interface AsciiTeamDetailCell {
  position: string;
  dnf: boolean;
  points: string;
}

export interface AsciiTeamDetailRound {
  round: string;
  raceName: string;
  country: string;
  date: string;
  /** One entry per driver column, null when the driver did not score a result. */
  cells: (AsciiTeamDetailCell | null)[];
  total: number;
}

export interface AsciiTeamDetailData {
  name: string;
  subtitle: string;
  color: string;
  wikiUrl: string;
  year: string;
  position: string;
  points: string;
  wins: string;
  headline: { label: string; value: string }[];
  pitStops: { avg: string; fastest: string; total: number } | null;
  pointsPerRace: string | null;
  retirements: { driver: string; raceName: string; status: string }[];
  drivers: AsciiTeamDetailDriver[];
  rounds: AsciiTeamDetailRound[];
}

function KV({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="f1-tdv-kv-row">
      <span className="f1-a-muted">{label}</span>
      <span className={`f1-a-num f1-a-pts${accent ? " f1-a-accent" : ""}`}>{value}</span>
    </div>
  );
}

export default function TeamDetailView({ data }: { data: AsciiTeamDetailData }) {
  const { name, subtitle, color, wikiUrl, year, drivers, rounds } = data;
  const gridCols = `44px minmax(0, 1fr) ${drivers.map(() => "66px").join(" ")} 48px`;

  return (
    <div className="f1-ascii-dash f1-ascii-team">
      <p className="f1-tdv-back">
        <Link href="/teams" className="f1-a-muted f1-tdv-link">
          &lt; TEAMS
        </Link>
      </p>
      <AsciiHeader title={name} subtitle={subtitle} />

      {/* Team summary */}
      <Panel label={<><Swatch color={color} /> SEASON SUMMARY</>}>
        <div className="f1-tdv-kv">
          <KV label="Position" value={`P${data.position}`} accent />
          <KV label="Points" value={`${data.points} pts`} accent />
          <KV label="Wins" value={data.wins} />
          {data.headline.map((h) => (
            <KV key={h.label} label={h.label} value={h.value} />
          ))}
          {data.pointsPerRace !== null && <KV label="Points per race" value={data.pointsPerRace} />}
        </div>

        {data.pitStops && (
          <div className="f1-tdv-sub">
            <p className="f1-a-muted f1-tdv-sub-h">PIT STOPS</p>
            <div className="f1-tdv-kv">
              <KV label="Avg stop" value={data.pitStops.avg} />
              <KV label="Fastest" value={data.pitStops.fastest} />
              <KV label="Total stops" value={String(data.pitStops.total)} />
            </div>
          </div>
        )}
      </Panel>

      {/* Driver panels */}
      {drivers.length > 0 && (
        <div className="f1-a-two">
          {drivers.map((d) => (
            <Panel
              key={d.driverId}
              label={
                <>
                  <span className="f1-a-muted">#{d.number}</span> {d.familyName.toUpperCase()}
                </>
              }
            >
              <Link href={`/drivers/${d.driverId}`} className="f1-tdv-link f1-tdv-driver">
                {d.givenName} <span className="f1-a-upper">{d.familyName}</span>
              </Link>
              <div className="f1-tdv-kv f1-tdv-kv-driver">
                <KV label="Points" value={`${d.points} pts`} accent />
                <KV label="Position" value={`P${d.position}`} />
                <KV label="Wins" value={d.wins} />
                <KV label="Code" value={d.code} />
              </div>
              <div className="f1-tdv-share">
                <span className="f1-a-muted">Share of team pts</span>
                <Bar frac={d.share} color={color} />
                <span className="f1-a-num">{Math.round(d.share * 100)}%</span>
              </div>
              <div className="f1-tdv-kv-row">
                <span className="f1-a-muted">Form (last {d.form.length})</span>
                <span className="f1-a-num f1-a-accent f1-tdv-spark">
                  {d.form.length > 0 ? spark(d.form) : "—"}
                </span>
              </div>
              {d.pitAvg && (
                <div className="f1-tdv-kv-row">
                  <span className="f1-a-muted">Pit avg</span>
                  <span className="f1-a-num">
                    {d.pitAvg} ({d.pitStops} stops)
                  </span>
                </div>
              )}
              <div className="f1-tdv-footer">
                <Link href={`/drivers/${d.driverId}`} className="f1-tdv-link">
                  VIEW PROFILE &rarr;
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Retirements */}
      {data.retirements.length > 0 && (
        <Panel label={`RETIREMENTS (${data.retirements.length})`}>
          <div className="f1-a-table">
            {data.retirements.map((r, i) => (
              <div className="f1-tdv-ret-row" key={i}>
                <span className="f1-a-driver">{r.driver}</span>
                <span className="f1-a-muted f1-tdv-ret-race">{r.raceName}</span>
                <span className="f1-a-r f1-tdv-dnf">{r.status}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Season race results */}
      <Panel label={`${year} RACE RESULTS`}>
        {rounds.length === 0 ? (
          <p className="f1-a-muted">No results yet this season.</p>
        ) : (
          <div className="f1-tdv-table">
            <div className="f1-tdv-round-row f1-tdv-head" style={{ gridTemplateColumns: gridCols }}>
              <span>R</span>
              <span>RACE</span>
              {drivers.map((d) => (
                <span key={d.driverId} className="f1-a-r">
                  {d.code}
                </span>
              ))}
              <span className="f1-a-r">PTS</span>
            </div>
            {rounds.map((r) => (
              <div className="f1-tdv-round-row" key={r.round} style={{ gridTemplateColumns: gridCols }}>
                <span className="f1-a-muted">
                  R{r.round}
                  <span className="f1-tdv-sub-line f1-tdv-hide-s">{r.date}</span>
                </span>
                <span className="f1-tdv-race">
                  <span className="f1-tdv-race-name">{r.raceName}</span>
                  <span className="f1-a-muted f1-tdv-hide-s">{r.country}</span>
                </span>
                {r.cells.map((c, i) => (
                  <span key={i} className="f1-a-r f1-tdv-cell">
                    {c ? (
                      <>
                        <span
                          className={
                            c.dnf
                              ? "f1-tdv-dnf"
                              : parseInt(c.position, 10) === 1
                                ? "f1-a-accent f1-tdv-p1"
                                : undefined
                          }
                        >
                          {c.dnf ? "DNF" : `P${parseInt(c.position, 10)}`}
                        </span>
                        <span className="f1-a-muted f1-tdv-sub-line f1-tdv-hide-s">{c.points}pts</span>
                      </>
                    ) : (
                      <span className="f1-a-muted">—</span>
                    )}
                  </span>
                ))}
                <span className="f1-a-r f1-a-pts">{r.total}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <p className="f1-tdv-footer f1-tdv-footer-end">
        <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="f1-a-muted f1-tdv-link">
          WIKIPEDIA &rarr;
        </a>
      </p>
    </div>
  );
}
