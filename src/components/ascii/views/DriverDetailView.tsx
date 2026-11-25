import type { ReactNode } from "react";
import Link from "next/link";
import { AsciiHeader, Bar, Panel, Swatch, spark } from "../kit";
import "@/app/ascii/driver-detail.css";

/*
 * ASCII view of the driver detail page. Rendered next to the standard markup and shown only
 * under html[data-style="ascii"] (see .f1-ascii-dash in ascii.css). The page computes every
 * number and passes plain data in, so this stays a server component. Row styles live in
 * src/app/ascii/driver-detail.css. The trajectory SVG, the news section and the interactive
 * widgets are standard-only and are not rendered here.
 */

export interface DriverDetailResult {
  round: string;
  raceName: string;
  country: string;
  dateLabel: string;
  grid: string;
  position: string;
  status: string;
  points: string;
  hasFastestLap: boolean;
}

export interface DriverDetailSeason {
  position: string;
  points: string;
  wins: string;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  racesEntered: number;
  gridRaces: number;
  avgFinish: number;
  avgGrid: number;
  ppr: number;
  positionsGained: number;
  pointsFinishes: number;
  pointsRate: number;
  poleConversion: number | null;
  poleToWins: number;
  poleCount: number;
  frontRowStarts: number;
  year: string;
}

export interface DriverDetailCareer {
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  span: string;
}

export interface DriverDetailH2H {
  teammateName: string;
  raceWins: number;
  tmRaceWins: number;
  qualWins: number;
  tmQualWins: number;
}

export interface DriverDetailViewProps {
  name: string;
  subtitle: string;
  team: string;
  teamColor: string;
  number: string;
  code: string;
  wikiUrl: string;
  season: DriverDetailSeason;
  career: DriverDetailCareer;
  results: DriverDetailResult[];
  form: { round: string; pos: number; isDNF: boolean }[];
  h2h: DriverDetailH2H | null;
}

const isDNFStatus = (status: string) => status !== "Finished" && !status.startsWith("+");

function signed(n: number) {
  return n >= 0 ? `+${n}` : `${n}`;
}

function Kv({ label, value, className = "" }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className="dd-kv">
      <span className="f1-a-muted">{label}</span>
      <span className="dd-lead" aria-hidden="true" />
      <span className={`dd-v ${className}`}>{value}</span>
    </div>
  );
}

