/**
 * Profile image URLs for F1 drivers and team cars.
 *
 * Driver headshots use the F1 official media CDN (Cloudinary-backed). We pass
 * a chain of Cloudinary directives BEFORE the asset path:
 *   - `f_auto`  — serve modern formats (AVIF/WebP) when supported
 *   - `q_auto`  — automatic quality (smaller payloads, faster load)
 *   - `w_400`   — cap width for headshots (the source is huge)
 *   - `d_driver_fallback_image.png` — silhouette placeholder if missing
 *
 * The CDN organises drivers by the first letter of their given name and uses
 * a code built from the first 3 chars of first + last name (e.g. MAXVER01).
 * When a driver switches teams mid-career the numeric suffix is incremented
 * (MAXVER01 → MAXVER02) so the CDN serves the new-livery portrait; those
 * per-driver bumps live in `driverOverrides.ts`.
 *
 * Team car images are transparent-background renders from the F1 official CDN.
 * For each team we provide an ordered list of candidate URLs (newest season
 * first); the CarImage component tries each in turn until one loads.
 */

import { DRIVER_OVERRIDES_2026 } from "./driverOverrides";
import {
  DRIVER_PORTRAITS,
  TEAM_PORTRAITS,
  type DriverPortraitEntry,
  type TeamPortraitEntry,
} from "./portraitsManifest.generated";
import {
  LOCAL_DRIVER_PORTRAITS,
  LOCAL_TEAM_PORTRAITS,
} from "./portraitsLocal";

export type { DriverPortraitEntry, TeamPortraitEntry };

const F1_CDN = "https://media.formula1.com";
const CAR_YEAR = "2026";
const CAR_YEAR_FALLBACK = "2025";

/**
 * Cache-bust suffix. Derived from the build-time app version (which CI bumps
 * on every release) so users always refetch driver/team images after an
 * update without needing to manually bump a magic string. A sane fallback
 * keeps dev builds working even without the env var.
 */
const IMG_CACHE_BUST =
  process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.npm_package_version ?? "2026.04.16";
const IMG_VERSION = `?v=${IMG_CACHE_BUST}`;

/** Cloudinary transformations applied to every driver headshot. */
const DRIVER_TRANSFORMS = "f_auto,q_auto,w_400,d_driver_fallback_image.png";
/** Cloudinary transformations applied to every team car render. */
const CAR_TRANSFORMS = "f_auto,q_auto,w_800";
/** Transformations for the small driver number-logos. */
const NUMBER_TRANSFORMS = "f_auto,q_auto,w_200,d_default_fallback_en.png";

/**
 * Build a driver headshot URL using the current F1 CDN pattern.
 * Pattern: /drivers/{FirstInitial}/{CODE}_{Given_Family}/{code}.png
 */
function driverUrl(firstInitial: string, code: string, givenName: string, familyName: string): string {
  return `${F1_CDN}/${DRIVER_TRANSFORMS}/content/dam/fom-website/drivers/${firstInitial}/${code}_${givenName}_${familyName}/${code.toLowerCase()}.png.transform/4col/image.png${IMG_VERSION}`;
}

/** Maps Ergast driverId -> F1 official race-suit headshot URL */
export const DRIVER_IMAGES: Record<string, string> = {
  max_verstappen: driverUrl("M", "MAXVER01", "Max", "Verstappen"),
  hamilton:   driverUrl("L", "LEWHAM01", "Lewis", "Hamilton"),
  leclerc:    driverUrl("C", "CHALEC01", "Charles", "Leclerc"),
  norris:     driverUrl("L", "LANNOR01", "Lando", "Norris"),
  piastri:    driverUrl("O", "OSCPIA01", "Oscar", "Piastri"),
  russell:    driverUrl("G", "GEORUS01", "George", "Russell"),
  antonelli:  driverUrl("K", "KIMANT01", "Kimi", "Antonelli"),
  alonso:     driverUrl("F", "FERALO01", "Fernando", "Alonso"),
  stroll:     driverUrl("L", "LANSTR01", "Lance", "Stroll"),
  gasly:      driverUrl("P", "PIEGAS01", "Pierre", "Gasly"),
  albon:      driverUrl("A", "ALEALB01", "Alex", "Albon"),
  sainz:      driverUrl("C", "CARSAI01", "Carlos", "Sainz"),
  colapinto:  driverUrl("F", "FRACOL01", "Franco", "Colapinto"),
  ocon:       driverUrl("E", "ESTOCO01", "Esteban", "Ocon"),
  bearman:    driverUrl("O", "OLIBEA01", "Oliver", "Bearman"),
  hulkenberg: driverUrl("N", "NICHUL01", "Nico", "Hulkenberg"),
  bortoleto:  driverUrl("G", "GABBOR01", "Gabriel", "Bortoleto"),
  hadjar:     driverUrl("I", "ISAHAD01", "Isack", "Hadjar"),
  lawson:     driverUrl("L", "LIALAW01", "Liam", "Lawson"),
  lindblad:   driverUrl("A", "ARVLIN01", "Arvid", "Lindblad"),
  // Cadillac (new 2026 entrant)
  bottas:     driverUrl("V", "VALBOT01", "Valtteri", "Bottas"),
  perez:      driverUrl("S", "SERPER01", "Sergio", "Perez"),
};

