"use client";

import { useMemo, useState } from "react";
import { usePredictions } from "@/lib/PredictionsContext";
import { scorePrediction } from "@/lib/predictionScoring";
import { getTeamColor, getCountryFlagByCountry } from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";
import type {
  DriverStanding,
  Prediction,
  PredictionScoreBreakdown,
  RaceResult,
} from "@/lib/types";
import DriverPicker from "./DriverPicker";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

export interface RoundInfo {
  round: string;
  raceName: string;
  country: string;
  raceDateISO: string;
  qualifyingDateISO: string;
  /** Pole driver if known (from qualifying or completed race grid) */
  polePosition?: string;
  /** Race results, or null if the race hasn't happened yet */
  raceResults: RaceResult[] | null;
}

type Mode = "OPEN" | "POLE_LOCKED" | "SCORED";

function modeFor(info: RoundInfo): Mode {
  if (info.raceResults && info.raceResults.length > 0) return "SCORED";
  // Pole becomes locked once qualifying has happened (we have a known pole).
  // We don't lock the podium/FL slots until the race itself starts, so the
  // user can keep editing those right up until lights-out.
  if (info.polePosition) return "POLE_LOCKED";
  return "OPEN";
}

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--color-f1-border)",
  background: "var(--color-f1-dark)",
};

const labelStyle: React.CSSProperties = {
  fontFamily: BC,
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: "0.1em",
  color: "var(--color-f1-text-muted)",
  textTransform: "uppercase",
  marginBottom: 4,
};

