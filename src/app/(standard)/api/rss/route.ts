import { NextRequest, NextResponse } from "next/server";
import type { RssArticle } from "@/lib/types";
import { DEFAULT_RSS_FEEDS } from "@/lib/rssFeeds";

const FETCH_TIMEOUT_MS = 8_000;
/** Cap on how many response bytes we'll read from any single feed. */
const MAX_FEED_BYTES = 4 * 1024 * 1024; // 4 MB
/** Cap on how many <item>/<entry> elements we'll parse out of one feed. */
const MAX_ITEMS_PER_FEED = 200;
/** Feed URLs are never taken from the client — only its known id is used to
 * look up the real URL here, so a request can't be used to make this server
 * fetch an arbitrary attacker-chosen address. */
const FEED_URL_BY_ID = new Map(DEFAULT_RSS_FEEDS.map((f) => [f.id, f.url]));

function isPrivateIpv4Octets(a: number, b: number): boolean {
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

/**
 * Expand a bracket-stripped, lowercase IPv6 literal (as `URL` normalizes it,
 * e.g. "::ffff:a9fe:a9fe") into its 16 bytes, or null if it doesn't parse as
 * exactly 8 groups (with at most one "::" compression).
 */
function parseIpv6Bytes(host: string): number[] | null {
  const parts = host.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  const missing = 8 - (head.length + tail.length);
  if (parts.length === 1 && head.length !== 8) return null;
  if (parts.length === 2 && missing < 0) return null;
  const groups = [...head, ...Array(parts.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  const bytes: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    const v = parseInt(g, 16);
    bytes.push((v >> 8) & 0xff, v & 0xff);
  }
  return bytes;
}

/** True if a normalized (bracket-stripped) IPv6 literal falls in a
 * loopback/link-local/unique-local range, or embeds a private IPv4 address
 * (IPv4-mapped `::ffff:a.b.c.d`, the `64:ff9b::/96` NAT64 prefix, or the
 * deprecated IPv4-compatible `::a.b.c.d` form). */
function isPrivateIpv6(inner: string): boolean {
  if (inner === "::1" || inner === "::") return true;
  const bytes = parseIpv6Bytes(inner);
  if (!bytes) return false;
  const first = bytes[0];
  if (first === 0xfe && (bytes[1] & 0xc0) === 0x80) return true; // fe80::/10 link-local
  if (first === 0xfc || first === 0xfd) return true; // fc00::/7 unique-local
  const isV4Mapped = bytes.slice(0, 10).every((b) => b === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
  const isNat64 =
    bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b &&
    bytes.slice(4, 12).every((b) => b === 0);
  const isV4Compatible =
    bytes.slice(0, 12).every((b) => b === 0) && bytes.slice(12).some((b) => b !== 0);
  if (isV4Mapped || isNat64 || isV4Compatible) {
    return isPrivateIpv4Octets(bytes[12], bytes[13]);
  }
  return false;
}

/** Block requests to private/internal IP ranges and non-HTTP(S) schemes. */
export function isAllowedUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  // `URL` already normalizes alternate IP encodings (decimal/octal/hex
  // octets, short forms like "127.1", a trailing-dot FQDN) to a canonical
  // form before `hostname` is read here, so the checks below see that
  // canonical value rather than the attacker-supplied spelling.
  const host = parsed.hostname;
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host === "metadata.google.internal"
  ) {
    return false;
  }
  if (host.startsWith("[") && host.endsWith("]")) {
    if (isPrivateIpv6(host.slice(1, -1))) return false;
    return true;
  }
  // Block private IPv4 ranges
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (isPrivateIpv4Octets(a, b)) return false;
  }
  return true;
}

/** Unescape HTML entities commonly found in RSS feeds */
export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const cp = parseInt(hex, 16);
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const cp = parseInt(dec, 10);
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
    })
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1");
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  // Unwrap CDATA sections before stripping tags — the generic tag regex
  // below has no CDATA awareness, so `<![CDATA[text]]>` (the standard
  // wrapping for <title>/<description> in most RSS feeds) would otherwise
  // match as a single "tag" and get deleted entirely.
  const withoutCData = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return decodeEntities(withoutCData.replace(/<[^>]*>/g, "")).trim();
}

/** Tracking-pixel and 1x1 sentinel domains/paths to drop. */
const TRACKING_PATTERNS = [
  /\/?pixel\.gif/i,
  /\/spacer\.gif/i,
  /\/1x1\.(gif|png)/i,
  /\/blank\.(gif|png)/i,
  /feedburner\.com\/~ff\//i,
  /feeds\.feedburner\.com\/~r\//i,
  /doubleclick\.net/i,
  /googletagmanager\.com/i,
];

