# F1 Dashboard

Live-updating dashboard for the 2025 Formula 1 season with full stat tracking for all drivers and teams.

## Quick Start

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm run build
npm start
```

## Pages

| Route | What's There |
|---|---|
| `/` | Season overview — championship leaders, next race, recent results, standings summaries |
| `/drivers` | Full driver championship table + stat cards (wins, podiums, poles, fastest laps, DNFs, avg finish, points per race) |
| `/teams` | Constructor championship table + team cards with stats and driver lineups |
| `/races` | Full race calendar split by upcoming/completed, each with F1TV watch links |
| `/race/:round` | Race detail — podium, full classification with grid deltas, qualifying results, F1TV link |

## Features

- **Live session banner** — Shows top 5 positions during active sessions (OpenF1 API)
- **Auto-refresh** — Countdown timer auto-refreshes data on every page
- **F1TV links** — Direct links to watch each race on F1TV
- **Team colors** — Correct 2025 colors for all 10 teams
- **Dark theme** — F1-branded dark UI with red accents
- **Responsive** — Mobile through desktop

## Data Sources

- [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) — Standings, results, schedule (Ergast successor)
- [OpenF1 API](https://openf1.org) — Live session timing data

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
