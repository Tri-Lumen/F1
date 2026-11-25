import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildManifests, extractAssets } from "./portraits-parse.mjs";

const fx = (n) => readFileSync(fileURLToPath(new URL(`./fixtures/${n}`, import.meta.url)), "utf8");
const drivers = fx("portraits-drivers.html");
const teams = fx("portraits-teams.html");

describe("portraits parsing", () => {
  it("ignores the fallback placeholder embedded in each URL", () => {
    const { drivers: d, teams: t } = extractAssets(drivers);
    expect([...d.keys()].sort()).toEqual(["carsai", "lannor", "newdrv", "olibea"]);
    expect(t.size).toBe(0);
    expect(extractAssets(teams).teams.has("fallback")).toBe(false);
  });

  it("associates by basename and keeps the real asset URL", () => {
    const { driverManifest } = buildManifests(drivers, teams);
    expect(driverManifest.norris.card).toMatch(/2026mclarenlannor01right\.webp$/);
    expect(driverManifest.sainz.card).toMatch(/2026williamscarsai01right\.webp$/);
    expect(driverManifest.bearman.card).toMatch(/2026haasf1teamolibea01right\.webp$/);
  });

  it("prefers the largest transform variant (incl. srcset) for teams", () => {
    const { teamManifest } = buildManifests(drivers, teams);
    expect(teamManifest.williams.car).toContain("h_448");
    expect(teamManifest.haas.car).toMatch(/2026haasf1teamcarright\.webp$/);
    expect(teamManifest.mclaren.car).toMatch(/2026mclarencarright\.webp$/);
  });

  it("reports unmapped drivers/teams instead of dropping silently", () => {
    const r = buildManifests(drivers, teams);
    expect(r.unknownDrivers).toEqual(["newdrv"]);
    expect(r.unknownTeams).toEqual(["zzz"]);
  });
});
