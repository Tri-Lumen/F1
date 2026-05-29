"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { DriverStanding } from "@/lib/types";
import { getTeamColor } from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";
import { OPEN_PALETTE_EVENT } from "@/components/CommandPalette";

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
  { href: "/gap", label: "Champ. Gap" },
  { href: "/highlights", label: "Highlights" },
  { href: "/penalties", label: "Incidents" },
  { href: "/replay", label: "Replay" },
  { href: "/predictions", label: "Pick'em" },
  { href: "/archive", label: "Archive" },
  { href: "/favorites", label: "Favorites" },
  { href: "/settings", label: "Settings" },
];

interface Props {
  standings: DriverStanding[];
  /** Mobile drawer open state (controlled by AppShell); ignored on desktop */
  mobileOpen?: boolean;
  onClose?: () => void;
  hasLiveSession?: boolean;
}

const ACCENT = "var(--color-f1-accent)";
const ACCENT_BG = "color-mix(in srgb, var(--color-f1-accent) 10%, transparent)";
const ACCENT_BG_SOFT = "color-mix(in srgb, var(--color-f1-accent) 7%, transparent)";

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
        background: hovered ? "var(--color-f1-card-hover)" : "transparent",
        transition: "background 0.12s",
      }}
    >
      <span
        style={{
          fontFamily: BC,
          fontWeight: 800,
          fontSize: 12,
          color: "var(--color-f1-text-muted)",
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
          color: "var(--color-f1-text)",
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

export default function SidebarNav({ standings, mobileOpen = false, onClose, hasLiveSession }: Props) {
  const pathname = usePathname();
  const isMoreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href));
  const [moreOpen, setMoreOpen] = useState(isMoreActive);
  // Show the platform-correct search shortcut. Defaults to the Mac glyph on the
  // server render, then corrects after mount to avoid a hydration mismatch.
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <aside
      className={`transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      style={{
        width: 224,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "var(--color-f1-black)",
        borderRight: "1px solid var(--color-f1-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid var(--color-f1-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, textDecoration: "none" }}>
          <span style={{ fontFamily: BC, fontWeight: 900, fontSize: 30, color: ACCENT, lineHeight: 1 }}>
            F1
          </span>
          <span style={{ fontFamily: BC, fontWeight: 600, fontSize: 14, color: "var(--color-f1-text-muted)", letterSpacing: "0.1em" }}>
            2026
          </span>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="md:hidden"
          style={{
            background: "none",
            border: "none",
            color: "var(--color-f1-text-muted)",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Search trigger */}
      <div style={{ padding: "10px 12px 0" }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "7px 10px",
            borderRadius: 8,
            background: "var(--color-f1-card)",
            border: "1px solid var(--color-f1-border)",
            color: "var(--color-f1-text-muted)",
            fontFamily: DM,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z" />
            </svg>
            Search
          </span>
          <kbd
            style={{
              fontSize: 10,
              border: "1px solid var(--color-f1-border)",
              borderRadius: 4,
              padding: "1px 5px",
            }}
            suppressHydrationWarning
          >
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>
      </div>

      {/* Nav links */}
      <nav style={{ padding: "10px 8px" }}>
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const isLiveLink = link.href === "/live";
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
                background: isActive ? "color-mix(in srgb, var(--color-f1-accent) 10%, transparent)" : "transparent",
                color: isActive ? "var(--color-f1-accent)" : "var(--color-f1-text-muted)",
                fontFamily: DM,
                fontWeight: 600,
                fontSize: 13,
                transition: "all 0.15s",
                textDecoration: "none",
              }}
            >
              {link.label}
              {isLiveLink && hasLiveSession && (
                <span
                  className="animate-pulse-live"
                  style={{
                    marginLeft: "auto",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-f1-accent)",
                    flexShrink: 0,
                  }}
                />
              )}
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
            background: isMoreActive ? ACCENT_BG_SOFT : "transparent",
            color: isMoreActive ? ACCENT : "var(--color-f1-text-muted)",
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
                    background: isActive ? ACCENT_BG : "transparent",
                    color: isActive ? ACCENT : "var(--color-f1-text-muted)",
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
          borderTop: "1px solid var(--color-f1-border)",
          paddingTop: 12,
        }}
      >
        <div
          style={{
            padding: "0 14px 8px",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "var(--color-f1-text-muted)",
            textTransform: "uppercase",
            fontFamily: DM,
          }}
        >
          Driver Standings
        </div>
        {standings.slice(0, 10).map((s, i) => (
          <Link
            key={s.Driver.driverId}
            href={`/drivers/${s.Driver.driverId}`}
            style={{ display: "block", textDecoration: "none" }}
          >
            <SidebarRow standing={s} rank={i + 1} />
          </Link>
        ))}
      </div>
    </aside>
  );
}
