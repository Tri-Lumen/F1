import Link from "next/link";
import { AsciiHeader, Bar, Panel, Swatch } from "../kit";
import "@/app/ascii/fastest-laps.css";

/*
 * ASCII view of the /fastest-laps page. Rendered next to the standard markup and shown only
 * under html[data-style="ascii"]. The page computes every list and passes plain values here,
 * so this stays a server component. Charts are drawn as Bar rows instead of SVG.
 */

export interface FastestLapsBar {
  id: string;
  label: string;
  name?: string;
  sub?: string;
  color?: string;
  count: number;
  /** Bar length, 0-1. */
  frac: number;
  /** Optional trailing text, e.g. a percentage share. */
  share?: string;
}

export interface FastestLapsRow {
  round: string;
  race: string;
  driver: string;
  team: string;
  color: string;
  time: string;
  lap: string;
  speed: string;
  position: string;
  best: boolean;
}

export interface FastestLapsViewData {
  recorded: number;
  completed: number;
  top: { name: string; team: string; count: number } | null;
  fastest: { time: string; name: string; race: string; speed: string } | null;
  leaderboard: FastestLapsBar[];
  teams: FastestLapsBar[];
  buckets: FastestLapsBar[];
  /** Lap-number bins; empty when there are too few laps to chart. */
  lapBins: FastestLapsBar[];
  rows: FastestLapsRow[];
}

export interface FastestLapsViewProps {
  year: string;
  data: FastestLapsViewData | null;
}

function BarRow({ item }: { item: FastestLapsBar }) {
  const color = item.color ?? "var(--color-f1-accent)";
  return (
    <div className="fl-item">
      <div className="fl-item-top">
        <span className="fl-rank">{item.label}</span>
        {item.color ? <Swatch color={item.color} /> : <span className="fl-noswatch" />}
        <span className="fl-name">
          {item.name ?? ""}
          {item.sub && <span className="fl-sub-line">{item.sub}</span>}
        </span>
        <span className="fl-val" style={item.color ? { color: item.color } : undefined}>
          {item.count}
          {item.share && <span className="f1-a-muted"> {item.share}</span>}
        </span>
      </div>
      <div className="fl-bar">
        <Bar frac={item.frac} color={color} />
      </div>
    </div>
  );
}

export default function FastestLapsView({ year, data }: FastestLapsViewProps) {
  const subtitle = `${year} Season · Purple lap records race by race`;

  if (!data) {
    return (
      <div className="f1-ascii-dash f1-ascii-fastest">
        <AsciiHeader title="Fastest Laps" subtitle={subtitle} />
        <p className="f1-a-muted">No race data available yet for {year}.</p>
      </div>
    );
  }

  return (
    <div className="f1-ascii-dash f1-ascii-fastest">
      <AsciiHeader title="Fastest Laps" subtitle={subtitle} />

      <Panel label="Summary">
        <div className="f1-a-stats">
          {data.top && (
            <span>
              <span className="f1-a-muted">MOST FASTEST LAPS</span>{" "}
              <span className="f1-a-accent">{data.top.count}</span> {data.top.name}{" "}
              <span className="f1-a-muted">{data.top.team}</span>
            </span>
          )}
          {data.fastest && (
            <span>
              <span className="f1-a-muted">FASTEST LAP</span>{" "}
              <span className="f1-a-accent">{data.fastest.time}</span> {data.fastest.name}{" "}
              <span className="f1-a-muted">
                {data.fastest.race}
                {data.fastest.speed ? ` · ${data.fastest.speed}` : ""}
              </span>
            </span>
          )}
          <span>
            <span className="f1-a-muted">RACES RECORDED</span>{" "}
            <span className="f1-a-accent">{data.recorded}</span>{" "}
            <span className="f1-a-muted">of {data.completed} completed</span>
          </span>
        </div>
      </Panel>

      <div className="f1-a-two">
        {data.leaderboard.length > 0 && (
          <Panel label="Fastest Lap Leaderboard">
            <div className="fl-list">
              {data.leaderboard.map((item, i) => (
                <BarRow key={item.id} item={{ ...item, label: String(i + 1) }} />
              ))}
            </div>
          </Panel>
        )}

        {data.teams.length > 0 && (
          <Panel label="Fastest Laps by Team">
            <div className="fl-list">
              {data.teams.map((item) => (
                <BarRow key={item.id} item={{ ...item, label: "" }} />
              ))}
            </div>
          </Panel>
        )}

        {data.buckets.length > 0 && (
          <Panel label="Who Sets Fastest Laps?">
            <p className="f1-a-muted">Distribution by race finishing position</p>
            <div className="fl-list">
              {data.buckets.map((item) => (
                <div key={item.id} className="fl-item">
                  <div className="fl-item-top fl-item-plain">
                    <span className="fl-name">{item.label}</span>
                    <span className="fl-val">
                      {item.count}
                      {item.share && <span className="f1-a-muted"> {item.share}</span>}
                    </span>
                  </div>
                  <div className="fl-bar">
                    <Bar frac={item.frac} color="var(--color-f1-accent)" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {data.lapBins.length > 0 && (
          <Panel label="When Are Fastest Laps Set?">
            <p className="f1-a-muted">Distribution by lap number</p>
            <div className="fl-list">
              {data.lapBins.map((item) => (
                <div key={item.id} className="fl-item">
                  <div className="fl-item-top fl-item-plain">
                    <span className="fl-name">Laps {item.label}</span>
                    <span className="fl-val">{item.count}</span>
                  </div>
                  <div className="fl-bar">
                    <Bar frac={item.frac} color="var(--color-f1-accent)" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {data.rows.length > 0 && (
        <Panel label="Race-by-Race Fastest Laps">
          <div className="fl-table">
            <div className="fl-row fl-head">
              <span>RD</span>
              <span>GRAND PRIX</span>
              <span className="f1-a-hide-s">DRIVER</span>
              <span className="f1-a-hide-s">TEAM</span>
              <span>TIME</span>
              <span className="fl-hide-m">LAP</span>
              <span className="fl-hide-m">AVG SPEED</span>
              <span className="fl-hide-m">POS</span>
            </div>
            {data.rows.map((r) => (
              <div key={r.round} className={`fl-row${r.best ? " fl-best" : ""}`}>
                <span className="fl-rd">{r.round}</span>
                <span className="fl-gp">
                  <Link href={`/race/${r.round}`}>{r.race}</Link>
                  <span className="fl-sub-d">{r.driver}</span>
                </span>
                <span className="f1-a-hide-s fl-driver">
                  <Swatch color={r.color} /> {r.driver}
                </span>
                <span className="f1-a-hide-s f1-a-muted fl-team">{r.team}</span>
                <span className="fl-time">
                  {r.time}
                  {r.best && <span className="f1-a-accent"> *</span>}
                </span>
                <span className="fl-hide-m f1-a-muted">{r.lap}</span>
                <span className="fl-hide-m f1-a-muted">{r.speed}</span>
                <span className="fl-hide-m fl-pos">P{r.position}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
