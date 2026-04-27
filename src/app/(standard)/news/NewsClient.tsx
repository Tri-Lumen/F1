"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRssFeeds } from "@/lib/RssFeedContext";
import { F1_DRIVERS_2026, SPECIAL_LIVERIES_2026 } from "@/lib/rssFeeds";
import { getTeamColor } from "@/lib/api";
import type { RssArticle } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function ArticleCard({ article }: { article: RssArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-f1-border/50 bg-f1-card/60 acrylic overflow-hidden hover:border-f1-accent/40 transition-all"
    >
      {article.imageUrl && (
        <div className="relative h-40 w-full overflow-hidden bg-f1-dark">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-f1-accent bg-f1-accent/10 px-2 py-0.5 rounded-full">
            {article.source}
          </span>
          <span className="text-[10px] text-f1-text-muted">{timeAgo(article.pubDate)}</span>
        </div>
        <h3 className="font-bold text-sm leading-tight group-hover:text-f1-accent transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="mt-2 text-xs text-f1-text-muted line-clamp-2">
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}

function SpecialLiveriesSection() {
  return (
    <section className="mb-10">
      <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-f1-accent to-f1-accent-secondary" />
        Special Liveries
      </h2>
      <p className="text-sm text-f1-text-muted mb-4">
        Notable one-off and special liveries from the 2026 season
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPECIAL_LIVERIES_2026.map((livery) => {
          const teamColor = getTeamColor(livery.constructorId);
          return (
            <div
              key={livery.id}
              className="rounded-xl border-2 overflow-hidden bg-f1-card/60 acrylic transition-all hover:border-opacity-70"
              style={{ borderColor: teamColor + "60" }}
            >
              {/* Team colour gradient header */}
              <div
                className="h-24 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${teamColor}30, ${teamColor}10, transparent)`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-4xl font-black opacity-10"
                    style={{ color: teamColor }}
                  >
                    F1
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: teamColor }}
                  >
                    {livery.event}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-1 h-12 rounded-full"
                    style={{ backgroundColor: teamColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm leading-tight">
                      {livery.title}
                    </h3>
                    <p className="text-xs text-f1-text-muted mt-0.5">{livery.team}</p>
                    <p className="text-xs text-f1-text-muted mt-2 leading-relaxed">
                      {livery.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DriverFilterBar({
  driverFilter,
  toggleDriverFilter,
  clearDriverFilter,
}: {
  driverFilter: string[];
  toggleDriverFilter: (id: string) => void;
  clearDriverFilter: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleDrivers = expanded ? F1_DRIVERS_2026 : F1_DRIVERS_2026.slice(0, 10);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-f1-text-muted font-semibold">
          Filter by Driver
        </p>
        {driverFilter.length > 0 && (
          <button
            onClick={clearDriverFilter}
            className="text-[10px] text-f1-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleDrivers.map((driver) => {
          const active = driverFilter.includes(driver.id);
          return (
            <button
              key={driver.id}
              onClick={() => toggleDriverFilter(driver.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                active
                  ? "bg-f1-accent text-white"
                  : "bg-f1-card border border-f1-border/50 text-f1-text-muted hover:text-f1-text hover:border-f1-text-muted"
              }`}
            >
              {driver.name.split(" ").pop()}
            </button>
          );
        })}
        {!expanded && F1_DRIVERS_2026.length > 10 && (
          <button
            onClick={() => setExpanded(true)}
            className="rounded-full px-3 py-1 text-xs font-semibold bg-f1-dark text-f1-text-muted hover:text-f1-text transition-colors"
          >
            +{F1_DRIVERS_2026.length - 10} more
          </button>
        )}
      </div>
    </div>
  );
}

function FeedSourceBar({
  feeds,
  toggleFeed,
}: {
  feeds: { id: string; name: string; enabled: boolean }[];
  toggleFeed: (id: string) => void;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wider text-f1-text-muted font-semibold mb-2">
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {feeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => toggleFeed(feed.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              feed.enabled
                ? "bg-f1-accent/15 text-f1-accent border border-f1-accent/30"
                : "bg-f1-card border border-f1-border/50 text-f1-text-muted/50 hover:text-f1-text-muted hover:border-f1-text-muted"
            }`}
          >
            {feed.name}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-f1-text-muted/60 mt-2">
        Click to toggle sources on/off. Manage all feeds in{" "}
        <Link href="/settings" className="text-f1-accent hover:underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}

export default function NewsClient() {
  const { feeds, toggleFeed, driverFilter, toggleDriverFilter, clearDriverFilter, mounted } =
    useRssFeeds();
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"news" | "liveries">("news");

  const enabledFeeds = useMemo(() => feeds.filter((f) => f.enabled), [feeds]);

  useEffect(() => {
    if (!mounted) return;
    if (enabledFeeds.length === 0) {
      setArticles([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const feedParam = JSON.stringify(
      enabledFeeds.map((f) => ({ id: f.id, name: f.name, url: f.url }))
    );

    fetch(`/api/rss?feeds=${encodeURIComponent(feedParam)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setArticles(data.articles ?? []);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError("Failed to fetch news feeds");
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [enabledFeeds, mounted]);

  // Filter articles by driver keywords
  const filteredArticles = useMemo(() => {
    if (driverFilter.length === 0) return articles;
    const activeKeywords = F1_DRIVERS_2026.filter((d) =>
      driverFilter.includes(d.id)
    ).flatMap((d) => d.keywords);

    return articles.filter((article) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      return activeKeywords.some((kw) => text.includes(kw.toLowerCase()));
    });
  }, [articles, driverFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-f1-red">F1</span> News
        </h1>
        <p className="mt-1 text-sm text-f1-text-muted">
          Latest headlines from top F1 news sources, filterable by driver
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-f1-border/40">
        <button
          onClick={() => setActiveTab("news")}
          className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "news"
              ? "text-f1-accent"
              : "text-f1-text-muted hover:text-f1-text"
          }`}
        >
          News Feed
          {activeTab === "news" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-f1-accent rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("liveries")}
          className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "liveries"
              ? "text-f1-accent"
              : "text-f1-text-muted hover:text-f1-text"
          }`}
        >
          Special Liveries
          {activeTab === "liveries" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-f1-accent rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "liveries" ? (
        <SpecialLiveriesSection />
      ) : (
        <>
          {/* Feed source toggles */}
          <FeedSourceBar feeds={feeds} toggleFeed={toggleFeed} />

          {/* Driver filter */}
          <DriverFilterBar
            driverFilter={driverFilter}
            toggleDriverFilter={toggleDriverFilter}
            clearDriverFilter={clearDriverFilter}
          />

          {/* Loading state */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-f1-border/50 bg-f1-card/60 overflow-hidden"
                >
                  <div className="h-40 bg-f1-dark animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-20 rounded bg-f1-dark animate-pulse" />
                    <div className="h-4 w-full rounded bg-f1-dark animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-f1-dark animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-xl border border-f1-red/30 bg-f1-red/10 p-6 text-center">
              <p className="text-sm font-semibold text-f1-red">{error}</p>
              <p className="text-xs text-f1-text-muted mt-1">
                Check your feed configuration in Settings
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && enabledFeeds.length === 0 && (
            <div className="rounded-xl border border-f1-border/50 bg-f1-card/60 p-12 text-center">
              <svg
                className="mx-auto h-10 w-10 text-f1-text-muted/40 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                />
              </svg>
              <p className="text-sm font-semibold text-f1-text-muted">No feeds enabled</p>
              <p className="text-xs text-f1-text-muted/60 mt-1">
                Enable at least one feed source above or in{" "}
                <Link href="/settings" className="text-f1-accent hover:underline">
                  Settings
                </Link>
              </p>
            </div>
          )}

          {/* No results for driver filter */}
          {!loading && !error && filteredArticles.length === 0 && articles.length > 0 && driverFilter.length > 0 && (
            <div className="rounded-xl border border-f1-border/50 bg-f1-card/60 p-8 text-center">
              <p className="text-sm font-semibold text-f1-text-muted">
                No articles found for the selected driver(s)
              </p>
              <button
                onClick={clearDriverFilter}
                className="mt-2 text-xs text-f1-accent hover:underline"
              >
                Clear driver filter
              </button>
            </div>
          )}

          {/* Articles grid */}
          {!loading && !error && filteredArticles.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-f1-text-muted">
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}
                  {driverFilter.length > 0 && " (filtered)"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article, i) => (
                  <ArticleCard key={`${article.sourceId}-${i}`} article={article} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
