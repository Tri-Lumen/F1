import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/lib/ThemeContext";
import { FavoritesProvider } from "@/lib/FavoritesContext";
import { RssFeedProvider } from "@/lib/RssFeedContext";
import { getNextScheduledSession, getLatestSession } from "@/lib/api";

export const metadata: Metadata = {
  title: "F1 Dashboard — 2026 Season",
  description: "Live F1 stats, standings, and race results for the 2026 season",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch session info once at the layout level so the Nav countdown
  // doesn't require an extra round-trip per page.
  let navSession: { type: string; raceName: string; country: string; date: string } | null = null;
  let isLive = false;

  try {
    const [nextSession, latestSession] = await Promise.all([
      getNextScheduledSession(),
      getLatestSession(),
    ]);

    if (nextSession) {
      navSession = {
        type: nextSession.type,
        raceName: nextSession.raceName,
        country: nextSession.country,
        date: nextSession.date.toISOString(),
      };
    }

    if (latestSession) {
      const now = new Date();
      isLive =
        now >= new Date(latestSession.date_start) &&
        now <= new Date(latestSession.date_end);
    }
  } catch {
    // Non-fatal — nav will render without the countdown
  }

  return (
    <html lang="en" data-mode="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var m = localStorage.getItem('f1-mode');
                  var a = localStorage.getItem('f1-accent');
                  if (m === 'light' || m === 'dark') {
                    document.documentElement.setAttribute('data-mode', m);
                  }
                  if (a && (a.startsWith('team-') || a.startsWith('retro-'))) {
                    document.documentElement.setAttribute('data-theme', a);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-f1-black text-f1-text antialiased"
        style={{ fontFamily: '"Titillium Web", Arial, sans-serif' }}
      >
        <ThemeProvider>
          <FavoritesProvider>
            <RssFeedProvider>
              <Nav nextSession={navSession} isLive={isLive} />
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </RssFeedProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
