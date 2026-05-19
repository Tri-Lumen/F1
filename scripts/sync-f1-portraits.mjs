#!/usr/bin/env node
/**
 * sync-f1-portraits.mjs
 *
 * Scrapes https://www.formula1.com/en/drivers and
 * https://www.formula1.com/en/teams, extracts the canonical image URLs for
 * each driver and team, and writes them to
 * src/lib/portraitsManifest.generated.ts.
 *
 * Run from a host that has public network access to formula1.com.
 * Containers with a strict egress policy will see HTTP 403 with
 * "x-deny-reason: host_not_allowed" and the script will exit non-zero.
 *
 * No external dependencies — uses Node 20+ global fetch.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "src", "lib", "portraitsManifest.generated.ts");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const DRIVERS_URL = "https://www.formula1.com/en/drivers";
const TEAMS_URL = "https://www.formula1.com/en/teams";

/**
 * Maps the display name F1.com prints under each driver card to the
 * Ergast/Jolpica driverId we use internally. Keep this in sync with the keys
 * in DRIVER_IMAGES / DRIVER_OVERRIDES_2026.
 */
const DRIVER_NAME_TO_ID = {
  "Max Verstappen": "max_verstappen",
  "Lewis Hamilton": "hamilton",
  "Charles Leclerc": "leclerc",
  "Lando Norris": "norris",
  "Oscar Piastri": "piastri",
  "George Russell": "russell",
  "Kimi Antonelli": "antonelli",
  "Andrea Kimi Antonelli": "antonelli",
  "Fernando Alonso": "alonso",
  "Lance Stroll": "stroll",
  "Pierre Gasly": "gasly",
  "Alexander Albon": "albon",
  "Alex Albon": "albon",
  "Carlos Sainz": "sainz",
  "Franco Colapinto": "colapinto",
  "Esteban Ocon": "ocon",
  "Oliver Bearman": "bearman",
  "Nico Hulkenberg": "hulkenberg",
  "Nico Hülkenberg": "hulkenberg",
  "Gabriel Bortoleto": "bortoleto",
  "Isack Hadjar": "hadjar",
  "Liam Lawson": "lawson",
  "Arvid Lindblad": "lindblad",
  "Valtteri Bottas": "bottas",
  "Sergio Perez": "perez",
  "Sergio Pérez": "perez",
};

/** F1.com team display name → Ergast constructorId */
const TEAM_NAME_TO_ID = {
  "Red Bull Racing": "red_bull",
  "Oracle Red Bull Racing": "red_bull",
  "Ferrari": "ferrari",
  "Scuderia Ferrari": "ferrari",
  "Scuderia Ferrari HP": "ferrari",
  "McLaren": "mclaren",
  "McLaren Formula 1 Team": "mclaren",
  "Mercedes": "mercedes",
  "Mercedes-AMG Petronas F1 Team": "mercedes",
  "Aston Martin": "aston_martin",
  "Aston Martin Aramco F1 Team": "aston_martin",
  "Alpine": "alpine",
  "BWT Alpine F1 Team": "alpine",
  "Williams": "williams",
  "Williams Racing": "williams",
  "Haas": "haas",
  "MoneyGram Haas F1 Team": "haas",
  "TGR Haas F1 Team": "haas",
  "Racing Bulls": "rb",
  "Visa Cash App RB": "rb",
  "Visa Cash App Racing Bulls": "rb",
  "Audi": "audi",
  "Audi F1 Team": "audi",
  "Kick Sauber": "audi",
  "Stake F1 Team Kick Sauber": "audi",
  "Cadillac": "cadillac",
  "Cadillac F1 Team": "cadillac",
};

/** Drivers we require to be present — exit non-zero if any are missing. */
const REQUIRED_DRIVERS = Array.from(new Set(Object.values(DRIVER_NAME_TO_ID)));
const REQUIRED_TEAMS = Array.from(new Set(Object.values(TEAM_NAME_TO_ID)));

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    redirect: "follow",
  });
  if (!res.ok) {
    const reason = res.headers.get("x-deny-reason");
    throw new Error(
      `GET ${url} → HTTP ${res.status}` +
        (reason ? ` (deny-reason: ${reason})` : "") +
        ". The host running this script needs public egress to formula1.com."
    );
  }
  return await res.text();
}

/**
 * Extract every `<img src=…>` and `<img srcset=…>` URL on the page, along with
 * the alt text and a window of surrounding HTML (so we can associate the
 * image with a driver/team name).
 */
function extractImages(html) {
  const out = [];
  const tag = /<img\b[^>]*>/gi;
  let m;
  while ((m = tag.exec(html))) {
    const blob = m[0];
    const src = blob.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const srcset = blob.match(/\bsrcset=["']([^"']+)["']/i)?.[1];
    const alt = blob.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "";
    // pick highest-resolution candidate from srcset if present
    let bestSrc = src;
    if (srcset) {
      const candidates = srcset
        .split(",")
        .map((s) => s.trim())
        .map((s) => {
          const [u, w] = s.split(/\s+/);
          return { url: u, w: parseInt(w ?? "0", 10) || 0 };
        })
        .sort((a, b) => b.w - a.w);
      if (candidates[0]?.url) bestSrc = candidates[0].url;
    }
    if (!bestSrc) continue;
    // Look ±400 chars around the tag for the driver/team name
    const start = Math.max(0, m.index - 400);
    const end = Math.min(html.length, m.index + blob.length + 400);
    const context = html.slice(start, end);
    out.push({ src: absolutise(bestSrc), alt, context });
  }
  return out;
}

