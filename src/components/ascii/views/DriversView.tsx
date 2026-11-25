import Link from "next/link";
import "@/app/ascii/drivers.css";
import { AsciiHeader, Bar, Panel, Swatch } from "../kit";
import { PointsGrid, type PointsGridData } from "./PointsGrid";

/*
 * ASCII view for the Drivers page. Shown only under html[data-style="ascii"] (see
 * .f1-ascii-dash in ascii.css); the standard driver cards sit beside it, hidden in ASCII.
 * Plain data in, server-safe out. The points-progression chart is drawn as a points grid.
 */

export interface AsciiDriverRow {
  pos: number;
  driverId: string;
  fullName: string;
  number: string;
  team: string;
  color: string;
  pts: number;
  wins: number;
  wikiUrl: string;
}

export default function DriversView({
  subtitle,
  drivers,
  progression,
}: {
  subtitle: string;
  drivers: AsciiDriverRow[];
  /** Cumulative points per round for the top drivers (the progression chart's data). */
  progression?: PointsGridData;
}) {
  const leaderPts = drivers[0]?.pts || 1;

  return (
    <div className="f1-ascii-dash f1-a-drv">
      <AsciiHeader title="Drivers" subtitle={subtitle} />

      <Panel label="Driver standings">
        {drivers.length === 0 ? (
          <p className="f1-a-muted">No driver standings available yet.</p>
        ) : (
          <div className="f1-a-drv-table">
            <div className="f1-a-drv-row f1-a-drv-head">
              <span className="f1-a-drv-pos">P</span>
              <span />
              <span>DRIVER</span>
              <span className="f1-a-hide-s">TEAM</span>
              <span className="f1-a-drv-r">PTS</span>
              <span className="f1-a-hide-s" />
              <span className="f1-a-drv-r">WINS</span>
              <span className="f1-a-drv-r">WIKI</span>
            </div>
            {drivers.map((d) => (
              <div className="f1-a-drv-row" key={d.driverId}>
                <span className={`f1-a-drv-pos${d.pos === 1 ? " f1-a-accent" : ""}`}>
                  {String(d.pos).padStart(2, " ")}
                </span>
                <Swatch color={d.color} />
                <span className="f1-a-drv-name">
                  <span className="f1-a-muted">#{d.number}</span>{" "}
                  <Link className="f1-a-drv-link" href={`/drivers/${d.driverId}`}>
                    {d.fullName}
                  </Link>
                </span>
                <span className="f1-a-hide-s f1-a-muted f1-a-drv-team">{d.team}</span>
                <span className="f1-a-drv-r f1-a-pts">{d.pts}</span>
                <span className="f1-a-hide-s">
                  <Bar frac={d.pts / leaderPts} color={d.color} />
                </span>
                <span className="f1-a-drv-r">{d.wins}</span>
                <span className="f1-a-drv-r">
                  <a
                    className="f1-a-drv-wiki"
                    href={d.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WIKI
                  </a>
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {progression && progression.rounds.length > 0 && progression.series.length > 0 && (
        <Panel label="Points progression">
          <p className="f1-a-muted">Cumulative championship points, top {progression.series.length} drivers</p>
          <PointsGrid data={progression} nameHeader="DRIVER" />
        </Panel>
      )}
    </div>
  );
}
