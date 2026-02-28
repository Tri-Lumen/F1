/**
 * Profile image URLs for F1 drivers and team cars.
 *
 * Driver headshots use the F1 official media CDN with the Cloudinary
 * `d_driver_fallback_image.png` overlay — if a driver's photo doesn't exist
 * at the given path, Cloudinary automatically serves a silhouette placeholder.
 *
 * Team car images are transparent-background renders from the F1 official CDN.
 */

const F1_CDN = "https://media.formula1.com";
const DRIVER_YEAR = "2025";
const CAR_YEAR = "2025";

/** Maps Ergast driverId -> F1 official race-suit headshot URL */
export const DRIVER_IMAGES: Record<string, string> = {
  verstappen: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/VERSTAPPENMAX01_Max_Verstappen/VERSTAPPENMAX01.png`,
  hamilton: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/HAMILTONLEW01_Lewis_Hamilton/HAMILTONLEW01.png`,
  leclerc: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/LECLERCHA01_Charles_Leclerc/LECLERCHA01.png`,
  norris: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/NORRISLAN01_Lando_Norris/NORRISLAN01.png`,
  piastri: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/PIASTRIOS01_Oscar_Piastri/PIASTRIOS01.png`,
  russell: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/RUSSELLGE01_George_Russell/RUSSELLGE01.png`,
  antonelli: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/ANTONELKI01_Kimi_Antonelli/ANTONELKI01.png`,
  alonso: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/ALONSOFER01_Fernando_Alonso/ALONSOFER01.png`,
  stroll: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/STROLLLAN01_Lance_Stroll/STROLLLAN01.png`,
  gasly: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/GASLYPIE01_Pierre_Gasly/GASLYPIE01.png`,
  doohan: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/DOOHANJAC01_Jack_Doohan/DOOHANJAC01.png`,
  albon: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/ALBONALE01_Alex_Albon/ALBONALE01.png`,
  sainz: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/SAINZCAR01_Carlos_Sainz/SAINZCAR01.png`,
  colapinto: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/COLAPFRA01_Franco_Colapinto/COLAPFRA01.png`,
  ocon: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/OCONEST01_Esteban_Ocon/OCONEST01.png`,
  bearman: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/BEARMANOL01_Oliver_Bearman/BEARMANOL01.png`,
  hulkenberg: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/HULKENNIC01_Nico_Hulkenberg/HULKENNIC01.png`,
  bortoleto: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/BORTOLEG01_Gabriel_Bortoleto/BORTOLEG01.png`,
  tsunoda: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/TSUNODAYU01_Yuki_Tsunoda/TSUNODAYU01.png`,
  hadjar: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/HADJARIS01_Isack_Hadjar/HADJARIS01.png`,
  lawson: `${F1_CDN}/d_driver_fallback_image.png/content/dam/fom-website/drivers/${DRIVER_YEAR}/LAWSONLIA01_Liam_Lawson/LAWSONLIA01.png`,
};

/** Maps Ergast constructorId -> F1 official transparent car-render PNG */
export const TEAM_CAR_IMAGES: Record<string, string> = {
  red_bull: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/red-bull-racing.png`,
  ferrari: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/ferrari.png`,
  mclaren: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/mclaren.png`,
  mercedes: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/mercedes.png`,
  aston_martin: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/aston-martin.png`,
  alpine: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/alpine.png`,
  williams: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/williams.png`,
  haas: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/haas.png`,
  rb: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/rb.png`,
  // Audi rebranded from Kick Sauber for 2026 — use the most recent available slug
  audi: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/kick-sauber.png`,
  kick_sauber: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/kick-sauber.png`,
  sauber: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/kick-sauber.png`,
  cadillac: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/cadillac.png`,
  andretti_cadillac: `${F1_CDN}/content/dam/fom-website/teams/${CAR_YEAR}/cadillac.png`,
};

export function getDriverImageUrl(driverId: string): string | undefined {
  return DRIVER_IMAGES[driverId];
}

export function getTeamCarImageUrl(constructorId: string): string | undefined {
  return TEAM_CAR_IMAGES[constructorId];
}
