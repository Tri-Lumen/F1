import { AsciiHeader, Bar, Panel, Swatch } from "../kit";
import { PointsGrid, type PointsGridData } from "./PointsGrid";
import "@/app/ascii/stats.css";

/*
 * ASCII view of the /stats page. Rendered next to the standard markup and shown only under
 * html[data-style="ascii"]. The page computes every list and passes plain values here, so
 * this stays a server component. The championship evolution chart becomes a points grid.
 */

export interface StatsItem {
  id: string;
  rank: string;
  name: string;
  color?: string;
  value: string;
  sub?: string;
  /** Bar length, 0-1. */
  frac: number;
}

export interface StatsHighlight {
  driver: string;
  value: string;
  race: string;
  color: string;
}

export interface StatsPprRow {
  id: string;
  name: string;
  color: string;
  ppr: string;
  total: number;
  races: number;
}

export interface StatsViewData {
  racesComplete: number;
  sprints: number;
  totalPoints: number;
  totalDnfs: number;
  drivers: number;
  bestGain: StatsHighlight | null;
  worstDrop: StatsHighlight | null;
  positions: StatsItem[];
  points: StatsPprRow[];
  dnfsByTeam: StatsItem[];
  lapsLed: StatsItem[];
  overtakes: StatsItem[];
  pit: {
    totalStops: number;
    fastest: { duration: string; race: string } | null;
    teams: StatsItem[];
  };
  consistency: StatsItem[];
  /** Cumulative points per round for the top drivers (the evolution chart's data). */
  evolution?: PointsGridData;
  /** Points deficit to the championship leader after each round (the gap view's data). */
  gap?: PointsGridData;
}

export interface StatsViewProps {
  year: string;
  data: StatsViewData | null;
}

function Item({ rank, name, color, value, sub, frac }: StatsItem) {
  return (
    <div className="st-item">
      <div className="st-item-top">
        <span className="st-rank">{rank}</span>
        {color ? <Swatch color={color} /> : <span className="st-noswatch" />}
        <span className="st-name">{name}</span>
        <span className="st-val" style={color ? { color } : undefined}>
          {value}
        </span>
      </div>
      <div className="st-bar">
        <Bar frac={frac} color={color ?? "var(--color-f1-accent)"} />
      </div>
      {sub && <p className="st-sub">{sub}</p>}
    </div>
  );
}

function Swing({ label, h }: { label: string; h: StatsHighlight }) {
  return (
    <div className="st-swing">
      <span className="f1-a-muted">{label}</span>
      <span className="st-val" style={{ color: h.color }}>
        {h.value}
      </span>
      <span className="st-name">{h.driver}</span>
      <span className="f1-a-muted">{h.race}</span>
    </div>
  );
}

