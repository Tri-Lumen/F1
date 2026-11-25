import Link from "next/link";
import "@/app/ascii/live.css";
import type { LiveTimingDriver, RaceControlMessage, TeamRadio, WeatherData } from "@/lib/types";
import { LocalClockTime } from "@/components/LocalDateTime";
import { AsciiHeader, Panel, Swatch } from "../kit";

/*
 * Terminal-grid Live Timing page for the ASCII visual style. Rendered next to the
 * standard markup in (standard)/live/page.tsx and shown only under
 * html[data-style="ascii"] (see .f1-ascii-dash in ascii.css). The page computes the
 * per-driver values with the same logic as the standard view and passes plain data in.
 * Interactive client parts (refresh, onboard, lap-time table, radio audio player) are
 * not included here.
 */

export interface AsciiLiveDriver {
  num: number;
  acronym: string;
  fullName: string;
  team: string;
  color: string;
  pos: number | null;
  gap: number | null;
  interval: number | null;
  lastLap: number | null;
  compound: string | null;
  compoundLabel: string | null;
  tyreAge: number | null;
}

export type AsciiLiveState =
  | { kind: "empty" }
  | { kind: "connecting"; raceName: string; type: string }
  | {
      kind: "live";
      title: string;
      circuit: string;
      isLive: boolean;
      flag: string | null;
      lap: number | null;
      warning: string | null;
      drivers: AsciiLiveDriver[];
      raceControl: RaceControlMessage[];
      weather: WeatherData | null;
      radio: TeamRadio[];
    };

