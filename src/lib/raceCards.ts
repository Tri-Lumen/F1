import type { Race } from "./types";
import { getDriverConstructorId } from "./driverOverrides";
import type { StudioRaceCardData } from "@/components/StudioRaceCard";

/**
 * Transform a completed Race + its results into the flat shape
 * StudioRaceCard expects.  Centralised so the home page and the
 * /races page can't drift out of sync.
 */
export function buildStudioRaceCardData(race: Race): StudioRaceCardData {
  const results = race.Results ?? [];
  let winner: (typeof results)[number] | undefined;
  let pole: (typeof results)[number] | undefined;
  let fastest: (typeof results)[number] | undefined;
  for (const r of results) {
    if (!winner && r.position === "1") winner = r;
    if (!pole && r.grid === "1") pole = r;
    if (!fastest && r.FastestLap?.rank === "1") fastest = r;
    if (winner && pole && fastest) break;
  }

  const country = race.Circuit?.Location?.country ?? "???";
  return {
    round: race.round,
    name: race.raceName.replace(" Grand Prix", " GP"),
    short: country.slice(0, 3).toUpperCase(),
    date: new Date(race.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    winnerFamily: winner?.Driver.familyName.toUpperCase() ?? "—",
    winnerTeamId:
      getDriverConstructorId(
        winner?.Driver.driverId ?? "",
        winner?.Constructor.constructorId,
      ) ??
      winner?.Constructor.constructorId ??
      "",
    poleFamily: pole ? pole.Driver.familyName.toUpperCase() : null,
    fastestFamily: fastest ? fastest.Driver.familyName.toUpperCase() : null,
  };
}
