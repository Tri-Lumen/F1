"use client";

import { useEffect, useState, useCallback } from "react";

const LEAD_OPTIONS = [5, 10, 15, 30] as const;
type Lead = (typeof LEAD_OPTIONS)[number];

export default function NotifyButton({
  sessionDate,
  sessionType,
  raceName,
}: {
  sessionDate: string;
  sessionType: string;
  raceName: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [lead, setLead] = useState<Lead>(10);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
    const savedEnabled = localStorage.getItem("f1-notify") === "true";
    const savedLead = parseInt(localStorage.getItem("f1-notify-lead") ?? "10");
    setEnabled(savedEnabled);
    setLead((LEAD_OPTIONS.includes(savedLead as Lead) ? savedLead : 10) as Lead);
  }, []);

  const scheduleNotification = useCallback(() => {
    const fireAt = new Date(sessionDate).getTime() - lead * 60_000;
    const delay = fireAt - Date.now();
    if (delay <= 0) return;

    const id = setTimeout(() => {
      try {
        new Notification(`${sessionType} starting in ${lead} min`, {
          body: raceName,
          icon: "/favicon.ico",
        });
      } catch {
        // Notification API unavailable at fire time — silently ignore
      }
    }, delay);

    return () => clearTimeout(id);
  }, [sessionDate, sessionType, raceName, lead]);

  useEffect(() => {
    if (!mounted || !enabled || permission !== "granted") return;
    return scheduleNotification();
  }, [mounted, enabled, permission, scheduleNotification]);

  async function toggle() {
    if (!enabled) {
      if (permission !== "granted") {
        let result: NotificationPermission;
        try {
          result = await Notification.requestPermission();
        } catch {
          return;
        }
        setPermission(result);
        if (result !== "granted") return;
      }
      localStorage.setItem("f1-notify", "true");
      setEnabled(true);
    } else {
      localStorage.setItem("f1-notify", "false");
      setEnabled(false);
    }
  }

  function changeLead(minutes: Lead) {
    setLead(minutes);
    localStorage.setItem("f1-notify-lead", String(minutes));
  }

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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={toggle}
        title={
          enabled
            ? `Notifications on — ${lead} min before session starts`
            : "Notify me before this session starts"
        }
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          enabled
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
        {enabled ? `Notify ${lead}m before` : "Notify me"}
      </button>

      {enabled && (
        <select
          value={lead}
          onChange={(e) => changeLead(parseInt(e.target.value) as Lead)}
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
