"use client";

import { useState } from "react";
import { useFadeIn } from "@/lib/hooks";
import { getTeamColor } from "@/lib/api";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

export interface StudioRaceCardData {
  round: string;
  name: string;
  short: string;
  date: string;
  winnerFamily: string;
  winnerTeamId: string;
  poleFamily: string | null;
  fastestFamily: string | null;
}

interface Props {
  race: StudioRaceCardData;
  delay?: number;
}

export default function StudioRaceCard({ race, delay = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const vis = useFadeIn(delay);
  const color = getTeamColor(race.winnerTeamId);
  const liveryBg = `repeating-linear-gradient(-55deg, transparent, transparent 9px, ${color}14 9px, ${color}14 10px)`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${hovered ? `${color}44` : "#1e1e1e"}`,
        opacity: vis ? 1 : 0,
        transform: vis ? (hovered ? "translateY(-2px)" : "none") : "translateY(12px)",
        transition: "opacity 0.4s, transform 0.3s, border-color 0.2s",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${color}, ${color}44)`,
        }}
      />
      <div
        style={{
          padding: "13px 14px",
          background: "#171717",
          backgroundImage: liveryBg,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#464646",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: DM,
              }}
            >
              Rd {race.round} · {race.date}
            </div>
            <div
              style={{
                fontFamily: BC,
                fontWeight: 800,
                fontSize: 16,
                marginTop: 3,
                lineHeight: 1.1,
              }}
            >
              {race.name}
            </div>
          </div>
          <span
            style={{
              fontFamily: BC,
              fontWeight: 900,
              fontSize: 22,
              color: "#242424",
              lineHeight: 1,
            }}
          >
            {race.short}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            ["Winner", race.winnerFamily, color],
            ["Pole", race.poleFamily, "#888"],
            ["Fastest", race.fastestFamily, "#a78bfa"],
          ].map(([lbl, name, c]) => (
            <div key={String(lbl)}>
              <div
                style={{
                  fontSize: 8,
                  color: "#3a3a3a",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                {lbl}
              </div>
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: 13,
                  color: String(c),
                }}
              >
                {name ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
