"use client";

import { memo } from "react";
import { useNotifications, LEAD_OPTIONS } from "@/lib/NotificationContext";

function NotifyButton({
  sessionDate,
  sessionType,
  raceName,
}: {
  sessionDate: string;
  sessionType: string;
  raceName: string;
}) {
  const {
    enabled,
    permission,
    leadMinutes,
    scheduled,
    toggle,
    setLeadMinutes,
    schedule,
    cancel,
    mounted,
  } = useNotifications();

  if (!mounted || typeof Notification === "undefined") return null;

  if (permission === "denied") {
    return (
      <p
        className="text-xs text-f1-text-muted/50"
        title="Notifications are blocked — enable them in your browser settings"
      >
        Notifications blocked in browser
      </p>
    );
  }

  const notifId = `${sessionType}-${raceName}-${sessionDate}`;
  const isScheduled = scheduled.some((s) => s.id === notifId);

  async function handleToggle() {
    if (!enabled) {
      // First enable globally, then schedule this session
      await toggle();
      schedule(sessionType, raceName, sessionDate);
    } else if (isScheduled) {
      cancel(notifId);
    } else {
      schedule(sessionType, raceName, sessionDate);
    }
  }

  const active = enabled && isScheduled;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleToggle}
        title={
          active
            ? `Notification set — ${leadMinutes} min before ${sessionType}`
            : "Notify me before this session starts"
        }
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          active
            ? "border-f1-accent/40 bg-f1-accent/10 text-f1-accent"
            : "border-f1-border bg-f1-dark text-f1-text-muted hover:border-f1-text-muted hover:text-f1-text"
        }`}
      >
        {/* Bell icon */}
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {active ? `Notify ${leadMinutes}m before` : "Notify me"}
      </button>

      {active && (
        <select
          value={leadMinutes}
          onChange={(e) => setLeadMinutes(parseInt(e.target.value))}
          className="rounded-lg border border-f1-border bg-f1-dark px-2 py-1.5 text-xs text-f1-text-muted focus:border-f1-accent focus:outline-none"
        >
          {LEAD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} min before
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default memo(NotifyButton);
