import type { DriverStanding } from "@/lib/types";
import { getCurrentYear, getTeamColor } from "@/lib/api";
import { getDriverConstructorName } from "@/lib/driverOverrides";
import { AsciiHeader, Bar, Panel, Swatch } from "@/components/ascii/kit";
import "@/app/ascii/compare.css";

/*
 * Terminal-grid version of the Head-to-Head page. Rendered by CompareClient alongside the
 * standard markup and shown only under html[data-style="ascii"] (.f1-ascii-dash). The
 * selection state and every number come from CompareClient; this file only lays them out.
 * Chart sections (Points Progression, Qualifying Gap) are intentionally omitted here.
 */

export interface CompareStats {
  position: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  bestFinish: number;
  avgFinish: number;
  avgGrid: number;
  pointsPerRace: number;
  totalPositionsGained: number;
}

export interface CompareH2HRow {
  round: string;
  raceName: string;
  a: { position: number; grid: number; points: number };
  b: { position: number; grid: number; points: number };
}

export interface CompareTeammatePair {
  teamId: string;
  driverA: string;
  driverB: string;
  nameA: string;
  nameB: string;
}

export interface CompareViewProps {
  standings: DriverStanding[];
  driverA: string;
  driverB: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
  onPickPair: (a: string, b: string) => void;
  teammatePairs: CompareTeammatePair[];
  standingA?: DriverStanding;
  standingB?: DriverStanding;
  statsA: CompareStats | null;
  statsB: CompareStats | null;
  teamColorA: string;
  teamColorB: string;
  h2hResults: CompareH2HRow[];
  h2hWinsA: number;
  h2hWinsB: number;
  h2hQualA: number;
  h2hQualB: number;
}

const RULE = "var(--ascii-rule)";

/** One stat: values above, then one proportional bar per driver (winner gets team colour). */
function StatRow({
  label,
  a,
  b,
  colorA,
  colorB,
  higherIsBetter = true,
  format = (v: number) => String(v),
}: {
  label: string;
  a: number;
  b: number;
  colorA: string;
  colorB: string;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
}) {
  const max = Math.max(a, b, 1);
  const tie = a === b;
  const aWins = (higherIsBetter ? a > b : a < b) && !tie;
  const bWins = (higherIsBetter ? b > a : b < a) && !tie;

  return (
    <div className="f1-cmp-stat">
      <div className="f1-cmp-stat-head">
        <span className={`f1-cmp-val${aWins ? " f1-cmp-val-on" : ""}`}>{format(a)}</span>
        <span className="f1-a-muted f1-a-upper f1-cmp-stat-label">{label}</span>
        <span className={`f1-cmp-val f1-cmp-val-r${bWins ? " f1-cmp-val-on" : ""}`}>{format(b)}</span>
      </div>
      <div className="f1-cmp-bars">
        <Bar frac={a / max} color={aWins ? colorA : RULE} />
        <Bar frac={b / max} color={bWins ? colorB : RULE} />
      </div>
    </div>
  );
}

