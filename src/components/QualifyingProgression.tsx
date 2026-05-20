import type { QualifyingResult } from "@/lib/types";
import { getTeamColor } from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";

const BC = "'Barlow Condensed', sans-serif";

function toSeconds(t?: string): number | null {
  if (!t) return null;
  const m = t.match(/^(?:(\d+):)?(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  const min = m[1] ? parseInt(m[1], 10) : 0;
  const sec = parseInt(m[2], 10);
  const frac = m[3] ? parseInt(m[3], 10) / Math.pow(10, m[3].length) : 0;
  return min * 60 + sec + frac;
}

function fmtGap(secs: number): string {
  return `+${secs.toFixed(3)}`;
}

interface Zone {
  key: "q3" | "q2" | "q1";
  title: string;
  caption: string;
  color: string;
  segment: (q: QualifyingResult) => string | undefined;
  rows: QualifyingResult[];
}

function Row({
  q,
  time,
  best,
}: {
  q: QualifyingResult;
  time?: string;
  best: number | null;
}) {
  const constructorId =
    getDriverConstructorId(q.Driver.driverId, q.Constructor.constructorId) ?? "";
  const teamColor = getTeamColor(constructorId);
  const secs = toSeconds(time);
  const gap = secs !== null && best !== null ? secs - best : null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-f1-border/40 last:border-0">
      <span
        className="w-6 shrink-0 text-right text-sm font-black text-f1-text-muted"
        style={{ fontFamily: BC }}
      >
        {q.position}
      </span>
      <span
        className="h-5 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: teamColor }}
      />
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="text-f1-text-muted">{q.Driver.givenName} </span>
        <span className="font-bold uppercase">{q.Driver.familyName}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-sm tabular-nums">{time ?? "—"}</span>
        {gap !== null && gap > 0.0005 && (
          <span className="block font-mono text-[11px] text-f1-text-muted">
            {fmtGap(gap)}
          </span>
        )}
        {gap !== null && gap <= 0.0005 && (
          <span className="block font-mono text-[11px] font-bold text-f1-accent">
            POLE
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Qualifying elimination view — splits the grid into the Q3 shootout and the
 * Q2 / Q1 knockout zones, showing each driver's decisive segment time and the
 * gap to that segment's benchmark. Complements the detailed Q1/Q2/Q3 table.
 */
export default function QualifyingProgression({
  qualifying,
}: {
  qualifying: QualifyingResult[];
}) {
  if (qualifying.length === 0) return null;

  const sorted = [...qualifying].sort(
    (a, b) => parseInt(a.position, 10) - parseInt(b.position, 10)
  );

  // A driver's decisive segment is the deepest one they reached.
  const q3 = sorted.filter((q) => q.Q3);
  const q2Out = sorted.filter((q) => !q.Q3 && q.Q2);
  const q1Out = sorted.filter((q) => !q.Q3 && !q.Q2);

  const bestOf = (rows: QualifyingResult[], seg: (q: QualifyingResult) => string | undefined) => {
    const times = rows
      .map((q) => toSeconds(seg(q)))
      .filter((t): t is number => t !== null);
    return times.length ? Math.min(...times) : null;
  };

  const allZones: Zone[] = [
    {
      key: "q3",
      title: "Q3 · Top-10 Shootout",
      caption: "Pole position fight",
      color: "var(--color-f1-accent)",
      segment: (q) => q.Q3,
      rows: q3,
    },
    {
      key: "q2",
      title: "Q2 · Knocked Out",
      caption: "Eliminated P11–15",
      color: "#f59e0b",
      segment: (q) => q.Q2,
      rows: q2Out,
    },
    {
      key: "q1",
      title: "Q1 · Knocked Out",
      caption: "Eliminated P16+",
      color: "#9ca3af",
      segment: (q) => q.Q1,
      rows: q1Out,
    },
  ];
  const zones = allZones.filter((z) => z.rows.length > 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {zones.map((zone) => {
        const best = bestOf(zone.rows, zone.segment);
        return (
          <div
            key={zone.key}
            className="overflow-hidden rounded-xl border border-f1-border bg-f1-card"
          >
            <div
              className="border-b border-f1-border px-3 py-2.5"
              style={{ borderTop: `2px solid ${zone.color}` }}
            >
              <p
                className="text-sm font-black uppercase tracking-wide"
                style={{ fontFamily: BC, color: zone.color }}
              >
                {zone.title}
              </p>
              <p className="text-[11px] text-f1-text-muted">{zone.caption}</p>
            </div>
            <div>
              {zone.rows.map((q) => (
                <Row
                  key={q.Driver.driverId}
                  q={q}
                  time={zone.segment(q)}
                  best={best}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
