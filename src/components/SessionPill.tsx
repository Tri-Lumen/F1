"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface NavSession {
  type: string;
  raceName: string;
  country: string;
  date: string;
}

interface SessionPillProps {
  session: NavSession | null;
  isLive: boolean;
}

export default function SessionPill({ session, isLive }: SessionPillProps) {
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
