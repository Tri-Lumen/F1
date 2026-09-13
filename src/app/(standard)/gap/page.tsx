export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getAllSeasonResults,
  getDriverStandings,
  getTeamColor,
  getCountryFlag,
  getCurrentYear,
} from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";
import RefreshButton from "@/components/RefreshButton";

export const metadata: Metadata = {
  title: "Championship Gap — F1 2026",
  description: "Championship gap between P1, P2, and P3 evolving across every round",
};

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

async function GapContent() {
  const [allRaces, driverStandings] = await Promise.all([
    getAllSeasonResults(),
    getDriverStandings(),
  ]);

  const completedRaces = allRaces.filter((r) => (r.Results?.length ?? 0) > 0);

  if (completedRaces.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center">
        <p className="text-f1-text-muted">No race data available yet for {getCurrentYear()}.</p>
      </div>
    );
  }

  // Build cumulative points per driver after each round
  const cumulativePoints = new Map<string, number[]>();
  const runningTotals = new Map<string, number>();

  // Build driver info map for name/constructor lookups
  const driverInfo = new Map<string, { name: string; constructorId: string; nationality: string }>();
  for (const s of driverStandings) {
    const cid = getDriverConstructorId(s.Driver.driverId, s.Constructors[0]?.constructorId) ?? s.Constructors[0]?.constructorId ?? "";
    driverInfo.set(s.Driver.driverId, {
      name: `${s.Driver.givenName} ${s.Driver.familyName}`,
      constructorId: cid,
      nationality: s.Driver.nationality,
    });
  }

  for (const race of completedRaces) {
    // Add round points
    for (const r of race.Results ?? []) {
      const id = r.Driver.driverId;
      const pts = parseFloat(r.points);
      runningTotals.set(id, (runningTotals.get(id) ?? 0) + pts);
      if (!driverInfo.has(id)) {
        const cid = getDriverConstructorId(id, r.Constructor.constructorId) ?? r.Constructor.constructorId;
        driverInfo.set(id, { name: `${r.Driver.givenName} ${r.Driver.familyName}`, constructorId: cid, nationality: r.Driver.nationality });
      }
    }
    // Snapshot after this round
    for (const [id, pts] of runningTotals) {
      const arr = cumulativePoints.get(id) ?? [];
      arr.push(pts);
      cumulativePoints.set(id, arr);
    }
  }

  // Sort drivers by final points, take top 6
  const sortedDrivers = [...cumulativePoints.entries()]
    .sort((a, b) => (b[1].at(-1) ?? 0) - (a[1].at(-1) ?? 0))
    .slice(0, 6);

  // Pad shorter series (drivers who started mid-season)
  const numRounds = completedRaces.length;
  for (const [, pts] of sortedDrivers) {
    while (pts.length < numRounds) pts.unshift(0);
  }

  // Gap series: for each round, compute gap from P1
  const leaderPts = sortedDrivers.map(([, pts]) => pts);
  const gapSeries = sortedDrivers.slice(1).map(([id, pts]) => ({
    id,
    pts,
    gap: pts.map((p, i) => (leaderPts[0][i] ?? 0) - p),
  }));

  const leader = sortedDrivers[0];
  const leaderId = leader?.[0] ?? "";
  const leaderInfo = driverInfo.get(leaderId);
  const leaderColor = leaderInfo ? getTeamColor(leaderInfo.constructorId) : "var(--color-f1-accent)";

  // Chart: gap over rounds (y=0 is leader)
  const maxGap = Math.max(...gapSeries.flatMap((s) => s.gap), 1);
  const W = 800;
  const H = 240;
  const PAD = { top: 20, right: 80, bottom: 32, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (numRounds === 1 ? chartW / 2 : (i / (numRounds - 1)) * chartW);
  const yScale = (gap: number) => PAD.top + (gap / (maxGap || 1)) * chartH;

  // Y-axis ticks
  const yTickStep = maxGap <= 50 ? 10 : maxGap <= 150 ? 25 : maxGap <= 300 ? 50 : 100;
  const yTicks = Array.from({ length: Math.floor(maxGap / yTickStep) + 1 }, (_, i) => i * yTickStep);

  return (
    <div className="space-y-6">
      {/* KPI summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {sortedDrivers.slice(0, 4).map(([id, pts], i) => {
          const info = driverInfo.get(id);
          if (!info) return null;
          const color = getTeamColor(info.constructorId);
          const gap = i === 0 ? 0 : (leaderPts[0].at(-1) ?? 0) - (pts.at(-1) ?? 0);
          return (
            <div
              key={id}
              className="rounded-xl border bg-f1-card p-4"
              style={{ borderColor: `${color}40` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="h-4 w-1 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-bold uppercase tracking-wider text-f1-text-muted">P{i + 1}</span>
              </div>
              <p className="font-black text-lg" style={{ color }}>
                {getCountryFlag(info.nationality)} {info.name.split(" ").pop()?.toUpperCase()}
              </p>
              <p style={{ fontFamily: BC, fontWeight: 900, fontSize: 28, color, lineHeight: 1 }}>
                {pts.at(-1) ?? 0}
              </p>
              <p className="text-xs text-f1-text-muted mt-1">
                {i === 0 ? "Championship Leader" : `–${gap.toFixed(0)} pts behind`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Gap chart */}
      <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
        <div className="border-b border-f1-border p-4">
          <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: "0.04em" }}>
            Gap to Championship Leader
          </h2>
          <p className="text-xs text-f1-text-muted mt-0.5">
            Points deficit to {leaderInfo?.name ?? "leader"} after each round — zero line is the leader
          </p>
        </div>
        <div className="p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 260 }}>
            {/* Grid lines + y labels */}
            {yTicks.map((v) => {
              const y = yScale(v);
              return (
                <g key={v}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" strokeOpacity={v === 0 ? 0.2 : 0.06} strokeWidth={v === 0 ? 2 : 1} />
                  <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.4}>–{v}</text>
                </g>
              );
            })}

            {/* Leader zero line label */}
            <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize={9} fill={leaderColor} fontWeight="bold" opacity={0.8}>0</text>

            {/* X-axis round labels */}
            {completedRaces.map((race, i) => {
              if (numRounds > 12 && i % Math.ceil(numRounds / 10) !== 0 && i !== numRounds - 1) return null;
              return (
                <text key={race.round} x={xScale(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.35}>
                  R{race.round}
                </text>
              );
            })}

            {/* Leader horizontal line at 0 */}
            <line x1={PAD.left} x2={xScale(numRounds - 1)} y1={PAD.top} y2={PAD.top} stroke={leaderColor} strokeWidth={2.5} strokeOpacity={0.8} />
            <text x={xScale(numRounds - 1) + 5} y={PAD.top + 4} fontSize={8} fill={leaderColor} fontWeight="bold">
              {leaderInfo?.name.split(" ").pop()}
            </text>

            {/* Gap lines per driver */}
            {gapSeries.map(({ id, gap }) => {
              const info = driverInfo.get(id);
              if (!info) return null;
              const color = getTeamColor(info.constructorId);
              const points = gap.map((g, i) => ({ x: xScale(i), y: yScale(g) }));
              const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
              const last = points.at(-1)!;
              return (
                <g key={id}>
                  <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} opacity={0.7} />
                  ))}
                  <text x={last.x + 5} y={last.y + 4} fontSize={8} fill={color} fontWeight="bold">
                    {info.name.split(" ").pop()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-4 pb-4">
          {sortedDrivers.slice(0, 6).map(([id], i) => {
            const info = driverInfo.get(id);
            if (!info) return null;
            const color = getTeamColor(info.constructorId);
            return (
              <div key={id} className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                <span className="text-xs text-f1-text-muted">P{i + 1} {info.name.split(" ").pop()}</span>
                <span className="text-xs font-bold" style={{ color }}>{sortedDrivers[i][1].at(-1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gap table by round */}
      <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
        <div className="border-b border-f1-border p-4">
          <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: "0.04em" }}>
            Round-by-Round Gap Table
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
                <th className="px-3 py-2">Round</th>
                <th className="px-3 py-2">Race</th>
                {sortedDrivers.slice(0, 6).map(([id], i) => {
                  const info = driverInfo.get(id);
                  return (
                    <th key={id} className="px-3 py-2 text-right">
                      P{i + 1} {info?.name.split(" ").pop()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {completedRaces.map((race, roundIdx) => {
                const leaderPtsAtRound = sortedDrivers[0][1][roundIdx] ?? 0;
                return (
                  <tr key={race.round} className="border-b border-f1-border/40 hover:bg-f1-dark/20">
                    <td className="px-3 py-2 text-f1-text-muted font-mono text-xs">R{race.round}</td>
                    <td className="px-3 py-2 text-xs">{race.raceName.replace(" Grand Prix", " GP")}</td>
                    {sortedDrivers.slice(0, 6).map(([id, pts], i) => {
                      const info = driverInfo.get(id);
                      const color = info ? getTeamColor(info.constructorId) : "#888";
                      const ptsAtRound = pts[roundIdx] ?? 0;
                      const gap = i === 0 ? null : leaderPtsAtRound - ptsAtRound;
                      return (
                        <td key={id} className="px-3 py-2 text-right font-bold" style={{ color: i === 0 ? color : undefined }}>
                          {i === 0 ? ptsAtRound : gap !== null ? <span className="text-f1-text-muted">–{gap}</span> : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function GapPage() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div style={{ fontFamily: BC, fontWeight: 900, fontSize: 28, letterSpacing: "0.02em", lineHeight: 1 }}>
            CHAMPIONSHIP GAP
          </div>
          <div style={{ fontFamily: DM, fontSize: 12, color: "#555", marginTop: 4 }}>
            {getCurrentYear()} Season · Points deficit to the leader after each round
          </div>
        </div>
        <RefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-f1-card animate-pulse" />
            ))}
          </div>
        }
      >
        <GapContent />
      </Suspense>
    </div>
  );
}