export default function StatsView({ year, data }: StatsViewProps) {
  if (!data) {
    return (
      <div className="f1-ascii-dash f1-ascii-stats">
        <AsciiHeader title="Season Stats" subtitle={`${year} Season · In-depth statistics and analysis`} />
        <p className="f1-a-muted">No race data available yet for {year}.</p>
      </div>
    );
  }

  const d = data;
  const hasSwings = d.bestGain !== null || d.worstDrop !== null;

  return (
    <div className="f1-ascii-dash f1-ascii-stats">
      <AsciiHeader title="Season Stats" subtitle={`${year} Season · In-depth statistics and analysis`} />

      {/* Season summary KPIs */}
      <Panel label="Overview">
        <div className="f1-a-stats">
          <span>
            <span className="f1-a-muted">RACES</span> <span className="f1-a-accent">{d.racesComplete}</span>
            {d.sprints > 0 && (
              <span className="f1-a-muted">
                {" "}+ {d.sprints} sprint{d.sprints !== 1 ? "s" : ""}
              </span>
            )}
          </span>
          <span>
            <span className="f1-a-muted">POINTS</span> <span className="f1-a-accent">{d.totalPoints}</span>
          </span>
          <span>
            <span className="f1-a-muted">DNFS</span> <span className="f1-a-accent">{d.totalDnfs}</span>
          </span>
          <span>
            <span className="f1-a-muted">DRIVERS</span> <span className="f1-a-accent">{d.drivers}</span>
          </span>
        </div>
      </Panel>

      {hasSwings && (
        <Panel label="Single-race swings">
          {d.bestGain && <Swing label="BEST GAIN" h={d.bestGain} />}
          {d.worstDrop && <Swing label="WORST DROP" h={d.worstDrop} />}
        </Panel>
      )}

      <div className="f1-a-two">
        {d.positions.length > 0 && (
          <Panel label="Season Positions Gained">
            <p className="f1-a-muted">
              Total grid positions gained from start to finish across all races (positive = moved forward)
            </p>
            <div className="st-list">
              {d.positions.map((p) => (
                <Item key={p.id} {...p} />
              ))}
            </div>
          </Panel>
        )}

        {d.points.length > 0 && (
          <Panel label="Points Per Race">
            <p className="f1-a-muted">Average championship points scored per race entry</p>
            <div className="st-ppr st-head">
              <span>RANK</span>
              <span>DRIVER</span>
              <span>PPR</span>
              <span>TOTAL</span>
              <span className="f1-a-hide-s">RACES</span>
            </div>
            {d.points.map((p, i) => (
              <div key={p.id} className="st-ppr">
                <span>{i + 1}</span>
                <span className="st-ppr-name">
                  <Swatch color={p.color} />
                  <span className="st-name">{p.name}</span>
                </span>
                <span className="st-ppr-val">{p.ppr}</span>
                <span>{p.total}</span>
                <span className="f1-a-hide-s f1-a-muted">{p.races}</span>
              </div>
            ))}
          </Panel>
        )}

        {d.dnfsByTeam.length > 0 && (
          <Panel label="DNFs by Team">
            <div className="st-list">
              {d.dnfsByTeam.map((t) => (
                <Item key={t.id} {...t} />
              ))}
            </div>
          </Panel>
        )}

        {d.lapsLed.length > 0 && (
          <Panel label="Race Winning Laps">
            <p className="f1-a-muted">Total laps completed as race winner</p>
            <div className="st-list">
              {d.lapsLed.map((l) => (
                <Item key={l.id} {...l} />
              ))}
            </div>
          </Panel>
        )}

        {d.overtakes.length > 0 && (
          <Panel label="Overtakes by Grand Prix">
            <p className="f1-a-muted">
              Total positions gained from grid to finish across all drivers (proxy for racing action)
            </p>
            <div className="st-list">
              {d.overtakes.map((o) => (
                <Item key={o.id} {...o} />
              ))}
            </div>
          </Panel>
        )}

        {d.pit.teams.length > 0 && (
          <Panel label="Pit Stop Performance by Team">
            <p className="f1-a-muted">
              Average pit stop duration (seconds) across {d.pit.totalStops} stops this season
            </p>
            {d.pit.fastest && (
              <p className="st-fastest">
                Fastest stop: <span className="f1-a-accent">{d.pit.fastest.duration}s</span> — {d.pit.fastest.race}
              </p>
            )}
            <div className="st-list">
              {d.pit.teams.map((t) => (
                <Item key={t.id} {...t} />
              ))}
            </div>
          </Panel>
        )}

        {d.consistency.length > 0 && (
          <Panel label="Driver Consistency">
            <p className="f1-a-muted">
              Lowest standard deviation in finishing position (excluding DNFs) — most consistent performers
            </p>
            <div className="st-list">
              {d.consistency.map((c) => (
                <Item key={c.id} {...c} />
              ))}
            </div>
          </Panel>
        )}
      </div>

      {d.evolution && d.evolution.rounds.length > 1 && d.evolution.series.length > 0 && (
        <Panel label="Championship Evolution">
          <p className="f1-a-muted">Cumulative points for top drivers after each round</p>
          <PointsGrid data={d.evolution} nameHeader="DRIVER" />
        </Panel>
      )}

      {d.gap && d.gap.rounds.length > 1 && d.gap.series.length > 0 && (
        <Panel label="Gap to leader">
          <p className="f1-a-muted">Points behind the championship leader after each round</p>
          <PointsGrid data={d.gap} nameHeader="DRIVER" />
        </Panel>
      )}
    </div>
  );
}
