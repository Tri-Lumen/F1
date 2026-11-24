#!/usr/bin/env node
/**
 * audit.mjs: weekly sanity check for the data and assets the dashboard shows.
 *
 *   node scripts/audit.mjs [--app http://localhost:3000] [--fix-assets]
 *                          [--json audit-report.json] [--md audit-report.md]
 *
 * Checks, in order:
 *   1. API       Jolpica (Ergast) and OpenF1 respond, and the standings are
 *                internally consistent (points, wins, round vs. calendar).
 *   2. Roster    every driver and constructor in the standings has an image,
 *                a team colour, a theme and (for drivers) a matching number
 *                override in the source.
 *   3. Assets    every local portrait file exists and is a real WebP, and the
 *                local set matches what formula1.com currently lists.
 *   4. App       (with --app) the running app shows the data the API returns,
 *                and none of its empty states appear while data exists.
 *
 * With --fix-assets it downloads current portraits from media.formula1.com and
 * updates src/lib/portraitsLocal.ts. It never deletes files and never edits
 * anything else. Exit code is 1 if any check reports an error.
 *
 * No dependencies; needs Node 20+ (global fetch).
 */

import { readFile, writeFile, readdir, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ERGAST = "https://api.jolpi.ca/ergast/f1";
const OPENF1 = "https://api.openf1.org/v1";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const APP = opt("--app");
const FIX = flag("--fix-assets");

/** @type {{id:string, level:'error'|'warn'|'info'|'ok', title:string, detail?:string}[]} */
const findings = [];
const add = (id, level, title, detail) => findings.push({ id, level, title, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { json = true, retries = 2, headers = {} } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, ...headers },
        signal: AbortSignal.timeout(25_000),
        redirect: "follow",
      });
      if (res.ok) return json ? await res.json() : await res.text();
      lastErr = new Error(`HTTP ${res.status}`);
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      lastErr = e;
    }
    await sleep(800 * 2 ** i);
  }
  throw new Error(`${url}: ${lastErr?.message ?? lastErr}`);
}

const src = async (p) => readFile(join(ROOT, p), "utf8");

