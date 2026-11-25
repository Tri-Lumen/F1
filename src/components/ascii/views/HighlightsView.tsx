import Link from "next/link";
import { AsciiHeader, Panel, Swatch } from "../kit";
import "@/app/ascii/highlights.css";

/*
 * ASCII view of the /highlights page. The server page builds these plain rows from the same
 * season results and standings as the standard markup, then passes them here. Row styles
 * live in src/app/ascii/highlights.css.
 */

export type HlType = "win" | "pole" | "fastest-lap" | "dnf" | "milestone";
export type HlCategory = "collision" | "mechanical" | "other";

export interface HlHighlightRow {
  key: string;
  type: HlType;
  round: string;
  raceName: string;
  driverName: string;
  constructorName: string;
  teamColor: string;
  detail: string;
  isFirst: boolean;
}

export interface HlIncidentRow {
  key: string;
  round: string;
  raceName: string;
  driverName: string;
  constructorName: string;
  teamColor: string;
  position: string;
  status: string;
  category: HlCategory;
}

export interface HlDnfRow {
  key: string;
  name: string;
  teamColor: string;
  count: number;
  reliability: number;
}

export interface HighlightsViewProps {
  year: string;
  racesComplete: number;
  uniqueWinners: number;
  uniquePolesitters: number;
  totalDNFs: number;
  collisions: number;
  mechanical: number;
  other: number;
  highlights: HlHighlightRow[];
  incidents: HlIncidentRow[];
  dnfs: HlDnfRow[];
}

const TYPE_CONFIG: Record<HlType, { label: string; color: string }> = {
  win: { label: "WIN", color: "#FFD700" },
  pole: { label: "POLE", color: "#A855F7" },
  "fastest-lap": { label: "FL", color: "#8B5CF6" },
  dnf: { label: "DNF", color: "#EF4444" },
  milestone: { label: "MILESTONE", color: "var(--color-f1-accent)" },
};

const CATEGORY_CONFIG: Record<HlCategory, { label: string; color: string }> = {
  collision: { label: "CRASH", color: "#ef4444" },
  mechanical: { label: "MECH", color: "#f97316" },
  other: { label: "OTHER", color: "#6b7280" },
};

const short = (name: string) => name.replace(" Grand Prix", " GP");

/** Shown when the season has no completed races yet. */
export function HighlightsEmpty({ year }: { year: string }) {
  return (
    <div className="f1-ascii-dash f1-ascii-hl">
      <AsciiHeader title="Highlights & Incidents" subtitle={`${year} Season`} />
      <p className="f1-a-muted">No race data available yet for {year}.</p>
    </div>
  );
}

export default function HighlightsView(p: HighlightsViewProps) {
  return (
    <div className="f1-ascii-dash f1-ascii-hl">
      <AsciiHeader
        title="Highlights & Incidents"
        subtitle={`${p.year} Season · First wins, poles, fastest laps, and the full incident log`}
      />

      {/* Season summary */}
      <Panel label="Season summary">
        <div className="hl-stats">
          <span><span className="f1-a-muted">RACES</span> <span className="f1-a-accent">{p.racesComplete}</span></span>
          <span><span className="f1-a-muted">WINNERS</span> <span className="f1-a-accent">{p.uniqueWinners}</span></span>
          <span><span className="f1-a-muted">GRID P1S</span> <span className="f1-a-accent">{p.uniquePolesitters}</span></span>
          <span><span className="f1-a-muted">DNFS</span> <span className="f1-a-accent">{p.totalDNFs}</span></span>
          <span><span className="f1-a-muted">CRASH</span> {p.collisions}</span>
          <span><span className="f1-a-muted">MECH</span> {p.mechanical}</span>
          <span><span className="f1-a-muted">OTHER</span> {p.other}</span>
        </div>
      </Panel>

      {/* Timeline */}
      <Panel id="highlights" label={`Season timeline · ${p.highlights.length}`}>
        {p.highlights.length === 0 ? (
          <p className="f1-a-muted">No highlights extracted yet.</p>
        ) : (
          <div className="f1-a-table">
            <div className="hl-row hl-tl hl-head">
              <span>TYPE</span>
              <span className="hl-rd">RD</span>
              <span>DRIVER</span>
              <span className="f1-a-hide-s">DETAIL</span>
            </div>
            {p.highlights.map((h) => {
              const cfg = TYPE_CONFIG[h.type];
              return (
                <div key={h.key} className="hl-row hl-tl">
                  <span className="hl-type" style={{ color: cfg.color }}>
                    <Swatch color={h.teamColor} /> {cfg.label}
                    {h.isFirst ? " 1ST" : ""}
                  </span>
                  <span className="hl-rd f1-a-hide-s f1-a-muted">R{h.round}</span>
                  <Link href={`/race/${h.round}`} className="hl-driver">
                    <span className="hl-name">{h.driverName}</span>
                    <span className="hl-sub f1-a-muted">
                      {short(h.raceName)} · {h.constructorName} · {h.detail}
                    </span>
                  </Link>
                  <span className="f1-a-hide-s f1-a-muted hl-cell">{h.detail}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Incident log */}
      <Panel id="incidents" label={`Incident log · ${p.incidents.length}`}>
        {p.incidents.length === 0 ? (
          <p className="f1-a-muted">No retirements recorded this season.</p>
        ) : (
          <div className="f1-a-table">
            <div className="hl-row hl-inc hl-head">
              <span className="hl-rd">RD</span>
              <span className="f1-a-hide-s">RACE</span>
              <span>DRIVER</span>
              <span className="hl-pos">POS</span>
              <span className="f1-a-hide-s">REASON</span>
              <span>TYPE</span>
            </div>
            {p.incidents.map((inc) => {
              const cfg = CATEGORY_CONFIG[inc.category];
              return (
                <div key={inc.key} className="hl-row hl-inc">
                  <Link href={`/race/${inc.round}`} className="hl-rd hl-rdlink">R{inc.round}</Link>
                  <span className="f1-a-hide-s f1-a-muted hl-cell">{short(inc.raceName)}</span>
                  <span className="hl-driver-cell">
                    <Swatch color={inc.teamColor} />
                    <span className="hl-name">{inc.driverName}</span>
                    <span className="hl-sub f1-a-muted">{inc.status}</span>
                  </span>
                  <span className="hl-pos f1-a-muted">P{inc.position}</span>
                  <span className="f1-a-hide-s hl-cell" style={{ color: cfg.color }}>{inc.status}</span>
                  <span className="hl-cat" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* DNFs per driver */}
      {p.dnfs.length > 0 && (
        <Panel label="DNFs per driver">
          <div className="f1-a-table">
            <div className="hl-row hl-dnf hl-head">
              <span>DRIVER</span>
              <span className="hl-num">DNFS</span>
              <span className="hl-num">REL %</span>
            </div>
            {p.dnfs.map((d) => (
              <div key={d.key} className="hl-row hl-dnf">
                <span className="hl-driver-cell">
                  <Swatch color={d.teamColor} />
                  <span className="hl-name">{d.name}</span>
                </span>
                <span className="hl-num hl-red">{d.count}</span>
                <span className="hl-num">{d.reliability}%</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
