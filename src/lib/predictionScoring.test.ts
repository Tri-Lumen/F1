import { describe, it, expect } from "vitest";
import { scorePrediction } from "./predictionScoring";
import type { Prediction, RaceResult, Driver, Constructor } from "./types";

function driver(driverId: string): Driver {
  return {
    driverId,
    permanentNumber: "0",
    code: driverId.slice(0, 3).toUpperCase(),
    givenName: driverId,
    familyName: driverId,
    dateOfBirth: "2000-01-01",
    nationality: "Test",
    url: "",
  };
}

function constructor(constructorId: string): Constructor {
  return { constructorId, name: constructorId, nationality: "Test", url: "" };
}

function result(
  position: string,
  driverId: string,
  opts: { fastestLapRank?: string } = {}
): RaceResult {
  return {
    number: "0",
    position,
    positionText: position,
    points: "0",
    Driver: driver(driverId),
    Constructor: constructor("team"),
    grid: position,
    laps: "50",
    status: "Finished",
    ...(opts.fastestLapRank
      ? {
          FastestLap: {
            rank: opts.fastestLapRank,
            lap: "30",
            Time: { time: "1:30.000" },
            AverageSpeed: { units: "kph", speed: "200" },
          },
        }
      : {}),
  };
}

const podium: RaceResult[] = [
  result("1", "verstappen", { fastestLapRank: "1" }),
  result("2", "norris"),
  result("3", "leclerc"),
];

function prediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    round: "1",
    pole: "verstappen",
    p1: "verstappen",
    p2: "norris",
    p3: "leclerc",
    fastestLap: "verstappen",
    submittedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("scorePrediction", () => {
  it("scores full points for an exact podium + pole + fastest lap match", () => {
    const breakdown = scorePrediction(prediction(), podium, "verstappen");
    expect(breakdown.pole).toBe(5);
    expect(breakdown.p1).toBe(10);
    expect(breakdown.p2).toBe(7);
    expect(breakdown.p3).toBe(5);
    expect(breakdown.podiumOffSlot).toBe(0);
    expect(breakdown.fastestLap).toBe(5);
    expect(breakdown.total).toBe(32);
  });

  it("scores 0 for a completely wrong podium/pole/fastest-lap pick", () => {
    const breakdown = scorePrediction(
      prediction({
        pole: "hamilton",
        p1: "hamilton",
        p2: "russell",
        p3: "piastri",
        fastestLap: "hamilton",
      }),
      podium,
      "verstappen"
    );
    expect(breakdown.pole).toBe(0);
    expect(breakdown.p1).toBe(0);
    expect(breakdown.p2).toBe(0);
    expect(breakdown.p3).toBe(0);
    expect(breakdown.podiumOffSlot).toBe(0);
    expect(breakdown.fastestLap).toBe(0);
    expect(breakdown.total).toBe(0);
  });

  it("awards the +2 off-slot bonus for a podium driver picked in the wrong slot", () => {
    // norris actually finished P2 but was picked for P1 — wrong slot, still podium.
    const breakdown = scorePrediction(
      prediction({ p1: "norris", p2: "verstappen" }),
      podium,
      "verstappen"
    );
    expect(breakdown.p1).toBe(0); // wrong slot for norris
    expect(breakdown.p2).toBe(0); // wrong slot for verstappen
    expect(breakdown.podiumOffSlot).toBe(4); // two off-slot podium hits at +2 each
    expect(breakdown.total).toBe(5 + 0 + 0 + 5 + 4 + 5); // pole + p3 + fastestLap unaffected
  });

  it("does not double-count the off-slot bonus when the same driver is picked in multiple slots (regression)", () => {
    // "verstappen" picked for both p1 and p2 — only one of those slots can
    // ever be the actual P1 finisher, so the off-slot bonus must not fire
    // twice for the same actual podium finisher.
    const breakdown = scorePrediction(
      prediction({ p1: "verstappen", p2: "verstappen", p3: "leclerc" }),
      podium,
      "verstappen"
    );
    expect(breakdown.p1).toBe(10); // exact slot match
    expect(breakdown.p2).toBe(0); // wrong slot (verstappen finished P1, not P2)
    expect(breakdown.p3).toBe(5); // exact slot match
    // p2's pick ("verstappen") is on the podium but in the wrong slot — one
    // off-slot bonus, not two, even though "verstappen" also appears in p1.
    expect(breakdown.podiumOffSlot).toBe(2);
  });

  it("scores 0 for missing raceResults/polePosition without throwing", () => {
    expect(() => scorePrediction(prediction(), [], undefined)).not.toThrow();
    const breakdown = scorePrediction(prediction(), [], undefined);
    expect(breakdown.pole).toBe(0);
    expect(breakdown.p1).toBe(0);
    expect(breakdown.p2).toBe(0);
    expect(breakdown.p3).toBe(0);
    expect(breakdown.podiumOffSlot).toBe(0);
    expect(breakdown.fastestLap).toBe(0);
    expect(breakdown.total).toBe(0);
  });
});