/** Keys of `export const NAME ... = { key: ..., }` at one level of nesting. */
function mapEntries(text, name) {
  const start = text.indexOf(`export const ${name}`);
  if (start < 0) return null;
  const open = text.indexOf("{", text.indexOf("=", start));
  let depth = 0;
  let end = open;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  const lines = text.slice(open + 1, end).split("\n");
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^ {2}([A-Za-z_0-9]+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    // multi-line object values run to the closing brace at the same indent
    if (v.trimStart().startsWith("{") && !v.includes("}")) {
      while (++i < lines.length) {
        v += "\n" + lines[i];
        if (/^ {2}\}/.test(lines[i])) break;
      }
    }
    out[m[1]] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. API
// ---------------------------------------------------------------------------

let standings = null; // { season, round, drivers: [...] }
let constructors = [];
let schedule = [];

async function checkApi() {
  try {
    const ds = await get(`${ERGAST}/current/driverStandings.json`);
    const list = ds.MRData.StandingsTable.StandingsLists[0];
    standings = {
      season: list.season,
      round: parseInt(list.round, 10),
      drivers: list.DriverStandings,
    };
    add("api.driver-standings", "ok", `Driver standings: ${standings.drivers.length} drivers, season ${standings.season}, round ${standings.round}`);
  } catch (e) {
    add("api.driver-standings", "error", "Driver standings unavailable", e.message);
    return;
  }
  await sleep(300);
  try {
    const cs = await get(`${ERGAST}/current/constructorStandings.json`);
    constructors = cs.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
    add("api.constructor-standings", "ok", `Constructor standings: ${constructors.length} teams`);
  } catch (e) {
    add("api.constructor-standings", "error", "Constructor standings unavailable", e.message);
  }
  await sleep(300);
  try {
    const sc = await get(`${ERGAST}/current.json?limit=100`);
    schedule = sc.MRData.RaceTable.Races;
    add("api.schedule", "ok", `Calendar: ${schedule.length} rounds`);
  } catch (e) {
    add("api.schedule", "error", "Race calendar unavailable", e.message);
  }
  await sleep(300);
  try {
    const sessions = await get(`${OPENF1}/sessions?session_key=latest`);
    add("api.openf1", Array.isArray(sessions) && sessions.length ? "ok" : "warn",
      Array.isArray(sessions) && sessions.length
        ? `OpenF1 latest session: ${sessions[0].session_name} at ${sessions[0].circuit_short_name}, ${String(sessions[0].date_start).slice(0, 10)}`
        : "OpenF1 returned no latest session");
  } catch (e) {
    add("api.openf1", "error", "OpenF1 unavailable", e.message);
  }
}

function checkConsistency() {
  if (!standings || !constructors.length) return;
  const sum = (arr, k) => arr.reduce((a, r) => a + parseFloat(r[k]), 0);
  const dPts = sum(standings.drivers, "points");
  const cPts = sum(constructors, "points");
  add("data.points-total", dPts === cPts ? "ok" : "warn",
    dPts === cPts ? `Driver and constructor points agree (${dPts})` : "Driver and constructor points totals differ",
    dPts === cPts ? undefined : `drivers ${dPts}, constructors ${cPts}, difference ${dPts - cPts}`);

  if (schedule.length) {
    const now = Date.now();
    const done = schedule.filter((r) => new Date(`${r.date}T${r.time ?? "23:59:59Z"}`).getTime() < now).length;
    const gap = Math.abs(done - standings.round);
    add("data.round-vs-calendar", gap <= 1 ? "ok" : "warn",
      gap <= 1 ? `Standings round (${standings.round}) matches the calendar (${done} past)` : "Standings round and calendar disagree",
      gap <= 1 ? undefined : `${done} races are dated in the past but standings are at round ${standings.round}; the upstream data may be lagging`);

    const wins = sum(standings.drivers, "wins");
    add("data.wins-total", wins === standings.round ? "ok" : "warn",
      wins === standings.round ? `Wins total (${wins}) equals completed rounds` : "Total wins does not equal completed rounds",
      wins === standings.round ? undefined : `${wins} wins across ${standings.round} rounds (sprints, disqualifications or lag can explain a small gap)`);
  }

  const nums = standings.drivers.map((d) => d.Driver.permanentNumber).filter(Boolean);
  const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
  add("data.numbers-unique", dup.length ? "warn" : "ok",
    dup.length ? "Duplicate permanent numbers upstream" : "Permanent numbers are unique upstream",
    dup.length ? dup.join(", ") : undefined);
}

// ---------------------------------------------------------------------------
// 2. Roster vs source
// ---------------------------------------------------------------------------

let srcs = {};
async function loadSources() {
  srcs = {
    local: await src("src/lib/portraitsLocal.ts"),
    images: await src("src/lib/profileImages.ts"),
    overrides: await src("src/lib/driverOverrides.ts"),
    api: await src("src/lib/api.ts"),
    themes: await src("src/lib/teamThemes.ts"),
  };
}

function checkRoster() {
  if (!standings) return;
  const localDrivers = mapEntries(srcs.local, "LOCAL_DRIVER_PORTRAITS") ?? {};
  const localTeams = mapEntries(srcs.local, "LOCAL_TEAM_PORTRAITS") ?? {};
  const cdnDrivers = mapEntries(srcs.images, "DRIVER_IMAGES") ?? {};
  const cdnTeams = mapEntries(srcs.images, "TEAM_CAR_IMAGES") ?? {};
  const overrides = mapEntries(srcs.overrides, "DRIVER_OVERRIDES_2026") ?? {};
  const colorBlock = srcs.api.slice(srcs.api.indexOf("export function getTeamColor"), srcs.api.indexOf("Deterministic HSL"));
  const themeIds = new Set([...srcs.themes.matchAll(/constructorId:\s*"([a-z_0-9]+)"/g)].map((m) => m[1]));

  const noLocal = [], noCdn = [], badNumber = [], badTeam = [];
  for (const row of standings.drivers) {
    const id = row.Driver.driverId;
    if (!(id in localDrivers)) noLocal.push(id);
    if (!(id in cdnDrivers)) noCdn.push(id);
    const ov = overrides[id] ?? "";
    const num = ov.match(/number:\s*"(\d+)"/)?.[1];
    const up = row.Driver.permanentNumber;
    if (up && num && num !== up) badNumber.push(`${id}: app shows #${num}, API says #${up}`);
    if (up && !num) badNumber.push(`${id}: no override, API says #${up} (shown as-is)`);
    const ovTeam = ov.match(/constructorId:\s*"([a-z_0-9]+)"/)?.[1];
    const apiTeam = row.Constructors?.[0]?.constructorId;
    if (ovTeam && apiTeam && ovTeam !== apiTeam) badTeam.push(`${id}: override says ${ovTeam}, API says ${apiTeam}`);
  }
  const lvl = (a, l) => (a.length ? l : "ok");
  // A missing portrait is an error only when formula1.com has one to pull. Drivers it does not
  // list (late reserves) cannot be sourced, so they are a warning: the UI shows an initials placeholder.
  const familyOf = (id) => standings.drivers.find((d) => d.Driver.driverId === id)?.Driver.familyName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  const canSource = (id) => !f1Families.size || [...f1Families].some((f) => f.replace(/[^a-z]/g, "") === familyOf(id));
  const noLocalFixable = noLocal.filter(canSource);
  const noLocalUnsourced = noLocal.filter((id) => !canSource(id));
  add("roster.driver-local-asset", lvl(noLocalFixable, "error"),
    noLocalFixable.length ? `${noLocalFixable.length} driver(s) listed on formula1.com have no local portrait` : "Every driver listed on formula1.com has a local portrait entry",
    noLocalFixable.join(", ") || undefined);
  if (noLocalUnsourced.length) {
    add("roster.driver-unsourced", "warn", `${noLocalUnsourced.length} driver(s) in the standings have no official portrait to pull`,
      `${noLocalUnsourced.join(", ")}. formula1.com does not list them, so the app shows an initials placeholder until it does.`);
  }
  add("roster.driver-cdn-fallback", lvl(noCdn, "warn"),
    noCdn.length ? `${noCdn.length} driver(s) have no CDN fallback URL` : "Every driver has a CDN fallback URL",
    noCdn.join(", ") || undefined);
  const realNumberIssues = badNumber.filter((x) => !x.includes("no override"));
  add("roster.driver-number", lvl(realNumberIssues, "error"),
    realNumberIssues.length ? "Driver numbers shown by the app differ from the API" : "Driver number overrides agree with the API",
    realNumberIssues.join("\n") || undefined);
  const missingNum = badNumber.filter((x) => x.includes("no override"));
  if (missingNum.length) add("roster.driver-number-no-override", "info", `${missingNum.length} driver(s) rely on the API number`, missingNum.join("\n"));
  add("roster.driver-team", lvl(badTeam, "warn"),
    badTeam.length ? "Driver team overrides differ from the API" : "Driver team overrides agree with the API",
    badTeam.join("\n") || undefined);

  const noTeamLocal = [], noTeamCdn = [], noColor = [], noTheme = [];
  for (const c of constructors) {
    const id = c.Constructor.constructorId;
    if (!(id in localTeams)) noTeamLocal.push(id);
    if (!(id in cdnTeams)) noTeamCdn.push(id);
    if (!new RegExp(`\\b${id}\\s*:`).test(colorBlock)) noColor.push(id);
    if (!themeIds.has(id)) noTheme.push(id);
  }
  add("roster.team-local-asset", lvl(noTeamLocal, "error"),
    noTeamLocal.length ? `${noTeamLocal.length} team(s) have no local car render` : "Every constructor has a local car render", noTeamLocal.join(", ") || undefined);
  add("roster.team-cdn-fallback", lvl(noTeamCdn, "warn"),
    noTeamCdn.length ? `${noTeamCdn.length} team(s) have no CDN car URLs` : "Every constructor has CDN car URLs", noTeamCdn.join(", ") || undefined);
  add("roster.team-colour", lvl(noColor, "warn"),
    noColor.length ? `${noColor.length} team(s) fall back to a generated colour` : "Every constructor has a defined team colour", noColor.join(", ") || undefined);
  add("roster.team-theme", lvl(noTheme, "warn"),
    noTheme.length ? `${noTheme.length} team(s) have no livery theme` : "Every constructor has a livery theme", noTheme.join(", ") || undefined);
}

// ---------------------------------------------------------------------------
// 3. Assets
// ---------------------------------------------------------------------------

const f1Cache = { drivers: null, teams: null };
/** Family-name slugs of the drivers formula1.com lists; empty if the page could not be read. */
const f1Families = new Set();

async function checkLocalFiles() {
  const refs = [...srcs.local.matchAll(/\$\{([DT])\}\/([A-Za-z0-9_.-]+\.webp)/g)].map((m) => ({
    kind: m[1] === "D" ? "drivers" : "teams",
    file: m[2],
  }));
  const missing = [], bad = [];
  for (const r of refs) {
    const p = join(ROOT, "public/portraits", r.kind, r.file);
    if (!existsSync(p)) {
      missing.push(`${r.kind}/${r.file}`);
      continue;
    }
    const buf = await readFile(p);
    const ok = buf.length > 2_000 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP";
    if (!ok) bad.push(`${r.kind}/${r.file} (${buf.length} bytes)`);
  }
  add("assets.local-files", missing.length || bad.length ? "error" : "ok",
    missing.length || bad.length ? "Local portrait files are missing or invalid" : `All ${new Set(refs.map((r) => r.file)).size} referenced portrait files exist and are valid WebP`,
    [...missing.map((m) => `missing: ${m}`), ...bad.map((b) => `invalid: ${b}`)].join("\n") || undefined);

  const referenced = new Set(refs.map((r) => r.file));
  const orphans = [];
  for (const kind of ["drivers", "teams"]) {
    const dir = join(ROOT, "public/portraits", kind);
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) if (f.endsWith(".webp") && !referenced.has(f)) orphans.push(`${kind}/${f}`);
  }
  if (orphans.length) add("assets.orphans", "info", `${orphans.length} portrait file(s) are not referenced by portraitsLocal.ts`, orphans.join("\n"));
}

