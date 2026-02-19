"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/live", label: "Live" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
  { href: "/races", label: "Races" },
  { href: "/compare", label: "Compare" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-f1-border bg-f1-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-f1-red">
            F1
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-f1-text-muted sm:block">
            Dashboard 2025
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-f1-text-muted hover:text-f1-text"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-f1-red" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
