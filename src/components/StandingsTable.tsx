import Link from "next/link";
import type { DriverStanding } from "@/lib/types";
import { getTeamColor, getCountryFlag } from "@/lib/api";

function formDotColor(pos: number, isDnf: boolean): string {
  if (isDnf) return "#ef4444";
  if (pos === 1) return "#FFD700";
  if (pos === 2) return "#A8A9AD";
  if (pos === 3) return "#CD7F32";
  if (pos <= 10) return "#22c55e";
  return "#374151";
}

export default function StandingsTable({
  standings,
  limit,
  recentForm,
}: {
  standings: DriverStanding[];
  limit?: number;
  recentForm?: Map<string, { pos: number; status: string }[]>;
}) {
  const data = limit ? standings.slice(0, limit) : standings;
  const leader = data[0] ? parseFloat(data[0].points) : 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
            <th className="px-3 py-3 w-12">Pos</th>
            <th className="px-3 py-3">Driver</th>
            <th className="px-3 py-3 hidden sm:table-cell">Team</th>
            <th className="px-3 py-3 text-center">Wins</th>
            {recentForm && (
              <th className="px-3 py-3 text-center hidden lg:table-cell">Form</th>
            )}
            <th className="px-3 py-3 text-right">Points</th>
            <th className="px-3 py-3 text-right hidden md:table-cell w-48">
              Gap
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => {
            const teamColor = getTeamColor(
              s.Constructors[0]?.constructorId ?? ""
            );
            const gap = leader - parseFloat(s.points);
            const barWidth =
              leader > 0
                ? (parseFloat(s.points) / leader) * 100
                : 0;

            return (
              <tr
                key={s.Driver.driverId}
                className="border-b border-f1-border/50 transition-colors hover:bg-f1-card-hover"
              >
                <td className={`px-3 py-3 font-bold ${s.position === "1" ? "text-f1-accent" : "text-f1-text-muted"}`}>
                  {s.position}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/drivers#${s.Driver.driverId}`}
                    className="flex items-center gap-2 hover:text-f1-red transition-colors"
                  >
                    <span
                      className="h-8 w-1 rounded-full"
                      style={{ backgroundColor: teamColor }}
                    />
                    <div>
                      <span className="font-medium">
                        {getCountryFlag(s.Driver.nationality)}{" "}
                        {s.Driver.givenName}{" "}
                        <span className="font-bold uppercase">
                          {s.Driver.familyName}
                        </span>
                      </span>
                      <span className="ml-2 text-xs text-f1-text-muted sm:hidden">
                        {s.Constructors[0]?.name}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell text-f1-text-muted">
                  <Link
                    href={`/teams#${s.Constructors[0]?.constructorId}`}
                    className="hover:text-f1-red transition-colors"
                  >
                    {s.Constructors[0]?.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">{s.wins}</td>
                {recentForm && (
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {(recentForm.get(s.Driver.driverId) ?? []).map((r, i) => {
                        const isDnf = r.status !== "Finished" && !r.status.startsWith("+");
                        return (
                          <span
                            key={i}
                            title={isDnf ? "DNF" : `P${r.pos}`}
                            className="w-4 h-4 rounded-full inline-block"
                            style={{ backgroundColor: formDotColor(r.pos, isDnf) }}
                          />
                        );
                      })}
                    </div>
                  </td>
                )}
                <td className="px-3 py-3 text-right font-bold">
                  {s.points}
                </td>
                <td className="px-3 py-3 text-right hidden md:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`text-xs w-12 text-right font-semibold ${gap > 0 ? "text-f1-text-muted" : "text-f1-accent"}`}>
                      {gap > 0 ? `-${gap}` : "LEADER"}
                    </span>
                    <div className="w-28 h-2 rounded-full bg-f1-dark overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: teamColor,
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
