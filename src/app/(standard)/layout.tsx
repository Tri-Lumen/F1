import { getDriverStandings } from "@/lib/api";
import SidebarNav from "@/components/SidebarNav";

export default async function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const standings = await getDriverStandings();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SidebarNav standings={standings} />
      <main style={{ marginLeft: 224, flex: 1, padding: "24px 26px 48px", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
