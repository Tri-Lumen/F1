"use client";

import { useFadeIn, useCountUp } from "@/lib/hooks";
import { getTeamColor } from "@/lib/api";
import { getDriverConstructorId, getDriverConstructorName } from "@/lib/driverOverrides";
import type { DriverStanding } from "@/lib/types";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

interface Props {
  leader: DriverStanding;
  second: DriverStanding;
  completedRaces: number;
  totalRaces: number;
}

export default function LeaderHero({ leader, second, completedRaces, totalRaces }: Props) {
  const constructorId =
    getDriverConstructorId(leader.Driver.driverId, leader.Constructors[0]?.constructorId) ?? "";
  const constructorName =
    getDriverConstructorName(leader.Driver.driverId, leader.Constructors[0]?.name) ?? "";
  const color = getTeamColor(constructorId);
  const pts = parseFloat(leader.points);
  const gap = pts - parseFloat(second.points);
  const animatedPts = useCountUp(pts, 1200, 150);
  const vis = useFadeIn(0);
  const liveryBg = `repeating-linear-gradient(-55deg, transparent, transparent 9px, ${color}14 9px, ${color}14 10px)`;
  const seasonPct = totalRaces > 0 ? (completedRaces / totalRaces) * 100 : 0;

  return (
    <div
      style={{
        borderRadius: 13,
        overflow: "hidden",
        marginBottom: 18,
        background: "var(--color-f1-dark)",
        border: `1px solid ${color}20`,
        opacity: vis ? 1 : 0,
        transition: "opacity 0.7s",
        position: "relative",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${color} 0%, ${color}55 55%, transparent 100%)`,
        }}
      />
      {/* Livery texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: liveryBg,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Content grid */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
        }}
      >
        {/* Left panel */}
        <div style={{ padding: "22px 28px 20px" }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.15em",
              color: "var(--color-f1-text-muted)",
              textTransform: "uppercase",
              fontFamily: DM,
              marginBottom: 8,
            }}
          >
            Championship Leader · Round {completedRaces}
          </div>

          {/* Driver name */}
          <div
            style={{
              fontFamily: BC,
              fontWeight: 900,
              fontSize: 50,
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
              marginBottom: 10,
            }}
          >
            <span style={{ color: "var(--color-f1-text-muted)" }}>
              {leader.Driver.givenName.toUpperCase()}{" "}
            </span>
            <span style={{ color }}>{leader.Driver.familyName.toUpperCase()}</span>
          </div>

          {/* Team pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 18,
              background: `${color}14`,
              border: `1px solid ${color}28`,
              borderRadius: 999,
              padding: "3px 10px 3px 8px",
            }}
          >
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
            <span
              style={{
                fontFamily: BC,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.08em",
                color,
                textTransform: "uppercase",
              }}
            >
              {constructorName}
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
            {[
              ["Points", animatedPts, color],
              ["Gap", `+${gap}`, "#c0c0c0"],
              ["Wins", parseInt(leader.wins), "#FFD700"],
            ].map(([lbl, val, c]) => (
              <div key={String(lbl)}>
                <div
                  style={{
                    fontFamily: BC,
                    fontWeight: 900,
                    fontSize: 36,
                    lineHeight: 1,
                    color: String(c),
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "var(--color-f1-text-muted)",
                    textTransform: "uppercase",
                    fontFamily: DM,
                    marginTop: 3,
                  }}
                >
                  {lbl}
                </div>
              </div>
            ))}

            {/* Season progress */}
            <div style={{ flex: 1, paddingBottom: 6 }}>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--color-f1-text-muted)",
                  textTransform: "uppercase",
                  fontFamily: DM,
                  marginBottom: 6,
                }}
              >
                Season {completedRaces}/{totalRaces}
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: "var(--color-f1-card)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    background:
                      "linear-gradient(90deg, var(--color-f1-accent), color-mix(in srgb, var(--color-f1-accent) 67%, transparent))",
                    width: `${seasonPct}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ghost watermark */}
        <div
          style={{
            paddingRight: 28,
            overflow: "hidden",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: BC,
              fontWeight: 900,
              fontSize: 100,
              color: `${color}09`,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {leader.Driver.familyName.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
