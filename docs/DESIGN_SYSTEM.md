# Design System Reference

A quick reference for the UI conventions used across the dashboard. The goal is
that pages compose a small set of shared primitives and theme tokens rather than
re-declaring layout, colour, and spacing inline.

## Layout primitives (use these — don't re-roll)

| Component | File | Use for |
| --- | --- | --- |
| `AppShell` | `src/components/AppShell.tsx` | The responsive shell (sidebar + mobile drawer + bottom bar + skip link + centred content). Provided by `(standard)/layout.tsx` — every route under it gets this automatically. |
| `PageHeader` | `src/components/PageHeader.tsx` | The title block at the top of every page (`title`, `subtitle`, `eyebrow`, `actions`). |
| `SectionHeading` | `src/components/SectionHeading.tsx` | Section labels. `variant="label"` = uppercase eyebrow above a block; `variant="card"` = bordered header row inside a card. |
| `CardShell` | `src/components/CardShell.tsx` | Any card surface. `variant="accent"` adds a team-coloured top bar (`accentColor`); `variant="plain"` drops the border. |
| `EmptyState` | `src/components/EmptyState.tsx` | Empty / no-results / error blocks. `variant="error"` tints it red. Used by all `error.tsx` boundaries. |
| `Grid` | `src/components/Grid.tsx` | Responsive auto-fill grids — pass `minColWidth` instead of writing `repeat(auto-fill, minmax(Npx, 1fr))`. |

## Theme tokens (CSS variables, defined in `globals.css` `@theme`)

Prefer the Tailwind `f1-*` classes (`bg-f1-card`, `text-f1-text-muted`,
`border-f1-border`, …) or the `var(--color-f1-*)` variables over hardcoded hex.
Team liveries override these variables, so any component built on them re-themes
for free.

- Surfaces: `--color-f1-black`, `--color-f1-dark`, `--color-f1-card`, `--color-f1-card-hover`
- Lines/text: `--color-f1-border`, `--color-f1-text`, `--color-f1-text-muted`
- Accent: `--color-f1-accent`, `--color-f1-accent-secondary`
- Layout: `--sidebar-w` (224px; mirrored by `SIDEBAR_WIDTH` in `src/lib/layout.ts`), `--content-max` (1600px)
- Radius: `--radius-sm … --radius-3xl` (re-mapped by `data-radius` sharp/default/rounded)

## Visual styles

The app has two visual styles, chosen in Settings → Interface (and the Electron View menu).
`ThemeContext` stores the choice (`f1-visual-style`) and sets `data-style="ascii"` on `<html>`;
`layout.tsx` sets it before first paint. Standard is the absence of the attribute, so nothing in
Standard depends on the ASCII layer.

`src/app/ascii.css` is the whole ASCII style, scoped under `html[data-style="ascii"]`. It works
through the same `--color-f1-*` tokens, so liveries, light mode and custom themes keep working.
Most pages style themselves inline, so it matches on inline values where it must
(`[style*="border-radius"]`, `div:empty[style*="width"][style*="%"]` for block bars) and sets
fonts with `!important`.

Hook classes on shared primitives (add them to new primitives that should get a terminal frame):

| Class | Where | ASCII effect |
| --- | --- | --- |
| `f1-box` | `CardShell` | brighter rule |
| `f1-sh-label` / `f1-sh-card` | `SectionHeading` | `[ TITLE ]` / dashed rule |
| `f1-page-title` | `PageHeader` | `## ` prefix, uppercase |
| `f1-hero` | `LeaderHero` | double border |
| `f1-nav-active` | sidebar links | `>` marker, tinted background |
| `f1-ascii-only` | `AsciiLogo`, `BigDigits` | rendered only in ASCII |
| `f1-keep-sr` | text replaced by `BigDigits` | visually hidden, still read aloud |

Images: `DriverImage` and `CarImage` render `DitheredImage` when the style is ASCII and
"Dithered images" is on. It dithers on a canvas (`src/lib/dither/`, Riemersma, 16 colours
extracted per image, settings in `preset.ts`) and falls back to the plain image if the canvas is
tainted. The font is self-hosted in `public/fonts/` because fallback fonts break glyph widths.

## Breakpoints (Tailwind defaults)

| Prefix | Min width | Typical use |
| --- | --- | --- |
| (base) | 0 | Mobile: single column, drawer nav + bottom bar |
| `sm:` | 640px | 2-up grids, reveal secondary table columns |
| `md:` | 768px | Desktop split — fixed sidebar (`md:ml-56`), multi-column |
| `lg:` | 1024px | 3-up grids, widest data tables |
| `xl:` | 1280px+ | Content is capped at `--content-max` and centred |

Dense tables collapse secondary columns with `hidden sm:table-cell` /
`hidden md:table-cell` rather than scrolling horizontally on phones.

## Spacing

Default section gap is `gap-4` (16px) and cards use ~`px-[18px] py-3.5`. Use the
Tailwind spacing scale; avoid mixing raw `gap: 16` inline objects with classes.

## Typography

- **Barlow Condensed** — headings, stats, labels (`fontFamily: "'Barlow Condensed', sans-serif"`)
- **DM Sans** — body copy and metadata

## Accessibility baseline

- Global `:focus-visible` ring (accent-coloured) — don't remove outlines.
- `AppShell` renders a "Skip to content" link targeting `#main-content`.
- Data tables use `<caption className="sr-only">` and `scope="col"` headers.
- OS `prefers-color-scheme` and `prefers-reduced-motion` are honoured as defaults
  (see `ThemeContext` and the no-FOUC script in `layout.tsx`).
- Don't rely on colour alone — pair it with text/labels (e.g. tire "OVERDUE").
