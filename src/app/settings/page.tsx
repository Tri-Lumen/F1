import type { Metadata } from "next";
import { getDriverStandings, getConstructorStandings } from "@/lib/api";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — F1 2026",
  description: "Customize your Delta Dashboard theme, favorites, notifications, and preferences",
};

export default async function SettingsPage() {
  const [availableDrivers, availableTeams] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
  ]);

  return (
    <SettingsClient
      availableDrivers={availableDrivers}
      availableTeams={availableTeams}
    />
  );
}
