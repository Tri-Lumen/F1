export const revalidate = 60;

import type { Metadata } from "next";
import { getDriverStandings, getConstructorStandings, getAllSeasonResults } from "@/lib/api";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = {
  title: "Favorites — F1 2026",
  description: "Your pinned drivers and teams with personalized stats at a glance",
};

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
