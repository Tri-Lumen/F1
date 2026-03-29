"use client";

import { useTheme } from "@/lib/ThemeContext";
import { CURRENT_TEAMS } from "@/lib/teamThemes";
import { getTeamColor } from "@/lib/api";

export default function TeamColorsSection() {
  const { teamColorOverrides, setTeamColorOverride } = useTheme();

  const hasAnyOverride = Object.keys(teamColorOverrides).length > 0;

  function resetAll() {
    for (const team of CURRENT_TEAMS) {
      setTeamColorOverride(team.constructorId, null);
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-bold">Team Colors</h2>
        {hasAnyOverride && (
          <button
            onClick={resetAll}
            className="text-xs text-f1-text-muted hover:text-f1-text transition-colors border border-f1-border/50 rounded-lg px-3 py-1.5"
          >
            Reset all to official
          </button>
        )}
      </div>
      <p className="text-sm text-f1-text-muted mb-5">
        Override official team colors used in standings, timing tables, and charts.
        Click a swatch to change it. A dot indicates the official color.
      </p>

      <div className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
        <div className="divide-y divide-f1-border/40">
          {CURRENT_TEAMS.map((team) => {
            const official = getTeamColor(team.constructorId);
            const override = teamColorOverrides[team.constructorId];
            const current = override ?? official;
            const isOverridden = !!override;

            return (
              <div key={team.constructorId} className="flex items-center gap-4 px-4 py-3">
                {/* Team accent strip */}
                <div className="h-8 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: current }} />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{team.name}</p>
                  <p className="text-xs text-f1-text-muted font-mono">{current}</p>
                </div>

                {/* Official color dot */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isOverridden && (
                    <div
                      className="h-4 w-4 rounded-full ring-1 ring-f1-border opacity-40"
                      style={{ backgroundColor: official }}
                      title={`Official: ${official}`}
                    />
                  )}

                  {/* Color swatch button */}
                  <label
                    className="relative h-8 w-8 rounded-lg overflow-hidden cursor-pointer ring-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: current,
                      ringColor: isOverridden ? current : "transparent",
                    }}
                    title="Click to change color"
                  >
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => setTeamColorOverride(team.constructorId, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>

                  {/* Reset button */}
                  {isOverridden ? (
                    <button
                      onClick={() => setTeamColorOverride(team.constructorId, null)}
                      className="rounded-md px-2 py-1 text-xs text-f1-text-muted hover:text-f1-text border border-f1-border/50 hover:border-f1-border transition-colors"
                      title="Reset to official color"
                    >
                      Reset
                    </button>
                  ) : (
                    <div className="w-14" /> /* spacer */
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-f1-text-muted">
        Color overrides are saved locally and exported with your settings file.
      </p>
    </section>
  );
}
