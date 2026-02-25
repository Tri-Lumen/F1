"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface FavoritesContextValue {
  /** Up to 3 driverId strings from the Ergast/Jolpica API */
  favoriteDriverIds: string[];
  /** Up to 2 constructorId strings from the Ergast/Jolpica API */
  favoriteTeamIds: string[];
  toggleDriver: (driverId: string) => void;
  toggleTeam: (constructorId: string) => void;
  /** True only after the initial localStorage read completes (avoids SSR mismatch) */
  mounted: boolean;
  hasAnyFavorites: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favoriteDriverIds: [],
  favoriteTeamIds: [],
  toggleDriver: () => {},
  toggleTeam: () => {},
  mounted: false,
  hasAnyFavorites: false,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteDriverIds, setFavoriteDriverIds] = useState<string[]>([]);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Read persisted favourites from localStorage on first mount
  useEffect(() => {
    try {
      const drivers = JSON.parse(localStorage.getItem("f1-fav-drivers") ?? "[]");
      const teams = JSON.parse(localStorage.getItem("f1-fav-teams") ?? "[]");
      if (Array.isArray(drivers)) setFavoriteDriverIds(drivers);
      if (Array.isArray(teams)) setFavoriteTeamIds(teams);
    } catch {
      // ignore parse errors
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("f1-fav-drivers", JSON.stringify(favoriteDriverIds));
  }, [favoriteDriverIds, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("f1-fav-teams", JSON.stringify(favoriteTeamIds));
  }, [favoriteTeamIds, mounted]);

  function toggleDriver(driverId: string) {
    setFavoriteDriverIds((prev) => {
      if (prev.includes(driverId)) return prev.filter((id) => id !== driverId);
      if (prev.length >= 3) return prev; // max 3 drivers
      return [...prev, driverId];
    });
  }

  function toggleTeam(constructorId: string) {
    setFavoriteTeamIds((prev) => {
      if (prev.includes(constructorId)) return prev.filter((id) => id !== constructorId);
      if (prev.length >= 2) return prev; // max 2 teams
      return [...prev, constructorId];
    });
  }

  return (
    <FavoritesContext.Provider
      value={{
        favoriteDriverIds,
        favoriteTeamIds,
        toggleDriver,
        toggleTeam,
        mounted,
        // hasAnyFavorites is false until mounted so the nav link doesn't
        // flash in/out during hydration
        hasAnyFavorites:
          mounted && (favoriteDriverIds.length > 0 || favoriteTeamIds.length > 0),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
