import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/lib/ThemeContext";
import { FavoritesProvider } from "@/lib/FavoritesContext";
import { RssFeedProvider } from "@/lib/RssFeedContext";
import { NotificationProvider } from "@/lib/NotificationContext";
import { getNextScheduledSession, getLatestSession, isSessionLive } from "@/lib/api";

export const metadata: Metadata = {
  title: "Delta Dashboard — 2026 Season",
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
      isLive = isSessionLive(latestSession);
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
                  var el = document.documentElement;
                  var m = localStorage.getItem('f1-mode');
                  var a = localStorage.getItem('f1-accent');
                  var r = localStorage.getItem('f1-border-radius');
                  var rm = localStorage.getItem('f1-reduce-motion');
                  var gi = localStorage.getItem('f1-glow-intensity');

                  if (m === 'light' || m === 'dark') el.setAttribute('data-mode', m);
                  if (r === 'sharp' || r === 'default' || r === 'rounded') el.setAttribute('data-radius', r);
                  if (rm === 'true') el.setAttribute('data-reduce-motion', 'true');
                  if (gi) {
                    var g = Math.min(100, Math.max(0, parseInt(gi) || 50));
                    el.style.setProperty('--glow-primary-opacity', Math.round(g * 0.28) + '%');
                    el.style.setProperty('--glow-secondary-opacity', Math.round(g * 0.14) + '%');
                  }
                  if (a && (a.startsWith('team-') || a.startsWith('retro-'))) {
                    el.setAttribute('data-theme', a);
                  }
                  // Custom theme: apply CSS vars directly from stored theme data
                  if (a && a.startsWith('custom-')) {
                    try {
                      var customs = JSON.parse(localStorage.getItem('f1-custom-themes') || '[]');
                      var ct = customs.find(function(t) { return t.id === a; });
                      if (ct && ct.colors) {
                        var c = ct.colors;
                        var vars = {
                          '--color-f1-black': c.bg,
                          '--color-f1-dark': c.dark,
                          '--color-f1-card': c.card,
                          '--color-f1-card-hover': c.cardHover,
                          '--color-f1-border': c.border,
                          '--color-f1-text': c.text,
                          '--color-f1-text-muted': c.textMuted,
                          '--color-f1-accent': c.accent,
                          '--color-f1-red': c.accent,
                          '--color-f1-red-dark': c.accentDark,
                          '--color-f1-accent-secondary': c.accentSecondary,
                        };
                        for (var k in vars) el.style.setProperty(k, vars[k]);
                      }
                    } catch(e2) {}
                  }
                  // Team color overrides
                  try {
                    var overrides = JSON.parse(localStorage.getItem('f1-team-colors') || '{}');
                    var teamVarMap = {
                      red_bull: '--color-team-red-bull', ferrari: '--color-team-ferrari',
                      mclaren: '--color-team-mclaren', mercedes: '--color-team-mercedes',
                      aston_martin: '--color-team-aston-martin', alpine: '--color-team-alpine',
                      williams: '--color-team-williams', haas: '--color-team-haas',
                      rb: '--color-team-rb', audi: '--color-team-audi', cadillac: '--color-team-cadillac',
                    };
                    for (var id in overrides) {
                      if (teamVarMap[id]) el.style.setProperty(teamVarMap[id], overrides[id]);
                    }
                  } catch(e3) {}
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
              <NotificationProvider>
                <Nav nextSession={navSession} isLive={isLive} />
                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                  {children}
                </main>
              </NotificationProvider>
            </RssFeedProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
