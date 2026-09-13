export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDriverStandings,
  getConstructorStandings,
  getRaceSchedule,
  getAllSeasonResults,
  getNextScheduledSession,
  getTodaySessions,
  getRaceDate,
  getMaxPointsForRound,
  getTeamColor,
  getCountryFlagByCountry,
} from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";
import { buildStudioRaceCardData } from "@/lib/raceCards";
import LeaderHero from "@/components/LeaderHero";
import ChampionshipBar from "@/components/ChampionshipBar";
import StudioDriverRow from "@/components/StudioDriverRow";
import StudioConstructorRow from "@/components/StudioConstructorRow";
import StudioRaceCard from "@/components/StudioRaceCard";
import type { StudioRaceCardData } from "@/components/StudioRaceCard";
import StudioNextRaceCard from "@/components/StudioNextRaceCard";
import LiveSessionBanner from "@/components/LiveSessionBanner";
import { LocalTime } from "@/components/LocalDateTime";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import SectionHeading from "@/components/SectionHeading";
import EmptyState from "@/components/EmptyState";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

export const metadata: Metadata = {
  title: "Dashboard — F1 2026",
  description:
    "Season overview with championship standings and race results for the 2026 season",
};

async function DashboardContent() {
  const [driverStandings, constructorStandings, races, allResults, nextSession, todaySessions] =
    await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
      getRaceSchedule(),
      getAllSeasonResults(),
      getNextScheduledSession(),
      getTodaySessions(),
    ]);

  // Single pass over the schedule: classify completed vs upcoming and find
  // the next race in one walk so we don't re-parse race dates three times.
  const now = new Date();
  let completedCount = 0;
  let nextRace: typeof races[number] | undefined;
  for (const r of races) {
    if (getRaceDate(r) <= now) completedCount++;
    else if (!nextRace) nextRace = r;
  }
  const totalRaces = races.length;

  // Compute recent form: last 5 race positions per driver
  const completedWithResults = allResults.filter((r) => (r.Results?.length ?? 0) > 0);
  const recentRacesForForm = completedWithResults.slice(-5);
  const formData: Record<string, number[]> = {};
  for (const race of recentRacesForForm) {
    for (const result of race.Results ?? []) {
      const driverId = result.Driver.driverId;
      const pos = parseInt(result.position, 10);
      if (!formData[driverId]) formData[driverId] = [];
      formData[driverId].push(isNaN(pos) ? 20 : pos);
    }
  }

  // Recent race cards (last 3 completed, newest first)
  const recentRaces: StudioRaceCardData[] = completedWithResults
    .slice(-3)
    .reverse()
    .map(buildStudioRaceCardData);

  const leader = driverStandings[0];
  const second = driverStandings[1];
  const maxConstructorPts = constructorStandings[0]
    ? parseFloat(constructorStandings[0].points)
    : 0;
  const leaderPts = leader ? parseFloat(leader.points) : 0;
  const nextSessionISO = nextSession?.date.toISOString() ?? "";

  if (!leader || !second) {
    return (
      <EmptyState
        title="Season data not yet available"
        hint="Standings will appear here once the season opens. Check back soon."
      />
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <LiveSessionBanner />
      </Suspense>

      {/* Today's Sessions Widget */}
      {todaySessions.length > 0 && (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl px-[18px] py-3"
          style={{
            border: "1px solid color-mix(in srgb, var(--color-f1-accent) 30%, var(--color-f1-border))",
            background: "color-mix(in srgb, var(--color-f1-accent) 6%, var(--color-f1-dark))",
          }}
        >
          <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", color: "var(--color-f1-accent)", textTransform: "uppercase" }}>
            📅 Today
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {todaySessions.map((s) => (
              <div
                key={s.type + s.round}
                style={{
                  background: "color-mix(in srgb, var(--color-f1-accent) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-f1-accent) 25%, transparent)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontFamily: DM,
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 700 }}>{s.type}</span>
                <span style={{ color: "var(--color-f1-text-muted)", marginLeft: 6 }}>
                  {getCountryFlagByCountry(s.country)} {s.raceName.replace(" Grand Prix", " GP")} ·{" "}
                  <LocalTime iso={s.date.toISOString()} withZone />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <LeaderHero
        leader={leader}
        second={second}
        completedRaces={completedCount}
        totalRaces={totalRaces}
      />

      {/* Championship stacked bar */}
      {constructorStandings.length > 0 && (
        <CardShell className="mb-[18px] px-[18px] py-3.5">
          <ChampionshipBar standings={constructorStandings} />
        </CardShell>
      )}

      {/* standings (×2) + next race */}
      <div className="mb-[18px] grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Driver standings — spans 2 cols on large screens */}
        <CardShell className="overflow-hidden lg:col-span-2">
          <SectionHeading
            variant="card"
            title="Driver Standings"
            action={
              <span
                className="text-[9px] uppercase tracking-[0.1em] text-f1-text-muted"
                style={{ fontFamily: DM }}
              >
                pts · last 5 form
              </span>
            }
          />
          {driverStandings.slice(0, 10).map((s, i) => (
            <StudioDriverRow
              key={s.Driver.driverId}
              standing={s}
              rank={i + 1}
              form={formData[s.Driver.driverId] ?? []}
              leaderPts={leaderPts}
              delay={i * 45 + 150}
            />
          ))}
        </CardShell>

        {/* Next race card */}
        {nextRace ? (
          <StudioNextRaceCard race={nextRace} nextSessionDate={nextSessionISO} />
        ) : (
          <EmptyState title="No upcoming race scheduled" />
        )}
      </div>

      {/* Championship Battle Card */}
      {driverStandings.length >= 2 && (() => {
        const p1 = driverStandings[0];
        const p2 = driverStandings[1];
        const p1Pts = parseFloat(p1.points);
        const p2Pts = parseFloat(p2.points);
        const gap = p1Pts - p2Pts;
        const totalRemaining = races
          .filter((r) => getRaceDate(r) > now)
          .reduce((sum, r) => sum + getMaxPointsForRound(!!r.Sprint), 0);
        const p1Cid = getDriverConstructorId(p1.Driver.driverId, p1.Constructors[0]?.constructorId) ?? "";
        const p2Cid = getDriverConstructorId(p2.Driver.driverId, p2.Constructors[0]?.constructorId) ?? "";
        const p1Color = getTeamColor(p1Cid);
        const p2Color = getTeamColor(p2Cid);
        const totalPts = p1Pts + p2Pts || 1;
        const p1Pct = Math.round((p1Pts / totalPts) * 100);
        return (
          <CardShell className="mb-[18px] px-[18px] py-3.5">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: "0.04em" }}>Championship Battle</span>
              <span style={{ fontFamily: DM, fontSize: 10, color: "var(--color-f1-text-muted)" }}>
                {races.length - completedCount} races left · {totalRemaining} pts available
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: BC, fontWeight: 900, fontSize: 16, color: p1Color }}>{p1.Driver.familyName.toUpperCase()}</span>
                <span style={{ fontFamily: BC, fontWeight: 900, fontSize: 22, color: p1Color, marginLeft: 8 }}>{p1.points}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 11, color: "var(--color-f1-text-muted)" }}>GAP</span>
                <div style={{ fontFamily: BC, fontWeight: 900, fontSize: 20, color: p1Color }}>–{gap.toFixed(0)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: BC, fontWeight: 900, fontSize: 22, color: p2Color }}>{p2.points}</span>
                <span style={{ fontFamily: BC, fontWeight: 900, fontSize: 16, color: p2Color, marginLeft: 8 }}>{p2.Driver.familyName.toUpperCase()}</span>
              </div>
            </div>
            {/* Battle bar */}
            <div style={{ height: 6, borderRadius: 3, background: "var(--color-f1-black)", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${p1Pct}%`, background: p1Color, transition: "width 0.6s" }} />
              <div style={{ flex: 1, background: p2Color, opacity: 0.7 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontFamily: DM, fontSize: 9, color: "var(--color-f1-text-muted)" }}>P1 · {p1Pct}%</span>
              {gap <= totalRemaining && (
                <span style={{ fontFamily: DM, fontSize: 9, color: "var(--color-f1-text-muted)" }}>P2 can still catch</span>
              )}
              {gap > totalRemaining && (
                <span style={{ fontFamily: DM, fontSize: 9, color: p1Color }}>Title mathematically close</span>
              )}
            </div>
          </CardShell>
        );
      })()}

      {/* constructors + recent results */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Constructor standings */}
        <CardShell className="overflow-hidden">
          <SectionHeading variant="card" title="Constructors" />
          {constructorStandings.map((s, i) => (
            <StudioConstructorRow
              key={s.Constructor.constructorId}
              standing={s}
              maxPts={maxConstructorPts}
              delay={i * 50 + 200}
            />
          ))}
        </CardShell>

        {/* Recent race results */}
        <div>
          <SectionHeading variant="label" title="Recent Results" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentRaces.map((r, i) => (
              <StudioRaceCard key={r.round} race={r} delay={i * 80 + 200} />
            ))}
            {recentRaces.length === 0 && (
              <EmptyState title="No race results yet this season" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="2026 Season · championship standings, battles & recent results"
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-f1-card animate-pulse" />
            ))}
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </>
  );
}
