/**
 * Local portrait backup.
 *
 * These .webp assets live in `public/portraits/` and ship with the build, so
 * the dashboard renders correct 2026 driver and team imagery even when the
 * F1.com sync hasn't been run (and even with no outbound network at all —
 * useful for the Electron desktop builds and air-gapped Docker deployments).
 *
 * profileImages.ts consults the manifest first, then this local backup, then
 * falls back to the deterministic media.formula1.com URL.
 *
 * Update this file when the asset bundle in `public/portraits/` changes —
 * it's hand-maintained, not generated.
 */

export interface LocalDriverPortrait {
  card: string;
}

export interface LocalTeamPortrait {
  car: string;
}

const D = "/portraits/drivers";
const T = "/portraits/teams";

export const LOCAL_DRIVER_PORTRAITS: Record<string, LocalDriverPortrait> = {
  max_verstappen: { card: `${D}/2026redbullracingmaxver01right.webp` },
  hadjar:         { card: `${D}/2026redbullracingisahad01right.webp` },
  lindblad:       { card: `${D}/2026racingbullsarvlin01right.webp` },
  lawson:         { card: `${D}/2026racingbullslialaw01right.webp` },
  leclerc:        { card: `${D}/2026ferrarichalec01right.webp` },
  hamilton:       { card: `${D}/2026ferrarilewham01right.webp` },
  norris:         { card: `${D}/2026mclarenlannor01right.webp` },
  piastri:        { card: `${D}/2026mclarenoscpia01right.webp` },
  russell:        { card: `${D}/2026mercedesgeorus01right.webp` },
  antonelli:      { card: `${D}/2026mercedesandant01right.webp` },
  alonso:         { card: `${D}/2026astonmartinferalo01right.webp` },
  stroll:         { card: `${D}/2026astonmartinlanstr01right.webp` },
  gasly:          { card: `${D}/2026alpinepiegas01right.webp` },
  colapinto:      { card: `${D}/2026alpinefracol01right.webp` },
  albon:          { card: `${D}/2026williamsalealb01right.webp` },
  sainz:          { card: `${D}/2026williamscarsai01right.webp` },
  bortoleto:      { card: `${D}/2026audigabbor01right.webp` },
  hulkenberg:     { card: `${D}/2026audinichul01right.webp` },
  ocon:           { card: `${D}/2026haasf1teamestoco01right.webp` },
  bearman:        { card: `${D}/2026haasf1teamolibea01right.webp` },
  bottas:         { card: `${D}/2026cadillacvalbot01right.webp` },
  perez:          { card: `${D}/2026cadillacserper01right.webp` },
};

export const LOCAL_TEAM_PORTRAITS: Record<string, LocalTeamPortrait> = {
  red_bull:     { car: `${T}/2026redbullracingcarright.webp` },
  ferrari:      { car: `${T}/2026ferraricarright.webp` },
  mclaren:      { car: `${T}/2026mclarencarright.webp` },
  mercedes:     { car: `${T}/2026mercedescarright.webp` },
  aston_martin: { car: `${T}/2026astonmartincarright.webp` },
  alpine:       { car: `${T}/2026alpinecarright.webp` },
  williams:     { car: `${T}/2026williamscarright.webp` },
  haas:         { car: `${T}/2026haasf1teamcarright.webp` },
  rb:           { car: `${T}/2026racingbullscarright.webp` },
  racing_bulls: { car: `${T}/2026racingbullscarright.webp` },
  audi:         { car: `${T}/2026audicarright.webp` },
  kick_sauber:  { car: `${T}/2026audicarright.webp` },
  sauber:       { car: `${T}/2026audicarright.webp` },
  cadillac:     { car: `${T}/2026cadillaccarright.webp` },
};
