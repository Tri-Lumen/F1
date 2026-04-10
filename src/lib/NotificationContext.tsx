"use client";

import { createContext, useContext, useCallback, useEffect, useState, useRef } from "react";

// --- Types ---

export interface ScheduledNotification {
  /** Unique key: `${sessionType}-${raceName}-${sessionDate}` */
  id: string;
  sessionType: string;
  raceName: string;
  /** ISO date string */
  sessionDate: string;
  /** Minutes before session */
  leadMinutes: number;
  /** When the notification fires (computed: sessionDate - leadMinutes) */
  fireAt: number;
  /** Whether it has already fired */
  fired: boolean;
}

export interface NotificationHistoryEntry {
  id: string;
  sessionType: string;
  raceName: string;
  sessionDate: string;
  firedAt: string;
}

interface NotificationContextValue {
  /** Global on/off for notifications */
  enabled: boolean;
  /** Browser Notification permission state */
  permission: NotificationPermission;
  /** Lead time in minutes */
  leadMinutes: number;
  /** Whether to auto-subscribe to all weekend sessions */
  autoSubscribeWeekend: boolean;
  /** Currently scheduled (pending) notifications */
  scheduled: ScheduledNotification[];
  /** History of fired notifications (last 50) */
  history: NotificationHistoryEntry[];
  /** Toggle global enable/disable (requests permission if needed) */
  toggle: () => Promise<void>;
  /** Change the lead time */
  setLeadMinutes: (m: number) => void;
  /** Toggle auto-subscribe to whole weekend */
  setAutoSubscribeWeekend: (v: boolean) => void;
  /** Schedule a notification for a specific session */
  schedule: (sessionType: string, raceName: string, sessionDate: string) => void;
  /** Cancel a scheduled notification */
  cancel: (id: string) => void;
  /** Clear notification history */
  clearHistory: () => void;
  /** True after first mount/localStorage read */
  mounted: boolean;
}

const LEAD_OPTIONS = [5, 10, 15, 30, 60] as const;
export type LeadOption = (typeof LEAD_OPTIONS)[number];
export { LEAD_OPTIONS };

const LS_ENABLED = "f1-notify";
const LS_LEAD = "f1-notify-lead";
const LS_SCHEDULED = "f1-notify-scheduled";
const LS_HISTORY = "f1-notify-history";
const LS_AUTO_WEEKEND = "f1-notify-auto-weekend";
const MAX_HISTORY = 50;

function makeId(sessionType: string, raceName: string, sessionDate: string): string {
  return `${sessionType}-${raceName}-${sessionDate}`;
}