function absolutise(url) {
  if (!url) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return "https://www.formula1.com" + url;
  return url;
}

/** Classify a CDN URL by its path so we know which manifest field it belongs in. */
function classifyDriverUrl(url) {
  const u = url.toLowerCase();
  if (u.includes("/number-logos/") || u.includes("number_logo")) return "number";
  if (u.includes("helmet")) return "helmet";
  if (u.includes("/headshot") || u.includes("face")) return "headshot";
  // Default: full-body card portrait (the dominant asset on /en/drivers tiles)
  if (u.includes("/drivers/") || u.includes("_driver")) return "card";
  return null;
}

function classifyTeamUrl(url) {
  const u = url.toLowerCase();
  if (u.includes("logo") || u.includes("badge")) return "logo";
  if (u.includes("backplate") || u.includes("background") || u.includes("gradient"))
    return "backplate";
  if (u.includes("/teams/") || u.includes("_car") || u.includes("car-")) return "car";
  return null;
}

/** Build a manifest from the array of {src, alt, context} entries. */
function buildDriverManifest(images) {
  const manifest = {};
  for (const img of images) {
    // Find which driver this image belongs to by scanning the surrounding HTML
    // for a known display name. Longest match wins to handle "Andrea Kimi
    // Antonelli" vs "Kimi Antonelli".
    let matchedName = null;
    for (const name of Object.keys(DRIVER_NAME_TO_ID)) {
      if (img.context.includes(name) || img.alt.includes(name)) {
        if (!matchedName || name.length > matchedName.length) matchedName = name;
      }
    }
    if (!matchedName) continue;
    const id = DRIVER_NAME_TO_ID[matchedName];
    const kind = classifyDriverUrl(img.src);
    if (!kind) continue;
    manifest[id] ??= {};
    // First-write wins for each kind so we don't trample a higher-quality
    // hero image with a thumbnail later in the page.
    if (!manifest[id][kind]) manifest[id][kind] = img.src;
  }
  return manifest;
}

function buildTeamManifest(images) {
  const manifest = {};
  for (const img of images) {
    let matchedName = null;
    for (const name of Object.keys(TEAM_NAME_TO_ID)) {
      if (img.context.includes(name) || img.alt.includes(name)) {
        if (!matchedName || name.length > matchedName.length) matchedName = name;
      }
    }
    if (!matchedName) continue;
    const id = TEAM_NAME_TO_ID[matchedName];
    const kind = classifyTeamUrl(img.src);
    if (!kind) continue;
    manifest[id] ??= {};
    if (!manifest[id][kind]) manifest[id][kind] = img.src;
  }
  return manifest;
}

function serialise(driverManifest, teamManifest) {
  const sortedDrivers = Object.fromEntries(
    Object.entries(driverManifest).sort(([a], [b]) => a.localeCompare(b))
  );
  const sortedTeams = Object.fromEntries(
    Object.entries(teamManifest).sort(([a], [b]) => a.localeCompare(b))
  );
  return (
    `/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Regenerated by scripts/sync-f1-portraits.mjs.
 */

export interface DriverPortraitEntry {
  card?: string;
  headshot?: string;
  number?: string;
  helmet?: string;
}

export interface TeamPortraitEntry {
  car?: string;
  logo?: string;
  backplate?: string;
}

export const DRIVER_PORTRAITS: Record<string, DriverPortraitEntry> = ${JSON.stringify(
      sortedDrivers,
      null,
      2,
    )};

export const TEAM_PORTRAITS: Record<string, TeamPortraitEntry> = ${JSON.stringify(
      sortedTeams,
      null,
      2,
    )};

export const GENERATED_AT = ${JSON.stringify(new Date().toISOString())};
`
  );
}

async function main() {
  console.log("Fetching", DRIVERS_URL);
  const driversHtml = await fetchHtml(DRIVERS_URL);
  console.log("Fetching", TEAMS_URL);
  const teamsHtml = await fetchHtml(TEAMS_URL);

  const driverImages = extractImages(driversHtml);
  const teamImages = extractImages(teamsHtml);
  console.log(
    `Found ${driverImages.length} <img> tags on /drivers, ${teamImages.length} on /teams`,
  );

  const driverManifest = buildDriverManifest(driverImages);
  const teamManifest = buildTeamManifest(teamImages);

  const missingDrivers = REQUIRED_DRIVERS.filter((id) => !driverManifest[id]);
  const missingTeams = REQUIRED_TEAMS.filter((id) => !teamManifest[id]);

  console.log(
    `Matched ${Object.keys(driverManifest).length}/${REQUIRED_DRIVERS.length} drivers, ` +
      `${Object.keys(teamManifest).length}/${REQUIRED_TEAMS.length} teams.`,
  );
  if (missingDrivers.length) console.warn("Missing drivers:", missingDrivers.join(", "));
  if (missingTeams.length) console.warn("Missing teams:", missingTeams.join(", "));

  const out = serialise(driverManifest, teamManifest);
  await writeFile(OUT_PATH, out, "utf8");
  console.log("Wrote", OUT_PATH);

  if (missingDrivers.length || missingTeams.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
