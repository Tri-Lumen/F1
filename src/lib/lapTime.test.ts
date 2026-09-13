import { describe, it, expect } from "vitest";
import { parseLapTimeToSeconds, parseLapTimeToMs } from "./lapTime";

describe("parseLapTimeToSeconds", () => {
  it("parses minutes:seconds.milliseconds format", () => {
    expect(parseLapTimeToSeconds("1:23.456")).toBeCloseTo(83.456, 6);
  });

  it("parses seconds-only format", () => {
    expect(parseLapTimeToSeconds("83.456")).toBeCloseTo(83.456, 6);
  });

  it("parses a whole-second time with no fractional part", () => {
    expect(parseLapTimeToSeconds("90")).toBe(90);
  });

  it("returns null for malformed input rather than NaN", () => {
    expect(parseLapTimeToSeconds("not-a-time")).toBeNull();
    expect(parseLapTimeToSeconds("")).toBeNull();
    expect(parseLapTimeToSeconds(undefined)).toBeNull();
  });
});

describe("parseLapTimeToMs", () => {
  it("converts minutes:seconds.milliseconds to milliseconds", () => {
    expect(parseLapTimeToMs("1:23.456")).toBeCloseTo(83456, 3);
  });

  it("converts seconds-only format to milliseconds", () => {
    expect(parseLapTimeToMs("83.456")).toBeCloseTo(83456, 3);
  });

  it("returns null for malformed input rather than throwing or NaN", () => {
    expect(() => parseLapTimeToMs("garbage")).not.toThrow();
    expect(parseLapTimeToMs("garbage")).toBeNull();
  });
});
