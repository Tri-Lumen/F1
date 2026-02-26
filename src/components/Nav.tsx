"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useFavorites } from "@/lib/FavoritesContext";

const BASE_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/live", label: "Live" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
  { href: "/races", label: "Races" },
  { href: "/compare", label: "Compare" },
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
    // Update every 30s — precise enough for a nav badge
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [session?.date, isLive]);

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
    <div className="flex items-center gap-1.5 rounded-full bg-f1-card border border-f1-border px-3 py-1 text-xs font-semibold text-f1-text-muted">
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

  const links = hasAnyFavorites
    ? [
        BASE_LINKS[0], // Dashboard
        { href: "/favorites", label: "Favourites" },
        ...BASE_LINKS.slice(1),
      ]
    : BASE_LINKS;

  return (
    <header className="sticky top-0 z-50 border-b border-f1-border bg-f1-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-black tracking-tight text-f1-red">
            F1
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-f1-text-muted sm:block">
            Dashboard 2026
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 overflow-x-auto flex-1">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex-shrink-0 px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-f1-text-muted hover:text-f1-text"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-f1-red" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Session countdown / live pill — hidden on small screens */}
        <div className="hidden md:flex flex-shrink-0">
          <SessionPill session={nextSession} isLive={isLive} />
        </div>
      </div>
    </header>
  );
}
