export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDriverStandings,
  getAllSeasonResults,
  CURRENT_YEAR,
} from "@/lib/api";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "Head-to-Head — F1 2026",
  description: "Compare F1 drivers side-by-side with race results, qualifying, and season statistics",
};

async function CompareContent() {
  const [standings, allRaces] = await Promise.all([
    getDriverStandings(),
    getAllSeasonResults(),
  ]);

  return <CompareClient standings={standings} allRaces={allRaces} />;
}

export default function ComparePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-f1-red">Head-to-Head</span> Comparison
        </h1>
        <p className="mt-1 text-sm text-f1-text-muted">
          Compare any two {CURRENT_YEAR} drivers side by side
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-16 rounded-xl bg-f1-card animate-pulse" />
            <div className="h-96 rounded-xl bg-f1-card animate-pulse" />
          </div>
        }
      >
        <CompareContent />
      </Suspense>
    </div>
  );
}
