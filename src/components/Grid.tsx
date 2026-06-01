import type { CSSProperties, ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  /**
   * Min column width (px) for a responsive auto-fill grid. When set, columns
   * reflow automatically — replaces the hand-rolled
   * `repeat(auto-fill, minmax(Npx, 1fr))` template duplicated across pages.
   */
  minColWidth?: number;
  /** Explicit grid-template-columns when `minColWidth` is not used. */
  cols?: string;
  /** Gap in px (defaults to the standard 16px section gap). */
  gap?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Small grid layout primitive. Consolidates the `display:grid` + column +
 * gap markup that every page previously declared inline with its own literals.
 */
export default function Grid({
  children,
  minColWidth,
  cols,
  gap = 16,
  className = "",
  style,
}: GridProps) {
  const gridTemplateColumns = minColWidth
    ? `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`
    : cols;

  return (
    <div
      className={className}
      style={{ display: "grid", gridTemplateColumns, gap, ...style }}
    >
      {children}
    </div>
  );
}
