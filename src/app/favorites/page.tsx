export const dynamic = "force-dynamic";

import { getDriverStandings, getConstructorStandings, getAllSeasonResults } from "@/lib/api";
import FavoritesClient from "./FavoritesClient";

export default async function FavoritesPage() {
  const [driverStandings, constructorStandings, seasonResults] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
    getAllSeasonResults(),
  ]);

  return (
    <FavoritesClient
      driverStandings={driverStandings}
      constructorStandings={constructorStandings}
      seasonResults={seasonResults}
    />
  );
}
