import type {
  DriverStanding,
  ConstructorStanding,
  Race,
  RaceResult,
  QualifyingResult,
  LiveSession,
  LiveTimingDriver,
  LivePosition,
  LiveInterval,
  LiveStint,
  TeamRadio,
  PitStop,
  OpenF1PitStop,
  RaceControlMessage,
  WeatherData,
  LiveLap,
} from "./types";

const ERGAST_BASE = "https://api.jolpi.ca/ergast/f1";
const OPENF1_BASE = "https://api.openf1.org/v1";
const CURRENT_SEASON = "2026";

/** Historical seasons available in the archive section */
export const ARCHIVE_SEASONS = [
  "2025", "2024", "2023", "2022", "2021",
  "2020", "2019", "2018", "2017", "2016",
];

// --- Ergast / Jolpica API ---

const FETCH_TIMEOUT_MS = 10_000;
/** Longer timeout for OpenF1 live endpoints which can be slow under load. */
const LIVE_FETCH_TIMEOUT_MS = 30_000;

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function fetchErgast<T>(path: string, revalidate: number | false = 300): Promise<T | null> {
  const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const fetchOptions = revalidate === false
      ? { cache: 'no-store' as const, signal }
      : { next: { revalidate }, signal };
    const res = await fetch(`${ERGAST_BASE}${path}`, fetchOptions);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] fetchErgast failed for ${path}:`, err);
    return null;
  } finally {
    clear();
  }
}

/** Historical data fetch — 24 h cache since completed seasons never change */
async function fetchErgastArchive<T>(path: string): Promise<T | null> {
  const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${ERGAST_BASE}${path}`, { next: { revalidate: 86400 }, signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[API] fetchErgastArchive failed for ${path}:`, err);
    return null;
  } finally {
    clear();
  }
}

export async function getDriverStandings(): Promise<DriverStanding[]> {
  // Fetch standings and driver list in parallel to avoid waterfall on pre-season fallback
  const [data, driversData] = await Promise.all([
    fetchErgast<any>(`/${CURRENT_SEASON}/driverstandings/?limit=100`),
    fetchErgast<any>(`/${CURRENT_SEASON}/drivers/?limit=100`),
  ]);
  const standings: DriverStanding[] =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];

  // Pre-season fallback: if no standings yet, build entries from the driver list
  if (standings.length === 0) {
    const drivers: any[] = driversData?.MRData?.DriverTable?.Drivers ?? [];
    if (drivers.length > 0) {
      return drivers.map((d: any, i: number) => ({
        position: String(i + 1),
        positionText: String(i + 1),
        points: "0",
        wins: "0",
        Driver: d,
        Constructors: [],
      }));
    }
  }

  return standings;
}

export async function getConstructorStandings(): Promise<ConstructorStanding[]> {
  // Fetch standings and constructor list in parallel to avoid waterfall on pre-season fallback
  const [data, ctorData] = await Promise.all([
    fetchErgast<any>(`/${CURRENT_SEASON}/constructorstandings/?limit=100`),
    fetchErgast<any>(`/${CURRENT_SEASON}/constructors/?limit=100`),
  ]);
  const standings: ConstructorStanding[] =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];

  // Pre-season fallback: if no standings yet, build entries from the constructors list
  if (standings.length === 0) {
    const ctors: any[] = ctorData?.MRData?.ConstructorTable?.Constructors ?? [];
    if (ctors.length > 0) {
      return ctors.map((c: any, i: number) => ({
        position: String(i + 1),
        positionText: String(i + 1),
        points: "0",
        wins: "0",
        Constructor: c,
      }));
    }
  }

  return standings;
}

export async function getRaceSchedule(): Promise<Race[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/?limit=30`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getRaceResults(round: string): Promise<RaceResult[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/${round}/results/?limit=30`);
  return data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
}

export async function getRaceWithResults(round: string): Promise<Race | null> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/${round}/results/?limit=30`, false);
  return data?.MRData?.RaceTable?.Races?.[0] ?? null;
}

