import type { LiveStint, LiveTimingDriver } from "@/lib/types";
import { COMPOUND_COLORS, COMPOUND_FALLBACK } from "@/lib/compounds";

function CompoundBadge({ compound }: { compound: string }) {
  const c = COMPOUND_COLORS[compound.toUpperCase()] ?? COMPOUND_FALLBACK;

  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${c.bg} text-xs font-black text-black`}
      title={compound}
    >
      {c.label}
    </span>
  );
}

export default function TireStrategy({
  stints,
  drivers,
  latestPositions,
}: {
  stints: LiveStint[];
  drivers: LiveTimingDriver[];
  latestPositions: Map<number, number>;
}) {
  // Group stints by driver
  const stintsByDriver = new Map<number, LiveStint[]>();
  for (const stint of stints) {
    const existing = stintsByDriver.get(stint.driver_number) ?? [];
    existing.push(stint);
    stintsByDriver.set(stint.driver_number, existing);
  }

  // Sort drivers by position
  const sortedDrivers = [...drivers].sort((a, b) => {
    const posA = latestPositions.get(a.driver_number) ?? 99;
    const posB = latestPositions.get(b.driver_number) ?? 99;
    return posA - posB;
  });

  if (stints.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card p-6 text-center">
        <p className="text-f1-text-muted text-sm">No tire data available yet</p>
      </div>
    );
  }

  // Find max lap for proportional width. For in-progress stints (no lap_end)
  // use the highest lap_start seen across all drivers as a proxy for the
  // current race lap — previously a magic `+5` could push bars past the
  // actual race distance on short sessions.
  const currentRaceLap = stints.reduce((m, s) => Math.max(m, s.lap_start), 0);
  const maxLap = Math.max(
    ...stints.map((s) => s.lap_end ?? currentRaceLap),
    1
  );

  return (
    <div className="rounded-xl border border-f1-border bg-f1-card">
      <div className="border-b border-f1-border p-4">
        <h3 className="font-bold text-lg">Tire Strategy</h3>
      </div>
      <div className="p-4 space-y-2">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-f1-text-muted">
          {Object.entries(COMPOUND_COLORS).map(([name, c]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${c.bg} text-[10px] font-black text-black`}
              >
                {c.label}
              </span>
              <span className="capitalize">{name.toLowerCase()}</span>
            </div>
          ))}
        </div>

        {/* Driver stints */}
        {sortedDrivers.map((driver) => {
          const driverStints = (
            stintsByDriver.get(driver.driver_number) ?? []
          ).sort((a, b) => a.stint_number - b.stint_number);
          const pos = latestPositions.get(driver.driver_number);

          if (driverStints.length === 0) return null;

          return (
            <div
              key={driver.driver_number}
              className="flex items-center gap-3 py-1"
            >
              {/* Position & driver */}
              <div className="flex items-center gap-2 w-24 shrink-0">
                <span className="text-xs font-bold text-f1-text-muted w-6 text-right">
                  P{pos}
                </span>
                <span
                  className="h-4 w-0.5 rounded-full"
                  style={{
                    backgroundColor: driver.team_colour
                      ? `#${driver.team_colour}`
                      : "#888",
                  }}
                />
                <span className="text-xs font-medium truncate">
                  {driver.name_acronym}
                </span>
              </div>

              {/* Stint bars */}
              <div className="flex-1 flex items-center gap-0.5 h-6">
                {driverStints.map((stint) => {
                  const start = stint.lap_start;
                  const end = stint.lap_end ?? maxLap;
                  const width = ((end - start) / maxLap) * 100;
                  const c =
                    COMPOUND_COLORS[stint.compound?.toUpperCase()] ??
                    COMPOUND_FALLBACK;
                  const laps = end - start + 1;
                  const totalAge = stint.tyre_age_at_start + laps;

                  return (
                    <div
                      key={stint.stint_number}
                      className={`${c.bgFaded} border ${c.border} rounded h-full flex items-center justify-center text-[10px] font-bold ${c.text} relative`}
                      style={{ width: `${Math.max(width, 4)}%` }}
                      title={`${stint.compound} | Laps ${start}-${end} | Age: ${totalAge}`}
                    >
                      {width > 8 && (
                        <span className="truncate px-1">
                          {c.label} {totalAge}L
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
