import {
  getDriverStandings,
  getConstructorStandings,
  getRaceSchedule,
  getTeamColor,
} from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";
import CommandPalette, { type SearchItem } from "./CommandPalette";

const PAGE_ITEMS: SearchItem[] = [
  { label: "Dashboard", sublabel: "Season overview", href: "/", kind: "page", keywords: "home" },
  { label: "Live Timing", sublabel: "Positions, intervals, radio", href: "/live", kind: "page" },
  { label: "Races", sublabel: "Calendar & results", href: "/races", kind: "page" },
  { label: "Drivers", sublabel: "Standings & profiles", href: "/drivers", kind: "page" },
  { label: "Teams", sublabel: "Constructor standings", href: "/teams", kind: "page" },
  { label: "Stats", sublabel: "Season analytics", href: "/stats", kind: "page", keywords: "championship gap" },
  { label: "News", sublabel: "Aggregated F1 headlines", href: "/news", kind: "page" },
  { label: "Compare", sublabel: "Head-to-head drivers", href: "/compare", kind: "page" },
  { label: "Fastest Laps", sublabel: "Fastest-lap rankings", href: "/fastest-laps", kind: "page" },
  { label: "Highlights & Incidents", sublabel: "Season timeline & incident log", href: "/highlights", kind: "page", keywords: "penalties dnf retirements" },
  { label: "Replay", sublabel: "Session replays", href: "/replay", kind: "page" },
  { label: "Pick'em", sublabel: "Predictions game", href: "/predictions", kind: "page" },
  { label: "Archive", sublabel: "Past seasons", href: "/archive", kind: "page" },
  { label: "Favorites", sublabel: "Your pinned drivers & teams", href: "/favorites", kind: "page" },
  { label: "Settings", sublabel: "Theme & preferences", href: "/settings", kind: "page" },
];

/**
 * Server component that assembles the command-palette search index from the
 * standings + schedule already cached by the data layer, then renders the
 * client palette. Mounted once in the standard layout.
 */
export default async function CommandPaletteLoader() {
  const [drivers, constructors, races] = await Promise.all([
    getDriverStandings().catch(() => []),
    getConstructorStandings().catch(() => []),
    getRaceSchedule().catch(() => []),
  ]);

  const driverItems: SearchItem[] = drivers.map((s) => {
    const constructorId =
      getDriverConstructorId(s.Driver.driverId, s.Constructors[0]?.constructorId) ?? "";
    return {
      label: `${s.Driver.givenName} ${s.Driver.familyName}`,
      sublabel: `P${s.position} · ${s.points} pts · ${s.Constructors[0]?.name ?? ""}`,
      href: `/drivers/${s.Driver.driverId}`,
      kind: "driver",
      color: getTeamColor(constructorId),
      keywords: s.Driver.code,
    };
  });

  const teamItems: SearchItem[] = constructors.map((c) => ({
    label: c.Constructor.name,
    sublabel: `P${c.position} · ${c.points} pts`,
    href: `/teams/${c.Constructor.constructorId}`,
    kind: "team",
    color: getTeamColor(c.Constructor.constructorId),
  }));

  const raceItems: SearchItem[] = races.map((r) => ({
    label: r.raceName,
    sublabel: `Round ${r.round} · ${r.Circuit.Location.country}`,
    href: `/race/${r.round}`,
    kind: "race",
    keywords: `${r.Circuit.Location.country} ${r.Circuit.circuitName}`,
  }));

  const items = [...PAGE_ITEMS, ...driverItems, ...teamItems, ...raceItems];

  return <CommandPalette items={items} />;
}
