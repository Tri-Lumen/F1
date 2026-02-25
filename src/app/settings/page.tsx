import { getDriverStandings, getConstructorStandings } from "@/lib/api";
import SettingsClient from "./SettingsClient";

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
