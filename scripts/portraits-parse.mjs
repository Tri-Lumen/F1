/**
 * Pure parsing helpers for sync-f1-portraits.mjs (no network, no fs).
 *
 * formula1.com's markup no longer carries stable names/paths next to each
 * <img>, but every asset's *basename* encodes what it is:
 *
 *   driver: 2026mclarenlannor01right.webp  → {year}{teamslug}{6-letter code}{NN}right
 *   team:   2026mclarencarright.webp       → {year}{teamslug}carright
 *
 * so we scan the raw HTML for media.formula1.com URLs and associate by
 * basename instead of by surrounding text or URL path fragments.
 */

/**
 * Ergast driverId → 6-letter CDN code, or several if the site changed it
 * (keep in sync with DRIVER_IMAGES in src/lib/profileImages.ts).
 * Antonelli: formula1.com now uses "andant" (Andrea Kimi Antonelli); profileImages.ts still has KIMANT01.
 */
export const DRIVER_CODES = {
  max_verstappen: "maxver",
  hamilton: "lewham",
  leclerc: "chalec",
  norris: "lannor",
  piastri: "oscpia",
  russell: "georus",
  antonelli: ["andant", "kimant"],
  alonso: "feralo",
  stroll: "lanstr",
  gasly: "piegas",
  albon: "alealb",
  sainz: "carsai",
  colapinto: "fracol",
  ocon: "estoco",
  bearman: "olibea",
  hulkenberg: "nichul",
  bortoleto: "gabbor",
  hadjar: "isahad",
  lawson: "lialaw",
  lindblad: "arvlin",
  bottas: "valbot",
  perez: "serper",
  // Not in profileImages.ts yet; id is a best guess at the Jolpica driverId.
  camara: "rafcam",
};

/** Team slug used in F1.com asset basenames → Ergast constructorId. */
export const TEAM_SLUGS = {
  redbullracing: "red_bull",
  ferrari: "ferrari",
  mclaren: "mclaren",
  mercedes: "mercedes",
  astonmartin: "aston_martin",
  alpine: "alpine",
  williams: "williams",
  haasf1team: "haas",
  racingbulls: "rb",
  audi: "audi",
  cadillac: "cadillac",
};

const URL_RE = /https?:\/\/media\.formula1\.com\/[^"'\s<>()\\]+/g;
const DRIVER_BASENAME = /^(20\d\d)([a-z0-9]+?)([a-z]{6})(\d{2})right\.(?:webp|png|jpg)$/;
const TEAM_BASENAME = /^(20\d\d)([a-z0-9]+?)carright\.(?:webp|png|jpg)$/;

/** Size hint from Cloudinary transforms (c_lfill,w_440 / h_224) used to prefer the largest variant. */
function sizeOf(url) {
  const m = url.match(/[,/](?:w|h)_(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Find every driver / team asset URL in raw HTML. Returns
 * { drivers: Map<code, url>, teams: Map<teamSlug, url> } keeping the largest
 * transform variant of each asset. The "fallback" placeholder assets are ignored.
 */
export function extractAssets(html) {
  const drivers = new Map();
  const teams = new Map();
  const keep = (map, key, url) => {
    const prev = map.get(key);
    if (!prev || sizeOf(url) > sizeOf(prev)) map.set(key, url);
  };
  for (const [url] of html.matchAll(URL_RE)) {
    const base = url.split("?")[0].split("/").pop() ?? "";
    let m = base.match(DRIVER_BASENAME);
    if (m) {
      keep(drivers, m[3], url);
      continue;
    }
    m = base.match(TEAM_BASENAME);
    if (m && m[2] !== "fallback") keep(teams, m[2], url);
  }
  return { drivers, teams };
}

/** Map extracted assets onto our internal ids; anything unrecognised is reported, not dropped silently. */
export function buildManifests(driversHtml, teamsHtml) {
  const codeToId = Object.fromEntries(
    Object.entries(DRIVER_CODES).flatMap(([id, c]) => [c].flat().map((code) => [code, id])),
  );
  const driverManifest = {};
  const teamManifest = {};
  const unknownDrivers = [];
  const unknownTeams = [];

  // Drivers are listed on both pages; /drivers is authoritative, /teams fills gaps.
  for (const html of [driversHtml, teamsHtml]) {
    for (const [code, url] of extractAssets(html).drivers) {
      const id = codeToId[code];
      if (!id) {
        if (!unknownDrivers.includes(code)) unknownDrivers.push(code);
        continue;
      }
      driverManifest[id] ??= { card: url };
    }
  }
  for (const [slug, url] of extractAssets(teamsHtml).teams) {
    const id = TEAM_SLUGS[slug];
    if (!id) {
      unknownTeams.push(slug);
      continue;
    }
    teamManifest[id] = { car: url };
  }
  return { driverManifest, teamManifest, unknownDrivers, unknownTeams };
}
