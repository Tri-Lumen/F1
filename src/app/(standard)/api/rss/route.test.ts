import { describe, it, expect } from "vitest";
import { decodeEntities, stripHtml, parseItem, isAllowedUrl } from "./route";

describe("stripHtml", () => {
  it("unwraps a CDATA-wrapped title intact (regression)", () => {
    // Standard RSS wrapping for <title>/<description>: a raw CDATA-wrapped
    // string should come out exactly as written, not be treated as a single
    // "tag" and deleted by the generic tag-stripping regex.
    expect(stripHtml("<![CDATA[Verstappen wins Miami Grand Prix]]>")).toBe(
      "Verstappen wins Miami Grand Prix"
    );
  });

  it("decodes HTML entities inside a CDATA section", () => {
    expect(stripHtml("<![CDATA[Hamilton &amp; Russell battle for P2]]>")).toBe(
      "Hamilton & Russell battle for P2"
    );
  });

  it("still strips plain (non-CDATA) HTML tags", () => {
    expect(stripHtml("<p>Race report: <b>Verstappen</b> wins</p>")).toBe(
      "Race report: Verstappen wins"
    );
  });
});

describe("decodeEntities", () => {
  it("decodes common named entities", () => {
    expect(decodeEntities("Red Bull &amp; Ferrari &mdash; Q3 &quot;shootout&quot;")).toBe(
      'Red Bull & Ferrari — Q3 "shootout"'
    );
  });

  it("decodes numeric and hex character references", () => {
    expect(decodeEntities("caf&#233; &#x2013; results")).toBe("café – results");
  });
});

describe("parseItem", () => {
  it("parses a CDATA-wrapped RSS <item> title without mangling it", () => {
    const xml = `
      <title><![CDATA[Verstappen &amp; Red Bull take pole]]></title>
      <link>https://example.com/article</link>
      <description><![CDATA[<p>Full report here</p>]]></description>
      <pubDate>Sat, 01 Feb 2026 12:00:00 GMT</pubDate>
    `;
    const article = parseItem(xml, "Test Feed", "test");
    expect(article).not.toBeNull();
    expect(article?.title).toBe("Verstappen & Red Bull take pole");
    expect(article?.description).toBe("Full report here");
    expect(article?.link).toBe("https://example.com/article");
  });

  it("returns null when the item has no title or link", () => {
    expect(parseItem("<description>No title or link here</description>", "Test Feed", "test")).toBeNull();
  });
});

describe("isAllowedUrl (SSRF guard for og:image fetches)", () => {
  it("allows ordinary public HTTPS URLs", () => {
    expect(isAllowedUrl("https://example.com/article")).toBe(true);
  });

  it("blocks non-HTTP(S) schemes", () => {
    expect(isAllowedUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedUrl("not a url")).toBe(false);
  });

  it("blocks localhost and dotted-quad loopback/private IPv4", () => {
    expect(isAllowedUrl("http://localhost/")).toBe(false);
    expect(isAllowedUrl("http://127.0.0.1/")).toBe(false);
    expect(isAllowedUrl("http://10.0.0.5/")).toBe(false);
    expect(isAllowedUrl("http://192.168.1.1/")).toBe(false);
    expect(isAllowedUrl("http://169.254.169.254/")).toBe(false); // cloud metadata
  });

  it("blocks alternate IPv4 encodings the URL parser normalizes to a private address", () => {
    expect(isAllowedUrl("http://127.1/")).toBe(false);
    expect(isAllowedUrl("http://0177.0.0.1/")).toBe(false); // octal
    expect(isAllowedUrl("http://2130706433/")).toBe(false); // decimal
    expect(isAllowedUrl("http://127.0.0.1./")).toBe(false); // trailing-dot FQDN
  });

  it("blocks IPv6 loopback, link-local, and unique-local addresses", () => {
    expect(isAllowedUrl("http://[::1]/")).toBe(false);
    expect(isAllowedUrl("http://[fe80::1]/")).toBe(false);
    expect(isAllowedUrl("http://[fc00::1]/")).toBe(false);
    expect(isAllowedUrl("http://[fd12:3456::1]/")).toBe(false);
  });

  it("blocks IPv4-mapped / NAT64 IPv6 addresses embedding a private IPv4", () => {
    expect(isAllowedUrl("http://[::ffff:127.0.0.1]/")).toBe(false);
    expect(isAllowedUrl("http://[::ffff:169.254.169.254]/")).toBe(false);
    expect(isAllowedUrl("http://[64:ff9b::127.0.0.1]/")).toBe(false);
  });

  it("allows a public IPv6 address", () => {
    expect(isAllowedUrl("http://[2001:db8::1]/")).toBe(true);
  });
});
