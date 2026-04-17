"use client";

import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useRef, useState } from "react";

function RefreshButton({
  intervalMs: intervalMsProp,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  // Read the user's preferred refresh interval from localStorage (set in Settings).
  // Falls back to the prop, then 30 s.
  const [intervalMs, setIntervalMs] = useState(intervalMsProp ?? 30000);
  useEffect(() => {
    const stored = localStorage.getItem("f1-refresh-interval");
    if (stored) {
      const seconds = parseInt(stored, 10);
      if (seconds > 0) setIntervalMs(seconds * 1000);
    }
  }, []);

  const intervalRef = useRef(intervalMs);
  intervalRef.current = intervalMs;

  const [countdown, setCountdown] = useState(intervalMs / 1000);

  const refresh = useCallback(() => {
    router.refresh();
    setCountdown(intervalRef.current / 1000);
  }, [router]);

  // Reset countdown when intervalMs changes (e.g. after reading localStorage)
  useEffect(() => {
    setCountdown(intervalMs / 1000);
  }, [intervalMs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          refresh();
          return intervalRef.current / 1000;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <button
      onClick={refresh}
      className="flex items-center gap-2 rounded-lg bg-f1-card px-3 py-1.5 text-xs text-f1-text-muted hover:bg-f1-card-hover transition-colors"
    >
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
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>
        {countdown <= 0 ? "Refreshing…" : `Auto-refresh in ${countdown}s`}
      </span>
    </button>
  );
}

export default memo(RefreshButton);
