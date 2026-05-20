import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  /** Optional right-aligned content (counts, links, controls) */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Uppercase muted section label with an accent tick — the pattern repeated
 * inline across the dashboard, list, and detail pages.
 */
export default function SectionLabel({
  children,
  trailing,
  className = "",
}: SectionLabelProps) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h2
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-f1-text-muted"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        <span className="h-3.5 w-1 rounded-full bg-f1-accent" />
        {children}
      </h2>
      {trailing && <div className="text-xs text-f1-text-muted">{trailing}</div>}
    </div>
  );
}
