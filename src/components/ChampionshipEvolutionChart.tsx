"use client";

import { useState } from "react";
import { getTeamColor } from "@/lib/api";

export interface EvolutionSeries {
  driverId: string;
  name: string;
  constructorId: string;
  /** Cumulative points after each round in `rounds`, same length/order. */
  points: number[];
}

interface Props {
  /** Sorted by final points descending — index 0 is the championship leader. */
  evolution: EvolutionSeries[];
  rounds: { round: string; raceName: string }[];
}

const BC = "'Barlow Condensed', sans-serif";

/**
 * Renders the season's cumulative-points-per-round series two ways from the
 * same underlying data: absolute points (view=points) or points deficit to
 * the championship leader (view=gap, formerly the standalone /gap page).
 * A collapsible table below gives the exact per-round numbers for both views
 * without permanently taking up page space.
 */
export default function ChampionshipEvolutionChart({ evolution, rounds }: Props) {
  const [view, setView] = useState<"points" | "gap">("points");
  const [showTable, setShowTable] = useState(false);

  const numRounds = rounds.length;
  const leader = evolution[0];
  const leaderColor = leader ? getTeamColor(leader.constructorId) : "var(--color-f1-accent)";

  // Gap view drops the leader's own (always-zero) line and instead draws it
  // as the horizontal reference at y=0.
  const gapSeries = evolution.slice(1).map((d) => ({
    ...d,
    gap: d.points.map((p, i) => (leader?.points[i] ?? 0) - p),
  }));

  const W = 800;
  const H = 220;
  const PAD = { top: 16, right: 24, bottom: 32, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const xScale = (i: number) => PAD.left + (i / Math.max(numRounds - 1, 1)) * chartW;

  const maxPts = Math.max(...evolution.map((d) => d.points.at(-1) ?? 0), 1);
  const maxGap = Math.max(...gapSeries.flatMap((s) => s.gap), 1);

  const pointsYScale = (pts: number) => PAD.top + chartH - (pts / maxPts) * chartH;
  const gapYScale = (gap: number) => PAD.top + (gap / maxGap) * chartH;

  const yTicks =
    view === "points"
      ? [0, 0.25, 0.5, 0.75, 1].map((frac) => Math.round(maxPts * frac))
      : (() => {
          const step = maxGap <= 50 ? 10 : maxGap <= 150 ? 25 : maxGap <= 300 ? 50 : 100;
          return Array.from({ length: Math.floor(maxGap / step) + 1 }, (_, i) => i * step);
        })();

  return (
    <div className="rounded-xl border border-[#1c1c1c] bg-[#131313] overflow-hidden scroll-mt-16" id="evolution">
      <div className="border-b border-[#1c1c1c] p-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base" style={{ fontFamily: BC, fontWeight: 800, letterSpacing: "0.04em" }}>
            Championship Evolution
          </h2>
          <p className="text-xs text-f1-text-muted mt-0.5">
            {view === "points"
              ? "Cumulative points for top drivers after each round"
              : `Points deficit to ${leader?.name ?? "the leader"} after each round`}
          </p>
        </div>
        <div className="flex rounded-lg border border-f1-border bg-f1-dark p-0.5 text-xs font-semibold">
          {(["points", "gap"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 transition-colors ${
                view === v ? "bg-f1-accent/15 text-f1-accent" : "text-f1-text-muted hover:text-f1-text"
              }`}
            >
              {v === "points" ? "Points" : "Gap to Leader"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
          {/* Grid lines + y labels */}
          {yTicks.map((v) => {
            const y = view === "points" ? pointsYScale(v) : gapYScale(v);
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={view === "gap" && v === 0 ? 0.2 : 0.08}
                  strokeWidth={view === "gap" && v === 0 ? 2 : 1}
                />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={view === "points" ? 10 : 9} fill="currentColor" opacity={0.4}>
                  {view === "points" ? v : `–${v}`}
                </text>
              </g>
            );
          })}

          {/* Round labels on x-axis */}
          {rounds.map((r, i) => {
            if (i % Math.max(1, Math.floor(numRounds / 8)) !== 0) return null;
            return (
              <text key={r.round} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.35}>
                R{r.round}
              </text>
            );
          })}

          {view === "points" ? (
            <>
              {evolution.map((driver) => {
                const color = getTeamColor(driver.constructorId);
                const points = driver.points.map((pts, i) => ({ x: xScale(i), y: pointsYScale(pts) }));
                const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                const last = points.at(-1)!;
                const shortName = driver.name.split(" ").pop() ?? driver.name;
                return (
                  <g key={driver.driverId}>
                    <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                    <text x={last.x + 4} y={last.y + 4} fontSize={9} fill={color} fontWeight="bold">
                      {shortName}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              <line x1={PAD.left} x2={xScale(numRounds - 1)} y1={PAD.top} y2={PAD.top} stroke={leaderColor} strokeWidth={2.5} strokeOpacity={0.8} />
              <text x={xScale(numRounds - 1) + 5} y={PAD.top + 4} fontSize={8} fill={leaderColor} fontWeight="bold">
                {leader?.name.split(" ").pop()}
              </text>
              {gapSeries.map((driver) => {
                const color = getTeamColor(driver.constructorId);
                const points = driver.gap.map((g, i) => ({ x: xScale(i), y: gapYScale(g) }));
                const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                const last = points.at(-1)!;
                const shortName = driver.name.split(" ").pop() ?? driver.name;
                return (
                  <g key={driver.driverId}>
                    <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                    {points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} opacity={0.7} />
                    ))}
                    <text x={last.x + 4} y={last.y + 4} fontSize={8} fill={color} fontWeight="bold">
                      {shortName}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap gap-3">
          {evolution.map((d) => {
            const color = getTeamColor(d.constructorId);
            const shortName = d.name.split(" ").pop() ?? d.name;
            const value = view === "points" ? d.points.at(-1) : (d.points.at(-1) ?? 0) === (leader?.points.at(-1) ?? 0) ? 0 : (leader?.points.at(-1) ?? 0) - (d.points.at(-1) ?? 0);
            return (
              <div key={d.driverId} className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full inline-block" style={{ backgroundColor: color }} />
                <span className="text-xs text-f1-text-muted">{shortName}</span>
                <span className="text-xs font-bold" style={{ color }}>
                  {view === "gap" && value !== 0 ? `–${value}` : value}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowTable((s) => !s)}
          className="mt-3 text-xs font-semibold text-f1-accent hover:underline"
        >
          {showTable ? "Hide round-by-round table" : "Show round-by-round table"}
        </button>

        {showTable && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-f1-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                  <th className="px-3 py-2">Round</th>
                  <th className="px-3 py-2">Race</th>
                  {evolution.map((d) => (
                    <th key={d.driverId} className="px-3 py-2 text-right">
                      {d.name.split(" ").pop()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rounds.map((r, roundIdx) => {
                  const leaderPtsAtRound = leader?.points[roundIdx] ?? 0;
                  return (
                    <tr key={r.round} className="border-b border-f1-border/40 hover:bg-f1-dark/20">
                      <td className="px-3 py-2 text-f1-text-muted font-mono text-xs">R{r.round}</td>
                      <td className="px-3 py-2 text-xs">{r.raceName.replace(" Grand Prix", " GP")}</td>
                      {evolution.map((d, i) => {
                        const ptsAtRound = d.points[roundIdx] ?? 0;
                        const gap = i === 0 ? null : leaderPtsAtRound - ptsAtRound;
                        return (
                          <td key={d.driverId} className="px-3 py-2 text-right font-bold">
                            {view === "points" || i === 0
                              ? ptsAtRound
                              : gap !== null
                              ? <span className="text-f1-text-muted">–{gap}</span>
                              : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