/** Build a team car image URL with the CDN transform suffix. */
function carUrl(year: string, teamSlug: string): string {
  return `${F1_CDN}/${CAR_TRANSFORMS}/content/dam/fom-website/teams/${year}/${teamSlug}.png.transform/4col/image.png${IMG_VERSION}`;
}

/** Maps Ergast constructorId -> F1 official transparent car-render PNG */
export const TEAM_CAR_IMAGES: Record<string, string[]> = {
  red_bull:          [carUrl(CAR_YEAR, "red-bull-racing"), carUrl(CAR_YEAR_FALLBACK, "red-bull-racing")],
  ferrari:           [carUrl(CAR_YEAR, "ferrari"), carUrl(CAR_YEAR_FALLBACK, "ferrari")],
  mclaren:           [carUrl(CAR_YEAR, "mclaren"), carUrl(CAR_YEAR_FALLBACK, "mclaren")],
  mercedes:          [carUrl(CAR_YEAR, "mercedes"), carUrl(CAR_YEAR_FALLBACK, "mercedes")],
  aston_martin:      [carUrl(CAR_YEAR, "aston-martin"), carUrl(CAR_YEAR_FALLBACK, "aston-martin")],
  alpine:            [carUrl(CAR_YEAR, "alpine"), carUrl(CAR_YEAR_FALLBACK, "alpine")],
  williams:          [carUrl(CAR_YEAR, "williams"), carUrl(CAR_YEAR_FALLBACK, "williams")],
  haas:              [carUrl(CAR_YEAR, "tgr-haas"), carUrl(CAR_YEAR, "haas"), carUrl(CAR_YEAR_FALLBACK, "haas")],
  rb:                [carUrl(CAR_YEAR, "racing-bulls"), carUrl(CAR_YEAR, "rb"), carUrl(CAR_YEAR_FALLBACK, "rb")],
  racing_bulls:      [carUrl(CAR_YEAR, "racing-bulls"), carUrl(CAR_YEAR, "rb"), carUrl(CAR_YEAR_FALLBACK, "rb")],
  audi:              [carUrl(CAR_YEAR, "audi"), carUrl(CAR_YEAR, "kick-sauber"), carUrl(CAR_YEAR_FALLBACK, "kick-sauber")],
  kick_sauber:       [carUrl(CAR_YEAR, "audi"), carUrl(CAR_YEAR, "kick-sauber"), carUrl(CAR_YEAR_FALLBACK, "kick-sauber")],
  sauber:            [carUrl(CAR_YEAR, "audi"), carUrl(CAR_YEAR, "kick-sauber"), carUrl(CAR_YEAR_FALLBACK, "kick-sauber")],
  cadillac:          [carUrl(CAR_YEAR, "cadillac")],
  andretti_cadillac: [carUrl(CAR_YEAR, "cadillac")],
};

/**
 * Official F1 CDN slugs for driver number logo images.
 */
const DRIVER_NUMBER_SLUGS: Record<string, string> = {
  max_verstappen:  "MAXVER01",
  hamilton:    "LEWHAM01",
  leclerc:     "CHALEC01",
  norris:      "LANNOR01",
  piastri:     "OSCPIA01",
  russell:     "GEORUS01",
  antonelli:   "KIMANT01",
  alonso:      "FERALO01",
  stroll:      "LANSTR01",
  gasly:       "PIEGAS01",
  albon:       "ALEALB01",
  sainz:       "CARSAI01",
  colapinto:   "FRACOL01",
  ocon:        "ESTOCO01",
  bearman:     "OLIBEA01",
  hulkenberg:  "NICHUL01",
  bortoleto:   "GABBOR01",
  hadjar:      "ISAHAD01",
  lawson:      "LIALAW01",
  lindblad:    "ARVLIN01",
  // Cadillac (new 2026 entrant)
  bottas:      "VALBOT01",
  perez:       "SERPER01",
};

/**
 * Resolve the canonical CDN slug for a driver, honouring 2026 overrides
 * (e.g. Bortoleto's fresh Audi portrait uses GABBOR02 rather than GABBOR01).
 */
