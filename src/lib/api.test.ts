import { describe, it, expect, vi, afterEach } from "vitest";
import { getMaxPointsForRound, getRaceSchedule } from "./api";

describe("Ergast requests", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("send a descriptive User-Agent (Jolpica rejects Node's default with 403)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ MRData: { RaceTable: { Races: [{ round: "1" }] } } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const races = await getRaceSchedule();
    expect(races).toHaveLength(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)["User-Agent"]).toBe("F1Dashboard/1.0");
  });

  it("logs a non-retryable failure instead of silently returning no data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock);
    expect(await getRaceSchedule()).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1); // 403 is not retried
    expect(errSpy.mock.calls.flat().join(" ")).toContain("HTTP 403");
    errSpy.mockRestore();
  });
});

describe("getMaxPointsForRound", () => {
  it("returns 26 for a normal (non-sprint) round", () => {
    expect(getMaxPointsForRound(false)).toBe(26);
  });

  it("returns 34 for a sprint round", () => {
    expect(getMaxPointsForRound(true)).toBe(34);
  });
});