const NotificationContext = createContext<NotificationContextValue>({
  enabled: false,
  permission: "default",
  leadMinutes: 10,
  autoSubscribeWeekend: false,
  scheduled: [],
  history: [],
  toggle: async () => {},
  setLeadMinutes: () => {},
  setAutoSubscribeWeekend: () => {},
  schedule: () => {},
  cancel: () => {},
  clearHistory: () => {},
  mounted: false,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [leadMinutes, setLeadMinutesState] = useState<number>(10);
  const [autoSubscribeWeekend, setAutoSubscribeWeekendState] = useState(false);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [history, setHistory] = useState<NotificationHistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // --- Load from localStorage on mount ---
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
    try {
      setEnabled(localStorage.getItem(LS_ENABLED) === "true");
      const savedLead = parseInt(localStorage.getItem(LS_LEAD) ?? "10", 10);
      setLeadMinutesState((LEAD_OPTIONS as readonly number[]).includes(savedLead) ? savedLead : 10);
      setAutoSubscribeWeekendState(localStorage.getItem(LS_AUTO_WEEKEND) === "true");

      const savedScheduled = JSON.parse(localStorage.getItem(LS_SCHEDULED) ?? "[]");
      if (Array.isArray(savedScheduled)) {
        // Filter out already-past notifications
        const now = Date.now();
        setScheduled(savedScheduled.filter((s: ScheduledNotification) => s.fireAt > now && !s.fired));
      }

      const savedHistory = JSON.parse(localStorage.getItem(LS_HISTORY) ?? "[]");
      if (Array.isArray(savedHistory)) setHistory(savedHistory.slice(0, MAX_HISTORY));
    } catch {
      // ignore parse errors
    }
    setMounted(true);
  }, []);

  // --- Persist scheduled to localStorage ---
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_SCHEDULED, JSON.stringify(scheduled));
    } catch {}
  }, [scheduled, mounted]);

  // --- Persist history to localStorage ---
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(history));
    } catch {}
  }, [history, mounted]);

  // --- Set up timers for all pending notifications ---
  useEffect(() => {
    if (!mounted || !enabled || permission !== "granted") return;

    const now = Date.now();
    const currentTimers = timersRef.current;

    for (const notif of scheduled) {
      if (notif.fired || currentTimers.has(notif.id)) continue;
      const delay = notif.fireAt - now;
      if (delay <= 0) {
        // Already past — fire immediately and mark as fired
        fireNotification(notif);
        continue;
      }

      const timerId = setTimeout(() => {
        fireNotification(notif);
        currentTimers.delete(notif.id);
      }, delay);
      currentTimers.set(notif.id, timerId);
    }

    return () => {
      // Clean up all timers on unmount/re-run
      for (const [id, timerId] of currentTimers.entries()) {
        clearTimeout(timerId);
        currentTimers.delete(id);
      }
    };
  }, [mounted, enabled, permission, scheduled]); // eslint-disable-line react-hooks/exhaustive-deps

  function fireNotification(notif: ScheduledNotification) {
    try {
      new Notification(`${notif.sessionType} starting in ${notif.leadMinutes} min`, {
        body: notif.raceName,
        icon: "/favicon.ico",
      });
    } catch {
      // Notification API unavailable — silently ignore
    }

    // Mark as fired and add to history
    setScheduled((prev) => prev.filter((s) => s.id !== notif.id));
    setHistory((prev) => [
      {
        id: notif.id,
        sessionType: notif.sessionType,
        raceName: notif.raceName,
        sessionDate: notif.sessionDate,
        firedAt: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, MAX_HISTORY));
  }

  const toggle = useCallback(async () => {
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
      localStorage.setItem(LS_ENABLED, "true");
      setEnabled(true);
    } else {
      localStorage.setItem(LS_ENABLED, "false");
      setEnabled(false);
      // Clear all pending timers
      for (const [id, timerId] of timersRef.current.entries()) {
        clearTimeout(timerId);
        timersRef.current.delete(id);
      }
    }
  }, [enabled, permission]);

  const setLeadMinutes = useCallback((m: number) => {
    setLeadMinutesState(m);
    localStorage.setItem(LS_LEAD, String(m));
    // Re-schedule all pending notifications with new lead time
    setScheduled((prev) =>
      prev.map((s) => ({
        ...s,
        leadMinutes: m,
        fireAt: new Date(s.sessionDate).getTime() - m * 60_000,
      }))
    );
  }, []);

  const setAutoSubscribeWeekend = useCallback((v: boolean) => {
    setAutoSubscribeWeekendState(v);
    localStorage.setItem(LS_AUTO_WEEKEND, String(v));
  }, []);

  const schedule = useCallback((sessionType: string, raceName: string, sessionDate: string) => {
    const id = makeId(sessionType, raceName, sessionDate);
    const fireAt = new Date(sessionDate).getTime() - leadMinutes * 60_000;
    if (fireAt <= Date.now()) return; // Already past

    setScheduled((prev) => {
      // Don't duplicate
      if (prev.some((s) => s.id === id)) return prev;
      return [...prev, { id, sessionType, raceName, sessionDate, leadMinutes, fireAt, fired: false }];
    });
  }, [leadMinutes]);

  const cancel = useCallback((id: string) => {
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
    setScheduled((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        enabled,
        permission,
        leadMinutes,
        autoSubscribeWeekend,
        scheduled,
        history,
        toggle,
        setLeadMinutes,
        setAutoSubscribeWeekend,
        schedule,
        cancel,
        clearHistory,
        mounted,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
