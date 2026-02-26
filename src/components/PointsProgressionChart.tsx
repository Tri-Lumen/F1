interface Race {
  round: string;
  raceName: string;
  Results?: Array<{
    Driver: { driverId: string; code: string };
    Constructor: { constructorId: string };
    points: string;
  }>;
}

interface DriverStanding {
  position: string;
  Driver: { driverId: string; code: string; givenName: string; familyName: string };
  Constructors: Array<{ constructorId: string }>;
}

interface Props {
  completedRaces: Race[];
  driverStandings: DriverStanding[];
  /** How many top drivers to show (default 8) */
  topN?: number;
  getTeamColor: (constructorId: string) => string;
}

export default function PointsProgressionChart({
  completedRaces,
  driverStandings,
  topN = 8,
  getTeamColor,
}: Props) {
  if (completedRaces.length === 0) return null;

  const topDrivers = driverStandings.slice(0, topN);

  // Build cumulative points per driver per race
  const cumulativePoints: Record<string, number[]> = {};
  for (const d of topDrivers) {
    cumulativePoints[d.Driver.driverId] = [];
  }

  let runningTotals: Record<string, number> = {};
  for (const d of topDrivers) runningTotals[d.Driver.driverId] = 0;

  for (const race of completedRaces) {
    for (const d of topDrivers) {
      const result = (race.Results ?? []).find(
        (r) => r.Driver.driverId === d.Driver.driverId
      );
      if (result) runningTotals[d.Driver.driverId] += parseFloat(result.points);
      cumulativePoints[d.Driver.driverId].push(
        runningTotals[d.Driver.driverId]
      );
    }
  }

  // Chart dimensions
  const W = 800;
  const H = 220;
  const PAD = { top: 12, right: 16, bottom: 32, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const numRaces = completedRaces.length;
  const maxPoints = Math.max(
    ...Object.values(cumulativePoints).map((arr) => arr[arr.length - 1] ?? 0),
    1
  );
  // Round up to next nice number
  const yMax = Math.ceil(maxPoints / 50) * 50 || 50;

  const xOf = (raceIdx: number) =>
    PAD.left + (numRaces === 1 ? chartW / 2 : (raceIdx / (numRaces - 1)) * chartW);
  const yOf = (pts: number) =>
    PAD.top + chartH - (pts / yMax) * chartH;

  // Y-axis gridlines
  const yTicks: number[] = [];
  const step = yMax <= 100 ? 25 : yMax <= 300 ? 50 : 100;
  for (let v = 0; v <= yMax; v += step) yTicks.push(v);

  // X-axis labels: show every round if ≤10, else every 5
  const xLabelEvery = numRaces <= 10 ? 1 : 5;

  return (
    <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
      <div className="border-b border-f1-border px-5 py-4">
        <h2 className="font-bold text-lg">Points Progression</h2>
        <p className="text-xs text-f1-text-muted mt-0.5">
          Cumulative championship points — top {topDrivers.length} drivers
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

          {/* Driver lines */}
          {topDrivers.map((d) => {
            const pts = cumulativePoints[d.Driver.driverId];
            if (!pts || pts.length === 0) return null;
            const color = getTeamColor(d.Constructors[0]?.constructorId ?? "");

            const pathD = pts
              .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)},${yOf(p).toFixed(1)}`)
              .join(" ");

            return (
              <g key={d.Driver.driverId}>
                {/* Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots */}
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={xOf(i)}
                    cy={yOf(p)}
                    r="3"
                    fill={color}
                    fillOpacity="0.85"
                  />
                ))}
                {/* End label */}
                <text
                  x={xOf(pts.length - 1) + 5}
                  y={yOf(pts[pts.length - 1])}
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill={color}
                >
                  {d.Driver.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-4">
        {topDrivers.map((d) => {
          const color = getTeamColor(d.Constructors[0]?.constructorId ?? "");
          const pts = cumulativePoints[d.Driver.driverId];
          const latest = pts?.[pts.length - 1] ?? 0;
          return (
            <div key={d.Driver.driverId} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-0.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-f1-text-muted font-mono">
                {d.Driver.code}
              </span>
              <span className="text-xs font-bold">{latest}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
