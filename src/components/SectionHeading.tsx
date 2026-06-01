import type { ReactNode } from "react";

const BC = "'Barlow Condensed', sans-serif";

interface SectionHeadingProps {
  title: ReactNode;
  /** Right-aligned slot for an action (link/button/meta). */
  action?: ReactNode;
  /**
   * "label" — small uppercase eyebrow above a block of content (default).
   * "card"  — a bordered header row sitting at the top of a CardShell.
   */
  variant?: "label" | "card";
  className?: string;
}

/**
 * Standardised section header, mirroring PageHeader at the section level.
 * Replaces the repeated inline-styled "eyebrow" labels and card header rows
 * scattered across the dashboard, live, drivers and races pages.
 */
export default function SectionHeading({
  title,
  action,
  variant = "label",
  className = "",
}: SectionHeadingProps) {
  if (variant === "card") {
    return (
      <div
        className={`flex items-center justify-between border-b border-f1-border px-3.5 py-3 ${className}`}
      >
        <span
          className="text-sm font-extrabold tracking-[0.04em]"
          style={{ fontFamily: BC }}
        >
          {title}
        </span>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    );
  }

  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <span
        className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-f1-text-muted"
        style={{ fontFamily: BC }}
      >
        {title}
      </span>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