function looksLikeTrackingPixel(url: string): boolean {
  return TRACKING_PATTERNS.some((re) => re.test(url));
}

/** Resolve a possibly-relative image URL against a base article link. */
function resolveImageUrl(url: string, baseUrl: string | null): string | undefined {
  const cleaned = url.trim();
  if (!cleaned) return undefined;
  if (looksLikeTrackingPixel(cleaned)) return undefined;
  // Protocol-relative (//host/path) — pin to https
  if (cleaned.startsWith("//")) return `https:${cleaned}`;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (!baseUrl) return undefined;
  try {
    return new URL(cleaned, baseUrl).toString();
  } catch {
    return undefined;
  }
}

/** Extract first image URL from HTML content or media tags */
function extractImage(item: string, baseUrl: string | null): string | undefined {
  const candidates: (string | undefined)[] = [];

  // media:content or media:thumbnail (handles media:group nesting too)
  const mediaMatch = item.match(/<media:(content|thumbnail)[^>]+url=["']([^"']+)["']/);
  if (mediaMatch) candidates.push(mediaMatch[2]);

  // enclosure with image type (both attribute orderings)
  const enclosureMatch = item.match(/<enclosure[^>]+type=["']image\/[^"']*["'][^>]+url=["']([^"']+)["']/);
  if (enclosureMatch) candidates.push(enclosureMatch[1]);
  const enclosureMatch2 = item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/);
  if (enclosureMatch2) candidates.push(enclosureMatch2[1]);

  // enclosure URL ending in an image extension (some feeds omit the type attribute)
  const enclosureImgExt = item.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"']*)?)["']/i);
  if (enclosureImgExt) candidates.push(enclosureImgExt[1]);

  // <image><url>...</url></image> (RSS channel-level sometimes nested in items)
  const imageUrlTag = item.match(/<image[^>]*>[\s\S]*?<url[^>]*>([\s\S]*?)<\/url>/);
  if (imageUrlTag) candidates.push(decodeEntities(imageUrlTag[1]).trim());

  // <thumbnail>...</thumbnail> without media: prefix
  const plainThumbnail = item.match(/<thumbnail[^>]*>([\s\S]*?)<\/thumbnail>/);
  if (plainThumbnail) candidates.push(decodeEntities(plainThumbnail[1]).trim());

  // <itunes:image href="..."/>
  const itunesImage = item.match(/<itunes:image[^>]+href=["']([^"']+)["']/);
  if (itunesImage) candidates.push(itunesImage[1]);

  // img tag in description/content/content:encoded (also handles data-src for lazy loading)
  const imgMatch = item.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) candidates.push(imgMatch[1]);
  const dataSrcMatch = item.match(/<img[^>]+data-src=["']([^"']+)["']/);
  if (dataSrcMatch) candidates.push(dataSrcMatch[1]);

  for (const c of candidates) {
    if (!c) continue;
    const resolved = resolveImageUrl(decodeEntities(c), baseUrl);
    if (resolved) return resolved;
  }
  return undefined;
}

/**
 * Fetch the article HTML and try to extract an Open Graph / Twitter image.
 *
 * Many F1 feeds (Autosport, GP Blog, others) omit images from the RSS feed
 * even though every article has an og:image meta tag.  Hitting the page once
 * lets us populate the preview thumbnail when the feed itself doesn't.
 *
 * Cached at the fetch layer for 24h since article URLs are stable.
 */
async function fetchOgImage(articleUrl: string): Promise<string | undefined> {
  if (!isAllowedUrl(articleUrl)) return undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4_000);
  try {
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "F1Dashboard/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return undefined;
    // Read just the <head> — og:image lives there and pulling the whole body
    // wastes bandwidth on long-form articles. Bounded read also protects
    // against a misbehaving/huge response before this slice ever applies.
    const text = await readBoundedText(res, MAX_FEED_BYTES);
    const head = text.slice(0, 64_000);

    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    ];
    for (const re of patterns) {
      const m = head.match(re);
      if (m) {
        const resolved = resolveImageUrl(decodeEntities(m[1]), articleUrl);
        if (resolved) return resolved;
      }
    }
    return undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Backfill missing imageUrl fields by hitting article pages for og:image.
 * Bounded concurrency keeps us from stampeding 100 outbound requests at once.
 */
async function backfillOgImages(articles: RssArticle[], concurrency = 8): Promise<void> {
  const targets = articles.filter((a) => !a.imageUrl);
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const idx = cursor++;
      const article = targets[idx];
      const img = await fetchOgImage(article.link);
      if (img) article.imageUrl = img;
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, targets.length) }, () => worker())
  );
}