function resolveDriverSlug(driverId: string): string | undefined {
  return DRIVER_OVERRIDES_2026[driverId]?.assetCode ?? DRIVER_NUMBER_SLUGS[driverId];
}

/** Computed (legacy) headshot URL — used as fallback if the manifest is empty. */
function computedDriverImageUrl(driverId: string): string | undefined {
  const override = DRIVER_OVERRIDES_2026[driverId];
  if (override?.assetCode && override.assetInitial && override.assetGiven && override.assetFamily) {
    return driverUrl(override.assetInitial, override.assetCode, override.assetGiven, override.assetFamily);
  }
  return DRIVER_IMAGES[driverId];
}

/**
 * Primary driver portrait URL.
 *
 * Prefers (in order):
 *   1. The full-body card image scraped from F1.com's /en/drivers tiles
 *      (committed to portraitsManifest.generated.ts via `npm run sync-portraits`)
 *   2. The square headshot scraped from F1.com
 *   3. The local backup .webp in public/portraits/drivers
 *   4. The deterministic media.formula1.com URL built from driver name/code
 *
 * The fallback chain in DriverImage handles the case where a primary URL 404s.
 */
export function getDriverImageUrl(driverId: string): string | undefined {
  const manifest: DriverPortraitEntry | undefined = DRIVER_PORTRAITS[driverId];
  return (
    manifest?.card ??
    manifest?.headshot ??
    LOCAL_DRIVER_PORTRAITS[driverId]?.card ??
    computedDriverImageUrl(driverId)
  );
}

/**
 * Returns a fallback portrait URL to use when the primary asset hasn't loaded.
 * Walks down the same tier list as the primary, stopping one rung lower so
 * DriverImage can transparently retry.
 */
export function getDriverImageFallbackUrl(driverId: string): string | undefined {
  const manifest: DriverPortraitEntry | undefined = DRIVER_PORTRAITS[driverId];
  if (manifest?.card && manifest.headshot) return manifest.headshot;
  if (manifest?.card || manifest?.headshot) {
    return LOCAL_DRIVER_PORTRAITS[driverId]?.card ?? computedDriverImageUrl(driverId);
  }
  if (LOCAL_DRIVER_PORTRAITS[driverId]?.card) return computedDriverImageUrl(driverId);
  if (DRIVER_OVERRIDES_2026[driverId]?.assetCode) return DRIVER_IMAGES[driverId];
  return undefined;
}

/**
 * Full-body card-style portrait — manifest if synced, otherwise the local
 * backup .webp. Returns undefined only when neither layer has the driver.
 */
export function getDriverCardImageUrl(driverId: string): string | undefined {
  return DRIVER_PORTRAITS[driverId]?.card ?? LOCAL_DRIVER_PORTRAITS[driverId]?.card;
}

/** Helmet thumbnail when F1.com exposes one. */
export function getDriverHelmetUrl(driverId: string): string | undefined {
  return DRIVER_PORTRAITS[driverId]?.helmet;
}

export function getDriverNumberUrl(driverId: string): string | undefined {
  const manifest = DRIVER_PORTRAITS[driverId]?.number;
  if (manifest) return manifest;
  const slug = resolveDriverSlug(driverId);
  if (!slug) return undefined;
  return `${F1_CDN}/${NUMBER_TRANSFORMS}/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${slug}.png${IMG_VERSION}`;
}

/**
 * Returns an array of candidate URLs for the team car image, ordered by
 * preference: synced manifest URL, then the local backup .webp in
 * public/portraits/teams, then the deterministic media.formula1.com guesses.
 * CarImage walks the list until one loads successfully.
 */
export function getTeamCarImageUrls(constructorId: string): string[] | undefined {
  const manifest: TeamPortraitEntry | undefined = TEAM_PORTRAITS[constructorId];
  const local = LOCAL_TEAM_PORTRAITS[constructorId]?.car;
  const computed = TEAM_CAR_IMAGES[constructorId] ?? [];
  const candidates: string[] = [];
  if (manifest?.car) candidates.push(manifest.car);
  if (local) candidates.push(local);
  candidates.push(...computed);
  return candidates.length > 0 ? candidates : undefined;
}

/** Returns the first (preferred) URL for backwards compatibility. */
export function getTeamCarImageUrl(constructorId: string): string | undefined {
  const urls = getTeamCarImageUrls(constructorId);
  return urls?.[0];
}

/** Team logo / badge URL when F1.com exposes one on /en/teams. */
export function getTeamLogoUrl(constructorId: string): string | undefined {
  return TEAM_PORTRAITS[constructorId]?.logo;
}
