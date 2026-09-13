import { describe, it, expect } from "vitest";
import { decodeEntities, stripHtml, parseItem } from "./route";

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
