import { LocalDate } from "@/components/LocalDateTime";
import type { StudioRaceCardData } from "@/components/StudioRaceCard";
import AsciiCountdown from "./AsciiCountdown";
import AsciiLogo from "./AsciiLogo";
import { Bar, FULL, Label, spark } from "./kit";

/*
 * Terminal-grid dashboard for the ASCII visual style. Rendered alongside the standard
 * dashboard and shown only under html[data-style="ascii"] (see ascii.css, .f1-ascii-dash).
 * All values arrive as plain data from the home page, so this stays a server component.
 */

export interface AsciiDriver {
  pos: number;
  familyName: string;
  fullName: string;
  team: string;
  color: string;
  pts: number;
  form: number[];
}

export interface AsciiTeam {
  name: string;
  color: string;
  pts: number;
}

export interface AsciiSession {
  type: string;
  iso: string;
}

export interface AsciiDashData {
  season: { done: number; total: number };
  leader: { familyName: string; fullName: string; team: string; color: string; pts: number; wins: number; num: string };
  second: { familyName: string; color: string; pts: number };
  nextRace: {
    round: string;
    name: string;
    circuit: string;
    place: string;
    targetISO: string;
    sessions: AsciiSession[];
  } | null;
  drivers: AsciiDriver[];
  teams: AsciiTeam[];
  recent: StudioRaceCardData[];
  teamColors: Record<string, string>;
}

