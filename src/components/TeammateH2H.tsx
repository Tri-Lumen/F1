import type { DriverStanding, Race } from "@/lib/types";
import { getTeamColor, getCountryFlag } from "@/lib/api";

interface H2H {
  constructorId: string;
  name: string;
  color: string;
  driverA: DriverStanding;
  driverB: DriverStanding;
  race: [number, number];   // [A wins, B wins]
  qual: [number, number];   // [A better grid, B better grid]
}

function computeH2H(drivers: DriverStanding[], races: Race[]): H2H[] {
  const byTeam = new Map<string, DriverStanding[]>();
  for (const d of drivers) {
    const id = d.Constructors[0]?.constructorId;
    if (!id) continue;
    const arr = byTeam.get(id) ?? [];
    arr.push(d);
    byTeam.set(id, arr);
  }

  const result: H2H[] = [];

  for (const [cid, pair] of byTeam) {
    if (pair.length !== 2) continue;
    const [a, b] = pair;
    const race: [number, number] = [0, 0];
    const qual: [number, number] = [0, 0];

    for (const r of races) {
      const rA = (r.Results ?? []).find(
        (x) => x.Driver.driverId === a.Driver.driverId
      );
      const rB = (r.Results ?? []).find(
        (x) => x.Driver.driverId === b.Driver.driverId
      );
      if (!rA || !rB) continue;

      // Race H2H: count classified finishes; treat DNF as a loss vs a finisher
      const posA = parseInt(rA.position);
      const posB = parseInt(rB.position);
      const finA = rA.status === "Finished" || rA.status.startsWith("+");
      const finB = rB.status === "Finished" || rB.status.startsWith("+");
      if (finA && finB) {
        if (posA < posB) race[0]++; else if (posB < posA) race[1]++;
      } else if (finA) {
        race[0]++;
      } else if (finB) {
        race[1]++;
      }

      // Qualifying H2H via grid position (skips pit-lane starts: grid === 0)
      const gA = parseInt(rA.grid);
      const gB = parseInt(rB.grid);
      if (gA > 0 && gB > 0) {
        if (gA < gB) qual[0]++; else if (gB < gA) qual[1]++;
      }
    }

    result.push({
      constructorId: cid,
      name: a.Constructors[0]?.name ?? cid,
      color: getTeamColor(cid),
      driverA: a,
      driverB: b,
      race,
      qual,
    });
  }

  return result;
}

/** Horizontal split bar showing A vs B ratio. */
function SplitBar({
  scoreA,
  scoreB,
  color,
  label,
}: {
  scoreA: number;
  scoreB: number;
  color: string;
  label: string;
}) {
  const total = scoreA + scoreB;
  const pctA = total > 0 ? (scoreA / total) * 100 : 50;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-bold">{scoreA}</span>
        <span className="text-xs text-f1-text-muted">{label}</span>
        <span className="text-xs font-mono font-bold">{scoreB}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex bg-f1-dark">
        <div
          className="h-full transition-all"
          style={{ width: `${pctA}%`, backgroundColor: color, opacity: 0.85 }}
        />
        <div
          className="h-full flex-1"
          style={{ backgroundColor: color, opacity: 0.22 }}
        />
      </div>
    </div>
  );
}

export default function TeammateH2H({
  driverStandings,
  allRaces,
}: {
  driverStandings: DriverStanding[];
  allRaces: Race[];
}) {
  const data = computeH2H(driverStandings, allRaces);
  if (data.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-1 text-lg font-bold">Teammate Head-to-Head</h2>
      <p className="mb-4 text-sm text-f1-text-muted">
        Season record between teammates &mdash; race finishes and qualifying grid positions
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((h) => {
          const { driverA: a, driverB: b } = h;
          const ptA = parseFloat(a.points);
          const ptB = parseFloat(b.points);
          const leader = ptA > ptB ? a : ptB > ptA ? b : null;
          const ptGap = Math.abs(ptA - ptB);

          return (
            <div
              key={h.constructorId}
              className="rounded-xl border border-f1-border bg-f1-card overflow-hidden"
            >
              {/* Team colour strip */}
              <div className="h-1" style={{ backgroundColor: h.color }} />

              <div className="px-4 pt-3 pb-4">
                {/* Team name */}
                <p className="text-xs font-bold uppercase tracking-wider text-f1-text-muted mb-3">
                  {h.name}
                </p>

                {/* Driver nameplates */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xl font-black" style={{ color: h.color }}>
                      {a.Driver.code}
                    </p>
                    <p className="text-xs text-f1-text-muted">
                      {getCountryFlag(a.Driver.nationality)} {ptA} pts
                    </p>
                  </div>

                  <div className="text-center">
                    {leader && ptGap > 0 ? (
                      <>
                        <p className="text-[10px] text-f1-text-muted font-semibold">
                          points gap
                        </p>
                        <p
                          className="text-sm font-black"
                          style={{ color: h.color }}
                        >
                          {leader.Driver.code} +{ptGap.toFixed(0)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-f1-text-muted font-semibold">
                        equal
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black" style={{ color: h.color }}>
                      {b.Driver.code}
                    </p>
                    <p className="text-xs text-f1-text-muted">
                      {ptB} pts {getCountryFlag(b.Driver.nationality)}
                    </p>
                  </div>
                </div>

                {/* H2H bars */}
                <div className="space-y-2.5">
                  <SplitBar
                    scoreA={h.race[0]}
                    scoreB={h.race[1]}
                    color={h.color}
                    label="Race"
                  />
                  <SplitBar
                    scoreA={h.qual[0]}
                    scoreB={h.qual[1]}
                    color={h.color}
                    label="Qualifying"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
