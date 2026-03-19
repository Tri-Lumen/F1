"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFavorites } from "@/lib/FavoritesContext";

/** Primary links always visible in the nav bar */
const PRIMARY_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/live", label: "Live" },
  { href: "/races", label: "Races" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
];

/** Secondary links live under the "More" dropdown */
const SECONDARY_LINKS = [
  { href: "/stats", label: "Stats" },
  { href: "/fastest-laps", label: "Fastest Laps" },
  { href: "/compare", label: "Compare" },
  { href: "/archive", label: "Archive" },
  { href: "/settings", label: "Settings" },
];

interface NavSession {
  type: string;
  raceName: string;
  country: string;
  date: string;
}

function SessionPill({
  session,
  isLive,
}: {
  session: NavSession | null;
  isLive: boolean;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (isLive) {
      setLabel("live");
      return undefined;
    }
    if (!session) {
      setLabel(null);
      return undefined;
    }

    const target = new Date(session.date);

    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setLabel("starting");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000) % 24;
      const mins = Math.floor(diff / 60000) % 60;

      if (days > 0) setLabel(`${session!.type} · ${days}d ${hours}h`);
      else if (hours > 0) setLabel(`${session!.type} · ${hours}h ${mins}m`);
      else setLabel(`${session!.type} · ${mins}m`);
    }

    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [session?.date, session?.type, isLive]);

  if (!label) return null;

  if (isLive) {
    return (
      <Link
        href="/live"
        className="flex items-center gap-1.5 rounded-full bg-f1-red/15 border border-f1-red/40 px-3 py-1 text-xs font-bold text-f1-red hover:bg-f1-red/25 transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-f1-red animate-pulse-live" />
        LIVE
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-f1-card/60 acrylic border border-f1-border/50 px-3 py-1 text-xs font-semibold text-f1-text-muted">
      <svg
        className="h-3 w-3 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="truncate max-w-[160px]">{label}</span>
    </div>
  );
}

interface NavProps {
  nextSession?: NavSession | null;
  isLive?: boolean;
}

export default function Nav({ nextSession = null, isLive = false }: NavProps) {
  const pathname = usePathname();
  const { hasAnyFavorites } = useFavorites();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const secondaryLinks = hasAnyFavorites
    ? [{ href: "/favorites", label: "Favourites" }, ...SECONDARY_LINKS]
    : SECONDARY_LINKS;

  // Close "More" on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const secondaryActive = secondaryLinks.some((l) => isActive(l.href));

  return (
    <header className="sticky top-0 z-50 border-b border-f1-border/40 bg-f1-black/60 acrylic-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
          <span className="text-2xl font-black tracking-tight text-f1-red">
            F1
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-f1-accent-secondary sm:block opacity-70">
            Dashboard
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5 flex-1 min-w-0">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                isActive(link.href)
                  ? "text-f1-accent bg-f1-accent/8"
                  : "text-f1-text-muted hover:text-f1-text hover:bg-f1-card/50"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative flex-shrink-0">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className={`relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                secondaryActive
                  ? "text-f1-accent bg-f1-accent/8"
                  : "text-f1-text-muted hover:text-f1-text hover:bg-f1-card/50"
              }`}
            >
              More
              <svg
                className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {moreOpen && (
              <div className="absolute left-0 top-full mt-1.5 min-w-[160px] rounded-xl border border-f1-border/50 bg-f1-card/90 acrylic py-1.5 shadow-xl z-50">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-f1-accent bg-f1-accent/8"
                        : "text-f1-text-muted hover:text-f1-text hover:bg-f1-card/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Session pill */}
        <div className="hidden md:flex flex-shrink-0 ml-auto">
          <SessionPill session={nextSession} isLive={isLive} />
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-lg border border-f1-border text-f1-text-muted hover:text-f1-text hover:border-f1-text-muted transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        >
          {mobileOpen ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-f1-border/40 bg-f1-black/75 acrylic-lg">
          <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <div className="grid grid-cols-2 gap-1.5">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive(link.href)
                      ? "bg-f1-accent/10 text-f1-accent"
                      : "text-f1-text-muted hover:bg-f1-card/50 hover:text-f1-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-f1-border/30 grid grid-cols-2 gap-1.5">
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive(link.href)
                      ? "bg-f1-accent/10 text-f1-accent"
                      : "text-f1-text-muted hover:bg-f1-card/50 hover:text-f1-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-f1-border/30 px-1">
              <SessionPill session={nextSession} isLive={isLive} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
