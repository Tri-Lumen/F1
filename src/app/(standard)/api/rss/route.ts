import { NextRequest, NextResponse } from "next/server";
import type { RssArticle } from "@/lib/types";

const FETCH_TIMEOUT_MS = 8_000;

/** Block requests to private/internal IP ranges and non-HTTP(S) schemes. */
function isAllowedUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname;
  // Block loopback, link-local, and private ranges
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host === "metadata.google.internal"
  ) {
    return false;
  }
  // Block private IPv4 ranges
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    ) {
      return false;
    }
  }
  return true;
}

/** Unescape HTML entities commonly found in RSS feeds */
function decodeEntities(text: string): string {
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
function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, "")).trim();
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
    // wastes bandwidth on long-form articles.
    const text = await res.text();
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
function parseItem(itemXml: string, sourceName: string, sourceId: string): RssArticle | null {
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
  while ((match = itemRegex.exec(xml)) !== null) {
    const article = parseItem(match[1], sourceName, sourceId);
    if (article) articles.push(article);
  }

  // Atom entries (if no RSS items found)
  if (articles.length === 0) {
    const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const article = parseItem(match[1], sourceName, sourceId);
      if (article) articles.push(article);
    }
  }

  return articles;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const feedUrls = searchParams.get("feeds");

  if (!feedUrls) {
    return NextResponse.json({ articles: [] });
  }

  // Expect JSON array of { id, name, url }
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

  const results = await Promise.allSettled(
    feedList.map(async (feed) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      if (!isAllowedUrl(feed.url)) return [];
      try {
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "F1Dashboard/1.0",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
          next: { revalidate: 300 }, // 5 min cache
        });
        if (!res.ok) return [];
        const xml = await res.text();
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
