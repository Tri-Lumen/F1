import { describe, it, expect } from "vitest";
import { getMaxPointsForRound } from "./api";

describe("getMaxPointsForRound", () => {
  it("returns 26 for a normal (non-sprint) round", () => {
    expect(getMaxPointsForRound(false)).toBe(26);
  });

  it("returns 34 for a sprint round", () => {
    expect(getMaxPointsForRound(true)).toBe(34);
  });
});
