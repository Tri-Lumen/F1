import type { QualifyingResult } from "@/lib/types";
import { getTeamColor } from "@/lib/api";

/** Parse a lap time string ("1:23.456" or "83.456") into milliseconds. */
function parseMs(t: string | undefined): number | null {
  if (!t) return null;
  const ci = t.indexOf(":");
  if (ci !== -1) {
    return (
      parseInt(t.slice(0, ci)) * 60_000 +
      parseFloat(t.slice(ci + 1)) * 1_000
    );
  }
  return parseFloat(t) * 1_000;
}

export default function QualifyingGapChart({
  qualifying,
}: {
  qualifying: QualifyingResult[];
}) {
  if (qualifying.length === 0) return null;

  // Best time per driver: Q3 > Q2 > Q1
  const withMs = qualifying.map((q) => ({
    ...q,
    ms: parseMs(q.Q3) ?? parseMs(q.Q2) ?? parseMs(q.Q1),
  }));

  const classified = withMs
    .filter((q): q is typeof q & { ms: number } => q.ms !== null)
    .sort((a, b) => a.ms - b.ms);
  if (classified.length < 2) return null;

  const poleMs = classified[0].ms;
  const maxGap = classified[classified.length - 1].ms - poleMs;
  if (maxGap <= 0) return null;

  // SVG layout constants
  const ROW_H = 28;
  const PL = 54;   // left area: position + driver code
  const PR = 72;   // right area: gap label
  const BW = 400;  // bar track width
  const W = PL + BW + PR;
  const H = classified.length * ROW_H + 4;

  return (
    <div className="mb-6 rounded-xl border border-f1-border bg-f1-card overflow-hidden">
      <div className="border-b border-f1-border px-5 py-4">
        <h3 className="font-bold text-lg">Qualifying Gap to Pole</h3>
        <p className="text-xs text-f1-text-muted mt-0.5">
          Each driver&apos;s best session time relative to pole position
        </p>
      </div>
      <div className="p-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          className="w-full"
          style={{ height: `${H}px`, minWidth: "280px" }}
        >
          {classified.map((q, i) => {
            const gap = q.ms - poleMs;
            const barW =
              gap === 0 ? 0 : Math.max(3, (gap / maxGap) * BW * 0.95);
            const y = i * ROW_H;
            const color = getTeamColor(q.Constructor.constructorId);
            const isPole = gap === 0;

            return (
              <g key={q.Driver.driverId}>
                {/* Alternating row tint */}
                <rect
                  x={0}
                  y={y}
                  width={W}
                  height={ROW_H - 2}
                  rx="2"
                  fill="currentColor"
                  fillOpacity={i % 2 === 0 ? 0 : 0.025}
                />

                {/* Grid position */}
                <text
                  x={16}
                  y={y + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  fillOpacity={0.4}
                  fontFamily="monospace"
                >
                  P{q.position}
                </text>

                {/* Driver code coloured by team */}
                <text
                  x={PL - 6}
                  y={y + 18}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="bold"
                  fill={color}
                >
                  {q.Driver.code}
                </text>

                {/* Bar track */}
                <rect
                  x={PL}
                  y={y + 7}
                  width={BW}
                  height={ROW_H - 14}
                  rx="3"
                  fill="currentColor"
                  fillOpacity={0.06}
                />

                {/* Gap bar — thin marker for pole, filled bar for rest */}
                {isPole ? (
                  <rect
                    x={PL}
                    y={y + 7}
                    width={5}
                    height={ROW_H - 14}
                    rx="2"
                    fill={color}
                    fillOpacity={0.9}
                  />
                ) : (
                  <rect
                    x={PL}
                    y={y + 7}
                    width={barW}
                    height={ROW_H - 14}
                    rx="3"
                    fill={color}
                    fillOpacity={0.65}
                  />
                )}

                {/* Gap label */}
                <text
                  x={PL + BW + 6}
                  y={y + 18}
                  fontSize="10"
                  fontFamily="monospace"
                  fill="currentColor"
                  fillOpacity={isPole ? 0.9 : 0.5}
                >
                  {isPole ? "POLE" : `+${(gap / 1_000).toFixed(3)}s`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
