"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Top tab bar for the ASCII style. Hidden in Standard; the sidebar is hidden in ASCII. */
const TABS: Array<{ href: string; label: string; match: (p: string) => boolean }> = [
  { href: "/", label: "DASH", match: (p) => p === "/" },
  { href: "/live", label: "LIVE", match: (p) => p.startsWith("/live") },
  { href: "/races", label: "RACES", match: (p) => p.startsWith("/races") || p.startsWith("/race/") },
  { href: "/drivers", label: "DRIVERS", match: (p) => p.startsWith("/drivers") },
  { href: "/teams", label: "TEAMS", match: (p) => p.startsWith("/teams") },
  { href: "/compare", label: "COMPARE", match: (p) => p.startsWith("/compare") },
  { href: "/settings", label: "SETTINGS", match: (p) => p.startsWith("/settings") },
];

export default function AsciiTopNav() {
  const pathname = usePathname() ?? "/";
  const current = TABS.find((t) => t.match(pathname))?.label ?? "DASH";

  return (
    <header className="f1-ascii-topnav">
      <div className="f1-ascii-topnav-row">
        <Link href="/" className="f1-ascii-brand">
          DELTA<span className="f1-a-rule">//</span>
          <span className="f1-a-lt">{current}</span>
        </Link>
        <nav aria-label="Main" className="f1-ascii-tabs">
          {TABS.map((t, i) => {
            const active = t.label === current;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={active ? "f1-ascii-tab f1-ascii-tab-on" : "f1-ascii-tab"}
              >
                <span className="f1-a-rule">[{i + 1}]</span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
