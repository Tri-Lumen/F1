import type { DriverStanding, RaceResult } from "@/lib/types";
import { LocalDate } from "@/components/LocalDateTime";
import { AsciiHeader, Panel } from "../kit";
import "@/app/ascii/predictions.css";

/*
 * ASCII view of the Pick'em calendar. Rendered by PredictionsClient next to the standard
 * markup. It shows each round's status and the official pole, podium and fastest lap, all
 * derived from the same rounds and standings the standard cards use. The user's own picks
 * and scores live in localStorage and stay in the Standard style. Row styles live in
 * src/app/ascii/predictions.css.
 */

export interface PredictionsViewRound {
  round: string;
  raceName: string;
  raceDateISO: string;
  polePosition?: string;
  raceResults: RaceResult[] | null;
}

export interface PredictionsViewProps {
  year: string;
  rounds: PredictionsViewRound[];
  drivers: DriverStanding[];
}

const STATUS_LABEL = { SCORED: "SCORED", POLE_LOCKED: "POLE LOCKED", OPEN: "OPEN" } as const;

/** Same rule as modeFor() in PredictionsClient: results mean scored, a known pole means locked. */
function statusOf(r: PredictionsViewRound): keyof typeof STATUS_LABEL {
  if (r.raceResults && r.raceResults.length > 0) return "SCORED";
  if (r.polePosition) return "POLE_LOCKED";
  return "OPEN";
}

export default function PredictionsView({ year, rounds, drivers }: PredictionsViewProps) {
  const nameOf = (id: string | undefined) => {
    if (!id) return "—";
    const d = drivers.find((s) => s.Driver.driverId === id);
    return d ? d.Driver.familyName : id.replace(/_/g, " ");
  };
  const scored = rounds.filter((r) => statusOf(r) === "SCORED").length;

  return (
    <div className="f1-ascii-dash f1-ascii-preds">
      <AsciiHeader
        title="Pick'em"
        subtitle={`Predict pole, podium, and fastest lap. Scored locally against the official ${year} results.`}
      />

      {rounds.length === 0 && <p className="f1-a-muted">No races in the schedule yet.</p>}

      {rounds.length > 0 && (
        <Panel label={`Calendar · ${scored} scored · ${rounds.length} on calendar`}>
          <div className="f1-a-table">
            <div className="pd-row pd-head">
              <span className="pd-rd">RD</span>
              <span>RACE</span>
              <span className="pd-date-col">DATE</span>
              <span className="pd-wide">POLE</span>
              <span className="pd-wide">PODIUM</span>
              <span className="pd-wide">FL</span>
              <span>STATUS</span>
            </div>
            {rounds.map((r) => {
              const st = statusOf(r);
              const results = r.raceResults ?? [];
              const podium = [1, 2, 3].map((p) =>
                nameOf(results.find((x) => x.position === String(p))?.Driver.driverId),
              );
              const fl = results.find((x) => x.FastestLap?.rank === "1");
              const pole = st === "SCORED"
                ? nameOf(results.find((x) => x.grid === "1")?.Driver.driverId ?? r.polePosition)
                : nameOf(r.polePosition);
              return (
                <div key={r.round} className="pd-row">
                  <span className="pd-rd f1-a-muted">{r.round.padStart(2, "0")}</span>
                  <span className="pd-name">
                    {r.raceName.replace(" Grand Prix", " GP")}
                    <span className="pd-sub f1-a-muted">
                      <LocalDate iso={r.raceDateISO} />
                    </span>
                  </span>
                  <span className="pd-date-col f1-a-muted pd-num">
                    <LocalDate iso={r.raceDateISO} />
                  </span>
                  <span className="pd-wide pd-driver">{pole}</span>
                  <span className="pd-wide pd-driver">
                    {st === "SCORED" ? podium.join(" · ") : "—"}
                  </span>
                  <span className="pd-wide pd-driver">{st === "SCORED" ? nameOf(fl?.Driver.driverId) : "—"}</span>
                  <span className={st === "SCORED" ? "pd-status f1-a-accent" : "pd-status f1-a-muted"}>
                    {STATUS_LABEL[st]}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
