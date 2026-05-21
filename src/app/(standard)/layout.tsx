import { Suspense } from "react";
import { getDriverStandings } from "@/lib/api";
import AppShell from "@/components/AppShell";
import CommandPaletteLoader from "@/components/CommandPaletteLoader";

export default async function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const standings = await getDriverStandings();

  return (
    <>
      <AppShell standings={standings}>{children}</AppShell>
      <Suspense fallback={null}>
        <CommandPaletteLoader />
      </Suspense>
    </>
  );
}
