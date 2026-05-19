"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Prediction } from "./types";

interface PredictionsContextValue {
  predictions: Prediction[];
  /** Find the saved prediction for a round, if any */
  getPrediction: (round: string) => Prediction | undefined;
  /** Insert or replace the prediction for a round */
  savePrediction: (prediction: Prediction) => void;
  /** Remove the prediction for a round */
  clearPrediction: (round: string) => void;
  /** True only after the initial localStorage read completes */
  mounted: boolean;
}

const PredictionsContext = createContext<PredictionsContextValue>({
  predictions: [],
  getPrediction: () => undefined,
  savePrediction: () => {},
  clearPrediction: () => {},
  mounted: false,
});

export function usePredictions() {
  return useContext(PredictionsContext);
}

const STORAGE_KEY = "f1-predictions-2026";

function sanitize(raw: string | null): Prediction[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is Prediction => {
      if (!p || typeof p !== "object") return false;
      const round = (p as Prediction).round;
      const pole = (p as Prediction).pole;
      const p1 = (p as Prediction).p1;
      const p2 = (p as Prediction).p2;
      const p3 = (p as Prediction).p3;
      const submittedAt = (p as Prediction).submittedAt;
      return (
        typeof round === "string" &&
        /^\d+$/.test(round) &&
        typeof pole === "string" &&
        typeof p1 === "string" &&
        typeof p2 === "string" &&
        typeof p3 === "string" &&
        typeof submittedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function PredictionsProvider({ children }: { children: React.ReactNode }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPredictions(sanitize(localStorage.getItem(STORAGE_KEY)));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
    } catch {}
  }, [predictions, mounted]);

  function getPrediction(round: string) {
    return predictions.find((p) => p.round === round);
  }

  function savePrediction(prediction: Prediction) {
    setPredictions((prev) => {
      const without = prev.filter((p) => p.round !== prediction.round);
      return [...without, prediction];
    });
  }

  function clearPrediction(round: string) {
    setPredictions((prev) => prev.filter((p) => p.round !== round));
  }

  return (
    <PredictionsContext.Provider
      value={{ predictions, getPrediction, savePrediction, clearPrediction, mounted }}
    >
      {children}
    </PredictionsContext.Provider>
  );
}
