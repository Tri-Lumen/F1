import Link from "next/link";
import { AsciiHeader, Panel, Swatch } from "../kit";
import "@/app/ascii/archive-season.css";

/*
 * ASCII view of /archive/[season]: standings and calendar for one season. Rendered next to
 * the standard markup and shown only under html[data-style="ascii"]. The page computes every
 * value and passes plain data here, so this stays a server component.
 */

export interface ArchiveSeasonChampion {
  name: string;
  team: string;
  points: string;
  wins: string;
  color: string;
}

export interface ArchiveSeasonDriverRow {
  id: string;
  position: string;
  name: string;
  team: string;
  points: string;
  color: string;
}

export interface ArchiveSeasonConstructorRow {
  id: string;
  position: string;
  name: string;
  wins: string;
  points: string;
  color: string;
}

export interface ArchiveSeasonRaceRow {
  round: string;
  name: string;
  country: string;
  date: string;
  winner: { surname: string; color: string; time?: string } | null;
}

export interface ArchiveSeasonViewProps {
  season: string;
  raceCount: number;
  champion: ArchiveSeasonChampion | null;
  drivers: ArchiveSeasonDriverRow[];
  /** Drivers beyond the top ten, which the table leaves out. */
  driversMore: number;
  constructors: ArchiveSeasonConstructorRow[];
  races: ArchiveSeasonRaceRow[];
}

const plural = (n: number) => (n !== 1 ? "s" : "");

export default function ArchiveSeasonView({
  season,
  raceCount,
  champion,
  drivers,
  driversMore,
  constructors,
  races,
}: ArchiveSeasonViewProps) {
  return (
    <div className="f1-ascii-dash f1-ascii-archive-season">
      <p className="f1-a-muted as-crumb">
        <Link href="/archive">Archive</Link> / {season}
      </p>
      <AsciiHeader
        title={`${season} Season`}
        subtitle={`${raceCount} race${plural(raceCount)} · Final standings`}
      />

      {champion && (
        <Panel label={`${season} World Champion`}>
          <div className="as-champ">
            <Swatch color={champion.color} />
            <div className="as-champ-copy">
              <span className="as-champ-name" style={{ color: champion.color }}>
                {champion.name}
              </span>
              <span className="f1-a-muted">{champion.team}</span>
            </div>
            <div className="as-champ-stat">
              <span className="as-big">{champion.points}</span>
              <span className="f1-a-muted">points</span>
            </div>
            <div className="as-champ-stat">
              <span className="as-big">{champion.wins}</span>
              <span className="f1-a-muted">wins</span>
            </div>
          </div>
        </Panel>
      )}

      <div className="f1-a-two">
        <Panel label="Driver Standings">
          {drivers.length === 0 ? (
            <p className="f1-a-muted">No data available</p>
          ) : (
            <div className="as-table">
              <div className="as-drv as-head">
                <span>POS</span>
                <span />
                <span>DRIVER</span>
                <span className="f1-a-hide-s">TEAM</span>
                <span>PTS</span>
              </div>
              {drivers.map((d) => (
                <div key={d.id} className="as-drv">
                  <span className="as-pos">{d.position}</span>
                  <Swatch color={d.color} />
                  <span className="as-name">
                    {d.name}
                    <span className="as-sub">{d.team}</span>
                  </span>
                  <span className="f1-a-hide-s f1-a-muted as-cell">{d.team}</span>
                  <span className="as-num">{d.points}</span>
                </div>
              ))}
              {driversMore > 0 && (
                <p className="f1-a-muted as-more">+{driversMore} more drivers</p>
              )}
            </div>
          )}
        </Panel>

        <Panel label="Constructor Standings">
          {constructors.length === 0 ? (
            <p className="f1-a-muted">No data available</p>
          ) : (
            <div className="as-table">
              <div className="as-con as-head">
                <span>POS</span>
                <span />
                <span>TEAM</span>
                <span>WINS</span>
                <span>PTS</span>
              </div>
              {constructors.map((c) => (
                <div key={c.id} className="as-con">
                  <span className="as-pos">{c.position}</span>
                  <Swatch color={c.color} />
                  <span className="as-name">{c.name}</span>
                  <span className="f1-a-muted as-num">
                    {c.wins} win{plural(Number(c.wins))}
                  </span>
                  <span className="as-num">{c.points}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {races.length > 0 && (
        <Panel label={`Race Calendar · ${races.length} rounds`}>
          <div className="as-table">
            <div className="as-race as-head">
              <span>RD</span>
              <span>RACE</span>
              <span className="f1-a-hide-s">DATE</span>
              <span>WINNER</span>
              <span className="f1-a-hide-s">TIME</span>
            </div>
            {races.map((r) => (
              <div key={r.round} className="as-race">
                <span className="as-pos">{String(r.round).padStart(2, "0")}</span>
                <span className="as-name">
                  {r.name}
                  <span className="as-sub">
                    {r.country}
                    <span className="as-sub-date"> · {r.date}</span>
                  </span>
                </span>
                <span className="f1-a-hide-s f1-a-muted as-cell">{r.date}</span>
                <span className="as-winner">
                  {r.winner ? (
                    <>
                      <Swatch color={r.winner.color} />
                      <span style={{ color: r.winner.color }}>{r.winner.surname}</span>
                    </>
                  ) : (
                    <span className="f1-a-muted">—</span>
                  )}
                </span>
                <span className="f1-a-hide-s as-num f1-a-muted">{r.winner?.time ?? "—"}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