/** Parse a single RSS/Atom item/entry element */
export function parseItem(itemXml: string, sourceName: string, sourceId: string): RssArticle | null {
  const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const linkMatch =
    itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/) ||
    itemXml.match(/<link[^>]+href=["']([^"']+)["']/);
  const descMatch =
    itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/) ||
    itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) ||
    itemXml.match(/<content[^>]*>([\s\S]*?)<\/content>/);
  const dateMatch =
    itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/) ||
    itemXml.match(/<published[^>]*>([\s\S]*?)<\/published>/) ||
    itemXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/) ||
    itemXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/);

  const title = titleMatch ? stripHtml(titleMatch[1]) : null;
  const link = linkMatch ? decodeEntities(linkMatch[1]).trim() : null;

  if (!title || !link) return null;

  const description = descMatch ? stripHtml(descMatch[1]).slice(0, 300) : "";
  // Articles without a pubDate previously defaulted to `new Date()`, which
  // caused them to leapfrog dated entries on every refresh.  Leave the field
  // empty so the sort comparator can demote them.
  const pubDate = dateMatch ? decodeEntities(dateMatch[1]).trim() : "";
  const imageUrl = extractImage(itemXml, link);

  return {
    title,
    link,
    description,
    pubDate,
    source: sourceName,
    sourceId,
    imageUrl,
  };
}

/** Parse RSS 2.0 or Atom XML into articles */
function parseRssFeed(xml: string, sourceName: string, sourceId: string): RssArticle[] {
  const articles: RssArticle[] = [];

  // RSS 2.0 items
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while (articles.length < MAX_ITEMS_PER_FEED && (match = itemRegex.exec(xml)) !== null) {
    const article = parseItem(match[1], sourceName, sourceId);
    if (article) articles.push(article);
  }

  // Atom entries (if no RSS items found)
  if (articles.length === 0) {
    const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while (articles.length < MAX_ITEMS_PER_FEED && (match = entryRegex.exec(xml)) !== null) {
      const article = parseItem(match[1], sourceName, sourceId);
      if (article) articles.push(article);
    }
  }

  return articles;
}

/** Read a response body as text, aborting once it exceeds `maxBytes` — a
 * malicious or misbehaving feed shouldn't be able to make this endpoint
 * buffer an unbounded response before any size check happens. */
async function readBoundedText(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return res.text();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const feedUrls = searchParams.get("feeds");

  if (!feedUrls) {
    return NextResponse.json({ articles: [] });
  }

  // Expect JSON array of { id, name, url } — `url` is accepted for backward
  // compatibility but ignored; only `id` is trusted, resolved against this
  // server's own known feed list, so a request can never make this endpoint
  // fetch an arbitrary client-chosen URL.
  let feedList: { id: string; name: string; url: string }[];
  try {
    const parsed = JSON.parse(feedUrls);
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "feeds must be a JSON array" }, { status: 400 });
    }
    feedList = parsed;
  } catch {
    return NextResponse.json({ error: "Invalid feeds parameter" }, { status: 400 });
  }

  // Cap fan-out regardless of what the client asks for.
  feedList = feedList.slice(0, DEFAULT_RSS_FEEDS.length);

  const results = await Promise.allSettled(
    feedList.map(async (feed) => {
      const url = FEED_URL_BY_ID.get(feed.id);
      if (!url || !isAllowedUrl(url)) return [];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "F1Dashboard/1.0",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
          next: { revalidate: 300 }, // 5 min cache
        });
        if (!res.ok) return [];
        const xml = await readBoundedText(res, MAX_FEED_BYTES);
        return parseRssFeed(xml, feed.name, feed.id);
      } catch {
        return [];
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const allArticles: RssArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Sort by date, newest first.  Articles with missing / unparseable dates
  // sort to the bottom instead of floating to the top.
  allArticles.sort((a, b) => {
    const tA = a.pubDate ? new Date(a.pubDate).getTime() : NaN;
    const tB = b.pubDate ? new Date(b.pubDate).getTime() : NaN;
    const dateA = Number.isFinite(tA) ? tA : -Infinity;
    const dateB = Number.isFinite(tB) ? tB : -Infinity;
    return dateB - dateA;
  });

  // Trim before backfill so we don't waste outbound requests on items the
  // client will never render.
  const trimmed = allArticles.slice(0, 100);

  // Hit article pages for og:image when the feed didn't carry an inline image.
  // Cached for 24h at the fetch layer, so this is only expensive on first load.
  await backfillOgImages(trimmed);

  return NextResponse.json({ articles: trimmed });
}
