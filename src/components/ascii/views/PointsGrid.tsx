import { Swatch } from "../kit";
import "@/app/ascii/points-grid.css";

/*
 * ASCII stand-in for the cumulative-points line charts (ChampionshipEvolutionChart,
 * PointsProgressionChart, ConstructorPointsChart). One row per series: a block-character
 * trend line scaled to the chart's maximum, then the cumulative total after each round.
 * Server-safe; the page passes plain numbers in. The wrapper scrolls sideways inside the
 * panel, so the page itself never scrolls horizontally.
 */

const SPARK = "▁▂▃▄▅▆▇█";

export interface PointsSeries {
  id: string;
  label: string;
  color: string;
  /** Cumulative points after each round, same order as `rounds`. */
  values: number[];
}

export interface PointsGridData {
  rounds: string[];
  series: PointsSeries[];
}

/** Cumulative values as block characters, scaled so `max` is the full block. */
export function sparkScaled(values: number[], max: number): string {
  const top = Math.max(max, 1);
  return values
    .map((v) => SPARK[Math.min(7, Math.max(0, Math.round((v / top) * 7)))])
    .join("");
}

export function PointsGrid({
  data,
  nameHeader = "NAME",
}: {
  data: PointsGridData;
  nameHeader?: string;
}) {
  const max = Math.max(1, ...data.series.flatMap((s) => s.values));

  return (
    <div className="f1-a-pg-wrap">
      <table className="f1-a-pg">
        <thead>
          <tr>
            <th scope="col" className="f1-a-pg-name">
              {nameHeader}
            </th>
            <th scope="col" className="f1-a-pg-trend">
              TREND
            </th>
            {data.rounds.map((r) => (
              <th scope="col" key={r}>
                R{r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.series.map((s) => (
            <tr key={s.id}>
              <th scope="row" className="f1-a-pg-name">
                <Swatch color={s.color} /> {s.label}
              </th>
              <td className="f1-a-pg-trend" style={{ color: s.color }} aria-hidden="true">
                {sparkScaled(s.values, max)}
              </td>
              {s.values.map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
