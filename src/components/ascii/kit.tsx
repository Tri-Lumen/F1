import type { ReactNode } from "react";

/*
 * Shared primitives for the ASCII visual style. Plain server-safe components; every
 * class is styled under html[data-style="ascii"] in src/app/ascii.css.
 */

export const FULL = "█".repeat(300);
export const TRACK = "░".repeat(300);
const SPARK = "▁▂▃▄▅▆▇█";

/** `## TITLE` page header with a muted subtitle. */
export function AsciiHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="f1-a-head-block">
      <h1 className="f1-a-page-title">
        <span className="f1-a-rule">## </span>
        {title}
      </h1>
      {subtitle && <p className="f1-a-muted">{subtitle}</p>}
    </header>
  );
}

/** Single-line frame with the label set into the top rule: `[ LABEL ]`. */
export function Panel({ label, children, className = "" }: { label?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`f1-a-panel ${className}`}>
      {label !== undefined && (
        <h2 className="f1-a-label">
          <span className="f1-a-rule">[ </span>
          <span className="f1-a-lt">{label}</span>
          <span className="f1-a-rule"> ]</span>
        </h2>
      )}
      {children}
    </section>
  );
}

/** Solid block bar clipped to `frac` (0–1) of its width, with a dimmed track. */
export function Bar({ frac, color }: { frac: number; color: string }) {
  const pct = Math.max(0, Math.min(1, frac)) * 100;
  return (
    <div className="f1-a-bar" aria-hidden="true">
      <span className="f1-a-track">{TRACK}</span>
      <span className="f1-a-fill" style={{ width: `${pct}%`, color }}>
        {FULL}
      </span>
    </div>
  );
}

/** Finishing-position form as block sparkline characters (1 = tallest). */
export function spark(form: number[]) {
  return form
    .map((p) => {
      const v = 1 - (Math.min(Math.max(p, 1), 20) - 1) / 19;
      return SPARK[Math.min(7, Math.round(v * 7))];
    })
    .join("");
}

/** Small colored key block used beside names. */
export function Swatch({ color }: { color: string }) {
  return <span className="f1-a-swatch" style={{ background: color }} />;
}

/** The `[ LABEL ]` heading set into a panel's top rule. Use inside a Panel-like `section.f1-a-panel`. */
export function Label({ children }: { children: string }) {
  return (
    <h2 className="f1-a-label">
      <span className="f1-a-rule">[ </span>
      <span className="f1-a-lt">{children}</span>
      <span className="f1-a-rule"> ]</span>
    </h2>
  );
}