export default function PredictionsClient({
  rounds,
  drivers,
}: {
  rounds: RoundInfo[];
  drivers: DriverStanding[];
  season: string;
}) {
  const { mounted, getPrediction, savePrediction, clearPrediction } = usePredictions();

  // Compute season total from scored rounds. Only meaningful after mount
  // because the predictions array lives in localStorage.
  const seasonScores = useMemo(() => {
    if (!mounted) return null;
    const items: Array<{ round: string; score: PredictionScoreBreakdown }> = [];
    let total = 0;
    for (const r of rounds) {
      if (modeFor(r) !== "SCORED") continue;
      const pred = getPrediction(r.round);
      if (!pred || !r.raceResults) continue;
      const breakdown = scorePrediction(pred, r.raceResults, r.polePosition);
      total += breakdown.total;
      items.push({ round: r.round, score: breakdown });
    }
    return { items, total };
  }, [mounted, rounds, getPrediction]);

  if (!mounted) {
    return <div className="h-48 rounded-xl bg-f1-card animate-pulse" />;
  }

  return (
    <>
      {/* Season total */}
      <div style={{ ...cardStyle, padding: "18px 20px", marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={labelStyle}>Season total</div>
            <div
              style={{
                fontFamily: BC,
                fontWeight: 900,
                fontSize: 32,
                lineHeight: 1,
                color: "var(--color-f1-accent)",
              }}
            >
              {seasonScores?.total ?? 0}
              <span
                style={{
                  fontSize: 14,
                  marginLeft: 6,
                  color: "var(--color-f1-text-muted)",
                  fontWeight: 700,
                }}
              >
                pts
              </span>
            </div>
          </div>
          <div
            style={{
              fontFamily: DM,
              fontSize: 11,
              color: "var(--color-f1-text-muted)",
              textAlign: "right",
            }}
          >
            {seasonScores?.items.length ?? 0} round
            {seasonScores?.items.length === 1 ? "" : "s"} scored ·{" "}
            {rounds.length} on calendar
          </div>
        </div>
      </div>

      {/* Per-round cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rounds.map((info) => (
          <RoundCard
            key={info.round}
            info={info}
            drivers={drivers}
            saved={getPrediction(info.round)}
            onSave={savePrediction}
            onClear={() => clearPrediction(info.round)}
          />
        ))}
      </div>
    </>
  );
}

function RoundCard({
  info,
  drivers,
  saved,
  onSave,
  onClear,
}: {
  info: RoundInfo;
  drivers: DriverStanding[];
  saved: Prediction | undefined;
  onSave: (p: Prediction) => void;
  onClear: () => void;
}) {
  const mode = modeFor(info);
  const flag = getCountryFlagByCountry(info.country);

  return (
    <div style={{ ...cardStyle, overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-f1-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: 11,
              padding: "2px 7px",
              borderRadius: 4,
              background: "var(--color-f1-card)",
              color: "var(--color-f1-text-muted)",
            }}
          >
            R{info.round}
          </span>
          <span
            style={{
              fontFamily: BC,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: "0.02em",
            }}
          >
            {flag} {info.raceName}
          </span>
        </div>
        <StatusPill mode={mode} />
      </div>
      <div style={{ padding: 16 }}>
        {mode === "SCORED" && info.raceResults && (
          <ScoredView info={info} drivers={drivers} saved={saved} />
        )}
        {mode === "POLE_LOCKED" && (
          <PickForm
            info={info}
            drivers={drivers}
            saved={saved}
            onSave={onSave}
            onClear={onClear}
            poleLocked
          />
        )}
        {mode === "OPEN" && (
          <PickForm
            info={info}
            drivers={drivers}
            saved={saved}
            onSave={onSave}
            onClear={onClear}
            poleLocked={false}
          />
        )}
      </div>
    </div>
  );
}

function StatusPill({ mode }: { mode: Mode }) {
  const styles: Record<Mode, { bg: string; color: string; label: string }> = {
    OPEN: { bg: "rgba(34,153,113,0.18)", color: "#22aa55", label: "OPEN" },
    POLE_LOCKED: {
      bg: "rgba(202,138,4,0.18)",
      color: "#ca8a04",
      label: "POLE LOCKED",
    },
    SCORED: {
      bg: "rgba(225,6,0,0.18)",
      color: "#e10600",
      label: "SCORED",
    },
  };
  const s = styles[mode];
  return (
    <span
      style={{
        fontFamily: BC,
        fontWeight: 800,
        fontSize: 10,
        letterSpacing: "0.1em",
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 99,
      }}
    >
      {s.label}
    </span>
  );
}

function PickForm({
  info,
  drivers,
  saved,
  onSave,
  onClear,
  poleLocked,
}: {
  info: RoundInfo;
  drivers: DriverStanding[];
  saved: Prediction | undefined;
  onSave: (p: Prediction) => void;
  onClear: () => void;
  poleLocked: boolean;
}) {
  const [pole, setPole] = useState<string>(saved?.pole ?? info.polePosition ?? "");
  const [p1, setP1] = useState<string>(saved?.p1 ?? "");
  const [p2, setP2] = useState<string>(saved?.p2 ?? "");
  const [p3, setP3] = useState<string>(saved?.p3 ?? "");
  const [fl, setFl] = useState<string>(saved?.fastestLap ?? "");

  const canSave =
    Boolean(pole) &&
    Boolean(p1) &&
    Boolean(p2) &&
    Boolean(p3) &&
    new Set([p1, p2, p3]).size === 3;

  function handleSubmit() {
    if (!canSave) return;
    onSave({
      round: info.round,
      pole,
      p1,
      p2,
      p3,
      fastestLap: fl || undefined,
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <div style={labelStyle}>Pole</div>
          <DriverPicker
            drivers={drivers}
            value={pole}
            onChange={setPole}
            disabled={poleLocked}
          />
          {poleLocked && info.polePosition && (
            <div
              style={{
                fontFamily: DM,
                fontSize: 10,
                color: "var(--color-f1-text-muted)",
                marginTop: 4,
              }}
            >
              Qualifying complete — pole is locked.
            </div>
          )}
        </div>
        <div>
          <div style={labelStyle}>P1</div>
          <DriverPicker drivers={drivers} value={p1} onChange={setP1} />
        </div>
        <div>
          <div style={labelStyle}>P2</div>
          <DriverPicker drivers={drivers} value={p2} onChange={setP2} />
        </div>
        <div>
          <div style={labelStyle}>P3</div>
          <DriverPicker drivers={drivers} value={p3} onChange={setP3} />
        </div>
        <div>
          <div style={labelStyle}>Fastest lap (optional)</div>
          <DriverPicker drivers={drivers} value={fl} onChange={setFl} allowEmpty />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSave}
          style={{
            background: canSave ? "var(--color-f1-accent)" : "var(--color-f1-card)",
            border: "none",
            color: canSave ? "#fff" : "var(--color-f1-text-muted)",
            fontFamily: BC,
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: "0.08em",
            padding: "6px 16px",
            borderRadius: 99,
            cursor: canSave ? "pointer" : "not-allowed",
          }}
        >
          {saved ? "UPDATE" : "SAVE PICK"}
        </button>
        {saved && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: "transparent",
              border: "1px solid var(--color-f1-border)",
              color: "var(--color-f1-text-muted)",
              fontFamily: BC,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.08em",
              padding: "5px 14px",
              borderRadius: 99,
              cursor: "pointer",
            }}
          >
            CLEAR
          </button>
        )}
        {saved && (
          <span
            style={{
              fontFamily: DM,
              fontSize: 10,
              color: "var(--color-f1-text-muted)",
              marginLeft: "auto",
            }}
          >
            saved {new Date(saved.submittedAt).toLocaleString("en-US")}
          </span>
        )}
        {!canSave && !saved && (
          <span
            style={{
              fontFamily: DM,
              fontSize: 10,
              color: "var(--color-f1-text-muted)",
              marginLeft: "auto",
            }}
          >
            Pick four unique drivers (pole + podium) to save.
          </span>
        )}
      </div>
    </div>
  );
}

function ScoredView({
  info,
  drivers,
  saved,
}: {
  info: RoundInfo;
  drivers: DriverStanding[];
  saved: Prediction | undefined;
}) {
  if (!info.raceResults) return null;

  if (!saved) {
    return (
      <p
        style={{
          fontFamily: DM,
          fontSize: 12,
          color: "var(--color-f1-text-muted)",
        }}
      >
        No prediction saved for this round.
      </p>
    );
  }

  const breakdown = scorePrediction(saved, info.raceResults, info.polePosition);
  const driverName = (id: string | undefined) => {
    if (!id) return "—";
    const d = drivers.find((s) => s.Driver.driverId === id);
    return d ? d.Driver.familyName.toUpperCase() : id;
  };

  const actualP = (slot: number) =>
    info.raceResults?.find((r) => r.position === String(slot))?.Driver.driverId;
  const actualFL = info.raceResults.find((r) => r.FastestLap?.rank === "1")?.Driver.driverId;

  const rows: Array<{ label: string; pick?: string; actual?: string; pts: number }> = [
    { label: "Pole", pick: saved.pole, actual: info.polePosition, pts: breakdown.pole },
    { label: "P1", pick: saved.p1, actual: actualP(1), pts: breakdown.p1 },
    { label: "P2", pick: saved.p2, actual: actualP(2), pts: breakdown.p2 },
    { label: "P3", pick: saved.p3, actual: actualP(3), pts: breakdown.p3 },
  ];
  if (saved.fastestLap || actualFL) {
    rows.push({
      label: "Fastest Lap",
      pick: saved.fastestLap,
      actual: actualFL,
      pts: breakdown.fastestLap,
    });
  }
  if (breakdown.podiumOffSlot > 0) {
    rows.push({
      label: "Off-slot podium",
      pick: undefined,
      actual: undefined,
      pts: breakdown.podiumOffSlot,
    });
  }

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-f1-border)" }}>
            {["Slot", "Your pick", "Actual", "Pts"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "6px 10px",
                  fontFamily: BC,
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--color-f1-text-muted)",
                  textTransform: "uppercase",
                  textAlign: h === "Pts" ? "right" : "left",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pickConstructor = row.pick
              ? getDriverConstructorId(
                  row.pick,
                  drivers.find((d) => d.Driver.driverId === row.pick)?.Constructors[0]
                    ?.constructorId,
                )
              : undefined;
            const actualConstructor = row.actual
              ? getDriverConstructorId(
                  row.actual,
                  drivers.find((d) => d.Driver.driverId === row.actual)?.Constructors[0]
                    ?.constructorId,
                )
              : undefined;
            return (
              <tr
                key={row.label}
                style={{ borderBottom: "1px solid var(--color-f1-border)" }}
              >
                <td
                  style={{
                    padding: "8px 10px",
                    fontFamily: BC,
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: "0.04em",
                  }}
                >
                  {row.label}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 13,
                    color: pickConstructor
                      ? getTeamColor(pickConstructor)
                      : "var(--color-f1-text-muted)",
                  }}
                >
                  {driverName(row.pick)}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 13,
                    color: actualConstructor
                      ? getTeamColor(actualConstructor)
                      : "var(--color-f1-text-muted)",
                  }}
                >
                  {driverName(row.actual)}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    fontFamily: "monospace",
                    fontSize: 12,
                    textAlign: "right",
                    color:
                      row.pts > 0 ? "var(--color-f1-accent)" : "var(--color-f1-text-muted)",
                  }}
                >
                  {row.pts > 0 ? `+${row.pts}` : "0"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={3}
              style={{
                padding: "10px 10px",
                fontFamily: BC,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: "0.04em",
                textAlign: "right",
              }}
            >
              ROUND TOTAL
            </td>
            <td
              style={{
                padding: "10px 10px",
                fontFamily: BC,
                fontWeight: 900,
                fontSize: 18,
                textAlign: "right",
                color: "var(--color-f1-accent)",
              }}
            >
              {breakdown.total}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
