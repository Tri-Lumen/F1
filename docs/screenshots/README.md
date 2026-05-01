# Screenshots

Drop PNGs here using these filenames so the main README picks them up:

| Filename | What to capture |
|---|---|
| `dashboard.png` | Full home page in the running app — sidebar nav visible, leader hero + championship bar + driver standings + recent results all in frame |
| `dashboard-detail.png` | Closer crop of the championship leader hero and the top of the driver standings table with the sparkline form charts visible |
| `live.png` | `/live` during an active session — timing table with positions and intervals, tire strategy panel, team radio feed |
| `drivers.png` | `/drivers` page — Studio driver-profile cards grid |
| `race-detail.png` | `/race/:round` for a completed round — podium block + classification table + qualifying gaps |
| `stats.png` | `/stats` page — championship-evolution sparkline chart and one of the per-team breakdown lists |

## Capture tips

- Run `npm run dev` and open <http://localhost:3000> in Chrome at 1440 × 900
- Use the browser's "Capture full size screenshot" devtools action for the longer pages (Cmd ⇧ P → "screenshot")
- Crop trailing white/dark space so the README renders tightly
- Save as PNG, ~2× pixel density if possible (the README displays them at column width)
