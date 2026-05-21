"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { DriverStanding } from "@/lib/types";
import SidebarNav from "@/components/SidebarNav";
import { OPEN_PALETTE_EVENT } from "@/components/CommandPalette";

/**
 * Responsive app shell. On desktop the sidebar is fixed and the content is
 * offset by its width; below the `md` breakpoint the sidebar becomes an
 * off-canvas drawer toggled from a sticky mobile top bar.
 */
export default function AppShell({
  standings,
  children,
}: {
  standings: DriverStanding[];
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-[120] flex items-center gap-3 border-b border-f1-border bg-f1-black/90 px-4 py-2.5 acrylic md:hidden">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-f1-border text-f1-text-muted"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-xl font-black text-f1-accent" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            F1
          </span>
          <span className="text-xs font-semibold tracking-widest text-f1-text-muted">2026</span>
        </Link>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))}
          aria-label="Search"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-f1-border text-f1-text-muted"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z" />
          </svg>
        </button>
      </div>

      {/* Mobile backdrop */}
      {navOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/50 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <SidebarNav standings={standings} mobileOpen={navOpen} onClose={() => setNavOpen(false)} />

      <main className="min-w-0 px-4 pb-12 pt-4 md:ml-56 md:px-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
