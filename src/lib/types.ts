export interface Driver {
  driverId: string;
  permanentNumber: string;
  code: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  url: string;
}

export interface Constructor {
  constructorId: string;
  name: string;
  nationality: string;
  url: string;
}

export interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
}

export interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: Constructor;
}

export interface Circuit {
  circuitId: string;
  circuitName: string;
  url: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

export interface RaceResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
    AverageSpeed: { units: string; speed: string };
  };
}

export interface Race {
  season: string;
  round: string;
  raceName: string;
  url: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
  SprintQualifying?: { date: string; time: string };
  Results?: RaceResult[];
  SprintResults?: RaceResult[];
  QualifyingResults?: QualifyingResult[];
  PitStops?: PitStop[];
}

export interface QualifyingResult {
  number: string;
  position: string;
  Driver: Driver;
  Constructor: Constructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface SeasonData {
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  races: Race[];
  season: string;
}

// OpenF1 live data types
export interface LiveTimingDriver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
  country_code: string;
}

export interface LivePosition {
  driver_number: number;
  position: number;
  date: string;
}

export interface LiveSession {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  country_name: string;
  circuit_short_name: string;
  year: number;
  meeting_key: number;
}

export interface LiveInterval {
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
}

// Tire stint data from OpenF1
export interface LiveStint {
  driver_number: number;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number | null;
  tyre_age_at_start: number;
}

// Team radio data from OpenF1
export interface TeamRadio {
  driver_number: number;
  recording_url: string;
  date: string;
}

// Race control messages from OpenF1
export interface RaceControlMessage {
  date: string;
  category: string;
  flag?: string;
  message: string;
  scope?: string;
  driver_number?: number;
  lap_number?: number;
  sector?: number;
}

// Weather data from OpenF1
export interface WeatherData {
  date: string;
  air_temperature: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

// Lap time data from OpenF1
export interface LiveLap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  date_start: string;
  is_pit_out_lap: boolean;
}

// Pit stop data from Ergast (duration = pit lane time, entry to exit)
export interface PitStop {
  driverId: string;
  lap: string;
  stop: string;
  time: string;
  duration: string;
}

// Pit stop data from OpenF1 (pit_duration = pit box time, stationary)
export interface OpenF1PitStop {
  driver_number: number;
  pit_duration: number | null;
  lap_number: number;
  date: string;
  session_key: number;
}

// Ergast API response envelope types
export interface ErgastResponse<T> {
  MRData: T;
}

export interface StandingsTableData {
  StandingsTable: {
    StandingsLists: Array<{
      DriverStandings?: DriverStanding[];
      ConstructorStandings?: ConstructorStanding[];
    }>;
  };
}

export interface DriverTableData {
  DriverTable: {
    Drivers: Driver[];
  };
}

export interface ConstructorTableData {
  ConstructorTable: {
    Constructors: Constructor[];
  };
}

export interface RaceTableData {
  RaceTable: {
    Races: Race[];
  };
}

// RSS feed types
export interface RssFeedSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface RssArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceId: string;
  imageUrl?: string;
}