export async function getQualifyingResults(round: string): Promise<QualifyingResult[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/${round}/qualifying/?limit=30`, false);
  return data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
}

export async function getDriverResults(driverId: string): Promise<Race[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/drivers/${driverId}/results/?limit=30`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getConstructorResults(constructorId: string): Promise<Race[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/constructors/${constructorId}/results/?limit=50`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getAllSeasonResults(): Promise<Race[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/results/?limit=500`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getSprintResults(round: string): Promise<RaceResult[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/${round}/sprint/?limit=30`, false);
  return data?.MRData?.RaceTable?.Races?.[0]?.SprintResults ?? [];
}

export async function getAllSprintResults(): Promise<Race[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/sprint/?limit=500`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getPitStops(round: string): Promise<PitStop[]> {
  const data = await fetchErgast<any>(`/${CURRENT_SEASON}/${round}/pitstops/?limit=100`, false);
  return data?.MRData?.RaceTable?.Races?.[0]?.PitStops ?? [];
}

// --- OpenF1 Live API ---

export async function getLiveSessions(): Promise<LiveSession[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENF1_BASE}/sessions?year=${CURRENT_SEASON}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear();
  }
}

export async function getLatestSession(): Promise<LiveSession | null> {
  // Try the direct "latest" query first — most reliable for live/recent sessions
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENF1_BASE}/sessions?session_key=latest`, {
      cache: "no-store",
      signal,
    });
    if (res.ok) {
      const data: LiveSession[] = await res.json();
      if (data.length > 0) {
        // Verify the session is from the current season — OpenF1 "latest" may
        // return a session from a prior year if the new season hasn't started yet
        const session = data[0];
        if (String(session.year) === CURRENT_SEASON) return session;
        // Still return it; the live page checks isLive status anyway
        return session;
      }
    }
  } catch {
    // Fall through to year-based query
  } finally {
    clear();
  }

  // Fallback: fetch all sessions for the current season
  const sessions = await getLiveSessions();
  if (!sessions.length) return null;
  // Find most recent session that has already started
  const now = new Date();
  const sorted = sessions
    .filter((s) => new Date(s.date_start) <= now)
    .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
  return sorted[0] ?? null;
}

export async function getLiveDrivers(sessionKey: number): Promise<LiveTimingDriver[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear();
  }
}

export async function getLivePositions(sessionKey: number): Promise<LivePosition[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    // Fetch recent position data (last 5 min) — wide enough to survive safety-car gaps
    // while still avoiding full-session payloads.
    const since = new Date(Date.now() - 5 * 60_000).toISOString();
    const res = await fetch(
      `${OPENF1_BASE}/position?session_key=${sessionKey}&date>${encodeURIComponent(since)}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return [];
    const data: LivePosition[] = await res.json();
    // If the time-filtered query returned data, use it; otherwise fall back to unfiltered
    if (data.length > 0) return data;
  } catch {
    // Fall through to unfiltered fetch
  } finally {
    clear();
  }
  // Fallback: unfiltered (for sessions that just started or non-live sessions)
  const { signal: sig2, clear: clear2 } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OPENF1_BASE}/position?session_key=${sessionKey}`,
      { cache: "no-store", signal: sig2 }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear2();
  }
}

export async function getLiveIntervals(sessionKey: number): Promise<LiveInterval[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    // Fetch recent interval data (last 5 min) — matches the position window
    const since = new Date(Date.now() - 5 * 60_000).toISOString();
    const res = await fetch(
      `${OPENF1_BASE}/intervals?session_key=${sessionKey}&date>${encodeURIComponent(since)}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return [];
    const data: LiveInterval[] = await res.json();
    if (data.length > 0) return data;
  } catch {
    // Fall through to unfiltered fetch
  } finally {
    clear();
  }
  // Fallback: unfiltered
  const { signal: sig2, clear: clear2 } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OPENF1_BASE}/intervals?session_key=${sessionKey}`,
      { cache: "no-store", signal: sig2 }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear2();
  }
}

export async function getLiveStints(sessionKey: number): Promise<LiveStint[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OPENF1_BASE}/stints?session_key=${sessionKey}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear();
  }
}

export async function getTeamRadio(sessionKey: number): Promise<TeamRadio[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OPENF1_BASE}/team_radio?session_key=${sessionKey}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear();
  }
}

/** Fetch pit box (stationary) times from OpenF1 for a given session. */
export async function getOpenF1PitStops(sessionKey: number): Promise<OpenF1PitStop[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OPENF1_BASE}/pit?session_key=${sessionKey}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear();
  }
}

/**
 * Find the OpenF1 session key for an Ergast race round.
 * Matches by comparing the race date from Ergast with OpenF1 sessions of type "Race".
 */
export async function getOpenF1SessionKeyForRace(race: Race): Promise<number | null> {
  const sessions = await getLiveSessions();
  if (!sessions.length) return null;
  const raceDate = getRaceDate(race);
  const raceDateStr = raceDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const match = sessions.find(
    (s) => s.session_type === "Race" && s.date_start.startsWith(raceDateStr)
  );
  return match?.session_key ?? null;
}

/** Fetch lap-by-lap timing data for all drivers in a session. */
export async function getLiveLaps(sessionKey: number): Promise<LiveLap[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    // Only the last 3 laps per driver is enough for current-lap display
    const res = await fetch(
      `${OPENF1_BASE}/laps?session_key=${sessionKey}&lap_number>=${Math.max(1, 0)}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear();
  }
}

