import type { CSSProperties, ReactNode } from "react";

interface CardShellProps {
  children: ReactNode;
  /** "accent" draws a left team/accent bar; "plain" drops the border */
  variant?: "default" | "accent" | "plain";
  /** Accent color for the variant="accent" bar (defaults to the theme accent) */
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Standard card surface used across pages — replaces the ad-hoc
 * `{ borderRadius, border, background }` objects duplicated on most pages so
 * border/background/radius track the theme tokens uniformly.
 */
export default function CardShell({
  children,
  variant = "default",
  accentColor,
  className = "",
  style,
}: CardShellProps) {
  const base =
    variant === "plain"
      ? "rounded-xl bg-f1-card/60"
      : "rounded-xl border border-f1-border bg-f1-card";

  if (variant === "accent") {
    return (
      <div className={`${base} overflow-hidden ${className}`} style={style}>
        <div
          className="h-1 w-full"
          style={{ backgroundColor: accentColor ?? "var(--color-f1-accent)" }}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={`${base} ${className}`} style={style}>
      {children}
    </div>
  );
}
