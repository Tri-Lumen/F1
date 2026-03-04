# F1 Dashboard

Live-updating dashboard for the 2026 Formula 1 season — standings, race results, live timing, stats, and historical data for every driver and team.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

**Docker Compose (recommended):**

```bash
docker compose up -d
```

**Docker directly:**

```bash
docker build -t f1-dashboard .
docker run -p 3000:3000 f1-dashboard
```

## Portainer

**Option 1 — Pre-built image via Web editor (recommended):**

1. Go to **Stacks → Add stack → Web editor**
2. Paste the following and click **Deploy the stack**:

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

The image is built and published to the GitHub Container Registry automatically on every push to `main`.

**Option 2 — Deploy from Git:**

1. Go to **Stacks → Add stack → Repository**
2. Set the URL to `https://github.com/Tri-Lumen/F1.git`
3. Set the **Compose path** to `docker-compose.yml`
4. Click **Deploy the stack**

> **Note:** Portainer's built-in git client (go-git) can fail to clone from GitHub with an HTTP 500 error. Use the pre-built image option if this happens.

## Production Build

```bash
npm run build
npm start
```

## Pages

### Current Season

| Route | Description |
|---|---|
| `/` | Season overview — live banner, next session card, championship leaders, recent results, standings summaries |
| `/live` | Live session timing — top positions, tire strategy, team radio feed, onboard camera links |
| `/races` | Full race calendar split into upcoming and completed rounds, each with F1TV watch links |
| `/race/:round` | Race detail — podium, full race classification with grid deltas, qualifying results, F1TV link |
| `/drivers` | Driver championship standings table with per-driver stat cards (wins, podiums, poles, fastest laps, DNFs, avg finish, points per race) |
| `/drivers/:driverId` | Individual driver profile — season results, points progression chart, qualifying gap chart, teammate head-to-head |
| `/teams` | Constructor championship standings table with team cards, driver lineups, and aggregate stats |
| `/teams/:constructorId` | Individual team profile — driver comparison, points progression, season results breakdown |

### Analytics

| Route | Description |
|---|---|
| `/stats` | Season-wide analytics — wins/podiums breakdown, points leaders, head-to-head team battles |
| `/fastest-laps` | Fastest lap rankings for every completed race with lap time, speed, and race position |
| `/compare` | Head-to-head driver comparison — points, wins, podiums, fastest laps, DNFs side by side |

### Historical & Settings

| Route | Description |
|---|---|
| `/archive` | Season index listing all available historical seasons |
| `/archive/:season` | Championship standings and full race results for a past season (2016–2025) |
| `/favorites` | Personalised view showing tracked drivers and teams *(appears in nav once favourites are set)* |
| `/settings` | Theme selection, accent colour, and favourite driver/team preferences |

## Features

- **Live session banner** — Top 5 positions, tire compounds, and intervals during active sessions (OpenF1 API)
- **Session countdown** — Nav pill counts down to the next scheduled session; switches to a pulsing LIVE indicator when a session is active
- **Auto-refresh** — Countdown timer on every page triggers a full data refresh
- **F1TV links** — Direct watch links on every race card and detail page
- **Driver profiles** — Points progression, qualifying gap charts, and teammate H2H for every driver
- **Team profiles** — Constructor points chart and driver-by-driver season breakdown
- **Favorites** — Pin drivers and teams for a personalised summary page
- **Archive** — Historical standings and results back to 2016
- **Team colors** — Correct 2026 colors for all 10 constructors
- **Dark / light theme** — F1-branded dark UI with red accents; switchable to light mode with custom team accent colors
- **Responsive** — Fully functional from mobile through widescreen desktop

## Data Sources

- [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) — Standings, results, and schedule (Ergast successor)
- [OpenF1 API](https://openf1.org) — Live session timing, tire stints, and team radio

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Electron 33 (desktop wrapper)
