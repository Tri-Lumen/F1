"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFavorites } from "@/lib/FavoritesContext";

const BASE_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/live", label: "Live" },
  { href: "/races", label: "Races" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
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
  date: string; // ISO string
}

/** Compact session countdown / live pill shown at right of nav */
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
      return;
    }
    if (!session) return;

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
  const [overflowIdx, setOverflowIdx] = useState<number | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreDropRef = useRef<HTMLDivElement>(null);

  const links = hasAnyFavorites
    ? [
        BASE_LINKS[0], // Dashboard
        { href: "/favorites", label: "Favourites" },
        ...BASE_LINKS.slice(1),
      ]
    : BASE_LINKS;

  const recalc = useCallback(() => {
    const nav = navRef.current;
    const measure = measureRef.current;
    if (!nav || !measure) return;

    const availableWidth = nav.offsetWidth;
    const spans = Array.from(
      measure.querySelectorAll<HTMLSpanElement>("[data-ml]")
    );
    const moreSpan = measure.querySelector<HTMLSpanElement>("[data-more]");
    const moreW = moreSpan?.offsetWidth ?? 72;

    let total = 0;
    let idx = links.length; // default: all visible

    for (let i = 0; i < spans.length; i++) {
      const w = spans[i].offsetWidth;
      // Reserve space for the "More" button unless this is the last link
      const reserve = i < spans.length - 1 ? moreW : 0;
      if (total + w + reserve > availableWidth) {
        idx = i;
        break;
      }
      total += w;
    }

    setOverflowIdx(idx);
  }, [links.length]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(recalc);
    ro.observe(nav);
    recalc();
    return () => ro.disconnect();
  }, [recalc]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function handler(e: MouseEvent) {
      if (
        moreDropRef.current &&
        !moreDropRef.current.contains(e.target as Node)
      ) {
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

  const visibleLinks =
    overflowIdx !== null ? links.slice(0, overflowIdx) : links;
  const overflowLinks =
    overflowIdx !== null ? links.slice(overflowIdx) : [];

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-f1-border/40 bg-f1-black/60 acrylic-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-black tracking-tight text-f1-red">
            F1
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-f1-accent-secondary sm:block opacity-70">
            Dashboard 2026
          </span>
        </Link>

        {/* Hidden measurement div — invisible, off-screen; used to measure link widths */}
        <div
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none absolute flex items-center"
          style={{ top: -999, left: 0, visibility: "hidden" }}
        >
          {links.map((link) => (
            <span
              key={link.href}
              data-ml={link.href}
              className="flex-shrink-0 px-3 py-2 text-sm font-semibold uppercase tracking-wide"
            >
              {link.label}
            </span>
          ))}
          <span
            data-more
            className="flex items-center gap-1 px-3 py-2 text-sm font-semibold uppercase tracking-wide"
          >
            More
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {/* Desktop nav with overflow handling */}
        <nav
          ref={navRef}
          className="hidden sm:flex items-center overflow-hidden flex-1 min-w-0"
        >
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex-shrink-0 px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                isActive(link.href)
                  ? "text-f1-accent"
                  : "text-f1-text-muted hover:text-f1-text"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-f1-red" />
              )}
            </Link>
          ))}

          {/* "More" overflow dropdown */}
          {overflowLinks.length > 0 && (
            <div ref={moreDropRef} className="relative flex-shrink-0">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                className={`relative flex items-center gap-1 px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  overflowLinks.some((l) => isActive(l.href))
                    ? "text-f1-accent"
                    : "text-f1-text-muted hover:text-f1-text"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {overflowLinks.some((l) => isActive(l.href)) && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-f1-red" />
                )}
              </button>

              {moreOpen && (
                <div className="absolute left-0 top-full mt-1 min-w-[140px] rounded-xl border border-f1-border/50 bg-f1-card/80 acrylic py-1 shadow-xl z-50">
                  {overflowLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`block px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                        isActive(link.href)
                          ? "text-f1-accent"
                          : "text-f1-text-muted hover:text-f1-text"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Session countdown / live pill — hidden on small screens */}
        <div className="hidden md:flex flex-shrink-0">
          <SessionPill session={nextSession} isLive={isLive} />
        </div>

        {/* Mobile hamburger button */}
        <button
          className="sm:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-lg border border-f1-border text-f1-text-muted hover:text-f1-text hover:border-f1-text-muted transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        >
          {mobileOpen ? (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile full menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-f1-border/40 bg-f1-black/75 acrylic-lg">
          <nav className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive(link.href)
                    ? "bg-f1-accent/10 text-f1-accent border border-f1-accent/20"
                    : "text-f1-text-muted hover:bg-f1-card/50 hover:text-f1-text"
                }`}
              >
                {isActive(link.href) && (
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-f1-red" />
                )}
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-f1-border pt-3 px-3 pb-1">
              <SessionPill session={nextSession} isLive={isLive} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
