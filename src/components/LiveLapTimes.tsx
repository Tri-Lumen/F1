import type { LiveLap, LiveTimingDriver } from "@/lib/types";

function formatLapTime(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

function formatSector(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  return seconds.toFixed(3);
}

function formatSpeed(kph: number | null): string {
  if (kph == null) return "—";
  return `${Math.round(kph)} km/h`;
}

export default function LiveLapTimes({
  laps,
  drivers,
  latestPositions,
}: {
  laps: LiveLap[];
  drivers: LiveTimingDriver[];
  latestPositions: Map<number, number>;
}) {
  if (laps.length === 0 || drivers.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border p-4">
          <h3 className="font-bold text-lg">Lap Times</h3>
        </div>
        <div className="p-6 text-center text-sm text-f1-text-muted">
          No lap time data available yet
        </div>
      </div>
    );
  }

  // For each driver get their latest completed lap and their best lap this session
  const latestLapMap = new Map<number, LiveLap>();
  const bestLapMap = new Map<number, number>(); // driver_number -> best lap_duration

  for (const lap of laps) {
    if (lap.lap_duration == null || lap.is_pit_out_lap) continue;

    const prev = latestLapMap.get(lap.driver_number);
    if (!prev || lap.lap_number > prev.lap_number) {
      latestLapMap.set(lap.driver_number, lap);
    }
    const best = bestLapMap.get(lap.driver_number) ?? Infinity;
    if (lap.lap_duration < best) {
      bestLapMap.set(lap.driver_number, lap.lap_duration);
    }
  }

  // Find the overall fastest lap in the session
  let overallBest = Infinity;
  for (const best of bestLapMap.values()) {
    if (best < overallBest) overallBest = best;
  }

  // Sort drivers by current race position
  const sortedDrivers = [...drivers].sort((a, b) => {
    const posA = latestPositions.get(a.driver_number) ?? 99;
    const posB = latestPositions.get(b.driver_number) ?? 99;
    return posA - posB;
  });

  return (
    <div className="rounded-xl border border-f1-border bg-f1-card">
      <div className="border-b border-f1-border p-4 flex items-center justify-between">
        <h3 className="font-bold text-lg">Lap Times</h3>
        <p className="text-xs text-f1-text-muted">
          Best: {overallBest < Infinity ? formatLapTime(overallBest) : "—"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
              <th className="px-3 py-2 w-10">Pos</th>
              <th className="px-3 py-2">Driver</th>
              <th className="px-3 py-2 text-right">Last Lap</th>
              <th className="px-3 py-2 text-right hidden sm:table-cell">Best</th>
              <th className="px-3 py-2 text-right hidden md:table-cell">S1</th>
              <th className="px-3 py-2 text-right hidden md:table-cell">S2</th>
              <th className="px-3 py-2 text-right hidden md:table-cell">S3</th>
              <th className="px-3 py-2 text-right hidden lg:table-cell">Speed Trap</th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.map((driver) => {
              const latest = latestLapMap.get(driver.driver_number);
              const best = bestLapMap.get(driver.driver_number) ?? null;
              const pos = latestPositions.get(driver.driver_number);
              const isPersonalBest =
                latest?.lap_duration != null &&
                best != null &&
                latest.lap_duration === best;
              const isOverallBest =
                best != null && best === overallBest;

              return (
                <tr
                  key={driver.driver_number}
                  className={`border-b border-f1-border/40 transition-colors hover:bg-f1-dark/30 ${
                    isOverallBest ? "bg-purple-500/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-bold text-f1-text-muted text-xs">
                    {pos ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-1 rounded-full shrink-0"
                        style={{
                          backgroundColor: driver.team_colour
                            ? `#${driver.team_colour}`
                            : "#888",
                        }}
                      />
                      <span className="font-bold text-xs">{driver.name_acronym}</span>
                    </div>
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono text-xs font-bold ${
                      isPersonalBest
                        ? isOverallBest
                          ? "text-purple-400"
                          : "text-green-400"
                        : "text-f1-text-muted"
                    }`}
                  >
                    {formatLapTime(latest?.lap_duration ?? null)}
                    {latest?.lap_number != null && (
                      <span className="ml-1 text-[10px] text-f1-text-muted/60">
                        L{latest.lap_number}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono text-xs hidden sm:table-cell ${
                      isOverallBest ? "text-purple-400 font-bold" : "text-f1-text-muted"
                    }`}
                  >
                    {formatLapTime(best)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-f1-text-muted hidden md:table-cell">
                    {formatSector(latest?.duration_sector_1 ?? null)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-f1-text-muted hidden md:table-cell">
                    {formatSector(latest?.duration_sector_2 ?? null)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-f1-text-muted hidden md:table-cell">
                    {formatSector(latest?.duration_sector_3 ?? null)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-f1-text-muted hidden lg:table-cell">
                    {formatSpeed(latest?.st_speed ?? null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
