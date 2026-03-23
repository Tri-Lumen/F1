"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { RssFeedSource } from "./types";
import { DEFAULT_RSS_FEEDS, F1_DRIVERS_2026 } from "./rssFeeds";

interface RssFeedContextValue {
  feeds: RssFeedSource[];
  toggleFeed: (feedId: string) => void;
  setFeedEnabled: (feedId: string, enabled: boolean) => void;
  /** Driver IDs the user wants to filter articles by (empty = show all) */
  driverFilter: string[];
  toggleDriverFilter: (driverId: string) => void;
  clearDriverFilter: () => void;
  mounted: boolean;
}

const RssFeedContext = createContext<RssFeedContextValue>({
  feeds: DEFAULT_RSS_FEEDS,
  toggleFeed: () => {},
  setFeedEnabled: () => {},
  driverFilter: [],
  toggleDriverFilter: () => {},
  clearDriverFilter: () => {},
  mounted: false,
});

export function useRssFeeds() {
  return useContext(RssFeedContext);
}

const STORAGE_KEY_FEEDS = "f1-rss-feeds";
const STORAGE_KEY_DRIVER_FILTER = "f1-rss-driver-filter";

export function RssFeedProvider({ children }: { children: React.ReactNode }) {
  const [feeds, setFeeds] = useState<RssFeedSource[]>(DEFAULT_RSS_FEEDS);
  const [driverFilter, setDriverFilter] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const savedFeeds = localStorage.getItem(STORAGE_KEY_FEEDS);
      if (savedFeeds) {
        const parsed: Record<string, boolean> = JSON.parse(savedFeeds);
        setFeeds((prev) =>
          prev.map((f) => ({
            ...f,
            enabled: parsed[f.id] !== undefined ? parsed[f.id] : f.enabled,
          }))
        );
      }
    } catch {}
    try {
      const savedFilter = localStorage.getItem(STORAGE_KEY_DRIVER_FILTER);
      if (savedFilter) {
        const parsed = JSON.parse(savedFilter);
        if (Array.isArray(parsed)) setDriverFilter(parsed);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Persist feed toggles
  useEffect(() => {
    if (!mounted) return;
    const map: Record<string, boolean> = {};
    feeds.forEach((f) => (map[f.id] = f.enabled));
    try {
      localStorage.setItem(STORAGE_KEY_FEEDS, JSON.stringify(map));
    } catch {}
  }, [feeds, mounted]);

  // Persist driver filter
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY_DRIVER_FILTER, JSON.stringify(driverFilter));
    } catch {}
  }, [driverFilter, mounted]);

  function toggleFeed(feedId: string) {
    setFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, enabled: !f.enabled } : f))
    );
  }

  function setFeedEnabled(feedId: string, enabled: boolean) {
    setFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, enabled } : f))
    );
  }

  function toggleDriverFilter(driverId: string) {
    setDriverFilter((prev) =>
      prev.includes(driverId)
        ? prev.filter((id) => id !== driverId)
        : [...prev, driverId]
    );
  }

  function clearDriverFilter() {
    setDriverFilter([]);
  }

  return (
    <RssFeedContext.Provider
      value={{
        feeds,
        toggleFeed,
        setFeedEnabled,
        driverFilter,
        toggleDriverFilter,
        clearDriverFilter,
        mounted,
      }}
    >
      {children}
    </RssFeedContext.Provider>
  );
}
