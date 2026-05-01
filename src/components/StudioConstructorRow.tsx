"use client";

import { memo } from "react";
import { useCountUp, useBarWidth, useFadeIn } from "@/lib/hooks";
import { getTeamColor } from "@/lib/api";
import type { ConstructorStanding } from "@/lib/types";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

interface Props {
  standing: ConstructorStanding;
  maxPts: number;
  delay?: number;
}

function StudioConstructorRowImpl({ standing, maxPts, delay = 0 }: Props) {
  const color = getTeamColor(standing.Constructor.constructorId);
  const pts = parseFloat(standing.points);
  const pct = maxPts > 0 ? (pts / maxPts) * 100 : 0;
  const animatedPts = useCountUp(pts, 980, delay + 220);
  const barW = useBarWidth(pct, delay + 220);
  const vis = useFadeIn(delay);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 14px",
        borderBottom: "1px solid var(--color-f1-border)",
        opacity: vis ? 1 : 0,
        transition: "opacity 0.35s",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          width: 106,
          fontFamily: BC,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.02em",
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {standing.Constructor.name}
      </div>
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: "var(--color-f1-dark)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
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
          width: 40,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {animatedPts}
      </span>
    </div>
  );
}

const StudioConstructorRow = memo(StudioConstructorRowImpl);
export default StudioConstructorRow;
