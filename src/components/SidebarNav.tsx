"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { DriverStanding } from "@/lib/types";
import { getTeamColor } from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/live", label: "Live" },
  { href: "/races", label: "Races" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
  { href: "/stats", label: "Stats" },
  { href: "/news", label: "News" },
];

const MORE_LINKS = [
  { href: "/fastest-laps", label: "Fastest Laps" },
  { href: "/compare", label: "Compare" },
  { href: "/archive", label: "Archive" },
  { href: "/favorites", label: "Favorites" },
  { href: "/settings", label: "Settings" },
];

interface Props {
  standings: DriverStanding[];
}

function SidebarRow({ standing, rank }: { standing: DriverStanding; rank: number }) {
  const [hovered, setHovered] = useState(false);
  const constructorId =
    getDriverConstructorId(standing.Driver.driverId, standing.Constructors[0]?.constructorId) ?? "";
  const color = getTeamColor(constructorId);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 14px",
        cursor: "pointer",
        background: hovered ? "#181818" : "transparent",
        transition: "background 0.12s",
      }}
    >
      <span
        style={{
          fontFamily: BC,
          fontWeight: 800,
          fontSize: 12,
          color: "#333",
          width: 14,
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <span
        style={{
          width: 2,
          height: 18,
          borderRadius: 1,
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: BC,
          fontWeight: 700,
          fontSize: 12,
          flex: 1,
          letterSpacing: "0.02em",
          color: "#ccc",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {standing.Driver.familyName.toUpperCase()}
      </span>
      <span style={{ fontFamily: BC, fontWeight: 900, fontSize: 13, color }}>
        {standing.points}
      </span>
    </div>
  );
}

export default function SidebarNav({ standings }: Props) {
  const pathname = usePathname();
  const isMoreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href));
  const [moreOpen, setMoreOpen] = useState(isMoreActive);

  return (
    <aside
      style={{
        width: 224,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "#0c0c0c",
        borderRight: "1px solid #1c1c1c",
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #181818" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, textDecoration: "none" }}>
          <span style={{ fontFamily: BC, fontWeight: 900, fontSize: 30, color: "#e10600", lineHeight: 1 }}>
            F1
          </span>
          <span style={{ fontFamily: BC, fontWeight: 600, fontSize: 14, color: "#383838", letterSpacing: "0.1em" }}>
            2026
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav style={{ padding: "10px 8px" }}>
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 1,
                background: isActive ? "rgba(225,6,0,0.10)" : "transparent",
                color: isActive ? "#e10600" : "rgba(255,255,255,0.35)",
                fontFamily: DM,
                fontWeight: 600,
                fontSize: 13,
                transition: "all 0.15s",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          );
        })}

        {/* More toggle */}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            marginTop: 2,
            background: isMoreActive ? "rgba(225,6,0,0.07)" : "transparent",
            color: isMoreActive ? "#e10600" : "rgba(255,255,255,0.25)",
            fontFamily: DM,
            fontWeight: 600,
            fontSize: 13,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <span>More</span>
          <span
            style={{
              fontSize: 9,
              opacity: 0.6,
              transform: moreOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
              display: "inline-block",
            }}
          >
            ▼
          </span>
        </button>

        {/* Collapsible more links */}
        {moreOpen && (
          <div style={{ paddingLeft: 8 }}>
            {MORE_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "6px 12px",
                    borderRadius: 8,
                    marginBottom: 1,
                    background: isActive ? "rgba(225,6,0,0.10)" : "transparent",
                    color: isActive ? "#e10600" : "rgba(255,255,255,0.28)",
                    fontFamily: DM,
                    fontWeight: 500,
                    fontSize: 12,
                    transition: "all 0.15s",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mini driver standings */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          borderTop: "1px solid #181818",
          paddingTop: 12,
        }}
      >
        <div
          style={{
            padding: "0 14px 8px",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "#383838",
            textTransform: "uppercase",
            fontFamily: DM,
          }}
        >
          Driver Standings
        </div>
        {standings.slice(0, 10).map((s, i) => (
          <SidebarRow key={s.Driver.driverId} standing={s} rank={i + 1} />
        ))}
      </div>
    </aside>
  );
}
