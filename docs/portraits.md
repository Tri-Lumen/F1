# Driver & Team Portraits

Portrait URLs (driver headshots, full-body card portraits, team car renders, team logos) are sourced from `media.formula1.com` — the same CDN that backs the official driver and team pages at https://www.formula1.com/en/drivers and https://www.formula1.com/en/teams.

## How it works

- `src/lib/profileImages.ts` exposes the helpers (`getDriverImageUrl`, `getDriverCardImageUrl`, `getDriverNumberUrl`, `getTeamCarImageUrls`, `getTeamLogoUrl`, …). Components call only these helpers; they never hardcode URLs.
- Each helper consults `src/lib/portraitsManifest.generated.ts` first. That manifest is the source of truth for which URL F1.com is currently using for each driver / team.
- If the manifest is missing an entry (e.g. a brand-new mid-season driver), the helper falls back to a deterministic URL built from `DRIVER_OVERRIDES_2026` and known F1 CDN paths. The dashboard keeps rendering — just with the prior asset.

## Refreshing the manifest

When F1.com publishes new portraits (start of season, mid-season livery changes, roster swaps), regenerate the manifest from any host with public network access to `formula1.com`:

```bash
npm run sync-portraits
```

The script scrapes the two F1.com pages, matches each card to an Ergast `driverId` / `constructorId`, and rewrites `src/lib/portraitsManifest.generated.ts`. Commit the result.

It will exit non-zero if any required driver or team is missing from the page (likely a roster change that needs a code update in `scripts/sync-f1-portraits.mjs` and `src/lib/driverOverrides.ts`).

## Environments where the sync can't run

Some container environments (including the Claude Code on-the-web sandbox used to author this codebase) restrict outbound traffic to `formula1.com`. Running `npm run sync-portraits` there fails with a 403 / `host_not_allowed` error. Run it from a developer laptop or a CI runner with public egress instead — the committed manifest is the only artifact builds need.
