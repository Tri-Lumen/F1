/**
 * Profile image URLs for F1 drivers and team cars.
 *
 * Driver headshots use the F1 official media CDN with the Cloudinary
 * `d_driver_fallback_image.png` overlay — if a driver's photo doesn't exist
 * at the given path, Cloudinary automatically serves a silhouette placeholder.
 *
 * The CDN organises drivers by the first letter of their given name and uses
 * a code built from the first 3 chars of first + last name (e.g. MAXVER01).
 *
 * Team car images are transparent-background renders from the F1 official CDN.
 */

const F1_CDN = "https://media.formula1.com";
const CAR_YEAR = "2026";
const CAR_YEAR_FALLBACK = "2025";

/**
 * Build a driver headshot URL using the current F1 CDN pattern.
 * Pattern: /drivers/{FirstInitial}/{CODE}_{Given_Family}/{code}.png
 */
function driverUrl(firstInitial: string, code: string, givenName: string, familyName: string): string {
  return `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${firstInitial}/${code}_${givenName}_${familyName}/${code.toLowerCase()}.png.transform/1col/image.png`;
}

/** Maps Ergast driverId -> F1 official race-suit headshot URL */
export const DRIVER_IMAGES: Record<string, string> = {
  verstappen: driverUrl("M", "MAXVER01", "Max", "Verstappen"),
  hamilton:   driverUrl("L", "LEWHAM01", "Lewis", "Hamilton"),
  leclerc:    driverUrl("C", "CHALEC01", "Charles", "Leclerc"),
  norris:     driverUrl("L", "LANNOR01", "Lando", "Norris"),
  piastri:    driverUrl("O", "OSCPIA01", "Oscar", "Piastri"),
  russell:    driverUrl("G", "GEORUS01", "George", "Russell"),
  antonelli:  driverUrl("K", "KIMANT01", "Kimi", "Antonelli"),
  alonso:     driverUrl("F", "FERALO01", "Fernando", "Alonso"),
  stroll:     driverUrl("L", "LANSTR01", "Lance", "Stroll"),
  gasly:      driverUrl("P", "PIEGAS01", "Pierre", "Gasly"),
  doohan:     driverUrl("J", "JACDOO01", "Jack", "Doohan"),
  albon:      driverUrl("A", "ALEALB01", "Alex", "Albon"),
  sainz:      driverUrl("C", "CARSAI01", "Carlos", "Sainz"),
  colapinto:  driverUrl("F", "FRACOL01", "Franco", "Colapinto"),
  ocon:       driverUrl("E", "ESTOCO01", "Esteban", "Ocon"),
  bearman:    driverUrl("O", "OLIBEA01", "Oliver", "Bearman"),
  hulkenberg: driverUrl("N", "NICHUL01", "Nico", "Hulkenberg"),
  bortoleto:  driverUrl("G", "GABBOR01", "Gabriel", "Bortoleto"),
  tsunoda:    driverUrl("Y", "YUKTSU01", "Yuki", "Tsunoda"),
  hadjar:     driverUrl("I", "ISAHAD01", "Isack", "Hadjar"),
  lawson:     driverUrl("L", "LIALAW01", "Liam", "Lawson"),
};

/** Build a team car image URL with the CDN transform suffix. */
function carUrl(year: string, teamSlug: string): string {
  return `${F1_CDN}/content/dam/fom-website/teams/${year}/${teamSlug}.png.transform/2col/image.png`;
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
  haas:              [carUrl(CAR_YEAR, "haas"), carUrl(CAR_YEAR_FALLBACK, "haas")],
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
 * URL pattern: {F1_CDN}/d_default_fallback_en.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/{slug}.png
 */
const DRIVER_NUMBER_SLUGS: Record<string, string> = {
  verstappen:  "MAXVER01",
  hamilton:    "LEWHAM01",
  leclerc:     "CHALEC01",
  norris:      "LANNOR01",
  piastri:     "OSCPIA01",
  russell:     "GEORUS01",
  antonelli:   "KIMANT01",
  alonso:      "FERALO01",
  stroll:      "LANSTR01",
  gasly:       "PIEGAS01",
  doohan:      "JACDOO01",
  albon:       "ALEALB01",
  sainz:       "CARSAI01",
  colapinto:   "FRACOL01",
  ocon:        "ESTOCO01",
  bearman:     "OLIBEA01",
  hulkenberg:  "NICHUL01",
  bortoleto:   "GABBOR01",
  tsunoda:     "YUKTSU01",
  hadjar:      "ISAHAD01",
  lawson:      "LIALAW01",
};

export function getDriverImageUrl(driverId: string): string | undefined {
  return DRIVER_IMAGES[driverId];
}

export function getDriverNumberUrl(driverId: string): string | undefined {
  const slug = DRIVER_NUMBER_SLUGS[driverId];
  if (!slug) return undefined;
  return `${F1_CDN}/d_default_fallback_en.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${slug}.png`;
}

/**
 * Returns an array of candidate URLs for the team car image, ordered by
 * preference (2026 first, then 2025 fallback). The CarImage component
 * tries each URL until one loads successfully.
 */
export function getTeamCarImageUrls(constructorId: string): string[] | undefined {
  return TEAM_CAR_IMAGES[constructorId];
}

/** Returns the first (preferred) URL for backwards compatibility. */
export function getTeamCarImageUrl(constructorId: string): string | undefined {
  const urls = TEAM_CAR_IMAGES[constructorId];
  return urls?.[0];
}
