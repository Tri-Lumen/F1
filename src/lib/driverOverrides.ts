/**
 * Canonical 2026 F1 driver overrides.
 *
 * Ergast / Jolpica tends to lag real-world mid-season changes — driver numbers
 * reverting after a WDC switch, constructor rebrands (Kick Sauber → Audi),
 * late roster moves — so we keep a small override layer that the rest of the
 * app consults before trusting upstream data.
 *
 * Each entry is keyed by the Ergast driverId.  Any field left undefined means
 * "trust the upstream value".
 */

export interface DriverOverride {
  /** Canonical 2026 permanent number (string to match Ergast's type). */
  number?: string;
  /** Canonical 2026 constructorId (used when the API still shows a prior team). */
  constructorId?: string;
  /** Canonical 2026 constructor display name. */
  constructorName?: string;
  /**
   * Override asset code for the F1 CDN headshot / number logo when the driver
   * has a new portrait (e.g. new team livery for the season).  If omitted, the
   * default slug in profileImages.ts is used.
   */
  assetCode?: string;
  /** First letter used by the CDN folder structure (matches assetCode's first char). */
  assetInitial?: string;
  /** Full given name as it appears in the CDN folder path. */
  assetGiven?: string;
  /** Full family name as it appears in the CDN folder path. */
  assetFamily?: string;
}

/**
 * 2026 season driver overrides.
 *
 * Numbers: Verstappen reverted to his permanent #33 after losing the 2025 WDC;
 * Kimi Antonelli locked in #12; Lindblad takes Perez's old #11 slot at Red Bull.
 *
 * Team rebrand: Sauber → Audi works team.  Bortoleto and Hulkenberg carry over
 * but their portraits are re-shot in Audi overalls — we bump the asset code
 * (e.g. GABBOR01 → GABBOR02) so the CDN serves the new image.  Cadillac
 * brought in Bottas and Perez; their portraits use fresh codes as well.
 */
export const DRIVER_OVERRIDES_2026: Record<string, DriverOverride> = {
  max_verstappen: {
    number: "33",
  },
  leclerc: { number: "16" },
  hamilton: { number: "44" },
  norris: { number: "4" },
  piastri: { number: "81" },
  russell: { number: "63" },
  antonelli: { number: "12" },
  alonso: { number: "14" },
  stroll: { number: "18" },
  gasly: { number: "10" },
  colapinto: { number: "43" },
  albon: { number: "23" },
  sainz: { number: "55" },
  ocon: { number: "31" },
  bearman: { number: "87" },
  // Audi works team — Sauber rebrand.  New livery = refreshed portraits.
  bortoleto: {
    number: "5",
    constructorId: "audi",
    constructorName: "Audi F1 Team",
    assetCode: "GABBOR02",
    assetInitial: "G",
    assetGiven: "Gabriel",
    assetFamily: "Bortoleto",
  },
  hulkenberg: {
    number: "27",
    constructorId: "audi",
    constructorName: "Audi F1 Team",
    assetCode: "NICHUL02",
    assetInitial: "N",
    assetGiven: "Nico",
    assetFamily: "Hulkenberg",
  },
  hadjar: { number: "6" },
  lawson: { number: "30" },
  // Arvid Lindblad promoted to Red Bull for 2026, inherits an available number.
  lindblad: {
    number: "11",
    constructorId: "red_bull",
    constructorName: "Red Bull Racing",
  },
  // Cadillac debut season — both drivers in fresh overalls.
  bottas: {
    number: "77",
    constructorId: "cadillac",
    constructorName: "Cadillac F1 Team",
    assetCode: "VALBOT02",
    assetInitial: "V",
    assetGiven: "Valtteri",
    assetFamily: "Bottas",
  },
  perez: {
    number: "11",
    constructorId: "cadillac",
    constructorName: "Cadillac F1 Team",
    assetCode: "SERPER02",
    assetInitial: "S",
    assetGiven: "Sergio",
    assetFamily: "Perez",
  },
};

export function getDriverOverride(driverId: string): DriverOverride | undefined {
  return DRIVER_OVERRIDES_2026[driverId];
}

/**
 * Returns the canonical 2026 permanent number for a driver, falling back to
 * the upstream value (or a placeholder) when no override exists.
 */
export function getDriverNumber(
  driverId: string,
  upstream: string | undefined,
  fallback: string = "#",
): string {
  return DRIVER_OVERRIDES_2026[driverId]?.number ?? upstream ?? fallback;
}

/**
 * Returns the canonical 2026 constructorId for a driver, preferring the
 * override (for mid-season rebrands like Sauber → Audi) over upstream data.
 */
export function getDriverConstructorId(
  driverId: string,
  upstream: string | undefined,
): string | undefined {
  return DRIVER_OVERRIDES_2026[driverId]?.constructorId ?? upstream;
}

/**
 * Returns the canonical 2026 constructor name for a driver, preferring the
 * override for mid-season rebrands.
 */
export function getDriverConstructorName(
  driverId: string,
  upstream: string | undefined,
): string | undefined {
  return DRIVER_OVERRIDES_2026[driverId]?.constructorName ?? upstream;
}
