import type {
  Driver,
  Constructor,
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
  ErgastResponse,
  StandingsTableData,
  DriverTableData,
  ConstructorTableData,
  RaceTableData,
} from "./types";

const ERGAST_BASE = "https://api.jolpi.ca/ergast/f1";
const OPENF1_BASE = "https://api.openf1.org/v1";

/**
 * Derive the current season from the real calendar year, but never dip below
 * 2026 — we don't have an earlier live-timing model and a clock skew before
 * that would break the homepage. Computed per call (not cached at module
 * load) so a long-running server actually rolls over on Jan 1 without
 * needing a restart.
 */
const SEASON_FLOOR = 2026;
function getCurrentSeason(): string {
  return String(Math.max(SEASON_FLOOR, new Date().getFullYear()));
}

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

/**
 * Fetch every page of a Races-shaped Ergast endpoint, merging `Results`
 * across pages by round. Ergast paginates by result *row*, not by race, so a
 * single race's rows can straddle a page boundary. A flat `limit` with no
 * pagination silently drops the tail of a season once total rows exceed it
 * (a full 22-car, 24-race season is ~530 rows).
 */
async function fetchAllRaceResults(
  basePath: string,
  fetchPage: (path: string) => Promise<ErgastResponse<RaceTableData> | null>
): Promise<Race[]> {
  const PAGE_SIZE = 100;
  const byRound = new Map<string, Race>();
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const sep = basePath.includes("?") ? "&" : "?";
    const data = await fetchPage(`${basePath}${sep}limit=${PAGE_SIZE}&offset=${offset}`);
    const races = data?.MRData?.RaceTable?.Races ?? [];
    if (races.length === 0) break;

    total = data?.MRData?.total ? parseInt(data.MRData.total, 10) : races.length;

    for (const race of races) {
      const existing = byRound.get(race.round);
      if (existing) {
        existing.Results = [...(existing.Results ?? []), ...(race.Results ?? [])];
      } else {
        byRound.set(race.round, { ...race });
      }
    }

    offset += PAGE_SIZE;
  }

  return [...byRound.values()];
}

