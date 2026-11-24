import { describe, expect, it } from "vitest";
import { classifyAsset, parseDrivers, parseTeams } from "./portraitParse.mjs";

const CDN = "https://media.formula1.com/image/upload";
const FALLBACK = "d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp";
const driverImg = (w, team, code, file = `2026${team.replace(/-/g, "")}${code}01right`) =>
  `<img src="${CDN}/c_lfill,w_${w}/q_auto/${FALLBACK}/v1740000001/common/f1/2026/${team}/${code}01/${file}.webp" alt="" role="presentation"/>`;
const carImg = (slug) =>
  `<img src="${CDN}/c_lfill,w_800/q_auto/v1740000001/common/f1/2026/${slug}/2026${slug}carright.webp" alt="" role="presentation"/>`;
const logoImg = (slug) =>
  `<img src="${CDN}/c_lfill,w_48/q_auto/v1740000001/common/f1/2026/${slug}/2026${slug}logowhite.webp" alt="" role="presentation"/>`;

describe("classifyAsset", () => {
  it("splits driver basenames into team slug and 6-letter code", () => {
    const a = classifyAsset(
      `${CDN}/c_lfill,w_440/q_auto/v1/common/f1/2026/haasf1team/olibea01/2026haasf1teamolibea01right.webp`,
    );
    expect(a).toMatchObject({ kind: "driver", year: 2026, slug: "haasf1team", code: "olibea" });
  });
  it("recognises car renders and ignores unrelated assets", () => {
    expect(classifyAsset(`${CDN}/v1/x/2026mclarencarright.webp`)).toMatchObject({ kind: "car", slug: "mclaren" });
    expect(classifyAsset(`${CDN}/v1/x/2026fallbackdriverright.webp`)).toBeNull();
    expect(classifyAsset(`${CDN}/v1/x/hero-banner.jpg`)).toBeNull();
  });
});

describe("parseDrivers", () => {
  const html = [
    driverImg(440, "mclaren", "lannor"),
    driverImg(440, "mercedes", "andant"),
    driverImg(440, "haasf1team", "olibea"),
    driverImg(440, "redbullracing", "maxver"),
    driverImg(440, "somenewteam", "newdrv"),
  ].join("\n");

  it("maps assets to driverIds by code, regardless of alt text or path", () => {
    const { manifest, unmapped } = parseDrivers(html);
    expect(Object.keys(manifest).sort()).toEqual(["antonelli", "bearman", "max_verstappen", "norris"]);
    expect(manifest.norris.card).toContain("2026mclarenlannor01right.webp");
    expect(unmapped).toEqual(["newdrv"]);
  });

  it("picks the widest rendition and ignores stale seasons", () => {
    const stale = driverImg(900, "mclaren", "lannor").replaceAll("2026", "2024");
    const { manifest } = parseDrivers(driverImg(160, "mclaren", "lannor") + driverImg(440, "mclaren", "lannor") + stale);
    expect(manifest.norris.card).toContain("w_440");
    expect(manifest.norris.card).toContain("/2026/");
  });

  it("returns nothing for markup without matching assets", () => {
    expect(parseDrivers('<img src="/x.png" alt="Lando Norris">').manifest).toEqual({});
  });
});

describe("parseTeams", () => {
  it("collects car + logo per team and ignores driver thumbnails", () => {
    const html = [
      carImg("mclaren"),
      logoImg("mclaren"),
      driverImg(40, "mclaren", "lannor"),
      carImg("haasf1team"),
      carImg("racingbulls"),
      carImg("mystery"),
    ].join("\n");
    const { manifest, unmapped } = parseTeams(html);
    expect(Object.keys(manifest).sort()).toEqual(["haas", "mclaren", "rb"]);
    expect(manifest.mclaren.car).toContain("2026mclarencarright.webp");
    expect(manifest.mclaren.logo).toContain("2026mclarenlogowhite.webp");
    expect(unmapped).toEqual(["mystery"]);
  });
});
