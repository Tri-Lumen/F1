import Link from "next/link";
import { AsciiHeader, Bar, Panel, Swatch } from "@/components/ascii/kit";
import "@/app/ascii/teams.css";

/*
 * Terminal-grid Teams page for the ASCII visual style. Rendered beside the standard
 * markup on /teams and shown only under html[data-style="ascii"] (see
 * app/ascii/teams.css). Receives plain data from the page, so it stays a server component.
 * The standard charts (ConstructorPointsChart, TeammateH2H) are not shown in ASCII.
 */

export interface AsciiTeamDriver {
  driverId: string;
  givenName: string;
  familyName: string;
  number: string;
  pts: number;
  pos: string;
}

export interface AsciiTeamEntry {
  constructorId: string;
  position: string;
  name: string;
  url: string;
  color: string;
  points: number;
  drivers: AsciiTeamDriver[];
}

export interface AsciiTeamsData {
  subtitle: string;
  teams: AsciiTeamEntry[];
}

export default function TeamsView({ data }: { data: AsciiTeamsData }) {
  const { subtitle, teams } = data;
  const leaderPts = teams[0]?.points || 1;

  return (
    <div className="f1-ascii-dash f1-ascii-teams">
      <AsciiHeader title="Teams" subtitle={subtitle} />

      {teams.length === 0 ? (
        <p className="f1-a-muted">No constructor standings available yet.</p>
      ) : (
        <>
          {/* Constructor standings */}
          <Panel label="Constructor standings">
            <div className="f1-a-table">
              <div className="f1-t-row f1-t-head">
                <span>P</span>
                <span />
                <span>TEAM</span>
                <span className="f1-a-r">PTS</span>
                <span className="f1-t-hide-s" />
                <span className="f1-t-hide-s">DRIVERS</span>
              </div>
              {teams.map((t) => (
                <div className="f1-t-row" key={t.constructorId}>
                  <span className={t.position === "1" ? "f1-a-accent" : undefined}>
                    {t.position.padStart(2, " ")}
                  </span>
                  <Swatch color={t.color} />
                  <span className="f1-t-team">
                    <Link href={`/teams/${t.constructorId}`} className="f1-t-link">
                      {t.name}
                    </Link>
                  </span>
                  <span className="f1-a-r f1-a-pts">{t.points}</span>
                  <span className="f1-t-hide-s">
                    <Bar frac={t.points / leaderPts} color={t.color} />
                  </span>
                  <span className="f1-t-hide-s f1-a-muted f1-t-driver-names">
                    {t.drivers.map((d) => d.familyName.toUpperCase()).join(" / ") || "—"}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Per-team driver points */}
          <div className="f1-a-two">
            {teams.map((t) => {
              const teamPts = t.points || 1;
              return (
                <Panel
                  key={t.constructorId}
                  id={t.constructorId}
                  label={
                    <span className="f1-t-panel-label">
                      <Swatch color={t.color} /> {t.name.toUpperCase()}
                    </span>
                  }
                >
                  {t.drivers.length === 0 ? (
                    <p className="f1-a-muted">No drivers listed.</p>
                  ) : (
                    <div className="f1-a-table">
                      {t.drivers.map((d) => (
                        <div className="f1-t-driver-row" key={d.driverId}>
                          <span className="f1-a-muted">#{d.number}</span>
                          <Link href={`/drivers/${d.driverId}`} className="f1-t-link f1-a-driver">
                            {d.givenName} <span className="f1-a-upper">{d.familyName}</span>
                          </Link>
                          <span className="f1-a-r f1-a-pts">{d.pts} pts</span>
                          <span className="f1-t-share">
                            <Bar frac={d.pts / teamPts} color={t.color} />
                          </span>
                          <span className="f1-a-r f1-a-muted">P{d.pos}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="f1-t-footer">
                    <Link href={`/teams/${t.constructorId}`} className="f1-t-link">
                      VIEW TEAM &rarr;
                    </Link>
                    <a href={t.url} target="_blank" rel="noopener noreferrer" className="f1-a-muted f1-t-link">
                      WIKIPEDIA
                    </a>
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
