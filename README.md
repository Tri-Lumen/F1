# Delta Dashboard

Your pit wall for the 2026 Formula 1 season. Live timing, championship standings, race results, driver and team analytics, and a full historical archive back to 2016 — wrapped in a single, cross-platform app.

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![Electron](https://img.shields.io/badge/Electron_33-47848F?logo=electron&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## What's Inside

### Live Timing

Follow every session as it happens. Real-time positions, intervals, and gap-to-leader update automatically every 15 seconds. Tire compound and age tracking shows each driver's stint history at a glance. Team radio messages stream in with audio playback, and one-click onboard camera links open directly in MultiViewer.

### Race Weekend Awareness

A nav bar countdown ticks down to the next session in days, hours, and minutes. When a session goes green, a pulsing red LIVE badge appears and the dashboard banner switches to highlight the active event.

### Standings & Results

Full driver and constructor championship tables, updated throughout the season. Every race has its own detail page covering the podium, full classification, qualifying order, sprint results, and pit stop summaries. A dedicated fastest-lap rankings page rounds it out.

### Driver & Team Profiles

Each driver and constructor gets a profile page with points progression charts across the season, qualifying gap analysis, teammate head-to-head records, and stat cards for wins, podiums, poles, and DNFs.

### Analytics & History

Season-level analytics break down wins, podiums, and points leaders. A head-to-head comparison tool lets you pit any two drivers against each other. The historical archive covers every season from 2016 through 2025 with full standings and results.

### Personalization

Pin your favorite drivers and teams to get a custom summary view. Switch between dark and light themes styled with official F1 branding, and set accent colors on a per-team basis.

### Cross-Platform

Run it in the browser, install the desktop app on Windows, macOS, or Linux with automatic updates, or self-host with Docker and Portainer. The layout is fully responsive from mobile to widescreen.

---

## Pages

| Route | Description |
|---|---|
| `/` | Season overview — live banner, next-session countdown, championship leaders, recent results |
| `/live` | Live timing — positions, intervals, tire strategy, team radio, onboard cameras |
| `/races` | Race calendar with upcoming and completed rounds, F1TV watch links |
| `/race/:round` | Race detail — podium, classification, qualifying, sprint, pit stops |
| `/drivers` | Driver standings with stat cards |
| `/drivers/:id` | Driver profile — results, points chart, qualifying gaps, teammate H2H |
| `/teams` | Constructor standings with driver lineups |
| `/teams/:id` | Team profile — driver comparison, points chart, results breakdown |
| `/stats` | Season analytics — wins, podiums, points leaders, team battles |
| `/fastest-laps` | Fastest lap rankings per race |
| `/compare` | Head-to-head driver comparison |
| `/archive` | Historical season browser (2016-2025) |
| `/archive/:season` | Past-season standings and results |
| `/favorites` | Personalized view of pinned drivers and teams |
| `/settings` | Theme, accent color, and favorites preferences |

---

## Quick Start

### Desktop App

One-line installers that pull the latest release from GitHub. After the first install, the built-in Electron auto-updater keeps the app current.

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

#### Direct Downloads

Grab a specific build from the [Releases page](https://github.com/Tri-Lumen/F1/releases/latest):

| Platform | Asset |
|---|---|
| Windows | [Delta-Dashboard-Setup.exe](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard-Setup.exe) |
| macOS (Apple Silicon) | [Delta-Dashboard-arm64.dmg](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard-arm64.dmg) |
| macOS (Intel) | [Delta-Dashboard-x64.dmg](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard-x64.dmg) |
| Linux | [Delta-Dashboard.AppImage](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard.AppImage) |

### From Source

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

### Electron (Development)

```bash
npm run electron:dev      # build + launch Electron
npm run electron:build    # package for current platform
```

---

## Docker & Self-Hosting

### Docker Compose

```bash
docker compose up -d
```

The included `docker-compose.yml` ships with [Watchtower](https://containrrr.dev/watchtower/) for automatic hourly image updates.

### Manual Build

```bash
docker build -t delta-dashboard .
docker run -p 3000:3000 delta-dashboard
```

### Portainer

**Pre-built image (recommended)** — Stacks > Add stack > Web editor:

```yaml
services:
  delta-dashboard:
    image: ghcr.io/tri-lumen/f1:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
```

**From Git** — Stacks > Add stack > Repository, set the URL to `https://github.com/Tri-Lumen/F1.git` and the compose path to `docker-compose.yml`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| **Language** | TypeScript 5.9 |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Desktop** | [Electron 33](https://www.electronjs.org) + electron-updater |
| **Standings & Results** | [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) |
| **Live Timing** | [OpenF1](https://openf1.org) |
| **Containerization** | Docker (Node 22 Alpine) + Watchtower |

## License

ISC
