import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  label: ReactNode;
  href?: string;
}

/**
 * Compact navigation trail for detail pages (driver / team / race / archive /
 * replay) so users can hop back to the parent list without the browser back
 * button. The last crumb renders as plain (current page) text.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-f1-text-muted">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-f1-accent"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-semibold text-f1-text" : ""}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-f1-text-muted/40" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
