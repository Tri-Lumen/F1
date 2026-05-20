import type { ReactNode } from "react";

interface EmptyStateProps {
  title: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Optional action (button/link) rendered below the hint */
  action?: ReactNode;
  /** "error" tints the surface red for failure states */
  variant?: "default" | "error";
  className?: string;
}

const DefaultIcon = (
  <svg
    className="h-10 w-10"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Standardised empty / error / no-results block, generalised from the bespoke
 * card markup that pages such as News rolled by hand.
 */
export default function EmptyState({
  title,
  hint,
  icon,
  action,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  const surface =
    variant === "error"
      ? "border-f1-red/30 bg-f1-red/10"
      : "border-f1-border/50 bg-f1-card/60";
  const titleColor = variant === "error" ? "text-f1-red" : "text-f1-text-muted";

  return (
    <div
      className={`rounded-xl border ${surface} p-10 text-center ${className}`}
    >
      <div className="mx-auto mb-3 flex justify-center text-f1-text-muted/40">
        {icon ?? DefaultIcon}
      </div>
      <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
      {hint && <p className="mt-1 text-xs text-f1-text-muted/70">{hint}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
