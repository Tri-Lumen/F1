"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

export type SearchKind = "page" | "driver" | "team" | "race";

export interface SearchItem {
  label: string;
  sublabel?: string;
  href: string;
  kind: SearchKind;
  /** Team/accent colour for the leading dot (drivers & teams) */
  color?: string;
  /** Extra terms to match against (e.g. driver code, country) */
  keywords?: string;
}

const KIND_LABEL: Record<SearchKind, string> = {
  page: "Page",
  driver: "Driver",
  team: "Team",
  race: "Race",
};

/** Event any component can dispatch to open the palette (used by the nav button). */
export const OPEN_PALETTE_EVENT = "open-command-palette";

function score(item: SearchItem, q: string): number {
  const hay = `${item.label} ${item.sublabel ?? ""} ${item.keywords ?? ""}`.toLowerCase();
  const label = item.label.toLowerCase();
  if (!q) return item.kind === "page" ? 1 : 0;
  if (!hay.includes(q)) return -1;
  if (label === q) return 100;
  if (label.startsWith(q)) return 50;
  if (label.includes(q)) return 25;
  return 10;
}

const RECENT_SEARCHES_KEY = "f1-cmd-recent";
const MAX_RECENT = 5;

function loadRecent(): SearchItem[] {
  try {
    const raw = sessionStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchItem[];
  } catch {
    return [];
  }
}

function saveRecent(item: SearchItem) {
  try {
    const prev = loadRecent().filter((r) => r.href !== item.href);
    const next = [item, ...prev].slice(0, MAX_RECENT);
    sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {}
}

export default function CommandPalette({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  // Global Cmd/Ctrl+K toggle + custom open event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  // Focus the input when opened and load recent searches
  useEffect(() => {
    if (open) {
      setRecentSearches(loadRecent());
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .map((item) => ({ item, s: score(item, q) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 25)
      .map((r) => r.item);
  }, [items, query]);

  const showRecent = !query && recentSearches.length > 0;
  // Single flat list backing keyboard nav — must match render order exactly
  // (recent searches first, then the results list) so `active` always
  // indexes the item actually highlighted on screen.
  const visibleItems = useMemo(
    () => (showRecent ? [...recentSearches, ...results] : results),
    [showRecent, recentSearches, results]
  );

  // Keep active index in range when results change
  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = useCallback(
    (item: SearchItem | undefined) => {
      if (!item) return;
      saveRecent(item);
      close();
      router.push(item.href);
    },
    [close, router]
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, visibleItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(visibleItems[active]);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center px-4 pt-[12vh]"
      onMouseDown={close}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-f1-border bg-f1-card shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="flex items-center gap-3 border-b border-f1-border px-4 py-3">
          <svg
            className="h-4 w-4 shrink-0 text-f1-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m1.35-5.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search drivers, teams, races, pages…"
            className="w-full bg-transparent text-sm text-f1-text placeholder:text-f1-text-muted/60 focus:outline-none"
            style={{ fontFamily: DM }}
          />
          <kbd className="hidden shrink-0 rounded border border-f1-border px-1.5 py-0.5 text-[10px] text-f1-text-muted sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-1.5">
          {/* Recent searches shown when query is empty */}
          {showRecent && (
            <div>
              <p className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-f1-text-muted/50 font-semibold">
                Recent
              </p>
              {recentSearches.map((item, i) => (
                <button
                  key={`recent-${item.href}`}
                  data-idx={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                    i === active ? "bg-f1-accent/10" : "hover:bg-f1-card-hover"
                  }`}
                >
                  <span className="h-5 w-5 shrink-0 flex items-center justify-center text-f1-text-muted/40">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-f1-text" style={{ fontFamily: BC, letterSpacing: "0.01em" }}>
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="block truncate text-xs text-f1-text-muted">{item.sublabel}</span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-f1-dark px-2 py-0.5 text-[10px] uppercase tracking-wider text-f1-text-muted">
                    {KIND_LABEL[item.kind]}
                  </span>
                </button>
              ))}
              <div className="mx-4 my-1.5 border-t border-f1-border/40" />
            </div>
          )}

          {results.length === 0 && query ? (
            <p className="px-4 py-8 text-center text-sm text-f1-text-muted">
              No matches for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((item, i) => {
              const idx = showRecent ? i + recentSearches.length : i;
              return (
                <button
                  key={`${item.kind}-${item.href}`}
                  data-idx={idx}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                    idx === active ? "bg-f1-accent/10" : "hover:bg-f1-card-hover"
                  }`}
                >
                  <span
                    className="h-5 w-1 shrink-0 rounded-full"
                    style={{ background: item.color ?? "var(--color-f1-text-muted)" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-sm font-semibold text-f1-text"
                      style={{ fontFamily: BC, letterSpacing: "0.01em" }}
                    >
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="block truncate text-xs text-f1-text-muted">
                        {item.sublabel}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-f1-dark px-2 py-0.5 text-[10px] uppercase tracking-wider text-f1-text-muted">
                    {KIND_LABEL[item.kind]}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
