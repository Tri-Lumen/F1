export const revalidate = 300;

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getCompletedSessions, getCountryFlagByCountry, getCurrentYear } from "@/lib/api";
import type { LiveSession } from "@/lib/types";
import { LocalDate, LocalTime } from "@/components/LocalDateTime";

export const metadata: Metadata = {
  title: "Session Replay — F1 2026",
  description:
    "Scrub through any completed session of the 2026 season — positions, intervals, tire strategy, team radio, and race control.",
};

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--color-f1-border)",
  background: "var(--color-f1-dark)",
};

/** Group sessions by meeting_key so all five sessions of a weekend cluster. */
function groupByMeeting(sessions: LiveSession[]): LiveSession[][] {
  const byMeeting = new Map<number, LiveSession[]>();
  for (const s of sessions) {
    const existing = byMeeting.get(s.meeting_key) ?? [];
    existing.push(s);
    byMeeting.set(s.meeting_key, existing);
  }
  // Sort each group by date_start ascending (FP1 → Race)
  for (const group of byMeeting.values()) {
    group.sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
  }
  // Return groups sorted by the latest session in each, descending (newest weekend first)
  return [...byMeeting.values()].sort((a, b) => {
    const aLast = new Date(a[a.length - 1].date_start).getTime();
    const bLast = new Date(b[b.length - 1].date_start).getTime();
    return bLast - aLast;
  });
}

async function ReplayContent() {
  const sessions = await getCompletedSessions();

  if (sessions.length === 0) {
    return (
      <div style={{ ...cardStyle, padding: 24, textAlign: "center" }}>
        <p style={{ fontFamily: DM, fontSize: 13, color: "var(--color-f1-text-muted)" }}>
          No completed sessions yet for the {getCurrentYear()} season.{" "}
          <Link href="/races" style={{ color: "var(--color-f1-accent)" }}>
            View the calendar
          </Link>
          .
        </p>
      </div>
    );
  }

  const groups = groupByMeeting(sessions);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {groups.map((group) => {
        const headline = group[group.length - 1];
        const flag = getCountryFlagByCountry(headline.country_name);
        return (
          <div key={headline.meeting_key} style={{ ...cardStyle, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--color-f1-border)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: BC,
                    fontWeight: 900,
                    fontSize: 20,
                    letterSpacing: "0.02em",
                  }}
                >
                  {flag} {headline.country_name}
                </div>
                <div
                  style={{
                    fontFamily: DM,
                    fontSize: 11,
                    color: "var(--color-f1-text-muted)",
                    marginTop: 2,
                  }}
                >
                  {headline.circuit_short_name} · <LocalDate iso={headline.date_start} />
                </div>
              </div>
              <span
                style={{
                  fontFamily: BC,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: "var(--color-f1-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                {group.length} session{group.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {group.map((s) => (
                <li
                  key={s.session_key}
                  style={{ borderBottom: "1px solid var(--color-f1-border)" }}
                >
                  <Link
                    href={`/replay/${s.session_key}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 18px",
                      fontFamily: DM,
                      fontSize: 13,
                      color: "var(--color-f1-text)",
                      textDecoration: "none",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BC,
                        fontWeight: 800,
                        fontSize: 14,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {s.session_name}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "var(--color-f1-text-muted)",
                      }}
                    >
                      <LocalDate iso={s.date_start} /> · <LocalTime iso={s.date_start} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function ReplayIndexPage() {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: "0.02em",
            margin: 0,
          }}
        >
          Session Replay
        </h1>
        <p
          style={{
            fontFamily: DM,
            fontSize: 12,
            color: "var(--color-f1-text-muted)",
            marginTop: 4,
          }}
        >
          Scrub through any completed session of the {getCurrentYear()} season.
        </p>
      </div>
      <Suspense
        fallback={<div className="h-48 rounded-xl bg-f1-card animate-pulse" />}
      >
        <ReplayContent />
      </Suspense>
    </>
  );
}