/** Fetch race control messages (flags, safety car, penalties, etc.) */
export async function getRaceControl(sessionKey: number): Promise<RaceControlMessage[]> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OPENF1_BASE}/race_control?session_key=${sessionKey}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clear();
  }
}

/** Fetch current weather data for the session (returns the most recent entry). */
export async function getWeather(sessionKey: number): Promise<WeatherData | null> {
  const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${OPENF1_BASE}/weather?session_key=${sessionKey}`,
      { cache: "no-store", signal }
    );
    if (!res.ok) return null;
    const data: WeatherData[] = await res.json();
    // Return the most recent weather reading
    return data.length > 0 ? data[data.length - 1] : null;
  } catch {
    return null;
  } finally {
    clear();
  }
}

// --- Archive API (historical seasons, 24 h cache) ---

export async function getSeasonDriverStandings(season: string): Promise<DriverStanding[]> {
  const data = await fetchErgastArchive<any>(`/${season}/driverstandings/?limit=100`);
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
}

export async function getSeasonConstructorStandings(season: string): Promise<ConstructorStanding[]> {
  const data = await fetchErgastArchive<any>(`/${season}/constructorstandings/?limit=100`);
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
}

export async function getSeasonSchedule(season: string): Promise<Race[]> {
  const data = await fetchErgastArchive<any>(`/${season}/?limit=30`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getSeasonRaceResults(season: string): Promise<Race[]> {
  const data = await fetchErgastArchive<any>(`/${season}/results/?limit=500`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

// --- Next scheduled session (from Ergast calendar) ---

export interface ScheduledSession {
  /** e.g. "Practice 1", "Qualifying", "Sprint", "Race" */
  type: string;
  raceName: string;
  circuitId: string;
  circuitName: string;
  country: string;
  locality: string;
  date: Date;
  round: string;
}

export async function getNextScheduledSession(): Promise<ScheduledSession | null> {
  let races: Race[] = [];
  try {
    races = await getRaceSchedule();
  } catch {
    return null;
  }

  const now = new Date();
  const upcoming: ScheduledSession[] = [];

  function push(type: string, race: Race, s: { date: string; time: string } | undefined) {
    if (!s) return;
    // Ergast times are UTC (include Z suffix)
    const timeStr = s.time.endsWith("Z") ? s.time : `${s.time}Z`;
    const d = new Date(`${s.date}T${timeStr}`);
    if (d > now) {
      upcoming.push({
        type,
        raceName: race.raceName,
        circuitId: race.Circuit.circuitId,
        circuitName: race.Circuit.circuitName,
        country: race.Circuit.Location.country,
        locality: race.Circuit.Location.locality,
        date: d,
        round: race.round,
      });
    }
  }

  for (const race of races) {
    push("Practice 1", race, race.FirstPractice);
    push("Practice 2", race, race.SecondPractice);
    push("Practice 3", race, race.ThirdPractice);
    push("Sprint Qualifying", race, race.SprintQualifying);
    push("Sprint", race, race.Sprint);
    push("Qualifying", race, race.Qualifying);
    if (race.time) {
      const timeStr = race.time.endsWith("Z") ? race.time : `${race.time}Z`;
      const d = new Date(`${race.date}T${timeStr}`);
      if (d > now) {
        upcoming.push({
          type: "Race",
          raceName: race.raceName,
          circuitId: race.Circuit.circuitId,
          circuitName: race.Circuit.circuitName,
          country: race.Circuit.Location.country,
          locality: race.Circuit.Location.locality,
          date: d,
          round: race.round,
        });
      }
    }
  }

  if (!upcoming.length) return null;
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0];
}

// --- Utility ---

export function getTeamColor(constructorId: string): string {
  const colors: Record<string, string> = {
    red_bull: "#3671C6",
    ferrari: "#e80020",
    mclaren: "#ff8000",
    mercedes: "#27f4d2",
    aston_martin: "#229971",
    alpine: "#ff87bc",
    williams: "#64c4ff",
    haas: "#b6babd",
    rb: "#6692ff",
    // Audi F1 Team — rebranded from Kick Sauber for 2026
    audi: "#bb0000",
    sauber: "#bb0000",
    kick_sauber: "#bb0000",
    cadillac: "#e0e0e0",
    andretti_cadillac: "#e0e0e0",
  };
  if (colors[constructorId]) return colors[constructorId];

  // Deterministic HSL color for any mid-season newcomer not yet in the map
  let hash = 0;
  for (let i = 0; i < constructorId.length; i++) {
    hash = constructorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/** Returns the Date when a race takes place, handling optional UTC time. */
export function getRaceDate(race: Race): Date {
  if (race.time) {
    const timeStr = race.time.endsWith("Z") ? race.time : `${race.time}Z`;
    return new Date(`${race.date}T${timeStr}`);
  }
  return new Date(race.date);
}

export function getF1TVRaceUrl(race: Race): string {
  const query = encodeURIComponent(race.raceName);
  return `https://f1tv.formula1.com/search?query=${query}&filter_objectSubtype=Replay&filter_orderByFom=Y&filter_year=${race.season}&orderBy=meeting_Number&sortOrder=asc`;
}

