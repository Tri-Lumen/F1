# F1 Dashboard

Real-time Formula 1 dashboard for the 2026 season. Track live sessions, standings, race results, driver and team stats, and explore historical data back to 2016 — all in a single app.

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![Electron](https://img.shields.io/badge/Electron_33-47848F?logo=electron&logoColor=white)

## Install

One-line installers that always pull the latest release from GitHub.

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

After the initial install the app updates itself automatically via the built-in Electron auto-updater.

### Direct Downloads

Grab a specific build from the [Releases page](https://github.com/Tri-Lumen/F1/releases/latest):

| Platform | Asset |
|---|---|
| Windows | [F1-Dashboard-Setup.exe](https://github.com/Tri-Lumen/F1/releases/latest/download/F1-Dashboard-Setup.exe) |
| macOS (Apple Silicon) | [F1-Dashboard-arm64.dmg](https://github.com/Tri-Lumen/F1/releases/latest/download/F1-Dashboard-arm64.dmg) |
| macOS (Intel) | [F1-Dashboard-x64.dmg](https://github.com/Tri-Lumen/F1/releases/latest/download/F1-Dashboard-x64.dmg) |
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

### Electron (Desktop)

```bash
npm run electron:dev      # build + launch Electron
npm run electron:build    # package for current platform
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

The included `docker-compose.yml` ships with [Watchtower](https://containrrr.dev/watchtower/) for automatic hourly image updates.

### Portainer

**Pre-built image (recommended)** — Stacks > Add stack > Web editor:

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

**From Git** — Stacks > Add stack > Repository, set the URL to `https://github.com/Tri-Lumen/F1.git` and the compose path to `docker-compose.yml`.

## Features

### Live Timing
- Real-time positions, intervals, and gap to leader during active sessions
- Tire compound and age tracking with stint history visualization
- Team radio feed with audio playback
- One-click onboard camera links via MultiViewer
- Auto-refresh every 15 seconds with manual refresh button

### Session Awareness
- Nav bar pill counts down to the next session with days/hours/minutes
- Pulsing red LIVE badge when a session is active
- Dashboard banner highlights the current live session

### Standings & Results
- Full driver and constructor championship standings
- Race detail pages with podium, classification, qualifying, sprint, and pit stops
- Fastest lap rankings per race with time and speed

### Driver & Team Profiles
- Points progression charts across the season
- Qualifying gap analysis
- Teammate head-to-head comparison
- Win, podium, pole, and DNF stat cards

### Stats & Comparison
- Season analytics with wins/podiums breakdown and points leaders
- Head-to-head driver comparison tool
- Historical archive covering 2016 through 2025

### Personalisation
- Pin favorite drivers and teams for a custom summary view
- Dark and light theme with F1-branded styling
- Configurable accent colors per team

### Cross-Platform
- Desktop app for Windows, macOS, and Linux with automatic updates
- Docker and Portainer deployment for self-hosting
- Fully responsive from mobile to widescreen

## Pages

| Route | Description |
|---|---|
| `/` | Season overview — live banner, next session countdown, championship leaders, recent results |
| `/live` | Live timing — positions, intervals, tire strategy, team radio, onboard cameras |
| `/races` | Race calendar with upcoming and completed races, F1TV watch links |
| `/race/:round` | Race detail — podium, full classification, qualifying, sprint, pit stops |
| `/drivers` | Driver standings with stat cards |
| `/drivers/:id` | Driver profile — results, points chart, qualifying gaps, teammate H2H |
| `/teams` | Constructor standings with driver lineups |
| `/teams/:id` | Team profile — driver comparison, points chart, results breakdown |
| `/stats` | Season analytics — wins, podiums, points leaders, team battles |
| `/fastest-laps` | Fastest lap rankings per race |
| `/compare` | Head-to-head driver comparison |
| `/archive` | Historical season browser (2016–2025) |
| `/archive/:season` | Past season standings and results |
| `/favorites` | Personalized view of pinned drivers and teams |
| `/settings` | Theme, accent color, and favorite preferences |

## Tech Stack

| | |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| **Language** | TypeScript 5.9 |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Desktop** | [Electron 33](https://www.electronjs.org) + electron-updater |
| **Standings & Results API** | [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) |
| **Live Timing API** | [OpenF1](https://openf1.org) |
| **Containerization** | Docker (Node 22 Alpine) + Watchtower |

## License

ISC
