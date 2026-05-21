"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DM = "'DM Sans', sans-serif";

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M8.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M15.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function RacesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 2v4M16 2v4" />
    </svg>
  );
}

function DriversIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
      <circle cx="17" cy="7" r="3" />
      <path d="M15 20c0-3 1.8-5 4.5-5" />
    </svg>
  );
}

const TABS = [
  { href: "/",        label: "Home",    Icon: HomeIcon,    isLive: false },
  { href: "/live",    label: "Live",    Icon: LiveIcon,    isLive: true  },
  { href: "/races",   label: "Races",   Icon: RacesIcon,   isLive: false },
  { href: "/drivers", label: "Drivers", Icon: DriversIcon, isLive: false },
  { href: "/teams",   label: "Teams",   Icon: TeamsIcon,   isLive: false },
];

export default function BottomTabBar({ hasLiveSession }: { hasLiveSession?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[130] grid md:hidden acrylic"
      style={{
        gridTemplateColumns: "repeat(5, 1fr)",
        background: "color-mix(in srgb, var(--color-f1-black) 90%, transparent)",
        borderTop: "1px solid var(--color-f1-border)",
        height: 56,
      }}
    >
      {TABS.map(({ href, label, Icon, isLive }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const color = isActive ? "var(--color-f1-accent)" : "var(--color-f1-text-muted)";
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textDecoration: "none",
              color,
              position: "relative",
            }}
          >
            <Icon />
            <span
              style={{
                fontFamily: DM,
                fontSize: 9,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </span>
            {isLive && hasLiveSession && (
              <span
                className="animate-pulse-live"
                style={{
                  position: "absolute",
                  top: 8,
                  right: "calc(50% - 13px)",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--color-f1-accent)",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
