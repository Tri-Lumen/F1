# F1 Dashboard

Live-updating dashboard for the 2026 Formula 1 season — standings, race results, live timing, stats, and historical data for every driver and team.

## Install

The quickest way to install F1 Dashboard is with the one-line installers below. They always download the **latest release** from GitHub — no need to grab a new installer after every update.

**Windows** (PowerShell):

```powershell
irm https://raw.githubusercontent.com/Tri-Lumen/F1/main/installer/install-windows.ps1 | iex
```

**macOS** (Terminal):

```bash
curl -fsSL https://raw.githubusercontent.com/Tri-Lumen/F1/main/installer/install-macos.sh | bash
```

**Linux** (Terminal):

```bash
curl -fsSL https://raw.githubusercontent.com/Tri-Lumen/F1/main/installer/install-linux.sh | bash
```

> After the initial install, the app updates itself automatically via the built-in Electron auto-updater.

### Direct Downloads

You can also grab a specific build from the [Releases page](https://github.com/Tri-Lumen/F1/releases/latest):

| Platform | Asset |
|---|---|
| Windows | [F1-Dashboard-Setup.exe](https://github.com/Tri-Lumen/F1/releases/latest/download/F1-Dashboard-Setup.exe) |
| macOS | [F1-Dashboard.dmg](https://github.com/Tri-Lumen/F1/releases/latest/download/F1-Dashboard.dmg) |
| Linux | [F1-Dashboard.AppImage](https://github.com/Tri-Lumen/F1/releases/latest/download/F1-Dashboard.AppImage) |

## Run from Source

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Docker

```bash
docker compose up -d
```

Or build and run directly:

```bash
docker build -t f1-dashboard .
docker run -p 3000:3000 f1-dashboard
```

### Portainer

**Pre-built image (recommended)** — Go to **Stacks → Add stack → Web editor** and paste:

```yaml
services:
  f1-dashboard:
    image: ghcr.io/tri-lumen/f1:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
```

**From Git** — Go to **Stacks → Add stack → Repository**, set the URL to `https://github.com/Tri-Lumen/F1.git` and the compose path to `docker-compose.yml`.

> Portainer's built-in git client can fail to clone from GitHub with an HTTP 500. Use the pre-built image if this happens.

## Pages

| Route | Description |
|---|---|
| `/` | Season overview — live banner, next session, championship leaders, recent results |
| `/live` | Live timing — positions, tire strategy, team radio, onboard links |
| `/races` | Race calendar (upcoming and completed) with F1TV links |
| `/race/:round` | Race detail — podium, classification, qualifying, F1TV link |
| `/drivers` | Driver standings with stat cards (wins, podiums, poles, DNFs, etc.) |
| `/drivers/:driverId` | Driver profile — results, points chart, qualifying gaps, teammate H2H |
| `/teams` | Constructor standings with driver lineups and aggregate stats |
| `/teams/:constructorId` | Team profile — driver comparison, points chart, results breakdown |
| `/stats` | Season analytics — wins/podiums breakdown, points leaders, team battles |
| `/fastest-laps` | Fastest lap rankings per race (time, speed, position) |
| `/compare` | Head-to-head driver comparison |
| `/archive` | Historical season index |
| `/archive/:season` | Past season standings and results (2016–2025) |
| `/favorites` | Personalised view of tracked drivers and teams |
| `/settings` | Theme, accent colour, and favourite preferences |

## Features

- **Live timing** — Top 5 positions, tire compounds, and intervals during active sessions
- **Session countdown** — Nav pill counts down to the next session; pulses LIVE when active
- **Auto-refresh** — Periodic data refresh on every page
- **F1TV links** — Direct watch links on race cards and detail pages
- **Driver & team profiles** — Points progression, qualifying gaps, teammate H2H
- **Favorites** — Pin drivers and teams for a personalised summary
- **Archive** — Historical standings and results (2016–2025)
- **Team colors** — Correct 2026 colours for all 10 constructors
- **Dark / light theme** — F1-branded dark UI with red accents; light mode with team accent colours
- **Responsive** — Mobile through widescreen

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- TypeScript / Tailwind CSS 4
- [Electron 33](https://www.electronjs.org) (desktop builds)
- [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) — standings, results, schedule
- [OpenF1 API](https://openf1.org) — live timing, tire stints, team radio
