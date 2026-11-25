import Link from "next/link";
import { AsciiHeader, Panel, Swatch } from "../kit";
import "@/app/ascii/archive.css";

/*
 * ASCII view of the /archive page: one row per season, linked to /archive/<season>.
 * Rendered next to the standard grid and shown only under html[data-style="ascii"].
 * Receives plain data from the page, so it stays a server component.
 */

export interface ArchiveViewSeason {
  season: string;
  races?: number;
  /** Driver champion's surname, already uppercased. Absent when there is no season data. */
  driverChampion?: string;
  constructorChampion?: string;
  color: string;
}

export interface ArchiveViewProps {
  seasons: ArchiveViewSeason[];
}

export default function ArchiveView({ seasons }: ArchiveViewProps) {
  return (
    <div className="f1-ascii-dash f1-ascii-archive">
      <AsciiHeader
        title="Archive"
        subtitle="Championship standings and race results from 2016 to 2025"
      />

      <Panel label={`Seasons · ${seasons.length} total`}>
        <div className="f1-a-table">
          <div className="ar-row f1-a-head">
            <span>YEAR</span>
            <span>DRIVER CHAMPION</span>
            <span className="f1-a-hide-s">TEAM CHAMPION</span>
            <span className="ar-r">RACES</span>
          </div>
          {seasons.map((s) => (
            <Link key={s.season} href={`/archive/${s.season}`} className="ar-row">
              <span className="ar-year">{s.season}</span>
              <span className="ar-driver">
                {s.driverChampion ? (
                  <>
                    <Swatch color={s.color} /> {s.driverChampion}
                  </>
                ) : (
                  <span className="f1-a-muted">—</span>
                )}
              </span>
              <span className="f1-a-hide-s f1-a-muted ar-team">{s.constructorChampion ?? "—"}</span>
              <span className="ar-r f1-a-muted">{s.races ?? "—"}</span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