export default function DriverDetailView({
  name,
  subtitle,
  team,
  teamColor,
  number,
  code,
  wikiUrl,
  season: s,
  career: c,
  results,
  form,
  h2h,
}: DriverDetailViewProps) {
  const hasRaces = s.racesEntered > 0;
  const gainedAvg = s.gridRaces > 0 ? s.positionsGained / s.gridRaces : 0;

  return (
    <div className="f1-ascii-dash f1-ascii-driver">
      <p className="dd-back">
        <Link href="/drivers" className="f1-a-muted">
          &lt; Drivers
        </Link>
      </p>

      <AsciiHeader title={name} subtitle={subtitle} />

      <Panel label="Driver">
        <div className="dd-id">
          <span className="dd-id-team" style={{ color: teamColor }}>
            <Swatch color={teamColor} /> {team}
          </span>
          <span>
            <span className="f1-a-muted">NUMBER</span> <span className="f1-a-accent">{number}</span>
          </span>
          <span>
            <span className="f1-a-muted">CODE</span> <span className="f1-a-accent">{code}</span>
          </span>
        </div>
      </Panel>

      {/* Season summary */}
      <Panel label={`${s.year} season`}>
        <div className="dd-kvs">
          <Kv label="POSITION" value={`P${s.position}`} className="dd-pos" />
          <Kv label="POINTS" value={s.points} />
          <Kv label="WINS" value={s.wins} />
          <Kv label="PODIUMS" value={s.podiums} />
          <Kv label="POLES" value={s.poles} />
          <Kv label="FASTEST LAPS" value={s.fastestLaps} />
          <Kv label="DNFS" value={s.dnfs} />
          <Kv label="STARTS" value={s.racesEntered} />
          <Kv label="AVG FINISH" value={hasRaces ? s.avgFinish : "—"} />
          <Kv label="AVG GRID" value={s.gridRaces > 0 ? s.avgGrid : "—"} />
          <Kv label="PPR" value={hasRaces ? s.ppr.toFixed(1) : "—"} />
          {hasRaces && (
            <Kv
              label="POSITIONS GAINED"
              value={
                <>
                  <span className={s.positionsGained >= 0 ? "dd-gain" : "dd-gain dd-pos-neg"}>
                    {signed(s.positionsGained)}
                  </span>{" "}
                  <span className="dd-v-sub">
                    avg {s.gridRaces > 0 ? `${gainedAvg >= 0 ? "+" : ""}${gainedAvg.toFixed(1)}` : "0"} / race
                  </span>
                </>
              }
            />
          )}
          {hasRaces && (
            <Kv
              label="FRONT ROW STARTS"
              value={
                <>
                  {s.frontRowStarts} <span className="dd-v-sub">P1/P2</span>
                </>
              }
            />
          )}
        </div>

        {hasRaces && (
          <>
            <div className="dd-bar-row">
              <div className="f1-a-muted">IN POINTS · {s.pointsRate}% · {s.pointsFinishes} of {s.racesEntered} races</div>
              <Bar frac={s.pointsRate / 100} color="var(--color-f1-accent)" />
            </div>
            {s.poleConversion !== null && (
              <div className="dd-bar-row">
                <div className="f1-a-muted">
                  POLE CONVERSION · {s.poleConversion}% · {s.poleToWins} wins from {s.poleCount} poles
                </div>
                <Bar frac={s.poleConversion / 100} color="var(--color-f1-accent)" />
              </div>
            )}
          </>
        )}

        {form.length > 0 && (
          <div className="dd-bar-row">
            <span className="f1-a-muted">RECENT FORM</span>{" "}
            <span className="dd-form" style={{ color: teamColor }}>
              {spark(form.map((f) => (f.isDNF ? 21 : f.pos)))}
            </span>
            <div className="f1-a-muted">
              {form.map((f) => `R${f.round}`).join(" ")} (last {form.length})
            </div>
          </div>
        )}
      </Panel>

      {/* Career */}
      <Panel label="Career summary">
        <div className="dd-kvs">
          <Kv label="RACES" value={c.races} />
          <Kv label="WINS" value={c.wins} />
          <Kv label="PODIUMS" value={c.podiums} />
          <Kv label="POLES" value={c.poles} />
          <Kv label="FASTEST LAPS" value={c.fastestLaps} />
        </div>
        <p className="f1-a-muted f1-a-mt">Based on available seasons ({c.span})</p>
      </Panel>

      {/* Teammate head-to-head */}
      {h2h && (
        <Panel label="vs Teammate">
          <p className="f1-a-muted" style={{ marginBottom: 10 }}>
            Head-to-head this season vs <span className="f1-a-accent">{h2h.teammateName}</span>
          </p>
          {[
            { label: "RACE", mine: h2h.raceWins, theirs: h2h.tmRaceWins },
            { label: "QUALIFYING", mine: h2h.qualWins, theirs: h2h.tmQualWins },
          ].map(({ label, mine, theirs }) => {
            const total = mine + theirs;
            const frac = total > 0 ? mine / total : 0.5;
            return (
              <div key={label} className="dd-h2h">
                <div className="dd-h2h-line">
                  <span style={{ color: teamColor }}>{mine}</span>
                  <span className="f1-a-muted">{label}</span>
                  <span>{theirs}</span>
                </div>
                <Bar frac={frac} color={teamColor} />
              </div>
            );
          })}
        </Panel>
      )}

      {/* Season results */}
      <Panel label={`${s.year} race results`}>
        {results.length === 0 ? (
          <p className="f1-a-muted">No results yet this season.</p>
        ) : (
          <div className="dd-table">
            <div className="dd-row dd-head">
              <span className="dd-rd">RD</span>
              <span>RACE</span>
              <span className="dd-c">GRID</span>
              <span className="dd-c">FIN</span>
              <span className="dd-c dd-hide-m">+/-</span>
              <span className="dd-c">PTS</span>
              <span className="dd-hide-m">STATUS</span>
              <span className="dd-hide-m">FL</span>
            </div>
            {results.map((r) => {
              const isDNF = isDNFStatus(r.status);
              const isWin = r.position === "1";
              const isPodium = parseInt(r.position) <= 3;
              const g = parseInt(r.grid);
              const p = parseInt(r.position);
              const diff = g - p;
              const gridLabel = r.grid === "0" ? "PL" : `P${r.grid}`;
              const finLabel = isDNF ? "DNF" : `P${r.position}`;
              const finClass = isWin ? "dd-win" : isDNF ? "dd-dnf" : isPodium ? "" : "f1-a-muted";
              return (
                <Link key={r.round} href={`/race/${r.round}`} className="dd-row">
                  <span className="dd-rd">{r.round}</span>
                  <span className="dd-race">
                    {r.raceName}
                    <span className="dd-sub">
                      {r.country} · {r.dateLabel}
                    </span>
                  </span>
                  <span className="dd-c">{gridLabel}</span>
                  <span className={`dd-c ${finClass}`}>{finLabel}</span>
                  <span className="dd-c dd-hide-m">
                    {g <= 0 || isDNF ? (
                      <span className="f1-a-muted">—</span>
                    ) : (
                      <span className={diff > 0 ? "dd-gain" : diff < 0 ? "dd-gain dd-pos-neg" : "f1-a-muted"}>
                        {signed(diff)}
                      </span>
                    )}
                  </span>
                  <span className="dd-c dd-v">{r.points}</span>
                  <span className="dd-status dd-hide-m">{r.status}</span>
                  <span className="dd-hide-m">{r.hasFastestLap && <span className="dd-fl">FL</span>}</span>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>

      <p className="f1-a-muted" style={{ textAlign: "right" }}>
        <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="f1-a-accent">
          Wikipedia &gt;
        </a>
      </p>
    </div>
  );
}
