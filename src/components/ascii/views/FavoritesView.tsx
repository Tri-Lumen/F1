import { AsciiHeader, Panel, Swatch, spark } from "../kit";
import "@/app/ascii/favorites.css";

/*
 * ASCII view of the /favorites page. Rendered by FavoritesClient (the standard page is
 * client-only: favourites live in localStorage), using the same driver and team lists and
 * derived numbers as the standard cards. Row styles live in src/app/ascii/favorites.css.
 */

export interface FavDriverRow {
  key: string;
  position: string;
  name: string;
  team: string;
  teamColor: string;
  points: string;
  wins: string;
  podiums: number;
  perRace: string;
  /** Finishing positions of the last five races, oldest first (20 = non-finish). */
  form: number[];
}

export interface FavTeamRow {
  key: string;
  position: string;
  name: string;
  teamColor: string;
  drivers: string;
  points: string;
  wins: string;
  podiums: number;
  perRace: string;
}

export interface FavoritesViewProps {
  status: "loading" | "empty" | "ready";
  drivers: FavDriverRow[];
  teams: FavTeamRow[];
}

export default function FavoritesView({ status, drivers, teams }: FavoritesViewProps) {
  return (
    <div className="f1-ascii-dash f1-ascii-favs">
      <AsciiHeader
        title="My Favourites"
        subtitle="Your selected drivers and teams at a glance."
      />

      {status === "loading" && <p className="f1-a-muted">Loading favourites…</p>}
      {status === "empty" && (
        <p className="f1-a-muted">No favourites yet. Pick up to 3 drivers and 2 teams in Settings.</p>
      )}

      {status === "ready" && drivers.length > 0 && (
        <Panel label={`Drivers · ${drivers.length}`}>
          <div className="f1-a-table">
            <div className="fv-row fv-drv fv-head">
              <span>POS</span>
              <span>DRIVER</span>
              <span className="f1-a-hide-s">TEAM</span>
              <span className="fv-num">PTS</span>
              <span className="fv-num f1-a-hide-s">WINS</span>
              <span className="fv-num f1-a-hide-s">POD</span>
              <span className="fv-num f1-a-hide-s">PTS/R</span>
              <span className="f1-a-hide-s">FORM</span>
            </div>
            {drivers.map((d) => (
              <div key={d.key} className="fv-row fv-drv">
                <span className="fv-pos f1-a-muted">{d.position}</span>
                <span className="fv-name">
                  <Swatch color={d.teamColor} /> {d.name}
                </span>
                <span className="f1-a-hide-s f1-a-muted fv-cell">{d.team}</span>
                <span className="fv-num fv-pts">{d.points}</span>
                <span className="fv-num f1-a-hide-s">{d.wins}</span>
                <span className="fv-num f1-a-hide-s">{d.podiums}</span>
                <span className="fv-num f1-a-hide-s">{d.perRace}</span>
                <span className="f1-a-hide-s fv-form">{spark(d.form) || "—"}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {status === "ready" && teams.length > 0 && (
        <Panel label={`Teams · ${teams.length}`}>
          <div className="f1-a-table">
            <div className="fv-row fv-team fv-head">
              <span>POS</span>
              <span>TEAM</span>
              <span className="f1-a-hide-s">DRIVERS</span>
              <span className="fv-num">PTS</span>
              <span className="fv-num f1-a-hide-s">WINS</span>
              <span className="fv-num f1-a-hide-s">POD</span>
              <span className="fv-num f1-a-hide-s">PTS/R</span>
            </div>
            {teams.map((t) => (
              <div key={t.key} className="fv-row fv-team">
                <span className="fv-pos f1-a-muted">{t.position}</span>
                <span className="fv-name">
                  <Swatch color={t.teamColor} /> {t.name}
                </span>
                <span className="f1-a-hide-s f1-a-muted fv-cell">{t.drivers}</span>
                <span className="fv-num fv-pts">{t.points}</span>
                <span className="fv-num f1-a-hide-s">{t.wins}</span>
                <span className="fv-num f1-a-hide-s">{t.podiums}</span>
                <span className="fv-num f1-a-hide-s">{t.perRace}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
