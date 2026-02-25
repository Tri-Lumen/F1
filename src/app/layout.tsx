import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/lib/ThemeContext";
import { FavoritesProvider } from "@/lib/FavoritesContext";

export const metadata: Metadata = {
  title: "F1 Dashboard — 2025 Season",
  description: "Live F1 stats, standings, and race results for the 2025 season",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@200;300;400;600;700;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('f1-theme');
                  if (t === 'light' || t === 'dark' || (t && t.startsWith('team-'))) {
                    document.documentElement.setAttribute('data-theme', t);
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
            <Nav />
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
