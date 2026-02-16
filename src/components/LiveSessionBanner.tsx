import { getLatestSession, getLiveDrivers, getLivePositions } from "@/lib/api";

export default async function LiveSessionBanner() {
  const session = await getLatestSession();
  if (!session) return null;

  const sessionEnd = new Date(session.date_end);
  const now = new Date();
  const isLive = now <= sessionEnd && now >= new Date(session.date_start);

  if (!isLive) return null;

  const [drivers, positions] = await Promise.all([
    getLiveDrivers(session.session_key),
    getLivePositions(session.session_key),
  ]);

  // Get latest position for each driver
  const latestPositions = new Map<number, number>();
  for (const p of positions) {
    latestPositions.set(p.driver_number, p.position);
  }

  // Sort drivers by position
  const sortedDrivers = [...drivers].sort((a, b) => {
    const posA = latestPositions.get(a.driver_number) ?? 99;
    const posB = latestPositions.get(b.driver_number) ?? 99;
    return posA - posB;
  });

  const top5 = sortedDrivers.slice(0, 5);

  return (
    <div className="mb-6 rounded-xl border border-f1-red/50 bg-gradient-to-r from-f1-red/10 to-f1-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-f1-red px-3 py-1 text-sm font-bold text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse-live" />
            LIVE
          </span>
          <div>
            <h2 className="font-bold">
              {session.country_name} &mdash; {session.session_name}
            </h2>
            <p className="text-sm text-f1-text-muted">
              {session.circuit_short_name}
            </p>
          </div>
        </div>
      </div>

      {top5.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {top5.map((d) => {
            const pos = latestPositions.get(d.driver_number);
            return (
              <div
                key={d.driver_number}
                className="flex items-center gap-2 rounded-lg bg-f1-dark/50 px-3 py-1.5 text-sm"
              >
                <span className="font-bold text-f1-text-muted">
                  P{pos}
                </span>
                <span
                  className="h-4 w-0.5 rounded-full"
                  style={{
                    backgroundColor: d.team_colour
                      ? `#${d.team_colour}`
                      : "#888",
                  }}
                />
                <span className="font-medium">{d.name_acronym}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
