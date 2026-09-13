import { Suspense } from "react";
import { getDriverStandings, getLatestSession, isSessionLive } from "@/lib/api";
import AppShell from "@/components/AppShell";
import CommandPaletteLoader from "@/components/CommandPaletteLoader";

export default async function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [standings, latestSession] = await Promise.all([
    getDriverStandings(),
    getLatestSession().catch((err) => {
      console.error("[layout] getLatestSession failed:", err);
      return null;
    }),
  ]);
  const hasLiveSession = latestSession ? isSessionLive(latestSession) : false;

  return (
    <>
      <AppShell standings={standings} hasLiveSession={hasLiveSession}>{children}</AppShell>
      <Suspense fallback={null}>
        <CommandPaletteLoader />
      </Suspense>
    </>
  );
}
