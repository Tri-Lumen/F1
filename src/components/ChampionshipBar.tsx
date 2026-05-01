"use client";

import { useBarWidth } from "@/lib/hooks";
import { getTeamColor } from "@/lib/api";
import type { ConstructorStanding } from "@/lib/types";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

function BarSegment({
  standing,
  totalPts,
  delay,
}: {
  standing: ConstructorStanding;
  totalPts: number;
  delay: number;
}) {
  const pct = totalPts > 0 ? (parseFloat(standing.points) / totalPts) * 100 : 0;
  const w = useBarWidth(pct, delay);
  const color = getTeamColor(standing.Constructor.constructorId);

  return (
    <div
      title={`${standing.Constructor.name}: ${standing.points} pts`}
      style={{
        width: `${w}%`,
        background: color,
        minWidth: w > 2 ? 2 : 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "width 0.06s",
        flexShrink: 0,
      }}
    >
      {w > 7 && (
        <span
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 9,
            color: "rgba(0,0,0,0.6)",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
          }}
        >
          {standing.Constructor.name.split(" ")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

interface Props {
  standings: ConstructorStanding[];
}

export default function ChampionshipBar({ standings }: Props) {
  const total = standings.reduce((s, c) => s + parseFloat(c.points), 0);

  return (
    <div style={{ marginBottom: 0 }}>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.13em",
          color: "var(--color-f1-text-muted)",
          textTransform: "uppercase",
          fontFamily: DM,
          marginBottom: 8,
        }}
      >
        Constructors · {total} pts
      </div>
      <div
        style={{
          display: "flex",
          height: 26,
          borderRadius: 6,
          overflow: "hidden",
          gap: 1,
        }}
      >
        {standings.map((s, i) => (
          <BarSegment
            key={s.Constructor.constructorId}
            standing={s}
            totalPts={total}
            delay={i * 80 + 300}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px 14px",
          marginTop: 8,
        }}
      >
        {standings.map((s) => {
          const color = getTeamColor(s.Constructor.constructorId);
          return (
            <div key={s.Constructor.constructorId} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 10, color: "var(--color-f1-text-muted)", fontFamily: DM }}>
                {s.Constructor.name}{" "}
                <strong style={{ color: "var(--color-f1-text)" }}>{s.points}</strong>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
