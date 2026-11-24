/**
 * Pure parsing helpers for scripts/sync-f1-portraits.mjs (no I/O, so they can
 * be unit-tested against fixtures).
 *
 * formula1.com's markup carries no reliable names or path fragments next to
 * images, but every asset basename encodes who it belongs to:
 *
 *   drivers: {year}{teamSlug}{6-letter code}{nn}right.{ext}   2026mclarenlannor01right.webp
 *   cars:    {year}{teamSlug}carright.{ext}                    2026mclarencarright.webp
 *   logos:   {year}{teamSlug}logowhite.{ext}                   2026mclarenlogowhite.webp
 *
 * so we key on the basename instead of on surrounding HTML.
 */

/** 6-letter asset code (first 3 letters of given + family name) → Ergast driverId. */
export const DRIVER_CODE_TO_ID = {
  maxver: "max_verstappen",
  lewham: "hamilton",
  chalec: "leclerc",
  lannor: "norris",
  oscpia: "piastri",
  georus: "russell",
  andant: "antonelli", // F1.com's "andant" = Andrea Kimi Antonelli
  kimant: "antonelli",
  feralo: "alonso",
  lanstr: "stroll",
  piegas: "gasly",
  alealb: "albon",
  carsai: "sainz",
  fracol: "colapinto",
  estoco: "ocon",
  olibea: "bearman",
  rafcam: "camara",
  nichul: "hulkenberg",
  gabbor: "bortoleto",
  isahad: "hadjar",
  lialaw: "lawson",
  arvlin: "lindblad",
  valbot: "bottas",
  serper: "perez",
};

/** Team slug as used in F1.com asset basenames → Ergast constructorId. */
export const TEAM_SLUG_TO_ID = {
  redbullracing: "red_bull",
  ferrari: "ferrari",
  mclaren: "mclaren",
  mercedes: "mercedes",
  astonmartin: "aston_martin",
  alpine: "alpine",
  williams: "williams",
  haasf1team: "haas",
  haas: "haas",
  racingbulls: "rb",
  audi: "audi",
  kicksauber: "audi",
  cadillac: "cadillac",
};

const MEDIA_URL = /https:\/\/media\.formula1\.com\/[^"'\s<>)\\]+/g;
const EXT = "(?:webp|png|jpg)";
const DRIVER_BASENAME = new RegExp(`^(20\\d\\d)([a-z0-9]+?)([a-z]{6})(\\d\\d)right\\.${EXT}$`);
const CAR_BASENAME = new RegExp(`^(20\\d\\d)([a-z0-9]+?)carright\\.${EXT}$`);
const LOGO_BASENAME = new RegExp(`^(20\\d\\d)([a-z0-9]+?)logowhite\\.${EXT}$`);

function widthOf(url) {
  return parseInt(url.match(/[/,]w_(\d+)/)?.[1] ?? "0", 10);
}

/** Every media.formula1.com URL in the HTML, in document order, entity-decoded. */
export function extractMediaUrls(html) {
  return (html.match(MEDIA_URL) ?? []).map((u) => u.replace(/&amp;/g, "&"));
}

/**
 * Classify one media URL. Returns null for anything that isn't a driver
 * portrait / car render / team logo.
 */
export function classifyAsset(url) {
  const basename = url.split("?")[0].split("/").pop() ?? "";
  let m = basename.match(DRIVER_BASENAME);
  if (m) return { kind: "driver", year: +m[1], slug: m[2], code: m[3], variant: m[4], url };
  m = basename.match(CAR_BASENAME);
  if (m) return { kind: "car", year: +m[1], slug: m[2], url };
  m = basename.match(LOGO_BASENAME);
  if (m) return { kind: "logo", year: +m[1], slug: m[2], url };
  return null;
}

/** Keep only assets for the newest season on the page; pages may carry stale ones. */
function currentSeason(assets) {
  const year = Math.max(0, ...assets.map((a) => a.year));
  return assets.filter((a) => a.year === year);
}

/** Of several URLs for one asset, prefer the widest rendition (first wins ties). */
function widest(urls) {
  return urls.reduce((best, u) => (widthOf(u) > widthOf(best) ? u : best));
}

/**
 * Parse /en/drivers HTML.
 * @returns {{ manifest: Record<string,{card:string}>, unmapped: string[] }}
 *   `unmapped` lists asset codes present on the page with no entry in DRIVER_CODE_TO_ID.
 */
export function parseDrivers(html) {
  const assets = currentSeason(
    extractMediaUrls(html).map(classifyAsset).filter((a) => a?.kind === "driver"),
  );
  const byCode = new Map();
  for (const a of assets) {
    // Same driver can appear under a re-numbered variant (…01 / …02); keep the
    // highest variant, since F1.com bumps it when it replaces the photo.
    const key = a.code;
    const list = byCode.get(key) ?? [];
    list.push(a);
    byCode.set(key, list);
  }
  const manifest = {};
  const unmapped = [];
  for (const [code, list] of byCode) {
    const id = DRIVER_CODE_TO_ID[code];
    if (!id) {
      unmapped.push(code);
      continue;
    }
    const topVariant = list.map((a) => a.variant).sort().at(-1);
    manifest[id] = { card: widest(list.filter((a) => a.variant === topVariant).map((a) => a.url)) };
  }
  return { manifest, unmapped };
}

/**
 * Parse /en/teams HTML. Only car renders and logos are used: the page also
 * embeds small driver thumbnails, which are deliberately ignored.
 * @returns {{ manifest: Record<string,{car?:string,logo?:string}>, unmapped: string[] }}
 */
export function parseTeams(html) {
  const assets = currentSeason(
    extractMediaUrls(html)
      .map(classifyAsset)
      .filter((a) => a && (a.kind === "car" || a.kind === "logo")),
  );
  const grouped = new Map(); // `${slug}|${kind}` → urls
  for (const a of assets) {
    const key = `${a.slug}|${a.kind}`;
    grouped.set(key, [...(grouped.get(key) ?? []), a.url]);
  }
  const manifest = {};
  const unmapped = new Set();
  for (const [key, urls] of grouped) {
    const [slug, kind] = key.split("|");
    const id = TEAM_SLUG_TO_ID[slug];
    if (!id) {
      unmapped.add(slug);
      continue;
    }
    manifest[id] ??= {};
    manifest[id][kind] = widest(urls);
  }
  return { manifest, unmapped: [...unmapped] };
}