/** Every `<year><slug><code><NN>right` or `<year><slug>carright` basename on an F1.com page, with its full URL. */
function f1Assets(html) {
  const out = new Map();
  const re = /https?:\/\/media\.formula1\.com\/[^"'\s)\\]*?\/((?:20\d\d)[a-z0-9]+?(?:right|carright))\.(?:webp|png|jpg)/gi;
  let m;
  while ((m = re.exec(html))) if (!out.has(m[1].toLowerCase())) out.set(m[1].toLowerCase(), m[0]);
  return out;
}

async function checkAgainstF1() {
  let driversHtml, teamsHtml;
  try {
    driversHtml = await get("https://www.formula1.com/en/drivers", { json: false });
    teamsHtml = await get("https://www.formula1.com/en/teams", { json: false });
  } catch (e) {
    add("assets.f1com", "warn", "formula1.com unreachable, asset freshness not checked", e.message);
    return;
  }
  f1Cache.drivers = f1Assets(driversHtml);
  f1Cache.teams = f1Assets(teamsHtml);
  add("assets.f1com", f1Cache.drivers.size && f1Cache.teams.size ? "ok" : "warn",
    `formula1.com lists ${f1Cache.drivers.size} driver and ${f1Cache.teams.size} team image assets`);

  // Roster on F1.com vs standings
  const slugs = new Set([...driversHtml.matchAll(/href="\/en\/drivers\/([a-z0-9-]+)"/g)].map((m) => m[1]));
  slugs.delete("");
  for (const sl of slugs) f1Families.add(sl.split("-").slice(-1)[0]);
  if (standings && slugs.size) {
    const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const apiSlugs = new Set(standings.drivers.map((d) => `${slugify(d.Driver.givenName)}-${slugify(d.Driver.familyName)}`));
    // Compare on family name: the API has "Andrea Kimi Antonelli", formula1.com has "Kimi Antonelli".
    const family = (slug) => slug.split("-").slice(-1)[0];
    const matches = (apiSlug, f1Slug) => apiSlug === f1Slug || family(apiSlug) === family(f1Slug);
    const notOnF1 = [...apiSlugs].filter((a) => ![...slugs].some((s) => matches(a, s)));
    const notInApi = [...slugs].filter((s) => ![...apiSlugs].some((a) => matches(a, s)));
    add("assets.roster-match", notOnF1.length || notInApi.length ? "warn" : "ok",
      notOnF1.length || notInApi.length ? "Driver roster differs between formula1.com and the standings" : "Driver roster on formula1.com matches the standings",
      [notOnF1.length ? `in standings, not on formula1.com: ${notOnF1.join(", ")}` : "", notInApi.length ? `on formula1.com, not in standings: ${notInApi.join(", ")}` : ""].filter(Boolean).join("\n") || undefined);
  }
}

/** Compare local assets with what formula1.com lists; returns planned replacements. */
function planAssetUpdates() {
  const plans = []; // {kind, id, oldFile, newBase, url}
  if (!f1Cache.drivers || !standings) return plans;
  const localDrivers = mapEntries(srcs.local, "LOCAL_DRIVER_PORTRAITS") ?? {};
  const cdnDrivers = mapEntries(srcs.images, "DRIVER_IMAGES") ?? {};
  const stale = [], unknown = [];
  for (const row of standings.drivers) {
    const id = row.Driver.driverId;
    const localBase = localDrivers[id]?.match(/\/([a-z0-9]+)\.webp/i)?.[1]?.toLowerCase();
    const code = cdnDrivers[id]?.match(/"([A-Za-z]{6}\d\d)"/)?.[1]?.toLowerCase()?.slice(0, 6);
    if (!code) {
      unknown.push(id);
      continue;
    }
    if (localBase && f1Cache.drivers.has(localBase)) continue;
    const cands = [...f1Cache.drivers.keys()].filter((b) => b.includes(code) && b.endsWith("right"));
    const pick = cands.sort().reverse()[0];
    if (pick) {
      plans.push({ kind: "drivers", id, oldFile: localBase, newBase: pick, url: f1Cache.drivers.get(pick) });
      stale.push(`${id}: ${localBase ?? "none"} -> ${pick}`);
    } else if (localBase) {
      stale.push(`${id}: ${localBase} is no longer listed on formula1.com and no replacement was found`);
    }
  }
  add("assets.driver-freshness", stale.length ? "warn" : "ok",
    stale.length ? `${stale.length} driver portrait(s) differ from formula1.com` : "Local driver portraits match formula1.com",
    stale.join("\n") || undefined);
  if (unknown.length) add("assets.driver-unmapped", "warn", `${unknown.length} driver(s) in the standings have no asset code in profileImages.ts`, `${unknown.join(", ")}. Once formula1.com lists them, add entries to DRIVER_IMAGES and DRIVER_NUMBER_SLUGS (profileImages.ts) and portraitsLocal.ts, following the rafael_camara entries, then run this script with --fix-assets.`);

  const localTeams = mapEntries(srcs.local, "LOCAL_TEAM_PORTRAITS") ?? {};
  const teamStale = [];
  for (const c of constructors) {
    const id = c.Constructor.constructorId;
    const localBase = localTeams[id]?.match(/\/([a-z0-9]+)\.webp/i)?.[1]?.toLowerCase();
    if (!localBase) continue;
    if (f1Cache.teams.has(localBase)) continue;
    const slug = localBase.replace(/^20\d\d/, "").replace(/carright$/, "");
    const cands = [...f1Cache.teams.keys()].filter((b) => b.endsWith(`${slug}carright`));
    const pick = cands.sort().reverse()[0];
    if (pick) {
      plans.push({ kind: "teams", id, oldFile: localBase, newBase: pick, url: f1Cache.teams.get(pick) });
      teamStale.push(`${id}: ${localBase} -> ${pick}`);
    } else {
      teamStale.push(`${id}: ${localBase} not listed on formula1.com`);
    }
  }
  add("assets.team-freshness", teamStale.length ? "warn" : "ok",
    teamStale.length ? `${teamStale.length} team car render(s) differ from formula1.com` : "Local team car renders match formula1.com",
    teamStale.join("\n") || undefined);
  return plans;
}

async function applyAssetUpdates(plans) {
  if (!plans.length) return;
  const done = [], failed = [];
  let local = srcs.local;
  for (const p of plans) {
    try {
      const res = await fetch(p.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.subarray(0, 4).toString() !== "RIFF" || buf.subarray(8, 12).toString() !== "WEBP") throw new Error("not a WebP");
      const dir = join(ROOT, "public/portraits", p.kind);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${p.newBase}.webp`), buf);
      if (p.oldFile) local = local.replaceAll(`${p.oldFile}.webp`, `${p.newBase}.webp`);
      done.push(`${p.kind}/${p.newBase}.webp (${Math.round(buf.length / 1024)} KB)${p.oldFile ? `, replaces ${p.oldFile}` : ""}`);
    } catch (e) {
      failed.push(`${p.kind}/${p.newBase}: ${e.message}`);
    }
  }
  if (local !== srcs.local) await writeFile(join(ROOT, "src/lib/portraitsLocal.ts"), local);
  if (done.length) add("fix.assets-downloaded", "info", `Downloaded ${done.length} asset(s) and updated portraitsLocal.ts`, done.join("\n"));
  if (failed.length) add("fix.assets-failed", "error", `${failed.length} asset download(s) failed`, failed.join("\n"));
}

// ---------------------------------------------------------------------------
// 4. Running app
// ---------------------------------------------------------------------------

const EMPTY_MARKERS = [
  "Season data not yet available",
  "No upcoming race scheduled",
  "No results yet this season",
  "Standings will appear here once the season opens",
];

async function fetchApp(path) {
  const res = await fetch(new URL(path, APP), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45_000) });
  return { status: res.status, html: await res.text() };
}

async function checkApp() {
  if (!APP || !standings) return;
  const leader = standings.drivers[0];
  const topTeam = constructors[0];
  const pages = [
    { path: "/", needs: [leader.Driver.familyName, leader.points], what: "dashboard shows the standings leader and points" },
    { path: "/drivers", needs: [leader.Driver.familyName], what: "drivers page lists the leader" },
    { path: `/drivers/${leader.Driver.driverId}`, needs: [leader.points], noEmpty: true, what: "leader profile shows points and results" },
    { path: "/teams", needs: [topTeam?.Constructor.name?.split(" ")[0] ?? ""], what: "teams page lists the top constructor" },
    { path: `/teams/${topTeam?.Constructor.constructorId}`, needs: [topTeam?.points ?? ""], noEmpty: true, what: "top constructor page shows points and results" },
    { path: "/races", needs: [schedule[0]?.raceName?.replace(/ Grand Prix$/, "") ?? ""], what: "races page lists the calendar" },
  ];
  for (const pg of pages) {
    let first = null;
    let final = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      let r;
      try {
        r = await fetchApp(pg.path);
      } catch (e) {
        r = { status: 0, html: "", err: e.message };
      }
      const problems = [];
      if (r.status !== 200) problems.push(`HTTP ${r.status}${r.err ? ` (${r.err})` : ""}`);
      for (const n of pg.needs.filter(Boolean)) if (!r.html.toLowerCase().includes(String(n).toLowerCase())) problems.push(`missing "${n}"`);
      if (pg.noEmpty || pg.path === "/") for (const m of EMPTY_MARKERS) if (r.html.includes(m)) problems.push(`shows empty state "${m}"`);
      if (!first) first = problems;
      final = problems;
      if (!problems.length) break;
      await sleep(8_000);
    }
    if (!final.length && !first.length) add(`app.${pg.path}`, "ok", `${pg.path}: ${pg.what}`);
    else if (!final.length) add(`app.${pg.path}`, "warn", `${pg.path}: failed once, then recovered (intermittent)`, first.join("; "));
    else add(`app.${pg.path}`, "error", `${pg.path}: ${pg.what} FAILED`, final.join("; "));
  }
  try {
    const h = await fetchApp("/api/health");
    add("app.health", h.status === 200 ? "ok" : "error", h.status === 200 ? "/api/health ok" : `/api/health returned ${h.status}`);
  } catch (e) {
    add("app.health", "error", "/api/health unreachable", e.message);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function render() {
  const order = { error: 0, warn: 1, info: 2, ok: 3 };
  const label = { error: "ERROR", warn: "WARN", info: "INFO", ok: "OK" };
  const sorted = [...findings].sort((a, b) => order[a.level] - order[b.level]);
  const count = (l) => findings.filter((f) => f.level === l).length;
  const lines = [
    `# Weekly data and asset audit`,
    ``,
    `Run: ${new Date().toISOString()} · season ${standings?.season ?? "?"} round ${standings?.round ?? "?"} · ${count("error")} error, ${count("warn")} warning, ${count("info")} info, ${count("ok")} ok`,
    ``,
  ];
  for (const f of sorted) {
    lines.push(`- **${label[f.level]}** ${f.title}`);
    if (f.detail) for (const d of f.detail.split("\n")) lines.push(`  - ${d}`);
  }
  return lines.join("\n") + "\n";
}

async function main() {
  await loadSources();
  await checkApi();
  checkConsistency();
  await checkAgainstF1();
  checkRoster();
  await checkLocalFiles();
  const plans = planAssetUpdates();
  if (FIX) await applyAssetUpdates(plans);
  else if (plans.length) add("fix.available", "info", `${plans.length} asset update(s) can be applied with --fix-assets`);
  await checkApp();

  const md = render();
  process.stdout.write(md);
  const jsonPath = opt("--json");
  const mdPath = opt("--md");
  if (jsonPath) await writeFile(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
  if (mdPath) await writeFile(mdPath, md);
  process.exit(findings.some((f) => f.level === "error") ? 1 : 0);
}

main().catch((e) => {
  console.error("audit crashed:", e);
  process.exit(2);
});
