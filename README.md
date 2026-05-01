<div align="center">

# DELTA DASHBOARD

### Your pit wall for the 2026 Formula 1 season

Live timing · Standings · Race results · Driver and team analytics · Historical archive back to 2016

[![Next.js 16](https://img.shields.io/badge/NEXT.JS_16-000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/REACT_19-131313?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-131313?style=for-the-badge&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org)
[![Tailwind 4](https://img.shields.io/badge/TAILWIND_4-131313?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com)
[![Electron 33](https://img.shields.io/badge/ELECTRON_33-131313?style=for-the-badge&logo=electron&logoColor=9FEAF9)](https://www.electronjs.org)
[![Docker](https://img.shields.io/badge/DOCKER-131313?style=for-the-badge&logo=docker&logoColor=2496ED)](https://www.docker.com)
[![License: ISC](https://img.shields.io/badge/LICENSE-ISC-e10600?style=for-the-badge)](LICENSE)

<!-- screenshot: docs/screenshots/dashboard.png — full home page in the running app -->

</div>

---

## ▍ DASHBOARD

The home page is built around a broadcast-style championship leader hero with team-livery textures, a stacked constructor bar, and animated count-up rows for the top 10 drivers — each carrying a sparkline of their last five-race form.

<!-- screenshot: docs/screenshots/dashboard-detail.png — championship hero + driver standings sparklines -->

| Block | What it shows |
|---|---|
| **Leader hero** | Championship leader with team livery, points gap to P2, season progress |
| **Constructors bar** | Stacked points bar per constructor, scaled to the leader |
| **Driver standings** | Top 10 with sparkline form, animated points, leader-relative bar |
| **Recent results** | Last 3 completed races with winner, pole, and fastest lap |
| **Next race card** | Country flag, livery accent, and weekend countdown |

---

## ▍ LIVE TIMING

Follow every session as it happens. Real-time positions, intervals, and gap-to-leader update every 15 s. Tire compound and stint age, team radio with audio playback, race control feed, and a weather widget round out the picture.

<!-- screenshot: docs/screenshots/live.png — live timing page during an active session -->

- **Positions & intervals** — live gap-to-leader and gap-to-car-ahead
- **Tire strategy** — compound, stint age, lap of last stop
- **Team radio** — streamed clips with playback
- **Onboard cameras** — one-click links into MultiViewer
- **Race control** — flags, penalties, and steward decisions
- **Weather** — air & track temp, wind, rainfall

---

## ▍ STANDINGS · RACES · DRIVERS · TEAMS

Every race has its own detail page covering the podium, full classification, qualifying order, sprint results, and pit-stop summary. Driver and constructor profiles include points-progression charts, qualifying gap analysis, and teammate head-to-head records.

<!-- screenshot: docs/screenshots/drivers.png — /drivers Studio profile cards grid -->
<!-- screenshot: docs/screenshots/race-detail.png — /race/:round podium + classification + qualifying -->

---

## ▍ ANALYTICS

Season-level analytics break down wins, podiums, points-per-race, DNFs by team, fastest-lap leaders, pit-stop performance, driver consistency, and a championship-evolution chart that traces the points race round by round.

<!-- screenshot: docs/screenshots/stats.png — /stats championship evolution chart + breakdowns -->

---

## ▍ ROUTES

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
| `/stats` | Season analytics — wins, podiums, points-per-race, DNFs, pit stops |
| `/fastest-laps` | Fastest-lap rankings per race |
| `/compare` | Head-to-head driver comparison |
| `/news` | Aggregated F1 news from RSS feeds |
| `/archive` | Historical season browser (2016 – 2025) |
| `/archive/:season` | Past-season standings and results |
| `/favorites` | Personalized view of pinned drivers and teams |
| `/settings` | Theme, accent color, and favorites preferences |

---

## ▍ QUICK START · DESKTOP

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

#### Direct downloads

Grab a specific build from the [Releases page](https://github.com/Tri-Lumen/F1/releases/latest):

| Platform | Asset |
|---|---|
| Windows | [Delta-Dashboard-Setup.exe](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard-Setup.exe) |
| macOS (Apple Silicon) | [Delta-Dashboard-arm64.dmg](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard-arm64.dmg) |
| macOS (Intel) | [Delta-Dashboard-x64.dmg](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard-x64.dmg) |
| Linux | [Delta-Dashboard.AppImage](https://github.com/Tri-Lumen/F1/releases/latest/download/Delta-Dashboard.AppImage) |

---

## ▍ QUICK START · DOCKER

```bash
docker compose up -d
```

The included `docker-compose.yml` ships with [Watchtower](https://containrrr.dev/watchtower/) for automatic hourly image updates — when a new image is pushed to `ghcr.io/tri-lumen/f1:latest`, your container restarts on the new build with no manual action.

#### Manual build

```bash
docker build -t delta-dashboard .
docker run -p 3000:3000 delta-dashboard
```

#### Portainer

**Pre-built image (recommended)** — Stacks → Add stack → Web editor:

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

**From Git** — Stacks → Add stack → Repository, set the URL to `https://github.com/Tri-Lumen/F1.git` and the compose path to `docker-compose.yml`.

---

## ▍ QUICK START · SOURCE

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

Electron development:

```bash
npm run electron:dev      # build + launch Electron
npm run electron:build    # package for current platform
```

---

## ▍ TECH STACK

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| **Language** | TypeScript 5.9 |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) + Studio design system (Barlow Condensed / DM Sans) |
| **Desktop** | [Electron 33](https://www.electronjs.org) + electron-updater |
| **Standings & results** | [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) |
| **Live timing** | [OpenF1](https://openf1.org) |
| **News feeds** | RSS (Motorsport.com, Autosport, PlanetF1, RaceFans, The Race) |
| **Containerization** | Docker (Node 22 Alpine) + Watchtower |

---

## ▍ DEPLOYMENT MODEL

The Docker image at `ghcr.io/tri-lumen/f1:latest` is automatically rebuilt and republished on every merge to `main` via the [`docker-publish`](.github/workflows/docker-publish.yml) workflow. The compose file itself is versioned in the repo — you fetch it once and Watchtower handles every subsequent image rollout.

The image build is skipped for changes that don't affect the runtime image (docs, installer scripts, electron-only files, design preview), so README updates won't trigger a re-publish.

The Electron desktop apps are built and uploaded to GitHub Releases on every `v*` tag via the [`electron-publish`](.github/workflows/electron-publish.yml) workflow, and electron-updater handles the rest.

---

## ▍ LICENSE

ISC
