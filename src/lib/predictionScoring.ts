import type {
  Prediction,
  PredictionScoreBreakdown,
  RaceResult,
} from "./types";

/**
 * Scoring rules (per round, max 30 pts):
 *   Pole correct                          +5
 *   P1 exact slot                        +10
 *   P2 exact slot                         +7
 *   P3 exact slot                         +5
 *   Podium driver picked, wrong slot      +2  (per off-slot match)
 *   Fastest-lap correct                   +5
 *
 * `pole` is taken from the actual qualifying pole (race grid position 1 if
 * qualifying was redacted). When inputs are missing, the corresponding
 * components score 0 — the breakdown stays internally consistent.
 */
export function scorePrediction(
  prediction: Prediction,
  raceResults: RaceResult[],
  polePosition: string | undefined,
): PredictionScoreBreakdown {
  const breakdown: PredictionScoreBreakdown = {
    pole: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    podiumOffSlot: 0,
    fastestLap: 0,
    total: 0,
  };

  if (polePosition && polePosition === prediction.pole) {
    breakdown.pole = 5;
  }

  if (raceResults.length > 0) {
    const finisherAt = (slot: number): string | undefined =>
      raceResults.find((r) => r.position === String(slot))?.Driver.driverId;
    const actual = {
      p1: finisherAt(1),
      p2: finisherAt(2),
      p3: finisherAt(3),
    };
    const actualPodiumSet = new Set([actual.p1, actual.p2, actual.p3].filter(Boolean));

    if (actual.p1 && actual.p1 === prediction.p1) breakdown.p1 = 10;
    if (actual.p2 && actual.p2 === prediction.p2) breakdown.p2 = 7;
    if (actual.p3 && actual.p3 === prediction.p3) breakdown.p3 = 5;

    // Off-slot bonus: picks that landed on the podium but in the wrong slot
    const slotMatched: Record<string, boolean> = {
      [prediction.p1]: actual.p1 === prediction.p1,
      [prediction.p2]: actual.p2 === prediction.p2,
      [prediction.p3]: actual.p3 === prediction.p3,
    };
    for (const pick of [prediction.p1, prediction.p2, prediction.p3]) {
      if (!slotMatched[pick] && actualPodiumSet.has(pick)) {
        breakdown.podiumOffSlot += 2;
      }
    }

    if (prediction.fastestLap) {
      const fl = raceResults.find((r) => r.FastestLap?.rank === "1");
      if (fl && fl.Driver.driverId === prediction.fastestLap) {
        breakdown.fastestLap = 5;
      }
    }
  }

  breakdown.total =
    breakdown.pole +
    breakdown.p1 +
    breakdown.p2 +
    breakdown.p3 +
    breakdown.podiumOffSlot +
    breakdown.fastestLap;

  return breakdown;
}
