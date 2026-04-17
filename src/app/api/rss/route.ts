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
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
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

/** Extract first image URL from HTML content or media tags */
function extractImage(item: string): string | undefined {
  // media:content or media:thumbnail (handles media:group nesting too)
  const mediaMatch = item.match(/<media:(content|thumbnail)[^>]+url=["']([^"']+)["']/);
  if (mediaMatch) return mediaMatch[2];

  // enclosure with image type (both attribute orderings)
  const enclosureMatch = item.match(/<enclosure[^>]+type=["']image\/[^"']*["'][^>]+url=["']([^"']+)["']/);
  if (enclosureMatch) return enclosureMatch[1];
  const enclosureMatch2 = item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/);
  if (enclosureMatch2) return enclosureMatch2[1];

  // enclosure URL ending in an image extension (some feeds omit the type attribute)
  const enclosureImgExt = item.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"']*)?)["']/i);
  if (enclosureImgExt) return enclosureImgExt[1];

  // <image><url>...</url></image> (RSS channel-level sometimes nested in items)
  const imageUrlTag = item.match(/<image[^>]*>[\s\S]*?<url[^>]*>([\s\S]*?)<\/url>/);
  if (imageUrlTag) return decodeEntities(imageUrlTag[1]).trim();

  // img tag in description/content/content:encoded (also handles data-src for lazy loading)
  const imgMatch = item.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];
  const dataSrcMatch = item.match(/<img[^>]+data-src=["']([^"']+)["']/);
  if (dataSrcMatch) return dataSrcMatch[1];

  return undefined;
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
  const pubDate = dateMatch ? decodeEntities(dateMatch[1]).trim() : new Date().toISOString();
  const imageUrl = extractImage(itemXml);

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

  // Sort by date, newest first
  allArticles.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime() || 0;
    const dateB = new Date(b.pubDate).getTime() || 0;
    return dateB - dateA;
  });

  // Limit to 100 most recent articles
  return NextResponse.json({ articles: allArticles.slice(0, 100) });
}
