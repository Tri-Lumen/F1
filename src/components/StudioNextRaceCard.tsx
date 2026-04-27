import type { Race } from "@/lib/types";
import { getCountryFlagByCountry } from "@/lib/api";
import CircuitMap from "@/components/CircuitMap";
import StudioCountdownTiles from "@/components/StudioCountdownTiles";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function getSessionLabel(key: string): string {
  const labels: Record<string, string> = {
    FirstPractice: "FP1",
    SecondPractice: "FP2",
    ThirdPractice: "FP3",
    SprintQualifying: "Sprint Quali",
    Sprint: "Sprint",
    Qualifying: "Qualifying",
    Race: "Race",
  };
  return labels[key] ?? key;
}

function formatSessionDay(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function formatSessionTime(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface Props {
  race: Race;
  nextSessionDate: string;
}

export default function StudioNextRaceCard({ race, nextSessionDate }: Props) {
  const flag = getCountryFlagByCountry(race.Circuit.Location.country);

  type SessionEntry = { key: string; date: string; time: string };
  const sessionEntries: SessionEntry[] = [];
  const addSession = (key: string, s: { date: string; time: string } | undefined) => {
    if (s) sessionEntries.push({ key, ...s });
  };
  addSession("FirstPractice", race.FirstPractice);
  addSession("SecondPractice", race.SecondPractice);
  addSession("ThirdPractice", race.ThirdPractice);
  addSession("SprintQualifying", race.SprintQualifying);
  addSession("Sprint", race.Sprint);
  addSession("Qualifying", race.Qualifying);
  if (race.time) addSession("Race", { date: race.date, time: race.time });

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(225,6,0,0.22)",
        background: "linear-gradient(140deg, rgba(225,6,0,0.07) 0%, #151515 60%)",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Circuit area */}
      <div
        style={{
          height: 140,
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #1a1a1a",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <CircuitMap
          circuitId={race.Circuit.circuitId}
          className="w-full max-w-[200px] h-20 text-f1-accent opacity-20"
        />
        <div
          style={{
            position: "absolute",
            bottom: 7,
            left: 14,
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "#353535",
            textTransform: "uppercase",
            fontFamily: DM,
          }}
        >
          {race.Circuit.circuitName}
        </div>
        <div style={{ position: "absolute", top: 8, right: 10 }}>
          <span
            style={{
              fontFamily: BC,
              fontWeight: 900,
              fontSize: 28,
              color: "#1c1c1c",
            }}
          >
            {race.Circuit.Location.country.slice(0, 3).toUpperCase()}
          </span>
        </div>
        <div style={{ position: "absolute", top: 8, left: 12 }}>
          <span
            style={{
              fontFamily: BC,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#e10600",
              textTransform: "uppercase",
              background: "rgba(225,6,0,0.12)",
              border: "1px solid rgba(225,6,0,0.25)",
              borderRadius: 99,
              padding: "2px 7px",
            }}
          >
            Round {race.round}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "18px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: BC,
            fontWeight: 900,
            fontSize: 20,
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          {flag} {race.raceName}
          <span
            style={{
              fontSize: 12,
              color: "#555",
              fontFamily: DM,
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            {race.Circuit.Location.country}
          </span>
        </div>

        {/* Countdown tiles */}
        <div style={{ marginBottom: 14 }}>
          <StudioCountdownTiles target={nextSessionDate} />
        </div>

        {/* Session schedule */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: "auto" }}>
          {sessionEntries.map((s) => {
            const label = getSessionLabel(s.key);
            const timeStr = s.time.endsWith("Z") ? s.time : `${s.time}Z`;
            const fullDate = `${s.date}T${timeStr}`;
            return (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: DM,
                    fontWeight: 600,
                    fontSize: 11,
                    color:
                      label === "Race"
                        ? "#e10600"
                        : label === "Qualifying"
                        ? "#ccc"
                        : "#484848",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: BC,
                    fontWeight: 600,
                    fontSize: 11,
                    color: "#3a3a3a",
                    letterSpacing: "0.04em",
                  }}
                >
                  {formatSessionDay(s.date + "T" + timeStr.replace("Z", ""))} ·{" "}
                  {formatSessionTime(s.date + "T" + timeStr.replace("Z", ""))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
