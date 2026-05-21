import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Main title — accepts a node so callers can colour parts (e.g. a red "F1") */
  title: ReactNode;
  subtitle?: ReactNode;
  /** Small uppercase label rendered above the title */
  eyebrow?: ReactNode;
  /** Right-aligned slot for actions (RefreshButton, links, etc.) */
  actions?: ReactNode;
  className?: string;
}

/**
 * Consistent page title block (Barlow-Condensed title + DM-Sans subtitle).
 * Standardises the per-page header markup that was previously hand-rolled with
 * a mix of inline styles and Tailwind across pages.
 */
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-f1-text-muted">
            {eyebrow}
          </p>
        )}
        <h1
          className="text-3xl font-black tracking-tight leading-none"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-f1-text-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