const SUBTITLE = "Real-time timing, tire strategy, team radio & onboard cameras";
const WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function lapTime(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const totalMs = Math.round(seconds * 1000);
  const m = Math.floor(totalMs / 60000);
  const s = (totalMs % 60000) / 1000;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

function signed(n: number | null): string {
  return n == null ? "—" : `+${n.toFixed(3)}`;
}

function flagText(flag: string): string {
  return flag.replace(/_/g, " ");
}

export default function LiveView({ state }: { state: AsciiLiveState }) {
  if (state.kind === "empty") {
    return (
      <div className="f1-ascii-dash f1-l-view">
        <AsciiHeader title="Live Timing" subtitle={SUBTITLE} />
        <Panel label="No session">
          <p>No session is currently active</p>
          <p className="f1-a-muted f1-a-mt">Live timing appears here once a session goes green.</p>
          <p className="f1-a-mt">
            <Link href="/races" className="f1-l-link">
              [ VIEW RACE CALENDAR ]
            </Link>
          </p>
        </Panel>
      </div>
    );
  }

  if (state.kind === "connecting") {
    return (
      <div className="f1-ascii-dash f1-l-view">
        <AsciiHeader title="Live Timing" subtitle={SUBTITLE} />
        <Panel label="Connecting">
          <p>
            {state.raceName} — {state.type}
          </p>
          <p className="f1-a-muted f1-a-mt">
            Session is in progress. Connecting to live timing data…
          </p>
          <p className="f1-a-muted">This page refreshes automatically every 15 seconds.</p>
        </Panel>
      </div>
    );
  }

  const { drivers, raceControl, weather, radio } = state;
  const messages = [...raceControl].reverse().slice(0, 20);
  const radioSorted = [...radio]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const radioShown = radioSorted.slice(0, 10);
  const driverByNum = new Map(drivers.map((d) => [d.num, d]));

  return (
    <div className="f1-ascii-dash f1-l-view">
      <AsciiHeader title="Live Timing" subtitle={SUBTITLE} />

      <Panel label="Session">
        <div className="f1-l-status">
          {state.isLive ? (
            <span className="f1-l-live">● LIVE</span>
          ) : (
            <span className="f1-a-muted">SESSION ENDED</span>
          )}
          {state.flag && <span className="f1-l-flag">{state.flag}</span>}
          {state.lap !== null && (
            <span>
              <span className="f1-a-muted">LAP</span> <span className="f1-a-accent">{state.lap}</span>
            </span>
          )}
        </div>
        <div className="f1-a-upper f1-a-mt f1-a-race-name">{state.title}</div>
        <div className="f1-a-muted">{state.circuit}</div>
      </Panel>

      {state.warning && (
        <Panel label="Data">
          <p className="f1-l-warn">{state.warning}</p>
        </Panel>
      )}

      <Panel label="Timing tower">
        {drivers.length === 0 ? (
          <p className="f1-a-muted">No timing data yet</p>
        ) : (
          <div className="f1-l-table">
            <div className="f1-l-row f1-l-head">
              <span className="f1-a-r">POS</span>
              <span />
              <span>DRIVER</span>
              <span className="f1-a-hide-s">NAME</span>
              <span>TYRE</span>
              <span className="f1-a-hide-s f1-a-r">INT</span>
              <span className="f1-a-r">GAP</span>
              <span className="f1-a-r">LAST LAP</span>
            </div>
            {drivers.map((d) => {
              const leader = d.pos === 1;
              return (
                <div className="f1-l-row" key={d.num}>
                  <span className={`f1-a-r${leader ? " f1-a-accent" : ""}`}>{d.pos ?? "—"}</span>
                  <Swatch color={d.color} />
                  <span className="f1-l-code">{d.acronym}</span>
                  <span className="f1-a-hide-s f1-a-muted f1-l-trunc">{d.fullName}</span>
                  <span className="f1-l-tyre">
                    {d.compoundLabel ? (
                      <>
                        [{d.compoundLabel}]
                        {d.tyreAge != null && <span className="f1-a-muted"> {d.tyreAge}L</span>}
                      </>
                    ) : (
                      <span className="f1-a-muted">—</span>
                    )}
                  </span>
                  <span className="f1-a-hide-s f1-a-r f1-a-muted">{leader ? "" : signed(d.interval)}</span>
                  <span className={`f1-a-r${leader ? " f1-a-accent f1-a-pts" : ""}`}>
                    {leader ? "LEADER" : signed(d.gap)}
                  </span>
                  <span className="f1-a-r">{lapTime(d.lastLap)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="f1-l-cols">
        <Panel label="Weather">
          {weather ? (
            <dl className="f1-l-kv">
              <dt>AIR</dt>
              <dd>{weather.air_temperature.toFixed(1)}°C</dd>
              <dt>TRACK</dt>
              <dd>{weather.track_temperature.toFixed(1)}°C</dd>
              <dt>HUMIDITY</dt>
              <dd>
                {weather.humidity.toFixed(0)}%
                <div className="f1-l-humid">
                  <span className="f1-a-bar">
                    <span className="f1-a-track">{"░".repeat(40)}</span>
                    <span className="f1-a-fill" style={{ width: `${Math.min(100, weather.humidity)}%`, color: "var(--color-f1-accent)" }}>
                      {"█".repeat(40)}
                    </span>
                  </span>
                </div>
              </dd>
              <dt>WIND</dt>
              <dd>
                {weather.wind_speed.toFixed(1)} m/s {WIND_DIRS[Math.round(weather.wind_direction / 45) % 8]}
              </dd>
              {weather.rainfall > 0 && (
                <>
                  <dt>RAIN</dt>
                  <dd className="f1-a-accent">WET · {weather.rainfall.toFixed(1)} mm</dd>
                </>
              )}
            </dl>
          ) : (
            <p className="f1-a-muted">No weather data yet</p>
          )}
        </Panel>

        <Panel label="Race control">
          {messages.length === 0 ? (
            <p className="f1-a-muted">No race control messages yet</p>
          ) : (
            <ul className="f1-l-list f1-l-scroll">
              {messages.map((m, i) => (
                <li key={`${m.date}-${i}`}>
                  <div className="f1-l-meta">
                    <LocalClockTime iso={m.date} />
                    {m.lap_number ? <span>LAP {m.lap_number}</span> : null}
                    {m.flag ? <span className="f1-a-accent">{flagText(m.flag)}</span> : null}
                  </div>
                  <div>{m.message}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel label="Team radio">
          {radio.length === 0 ? (
            <p className="f1-a-muted">No team radio messages yet</p>
          ) : (
            <>
              <p className="f1-a-muted f1-a-upper">
                {radio.length} message{radio.length !== 1 ? "s" : ""} · newest {radioShown.length}
              </p>
              <ul className="f1-l-list f1-l-scroll">
                {radioShown.map((m, i) => {
                  const d = driverByNum.get(m.driver_number);
                  return (
                    <li key={`${m.driver_number}-${m.date}-${i}`} className="f1-l-radio">
                      <LocalClockTime iso={m.date} />
                      <span className="f1-l-radio-id">
                        {d && <Swatch color={d.color} />}
                        <span className="f1-l-code">{d?.acronym ?? `#${m.driver_number}`}</span>
                        {d && <span className="f1-a-muted f1-a-hide-s"> {d.team}</span>}
                      </span>
                      <a href={m.recording_url} target="_blank" rel="noopener noreferrer" className="f1-l-link">
                        [ AUDIO ]
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
