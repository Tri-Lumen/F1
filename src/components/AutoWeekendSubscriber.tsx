"use client";

import { useEffect } from "react";
import { useNotifications } from "@/lib/NotificationContext";

/**
 * Backs the "auto-subscribe to all weekend sessions" setting: when enabled,
 * fetches the remaining sessions of the next race weekend and schedules a
 * notification for each. schedule() de-dupes by session id internally, so
 * re-running this on every mount/toggle is safe. Renders nothing — mounted
 * once at the root layout so it applies regardless of which page is open.
 */
export default function AutoWeekendSubscriber() {
  const { mounted, enabled, autoSubscribeWeekend, permission, schedule } = useNotifications();

  useEffect(() => {
    if (!mounted || !enabled || !autoSubscribeWeekend || permission !== "granted") return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/weekend-sessions", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const sessions: { type: string; raceName: string; date: string }[] = await res.json();
        for (const s of sessions) {
          schedule(s.type, s.raceName, s.date);
        }
      } catch {
        // Best-effort — a failed fetch just means nothing new gets scheduled
        // this tick; the setting stays on and retries on the next mount.
      }
    })();

    return () => {
      cancelled = true;
    };
    // schedule() changes identity when leadMinutes changes; deliberately not
    // a dependency here so this doesn't re-fetch and re-schedule on every
    // lead-time tweak, only on the state changes that actually matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, enabled, autoSubscribeWeekend, permission]);

  return null;
}
