"use client";

import { useCountUp, useBarWidth, useFadeIn } from "@/lib/hooks";
import { getTeamColor } from "@/lib/api";
import { getDriverConstructorId, getDriverConstructorName } from "@/lib/driverOverrides";
import SparkLine from "@/components/SparkLine";
import type { DriverStanding } from "@/lib/types";
import { memo, useState } from "react";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

function PosPill({ pos }: { pos: number }) {
  const gold: Record<number, string> = { 1: "#FFD700", 2: "#A8A9AD", 3: "#CD7F32" };
  const c = gold[pos];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 22,
        borderRadius: 4,
        background: c ? `${c}1a` : "var(--color-f1-dark)",
        color: c || "var(--color-f1-text-muted)",
        fontSize: 12,
        fontWeight: 800,
        fontFamily: BC,
        border: `1px solid ${c ? `${c}40` : "var(--color-f1-border)"}`,
        flexShrink: 0,
      }}
    >
      {pos}
    </span>
  );
}

interface Props {
  standing: DriverStanding;
  rank: number;
  form: number[];
  leaderPts: number;
  delay?: number;
}

function StudioDriverRowImpl({ standing, rank, form, leaderPts, delay = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const constructorId =
    getDriverConstructorId(standing.Driver.driverId, standing.Constructors[0]?.constructorId) ?? "";
  const constructorName =
    getDriverConstructorName(standing.Driver.driverId, standing.Constructors[0]?.name) ?? "";
  const color = getTeamColor(constructorId);
  const pts = parseFloat(standing.points);
  const pct = leaderPts > 0 ? (pts / leaderPts) * 100 : 0;
  const animatedPts = useCountUp(pts, 980, delay + 200);
  const barW = useBarWidth(pct, delay + 320);
  const vis = useFadeIn(delay);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 14px",
        borderBottom: "1px solid var(--color-f1-border)",
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateX(-8px)",
        transition: "opacity 0.35s, transform 0.35s",
        cursor: "pointer",
        background: hovered ? "var(--color-f1-card-hover)" : "transparent",
      }}
    >
      <PosPill pos={rank} />
      <span
        style={{
          width: 3,
          height: 26,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: BC,
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {standing.Driver.familyName.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "var(--color-f1-text-muted)",
            fontFamily: DM,
            textTransform: "capitalize",
          }}
        >
          {constructorName}
        </div>
      </div>
      <SparkLine data={form} color={color} width={52} height={20} />
      <div style={{ width: 80, display: "flex", alignItems: "center", gap: 7 }}>
        <div
          style={{
            flex: 1,
            height: 2,
            borderRadius: 1,
            background: "var(--color-f1-dark)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 1,
              background: color,
              width: `${barW}%`,
              transition: "width 0.06s",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 17,
            color,
            flexShrink: 0,
            width: 36,
            textAlign: "right",
          }}
        >
          {animatedPts}
        </span>
      </div>
    </div>
  );
}

// Equality fn: only re-render when displayed values change.  `form` is a fresh
// array reference on every parent render, so compare element-wise instead.
const StudioDriverRow = memo(StudioDriverRowImpl, (a, b) => {
  if (a.rank !== b.rank || a.delay !== b.delay || a.leaderPts !== b.leaderPts) return false;
  if (a.standing !== b.standing) return false;
  if (a.form === b.form) return true;
  if (a.form.length !== b.form.length) return false;
  for (let i = 0; i < a.form.length; i++) {
    if (a.form[i] !== b.form[i]) return false;
  }
  return true;
});
export default StudioDriverRow;