export function getCountryFlag(nationality: string): string {
  const flags: Record<string, string> = {
    Dutch: "🇳🇱", British: "🇬🇧", Spanish: "🇪🇸", Monegasque: "🇲🇨",
    Australian: "🇦🇺", Mexican: "🇲🇽", French: "🇫🇷", Canadian: "🇨🇦",
    German: "🇩🇪", Finnish: "🇫🇮", Japanese: "🇯🇵", Chinese: "🇨🇳",
    Thai: "🇹🇭", Danish: "🇩🇰", American: "🇺🇸", Italian: "🇮🇹",
    Argentine: "🇦🇷", "New Zealander": "🇳🇿", Brazilian: "🇧🇷",
    Austrian: "🇦🇹", Swiss: "🇨🇭", Swedish: "🇸🇪", Belgian: "🇧🇪",
    Polish: "🇵🇱", Russian: "🇷🇺", Indian: "🇮🇳", Korean: "🇰🇷",
    Colombian: "🇨🇴", Venezuelan: "🇻🇪", Portuguese: "🇵🇹",
  };
  return flags[nationality] ?? "🏁";
}

export function getCountryFlagByCountry(country: string): string {
  const flags: Record<string, string> = {
    Netherlands: "🇳🇱", "UK": "🇬🇧", "United Kingdom": "🇬🇧", Spain: "🇪🇸",
    Monaco: "🇲🇨", Australia: "🇦🇺", Mexico: "🇲🇽", France: "🇫🇷",
    Canada: "🇨🇦", Germany: "🇩🇪", Finland: "🇫🇮", Japan: "🇯🇵",
    China: "🇨🇳", Thailand: "🇹🇭", Denmark: "🇩🇰", USA: "🇺🇸",
    "United States": "🇺🇸", Italy: "🇮🇹", Argentina: "🇦🇷",
    "New Zealand": "🇳🇿", Brazil: "🇧🇷", Austria: "🇦🇹",
    Switzerland: "🇨🇭", Sweden: "🇸🇪", Belgium: "🇧🇪", Poland: "🇵🇱",
    Russia: "🇷🇺", India: "🇮🇳", Korea: "🇰🇷", Colombia: "🇨🇴",
    Venezuela: "🇻🇪", Portugal: "🇵🇹", Bahrain: "🇧🇭",
    "Saudi Arabia": "🇸🇦", Azerbaijan: "🇦🇿", Singapore: "🇸🇬",
    Hungary: "🇭🇺", "United Arab Emirates": "🇦🇪", UAE: "🇦🇪",
    Qatar: "🇶🇦", "Las Vegas": "🇺🇸", Miami: "🇺🇸", Madrid: "🇪🇸",
  };
  return flags[country] ?? "🏁";
}

/**
 * Determine whether a live session should be treated as "in progress".
 *
 * OpenF1's `date_end` is the *scheduled* end — races regularly overrun due to
 * safety cars, red flags, or slow formations.  We add a grace period so the UI
 * keeps showing LIVE rather than flipping to SESSION ENDED while the session
 * is likely still on-going.
 */
export function isSessionLive(session: LiveSession): boolean {
  const now = new Date();
  const start = new Date(session.date_start);
  const end = new Date(session.date_end);
  // Race sessions get a 2 h grace; other sessions get 1 h
  const graceMs =
    session.session_type === "Race"
      ? 2 * 60 * 60 * 1000
      : 60 * 60 * 1000;
  return now >= start && now <= new Date(end.getTime() + graceMs);
}

export const CURRENT_YEAR = CURRENT_SEASON;