export default function CompareView({
  standings,
  driverA,
  driverB,
  onChangeA,
  onChangeB,
  onPickPair,
  teammatePairs,
  standingA,
  standingB,
  statsA,
  statsB,
  teamColorA,
  teamColorB,
  h2hResults,
  h2hWinsA,
  h2hWinsB,
  h2hQualA,
  h2hQualB,
}: CompareViewProps) {
  const codeA = standingA?.Driver.code ?? "";
  const codeB = standingB?.Driver.code ?? "";
  const driverPanel = (
    label: string,
    value: string,
    onChange: (id: string) => void,
    s: DriverStanding | undefined,
    color: string,
  ) => (
    <Panel label={label}>
      <select
        className="f1-cmp-select"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {standings.map((o) => (
          <option key={o.Driver.driverId} value={o.Driver.driverId}>
            {o.Driver.givenName} {o.Driver.familyName} ({getDriverConstructorName(o.Driver.driverId, o.Constructors[0]?.name)})
          </option>
        ))}
      </select>
      {s && (
        <div className="f1-cmp-pick-id">
          <Swatch color={color} />
          <div>
            <div className="f1-a-driver f1-a-upper">{s.Driver.familyName}</div>
            <div className="f1-a-muted">
              {getDriverConstructorName(s.Driver.driverId, s.Constructors[0]?.name)} · P{s.position} · {s.points} PTS
            </div>
          </div>
        </div>
      )}
    </Panel>
  );

  return (
    <div className="f1-ascii-dash f1-cmp">
      <AsciiHeader title="Head-to-Head" subtitle={`Compare any two ${getCurrentYear()} drivers side by side`} />

      {/* Teammate quick-select */}
      {teammatePairs.length > 0 && (
        <Panel label="Teammates">
          <div className="f1-cmp-pairs">
            {teammatePairs.map((pair) => {
              const isActive =
                (driverA === pair.driverA && driverB === pair.driverB) ||
                (driverA === pair.driverB && driverB === pair.driverA);
              return (
                <button
                  key={pair.teamId}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onPickPair(pair.driverA, pair.driverB)}
                  className={`f1-cmp-opt${isActive ? " f1-cmp-opt-on" : ""}`}
                >
                  <span style={{ color: getTeamColor(pair.teamId) }}>■</span>{" "}
                  {isActive ? "[x]" : "[ ]"} {pair.nameA.toUpperCase()} VS {pair.nameB.toUpperCase()}
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Driver selectors */}
      <div className="f1-a-two">
        {driverPanel("Driver 1", driverA, onChangeA, standingA, teamColorA)}
        {driverPanel("Driver 2", driverB, onChangeB, standingB, teamColorB)}
      </div>

      {statsA && statsB ? (
        <>
          {/* Season stats */}
          <Panel label="Season stats">
            <div className="f1-cmp-stat-head f1-cmp-stat-title">
              <span className="f1-a-driver" style={{ color: teamColorA }}>{codeA}</span>
              <span className="f1-a-muted f1-a-upper">Stat</span>
              <span className="f1-a-driver f1-cmp-val-r" style={{ color: teamColorB }}>{codeB}</span>
            </div>
            <StatRow label="Championship position" a={statsA.position} b={statsB.position} colorA={teamColorA} colorB={teamColorB} higherIsBetter={false} />
            <StatRow label="Points" a={statsA.points} b={statsB.points} colorA={teamColorA} colorB={teamColorB} />
            <StatRow label="Wins" a={statsA.wins} b={statsB.wins} colorA={teamColorA} colorB={teamColorB} />
            <StatRow label="Podiums" a={statsA.podiums} b={statsB.podiums} colorA={teamColorA} colorB={teamColorB} />
            <StatRow label="Grid P1s" a={statsA.poles} b={statsB.poles} colorA={teamColorA} colorB={teamColorB} />
            <StatRow label="Fastest laps" a={statsA.fastestLaps} b={statsB.fastestLaps} colorA={teamColorA} colorB={teamColorB} />
            <StatRow label="Avg finish" a={statsA.avgFinish} b={statsB.avgFinish} colorA={teamColorA} colorB={teamColorB} higherIsBetter={false} format={(v) => v.toFixed(1)} />
            <StatRow label="Avg grid" a={statsA.avgGrid} b={statsB.avgGrid} colorA={teamColorA} colorB={teamColorB} higherIsBetter={false} format={(v) => v.toFixed(1)} />
            <StatRow label="Points / race" a={statsA.pointsPerRace} b={statsB.pointsPerRace} colorA={teamColorA} colorB={teamColorB} format={(v) => v.toFixed(1)} />
            <StatRow label="DNFs" a={statsA.dnfs} b={statsB.dnfs} colorA={teamColorA} colorB={teamColorB} higherIsBetter={false} />
            <StatRow label="Positions gained" a={statsA.totalPositionsGained} b={statsB.totalPositionsGained} colorA={teamColorA} colorB={teamColorB} format={(v) => (v >= 0 ? `+${v}` : String(v))} />
            <StatRow label="Best finish" a={statsA.bestFinish} b={statsB.bestFinish} colorA={teamColorA} colorB={teamColorB} higherIsBetter={false} format={(v) => (v > 0 ? `P${v}` : "—")} />
          </Panel>

          {h2hResults.length > 0 && (
            <>
              {/* Head-to-head tallies */}
              <Panel label="Head-to-head">
                <StatRow label="Race finishes" a={h2hWinsA} b={h2hWinsB} colorA={teamColorA} colorB={teamColorB} />
                <StatRow label="Qualifying" a={h2hQualA} b={h2hQualB} colorA={teamColorA} colorB={teamColorB} />
              </Panel>

              {/* Race-by-race */}
              <Panel label="Race by race">
                <div className="f1-cmp-race">
                  <div className="f1-cmp-race-row f1-cmp-race-head f1-a-upper">
                    <span>Race</span>
                    <span className="f1-a-hide-s f1-a-r">Grid</span>
                    <span className="f1-a-r">{codeA}</span>
                    <span className="f1-a-hide-s f1-a-r">Grid</span>
                    <span className="f1-a-r">{codeB}</span>
                    <span className="f1-a-hide-s f1-a-r">{codeA} pts</span>
                    <span className="f1-a-hide-s f1-a-r">{codeB} pts</span>
                    <span className="f1-a-r">Result</span>
                  </div>
                  {h2hResults.map((r) => {
                    const aWon = r.a.position < r.b.position;
                    const bWon = r.b.position < r.a.position;
                    const bothQual = r.a.grid > 0 && r.b.grid > 0;
                    const aQualAhead = bothQual && r.a.grid < r.b.grid;
                    const bQualAhead = bothQual && r.b.grid < r.a.grid;
                    return (
                      <div className="f1-cmp-race-row" key={r.round}>
                        <span className="f1-a-muted f1-cmp-race-name">
                          R{r.round} {r.raceName.replace(" Grand Prix", "")}
                        </span>
                        <span className="f1-a-hide-s f1-a-r f1-a-muted">
                          {r.a.grid === 0 ? "PL" : `P${r.a.grid}`}
                          {aQualAhead && <span className="f1-cmp-up">▲</span>}
                        </span>
                        <span className={`f1-a-r f1-cmp-pos${aWon ? " f1-cmp-val-on" : ""}`}>P{r.a.position}</span>
                        <span className="f1-a-hide-s f1-a-r f1-a-muted">
                          {r.b.grid === 0 ? "PL" : `P${r.b.grid}`}
                          {bQualAhead && <span className="f1-cmp-up">▲</span>}
                        </span>
                        <span className={`f1-a-r f1-cmp-pos${bWon ? " f1-cmp-val-on" : ""}`}>P{r.b.position}</span>
                        <span className="f1-a-hide-s f1-a-r f1-a-muted">{r.a.points}</span>
                        <span className="f1-a-hide-s f1-a-r f1-a-muted">{r.b.points}</span>
                        <span className="f1-a-r f1-cmp-result">
                          {aWon && <span style={{ color: teamColorA }}>{codeA}</span>}
                          {bWon && <span style={{ color: teamColorB }}>{codeB}</span>}
                          {!aWon && !bWon && <span className="f1-a-muted">TIE</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </>
          )}
        </>
      ) : (
        <p className="f1-a-muted">Select two drivers to compare.</p>
      )}

    </div>
  );
}
