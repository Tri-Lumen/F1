import type { RssArticle } from "@/lib/types";
import { AsciiHeader, Panel } from "../kit";
import "@/app/ascii/news.css";

/*
 * ASCII view of the /news headline list. Rendered by NewsClient next to the standard
 * markup and shown only under html[data-style="ascii"]. It receives the articles the
 * client already holds (after the driver filter), so it does no fetching of its own.
 * Row styles live in src/app/ascii/news.css.
 */

export interface NewsViewProps {
  articles: RssArticle[];
  loading: boolean;
  error: string | null;
  sourcesOn: number;
  filtered: boolean;
}

function shortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NewsView({ articles, loading, error, sourcesOn, filtered }: NewsViewProps) {
  return (
    <div className="f1-ascii-dash f1-ascii-news">
      <AsciiHeader
        title="F1 News"
        subtitle="Latest headlines from top F1 news sources, filterable by driver"
      />

      {sourcesOn === 0 && (
        <p className="f1-a-muted">No news sources are enabled. Turn them on in Settings.</p>
      )}
      {sourcesOn > 0 && loading && <p className="f1-a-muted">Loading headlines…</p>}
      {sourcesOn > 0 && error && !loading && (
        <p className="f1-a-accent">Could not load headlines: {error}</p>
      )}
      {sourcesOn > 0 && !loading && !error && articles.length === 0 && (
        <p className="f1-a-muted">
          {filtered ? "No headlines match the driver filter." : "No headlines yet."}
        </p>
      )}

      {!loading && !error && articles.length > 0 && (
        <Panel label={`Headlines · ${articles.length}${filtered ? " (filtered)" : ""}`}>
          <div className="f1-a-table">
            <div className="nw-row nw-head">
              <span>TITLE</span>
              <span>SOURCE</span>
              <span className="nw-date">DATE</span>
            </div>
            {articles.map((a, i) => (
              <a
                key={`${a.sourceId}-${i}`}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="nw-row"
              >
                <span className="nw-title">{a.title}</span>
                <span className="nw-source f1-a-muted">{a.source}</span>
                <span className="nw-date f1-a-muted">{shortDate(a.pubDate)}</span>
              </a>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