export async function getDriverStandings(): Promise<DriverStanding[]> {
  // Fetch standings and driver list in parallel to avoid waterfall on pre-season fallback
  const [data, driversData] = await Promise.all([
    fetchErgast<ErgastResponse<StandingsTableData>>(`/${getCurrentSeason()}/driverstandings/?limit=100`),
    fetchErgast<ErgastResponse<DriverTableData>>(`/${getCurrentSeason()}/drivers/?limit=100`),
  ]);
  const standings: DriverStanding[] =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];

  // Pre-season fallback: if no standings yet, build entries from the driver list
  if (standings.length === 0) {
    const drivers: Driver[] = driversData?.MRData?.DriverTable?.Drivers ?? [];
    if (drivers.length > 0) {
      return drivers.map((d, i) => ({
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
    fetchErgast<ErgastResponse<StandingsTableData>>(`/${getCurrentSeason()}/constructorstandings/?limit=100`),
    fetchErgast<ErgastResponse<ConstructorTableData>>(`/${getCurrentSeason()}/constructors/?limit=100`),
  ]);
  const standings: ConstructorStanding[] =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];

  // Pre-season fallback: if no standings yet, build entries from the constructors list
  if (standings.length === 0) {
    const ctors: Constructor[] = ctorData?.MRData?.ConstructorTable?.Constructors ?? [];
    if (ctors.length > 0) {
      return ctors.map((c, i) => ({
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
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(`/${getCurrentSeason()}/?limit=30`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getRaceResults(round: string): Promise<RaceResult[]> {
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(`/${getCurrentSeason()}/${round}/results/?limit=30`);
  return data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
}

/**
 * Return a revalidation TTL for a completed-race endpoint.
 * Once a race was more than 2 hours ago we can safely cache it for 24 h;
 * if it's still within the live window we flush every request.
 */
function raceRevalidate(raceDateISO: string | undefined): number | false {
  if (!raceDateISO) return false;
  const raceEnd = new Date(raceDateISO).getTime() + 2 * 60 * 60 * 1000;
  return Date.now() > raceEnd ? 86400 : false;
}

export async function getRaceWithResults(round: string): Promise<Race | null> {
  // First do a cheap schedule fetch (already cached at 5 min) to decide TTL
  const schedule = await getRaceSchedule();
  const raceEntry = schedule.find((r) => r.round === round);
  const ttl = raceRevalidate(
    raceEntry ? `${raceEntry.date}T${raceEntry.time ?? "15:00:00Z"}` : undefined,
  );
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(
    `/${getCurrentSeason()}/${round}/results/?limit=30`,
    ttl,
  );
  return data?.MRData?.RaceTable?.Races?.[0] ?? null;
}

export async function getQualifyingResults(round: string): Promise<QualifyingResult[]> {
  const schedule = await getRaceSchedule();
  const raceEntry = schedule.find((r) => r.round === round);
  // Qualifying ends ~2 h before race day; use race date as conservative upper bound
  const ttl = raceRevalidate(
    raceEntry ? `${raceEntry.date}T${raceEntry.time ?? "15:00:00Z"}` : undefined,
  );
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(
    `/${getCurrentSeason()}/${round}/qualifying/?limit=30`,
    ttl,
  );
  return data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
}

export async function getDriverResults(driverId: string): Promise<Race[]> {
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(`/${getCurrentSeason()}/drivers/${driverId}/results/?limit=30`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getConstructorResults(constructorId: string): Promise<Race[]> {
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(`/${getCurrentSeason()}/constructors/${constructorId}/results/?limit=50`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getAllSeasonResults(): Promise<Race[]> {
  return fetchAllRaceResults(`/${getCurrentSeason()}/results/`, (p) =>
    fetchErgast<ErgastResponse<RaceTableData>>(p)
  );
}

export async function getSprintResults(round: string): Promise<RaceResult[]> {
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(`/${getCurrentSeason()}/${round}/sprint/?limit=30`, false);
  return data?.MRData?.RaceTable?.Races?.[0]?.SprintResults ?? [];
}

export async function getAllSprintResults(): Promise<Race[]> {
  return fetchAllRaceResults(`/${getCurrentSeason()}/sprint/`, (p) =>
    fetchErgast<ErgastResponse<RaceTableData>>(p)
  );
}

export async function getPitStops(round: string): Promise<PitStop[]> {
  const schedule = await getRaceSchedule();
  const raceEntry = schedule.find((r) => r.round === round);
  const ttl = raceRevalidate(
    raceEntry ? `${raceEntry.date}T${raceEntry.time ?? "15:00:00Z"}` : undefined,
  );
  const data = await fetchErgast<ErgastResponse<RaceTableData>>(
    `/${getCurrentSeason()}/${round}/pitstops/?limit=100`,
    ttl,
  );
  return data?.MRData?.RaceTable?.Races?.[0]?.PitStops ?? [];
}

// --- OpenF1 Live API ---

const OPENF1_MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Generic OpenF1 fetch with retry + backoff.
 *
 * OpenF1 rate-limits and occasionally 5xx's when a page fires several queries
 * at once (the replay/live screens request 8 endpoints in parallel). A single
 * attempt means a transient 429/timeout silently yields `[]`, leaving the grid
 * with positions/intervals/tyres unpopulated even though the session has data.
 * Retrying the transient failures with exponential backoff lets the burst
 * settle so every endpoint resolves. Genuinely-empty (200 + `[]`) responses are
 * returned immediately — those are not failures.
 */
async function fetchOpenF1<T>(path: string): Promise<T[]> {
  for (let attempt = 0; attempt <= OPENF1_MAX_RETRIES; attempt++) {
    const { signal, clear } = withTimeout(LIVE_FETCH_TIMEOUT_MS);
    let retryable = false;
    try {
      const res = await fetch(`${OPENF1_BASE}${path}`, { cache: "no-store", signal });
      if (res.ok) {
        const body: unknown = await res.json();
        // Guard against a malformed/non-array response (error envelope, HTML
        // error page served with a JSON content-type, etc.) — callers chain
        // .filter/.find/.sort directly on the result with no other check.
        return Array.isArray(body) ? (body as T[]) : [];
      }
      // 429 (rate limit) and 5xx are transient; 4xx (bad request) is not.
      retryable = res.status === 429 || res.status >= 500;
    } catch {
      // Network error / timeout abort — worth another try.
      retryable = true;
    } finally {
      clear();
    }
    if (!retryable || attempt === OPENF1_MAX_RETRIES) return [];
    await sleep(500 * 2 ** attempt); // 500ms, 1s, 2s
  }
  return [];
}

export async function getLiveSessions(): Promise<LiveSession[]> {
  return fetchOpenF1<LiveSession>(`/sessions?year=${getCurrentSeason()}`);
}

/**
 * All sessions for the current season that have already ended — replay-ready.
 * Sorted by start time descending (most recent first).
 */
export async function getCompletedSessions(): Promise<LiveSession[]> {
  const all = await getLiveSessions();
  const now = Date.now();
  return all
    .filter((s) => new Date(s.date_end).getTime() < now)
    .sort(
      (a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime(),
    );
}

/** Single session lookup by key (used by the replay page). */
export async function getSessionByKey(sessionKey: number): Promise<LiveSession | null> {
  const data = await fetchOpenF1<LiveSession>(`/sessions?session_key=${sessionKey}`);
  return data[0] ?? null;
}

export async function getLatestSession(): Promise<LiveSession | null> {
  // Use retry-backed fetch (the previous one-shot approach silently returned null
  // on any transient 5xx / timeout during race-day load, hiding the live session)
  const data = await fetchOpenF1<LiveSession>(`/sessions?session_key=latest`);
  if (data.length > 0) {
    return data[0];
  }

  // Fallback: fetch all sessions for the current season and find the most recent
  // one that has already started (covers seasons OpenF1 hasn't fully indexed yet)
  const sessions = await getLiveSessions();
  if (!sessions.length) return null;
  const now = new Date();
  const sorted = sessions
    .filter((s) => new Date(s.date_start) <= now)
    .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
  return sorted[0] ?? null;
}

export async function getLiveDrivers(sessionKey: number): Promise<LiveTimingDriver[]> {
  return fetchOpenF1<LiveTimingDriver>(`/drivers?session_key=${sessionKey}`);
}

/**
 * Position and interval records are an event stream — OpenF1 only emits a row
 * when a driver's value *changes*.  To know the current state of every driver
 * (live: latest per driver; replay: a snapshot at an arbitrary time) we need the
 * whole session, not a recent time window.  A windowed query silently drops any
 * driver who hasn't changed inside the window — leaving holes in the live grid —
 * and truncates the replay timeline of a recently-ended session to its last few
 * minutes.  So we always fetch the full session history here.
 */
export async function getLivePositions(sessionKey: number): Promise<LivePosition[]> {
  return fetchOpenF1<LivePosition>(`/position?session_key=${sessionKey}`);
}

export async function getLiveIntervals(sessionKey: number): Promise<LiveInterval[]> {
  return fetchOpenF1<LiveInterval>(`/intervals?session_key=${sessionKey}`);
}

export async function getLiveStints(sessionKey: number): Promise<LiveStint[]> {
  return fetchOpenF1<LiveStint>(`/stints?session_key=${sessionKey}`);
}

export async function getTeamRadio(sessionKey: number): Promise<TeamRadio[]> {
  return fetchOpenF1<TeamRadio>(`/team_radio?session_key=${sessionKey}`);
}

/** Fetch pit box (stationary) times from OpenF1 for a given session. */
export async function getOpenF1PitStops(sessionKey: number): Promise<OpenF1PitStop[]> {
  return fetchOpenF1<OpenF1PitStop>(`/pit?session_key=${sessionKey}`);
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
  return fetchOpenF1<LiveLap>(
    `/laps?session_key=${sessionKey}&lap_number>=1`
  );
}

/** Fetch race control messages (flags, safety car, penalties, etc.) */
export async function getRaceControl(sessionKey: number): Promise<RaceControlMessage[]> {
  return fetchOpenF1<RaceControlMessage>(`/race_control?session_key=${sessionKey}`);
}

/** Fetch current weather data for the session (returns the most recent entry). */
export async function getWeather(sessionKey: number): Promise<WeatherData | null> {
  const data = await fetchOpenF1<WeatherData>(`/weather?session_key=${sessionKey}`);
  return data.length > 0 ? data[data.length - 1] : null;
}

/** Fetch the full weather time-series for a session (replay scrubber needs every sample). */
export async function getWeatherSeries(sessionKey: number): Promise<WeatherData[]> {
  return fetchOpenF1<WeatherData>(`/weather?session_key=${sessionKey}`);
}

// --- Archive API (historical seasons, 24 h cache) ---

export async function getSeasonDriverStandings(season: string): Promise<DriverStanding[]> {
  const data = await fetchErgastArchive<ErgastResponse<StandingsTableData>>(`/${season}/driverstandings/?limit=100`);
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
}

export async function getSeasonConstructorStandings(season: string): Promise<ConstructorStanding[]> {
  const data = await fetchErgastArchive<ErgastResponse<StandingsTableData>>(`/${season}/constructorstandings/?limit=100`);
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
}

export async function getSeasonSchedule(season: string): Promise<Race[]> {
  const data = await fetchErgastArchive<ErgastResponse<RaceTableData>>(`/${season}/?limit=30`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getSeasonRaceResults(season: string): Promise<Race[]> {
  return fetchAllRaceResults(`/${season}/results/`, (p) =>
    fetchErgastArchive<ErgastResponse<RaceTableData>>(p)
  );
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

/** The session slots that make up a race weekend, in schedule order. */
const SESSION_SLOTS: Array<{
  type: string;
  get: (race: Race) => { date: string; time: string } | undefined;
}> = [
  { type: "Practice 1", get: (r) => r.FirstPractice },
  { type: "Practice 2", get: (r) => r.SecondPractice },
  { type: "Practice 3", get: (r) => r.ThirdPractice },
  { type: "Sprint Qualifying", get: (r) => r.SprintQualifying },
  { type: "Sprint", get: (r) => r.Sprint },
  { type: "Qualifying", get: (r) => r.Qualifying },
  { type: "Race", get: (r) => (r.time ? { date: r.date, time: r.time } : undefined) },
];

/** Enumerate every scheduled session slot across a set of races, resolved to a Date. */
function* enumerateSessionSlots(races: Race[]): Generator<{ type: string; race: Race; date: Date }> {
  for (const race of races) {
    for (const { type, get } of SESSION_SLOTS) {
      const s = get(race);
      if (!s) continue;
      // Ergast times are UTC (include Z suffix)
      const timeStr = s.time.endsWith("Z") ? s.time : `${s.time}Z`;
      yield { type, race, date: new Date(`${s.date}T${timeStr}`) };
    }
  }
}

function toScheduledSession(type: string, race: Race, date: Date): ScheduledSession {
  return {
    type,
    raceName: race.raceName,
    circuitId: race.Circuit.circuitId,
    circuitName: race.Circuit.circuitName,
    country: race.Circuit.Location.country,
    locality: race.Circuit.Location.locality,
    date,
    round: race.round,
  };
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
  for (const { type, race, date } of enumerateSessionSlots(races)) {
    if (date > now) upcoming.push(toScheduledSession(type, race, date));
  }

  if (!upcoming.length) return null;
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0];
}

/**
 * Returns a session from the Ergast calendar that is estimated to be in progress
 * right now, based on scheduled start time + typical session duration.  Used as a
 * fallback when OpenF1 returns null so the live page can show "connecting…" rather
 * than a misleading next-session countdown.
 */
export async function getOngoingScheduledSession(): Promise<ScheduledSession | null> {
  let races: Race[] = [];
  try {
    races = await getRaceSchedule();
  } catch {
    return null;
  }

  const now = new Date();
  // Estimated duration + grace window per session type
  const windowMs: Record<string, number> = {
    "Practice 1":        90 * 60 * 1000,
    "Practice 2":        90 * 60 * 1000,
    "Practice 3":        90 * 60 * 1000,
    "Sprint Qualifying": 90 * 60 * 1000,
    "Sprint":            60 * 60 * 1000,
    "Qualifying":        90 * 60 * 1000,
    "Race":             4 * 60 * 60 * 1000,
  };

  const ongoing: ScheduledSession[] = [];
  for (const { type, race, date } of enumerateSessionSlots(races)) {
    const window = windowMs[type] ?? 2 * 60 * 60 * 1000;
    if (date <= now && now <= new Date(date.getTime() + window)) {
      ongoing.push(toScheduledSession(type, race, date));
    }
  }

  if (!ongoing.length) return null;
  // Return the most recently-started ongoing session
  return ongoing.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
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
  // Race sessions get a 2 h grace; other sessions get 1 h
  const graceMs =
    session.session_type === "Race"
      ? 2 * 60 * 60 * 1000
      : 60 * 60 * 1000;

  // date_end is absent or null for in-progress sessions; new Date(null/undefined)
  // yields epoch (Jan 1 1970), making the window check always false. Fall back to
  // treating the session as live for up to 4 hours after start.
  const endRaw = new Date(session.date_end);
  if (!session.date_end || isNaN(endRaw.getTime())) {
    return now >= start && now <= new Date(start.getTime() + 4 * 60 * 60 * 1000);
  }

  return now >= start && now <= new Date(endRaw.getTime() + graceMs);
}

/** Display-only current season year; computed per call, same as getCurrentSeason(). */
export function getCurrentYear(): string {
  return getCurrentSeason();
}

/** All sessions from the race schedule that start today (UTC date match). */
export async function getTodaySessions(): Promise<ScheduledSession[]> {
  let races: Race[] = [];
  try {
    races = await getRaceSchedule();
  } catch {
    return [];
  }

  const todayUTC = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sessions: ScheduledSession[] = [];
  for (const { type, race, date } of enumerateSessionSlots(races)) {
    if (date.toISOString().slice(0, 10) === todayUTC) {
      sessions.push(toScheduledSession(type, race, date));
    }
  }

  sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  return sessions;
}

/** Fetch career stats for a driver across all seasons available in the Jolpica API. */
export async function getDriverCareerWins(driverId: string): Promise<{
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  races: number;
  championships: number;
}> {
  // Ergast/Jolpica only supports single finishing-position filters as path
  // segments (e.g. /results/1/), not query params — so wins/podiums/poles/
  // fastest laps are each derived from the `total` count of a position-
  // filtered query, never by fetching and counting rows (which would be
  // truncated by a fixed `limit` for long careers).
  const [winsData, position2Data, position3Data, polesData, racesData, flData, champsData] = await Promise.all([
    fetchErgastArchive<ErgastResponse<RaceTableData>>(`/drivers/${driverId}/results/1/?limit=1`),
    fetchErgastArchive<ErgastResponse<RaceTableData>>(`/drivers/${driverId}/results/2/?limit=1`),
    fetchErgastArchive<ErgastResponse<RaceTableData>>(`/drivers/${driverId}/results/3/?limit=1`),
    fetchErgastArchive<ErgastResponse<RaceTableData>>(`/drivers/${driverId}/qualifying/1/?limit=1`),
    fetchErgastArchive<ErgastResponse<RaceTableData>>(`/drivers/${driverId}/results/?limit=1`),
    // Ergast/Jolpica requires the trailing /results/ segment for the
    // fastest-lap-rank filter — /fastest/1/ alone 404s.
    fetchErgastArchive<ErgastResponse<RaceTableData>>(`/drivers/${driverId}/fastest/1/results/?limit=1`),
    fetchErgastArchive<ErgastResponse<StandingsTableData>>(`/drivers/${driverId}/driverstandings/1/?limit=100`),
  ]);

  const totalOf = (d: { MRData?: { total?: string } } | null): number =>
    parseInt(d?.MRData?.total ?? "0", 10);

  const wins = totalOf(winsData);
  const races = totalOf(racesData);
  const poles = totalOf(polesData);
  const fl = totalOf(flData);
  const podiums = wins + totalOf(position2Data) + totalOf(position3Data);
  const championships = (champsData?.MRData?.StandingsTable?.StandingsLists?.length ?? 0);

  return { wins, podiums, poles, fastestLaps: fl, races, championships };
}
