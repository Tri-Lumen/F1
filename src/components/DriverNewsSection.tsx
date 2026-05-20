"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RSS_FEEDS, F1_DRIVERS_2026 } from "@/lib/rssFeeds";
import type { RssArticle } from "@/lib/types";
import SectionLabel from "@/components/SectionLabel";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Driver-scoped news: pulls the default feeds and filters to the given driver's
 * keywords (reuses the same matching logic as the /news page). Renders nothing
 * when there are no matching headlines so it never leaves an empty shell.
 */
export default function DriverNewsSection({
  driverId,
  driverName,
}: {
  driverId: string;
  driverName: string;
}) {
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const driver = F1_DRIVERS_2026.find((d) => d.id === driverId);
  const keywords =
    driver?.keywords ?? [driverName.split(" ").pop()?.toLowerCase() ?? ""];

  useEffect(() => {
    const controller = new AbortController();
    const enabled = DEFAULT_RSS_FEEDS.filter((f) => f.enabled).map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url,
    }));
    const feedParam = encodeURIComponent(JSON.stringify(enabled));

    fetch(`/api/rss?feeds=${feedParam}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const all: RssArticle[] = data.articles ?? [];
        const filtered = all.filter((a) => {
          const text = `${a.title} ${a.description}`.toLowerCase();
          return keywords.some((kw) => kw && text.includes(kw.toLowerCase()));
        });
        setArticles(filtered.slice(0, 6));
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  if (loading) {
    return (
      <div className="mb-6">
        <SectionLabel>Latest News</SectionLabel>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-f1-card" />
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="mb-6">
      <SectionLabel>Latest News</SectionLabel>
      <div className="overflow-hidden rounded-xl border border-f1-border bg-f1-card">
        {articles.map((a, i) => (
          <a
            key={`${a.sourceId}-${i}`}
            href={a.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 border-b border-f1-border/40 px-4 py-3 transition-colors last:border-0 hover:bg-f1-card-hover"
          >
            {a.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.imageUrl}
                alt=""
                loading="lazy"
                className="h-12 w-16 shrink-0 rounded object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold transition-colors group-hover:text-f1-accent">
                {a.title}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-[11px] text-f1-text-muted">
                <span className="font-semibold uppercase tracking-wider text-f1-accent">
                  {a.source}
                </span>
                <span>{timeAgo(a.pubDate)}</span>
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
