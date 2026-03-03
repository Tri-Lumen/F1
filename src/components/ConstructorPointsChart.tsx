interface Race {
  round: string;
  Results?: Array<{
    Constructor: { constructorId: string; name: string };
    points: string;
  }>;
}

interface ConstructorStanding {
  position: string;
  points: string;
  Constructor: { constructorId: string; name: string };
}

interface Props {
  completedRaces: Race[];
  constructorStandings: ConstructorStanding[];
  topN?: number;
  getTeamColor: (constructorId: string) => string;
}

export default function ConstructorPointsChart({
  completedRaces,
  constructorStandings,
  topN = 10,
  getTeamColor,
}: Props) {
  if (completedRaces.length === 0) return null;

  const topTeams = constructorStandings.slice(0, topN);

  // Build cumulative points per constructor per race
  const cumulativePoints: Record<string, number[]> = {};
  for (const t of topTeams) cumulativePoints[t.Constructor.constructorId] = [];

  const runningTotals: Record<string, number> = {};
  for (const t of topTeams) runningTotals[t.Constructor.constructorId] = 0;

  for (const race of completedRaces) {
    for (const t of topTeams) {
      const cid = t.Constructor.constructorId;
      const teamResults = (race.Results ?? []).filter(
        (r) => r.Constructor.constructorId === cid
      );
      const earned = teamResults.reduce((s, r) => s + parseFloat(r.points), 0);
      runningTotals[cid] = (runningTotals[cid] ?? 0) + earned;
      cumulativePoints[cid].push(runningTotals[cid]);
    }
  }

  // Chart dimensions
  const W = 800;
  const H = 220;
  const PAD = { top: 12, right: 16, bottom: 32, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const numRaces = completedRaces.length;
  const maxPoints = Math.max(
    ...Object.values(cumulativePoints).map((arr) => arr[arr.length - 1] ?? 0),
    1
  );
  const yMax = Math.ceil(maxPoints / 50) * 50 || 50;

  const xOf = (i: number) =>
    PAD.left + (numRaces === 1 ? chartW / 2 : (i / (numRaces - 1)) * chartW);
  const yOf = (pts: number) =>
    PAD.top + chartH - (pts / yMax) * chartH;

  const yTicks: number[] = [];
  const step = yMax <= 200 ? 50 : yMax <= 500 ? 100 : 200;
  for (let v = 0; v <= yMax; v += step) yTicks.push(v);

  const xLabelEvery = numRaces <= 10 ? 1 : 5;

  return (
    <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
      <div className="border-b border-f1-border px-5 py-4">
        <h2 className="font-bold text-lg">Constructor Points Progression</h2>
        <p className="text-xs text-f1-text-muted mt-0.5">
          Cumulative championship points — all {topTeams.length} constructors
        </p>
      </div>

      <div className="p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "auto" }}
          aria-hidden="true"
        >
          {/* Gridlines */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                y1={yOf(v)}
                x2={W - PAD.right}
                y2={yOf(v)}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={yOf(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="9"
                fill="currentColor"
                fillOpacity="0.4"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X-axis round labels */}
          {completedRaces.map((race, i) => {
            if (i % xLabelEvery !== 0 && i !== numRaces - 1) return null;
            return (
              <text
                key={i}
                x={xOf(i)}
                y={H - PAD.bottom + 14}
                textAnchor="middle"
                fontSize="9"
                fill="currentColor"
                fillOpacity="0.4"
              >
                R{race.round}
              </text>
            );
          })}

          {/* Constructor lines */}
          {topTeams.map((t) => {
            const cid = t.Constructor.constructorId;
            const pts = cumulativePoints[cid];
            if (!pts || pts.length === 0) return null;
            const color = getTeamColor(cid);

            const pathD = pts
              .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)},${yOf(p).toFixed(1)}`)
              .join(" ");

            // Abbreviate team name for label
            const label = t.Constructor.name.split(" ").at(-1) ?? t.Constructor.name;

            return (
              <g key={cid}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {pts.map((p, i) => (
                  <circle key={i} cx={xOf(i)} cy={yOf(p)} r="3" fill={color} fillOpacity="0.85" />
                ))}
                <text
                  x={xOf(pts.length - 1) + 5}
                  y={yOf(pts[pts.length - 1])}
                  dominantBaseline="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill={color}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-4">
        {topTeams.map((t) => {
          const cid = t.Constructor.constructorId;
          const color = getTeamColor(cid);
          const pts = cumulativePoints[cid];
          const latest = pts?.[pts.length - 1] ?? 0;
          return (
            <div key={cid} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-f1-text-muted">{t.Constructor.name}</span>
              <span className="text-xs font-bold">{latest}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