export default function AsciiDashboard({ data }: { data: AsciiDashData }) {
  const { season, leader, second, nextRace, drivers, teams, recent } = data;
  const totalTeamPts = teams.reduce((a, t) => a + t.pts, 0) || 1;
  const leaderPts = leader.pts || 1;
  const gap = leader.pts - second.pts;

  return (
    <div className="f1-ascii-dash">
      {/* Hero */}
      <section className="f1-a-panel f1-a-hero">
        <Label>Welcome back</Label>
        <div className="f1-a-hero-top">
          <AsciiLogo />
          <div className="f1-a-hero-copy">
            <p className="f1-a-accent f1-a-upper">The pit wall for the 2026 Formula 1 season</p>
            <p className="f1-a-muted f1-a-upper">
              Live timing · standings · race results · driver and team analytics
            </p>
          </div>
        </div>
        <div className="f1-a-season">
          <span className="f1-a-muted">SEASON</span>
          <Bar frac={season.total ? season.done / season.total : 0} color="var(--color-f1-accent)" />
          <span className="f1-a-num">
            {String(season.done).padStart(2, "0")}/{season.total}
          </span>
        </div>
        <div className="f1-a-stats">
          <span>
            <span className="f1-a-muted">LEADER</span> <span className="f1-a-accent">{leader.familyName.toUpperCase()}</span>
          </span>
          <span>
            <span className="f1-a-muted">RACES LEFT</span>{" "}
            <span className="f1-a-accent">{Math.max(0, season.total - season.done)}</span>
          </span>
        </div>
      </section>

      {/* Leader + next race */}
      <div className="f1-a-two">
        <section className="f1-a-panel">
          <Label>Championship leader</Label>
          <div className="f1-a-leader">
            <div className="f1-a-leader-id">
              <div className="f1-a-leader-name">{leader.fullName}</div>
              <div>
                <span className="f1-a-chip" style={{ background: leader.color }} /> {leader.team}
              </div>
              <div className="f1-a-muted">
                #{leader.num} · {leader.wins} {leader.wins === 1 ? "WIN" : "WINS"}
              </div>
            </div>
            <div className="f1-a-points" style={{ color: leader.color }}>
              {String(leader.pts)}
            </div>
          </div>
          <div className="f1-a-gap">
            <span className="f1-a-accent">+{gap} PTS</span> <span className="f1-a-muted">VS P2</span>
          </div>
          <div className="f1-a-compare">
            <span className="f1-a-cmp-name">{leader.familyName.slice(0, 3).toUpperCase()}</span>
            <Bar frac={1} color={leader.color} />
            <span className="f1-a-cmp-pts">{leader.pts}</span>
            <span className="f1-a-cmp-name">{second.familyName.slice(0, 3).toUpperCase()}</span>
            <Bar frac={second.pts / leaderPts} color={second.color} />
            <span className="f1-a-cmp-pts">{second.pts}</span>
          </div>
        </section>

        <section className="f1-a-panel">
          <Label>{nextRace ? `Next race · round ${nextRace.round}` : "Next race"}</Label>
          {nextRace ? (
            <>
              <div className="f1-a-race-name">{nextRace.name}</div>
              <div className="f1-a-muted">{nextRace.circuit}</div>
              <div className="f1-a-muted f1-a-upper f1-a-mt">Lights out in</div>
              <AsciiCountdown target={nextRace.targetISO} />
              <table className="f1-a-sessions">
                <tbody>
                  {nextRace.sessions.map((s, i) => (
                    <tr key={s.type} className={i === nextRace.sessions.length - 1 ? "f1-a-next" : undefined}>
                      <td>{s.type}</td>
                      <td>
                        <LocalDate iso={s.iso} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="f1-a-muted">No upcoming race scheduled.</p>
          )}
        </section>
      </div>

      {/* Driver standings */}
      <section className="f1-a-panel">
        <Label>Driver standings</Label>
        <div className="f1-a-table">
          <div className="f1-a-row f1-a-head">
            <span>P</span>
            <span />
            <span>DRIVER</span>
            <span className="f1-a-hide-s">TEAM</span>
            <span className="f1-a-r">PTS</span>
            <span className="f1-a-hide-s" />
            <span className="f1-a-form-h">FORM</span>
          </div>
          {drivers.map((d) => (
            <div className="f1-a-row" key={d.familyName + d.pos}>
              <span className={d.pos === 1 ? "f1-a-accent" : undefined}>{String(d.pos).padStart(2, " ")}</span>
              <span className="f1-a-swatch" style={{ background: d.color }} />
              <span className="f1-a-driver">{d.fullName}</span>
              <span className="f1-a-hide-s f1-a-muted">{d.team}</span>
              <span className="f1-a-r f1-a-pts">{d.pts}</span>
              <span className="f1-a-hide-s">
                <Bar frac={d.pts / leaderPts} color={d.color} />
              </span>
              <span className="f1-a-form" style={{ color: d.color }}>
                {spark(d.form)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Constructors */}
      <section className="f1-a-panel">
        <Label>Constructors</Label>
        <div className="f1-a-stack" aria-hidden="true">
          {teams.map((t) => (
            <span key={t.name} className="f1-a-seg" style={{ flexGrow: t.pts / totalTeamPts, color: t.color }}>
              {FULL}
            </span>
          ))}
        </div>
        <div className="f1-a-table f1-a-mt">
          {teams.map((t, i) => (
            <div className="f1-a-row" key={t.name}>
              <span className={i === 0 ? "f1-a-accent" : undefined}>{String(i + 1).padStart(2, " ")}</span>
              <span className="f1-a-swatch" style={{ background: t.color }} />
              <span className="f1-a-driver">{t.name}</span>
              <span className="f1-a-hide-s" />
              <span className="f1-a-r f1-a-pts">{t.pts}</span>
              <span className="f1-a-bar-cell">
                <Bar frac={t.pts / (teams[0]?.pts || 1)} color={t.color} />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent results */}
      <div className="f1-a-three">
        {recent.map((r) => (
          <section className="f1-a-panel" key={r.round}>
            <Label>{`R${r.round.padStart(2, "0")} · ${r.short}`}</Label>
            <div className="f1-a-race-name">{r.name}</div>
            <div className="f1-a-muted">{r.date}</div>
            <div className="f1-a-mt">
              <div>
                <span className="f1-a-muted">WIN</span>{" "}
                <span style={{ color: data.teamColors[r.winnerTeamId] }}>{r.winnerFamily}</span>
              </div>
              <div>
                <span className="f1-a-muted">POLE</span> {r.poleFamily ?? "—"}
              </div>
              <div>
                <span className="f1-a-muted">FL</span> {r.fastestFamily ?? "—"}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
