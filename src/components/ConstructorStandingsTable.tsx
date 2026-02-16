import Link from "next/link";
import type { ConstructorStanding } from "@/lib/types";
import { getTeamColor } from "@/lib/api";

export default function ConstructorStandingsTable({
  standings,
  limit,
}: {
  standings: ConstructorStanding[];
  limit?: number;
}) {
  const data = limit ? standings.slice(0, limit) : standings;
  const leader = data[0] ? parseFloat(data[0].points) : 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-f1-border text-left text-xs uppercase tracking-wider text-f1-text-muted">
            <th className="px-3 py-3 w-12">Pos</th>
            <th className="px-3 py-3">Team</th>
            <th className="px-3 py-3 text-center">Wins</th>
            <th className="px-3 py-3 text-right">Points</th>
            <th className="px-3 py-3 text-right hidden md:table-cell w-56">
              Gap
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => {
            const teamColor = getTeamColor(s.Constructor.constructorId);
            const gap = leader - parseFloat(s.points);
            const barWidth =
              leader > 0
                ? (parseFloat(s.points) / leader) * 100
                : 0;

            return (
              <tr
                key={s.Constructor.constructorId}
                className="border-b border-f1-border/50 transition-colors hover:bg-f1-card/50"
              >
                <td className="px-3 py-3 font-bold text-f1-text-muted">
                  {s.position}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/teams#${s.Constructor.constructorId}`}
                    className="flex items-center gap-2 hover:text-f1-red transition-colors"
                  >
                    <span
                      className="h-8 w-1.5 rounded-full"
                      style={{ backgroundColor: teamColor }}
                    />
                    <span className="font-bold">{s.Constructor.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">{s.wins}</td>
                <td className="px-3 py-3 text-right font-bold text-lg">
                  {s.points}
                </td>
                <td className="px-3 py-3 text-right hidden md:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-f1-text-muted w-14 text-right">
                      {gap > 0 ? `-${gap}` : "LEADER"}
                    </span>
                    <div className="w-36 h-3 rounded-full bg-f1-dark overflow-hidden">
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
