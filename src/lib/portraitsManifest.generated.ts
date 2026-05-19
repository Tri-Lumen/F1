/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 *
 * Regenerate with:  npm run sync-portraits
 *
 * The sync script scrapes https://www.formula1.com/en/drivers and
 * https://www.formula1.com/en/teams and writes the canonical image URLs that
 * F1.com itself uses for each driver and team. profileImages.ts prefers these
 * URLs and falls back to the deterministic media.formula1.com URLs when an
 * entry is missing (e.g. a brand-new driver between sync runs).
 *
 * Keys are Ergast/Jolpica IDs (driverId, constructorId).
 *
 * The committed stub is intentionally empty so the dashboard falls through to
 * the legacy computed URLs in environments where the sync hasn't been run.
 * Run `npm run sync-portraits` from any host with public egress (the user's
 * machine or the project's GitHub Actions runners) to populate it.
 */

export interface DriverPortraitEntry {
  /** Full-body card portrait shown on /en/drivers tiles */
  card?: string;
  /** Square headshot */
  headshot?: string;
  /** Stylised racing-number graphic */
  number?: string;
  /** Helmet thumbnail */
  helmet?: string;
}

export interface TeamPortraitEntry {
  /** Transparent car render shown on /en/teams */
  car?: string;
  /** Team logo / badge */
  logo?: string;
  /** Livery gradient backplate */
  backplate?: string;
}

export const DRIVER_PORTRAITS: Record<string, DriverPortraitEntry> = {};

export const TEAM_PORTRAITS: Record<string, TeamPortraitEntry> = {};

/** ISO timestamp of the last sync run. Empty when the manifest is the stub. */
export const GENERATED_AT = "";
