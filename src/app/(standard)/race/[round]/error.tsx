"use client";

import Link from "next/link";

export default function RaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Failed to load race data</h2>
        <p className="text-sm text-f1-text-muted mb-6">
          The race results could not be fetched. This may be a temporary issue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-dark transition-colors"
          >
            Try again
          </button>
          <Link
            href="/races"
            className="rounded-lg bg-f1-dark px-4 py-2 text-sm font-medium text-f1-accent hover:bg-f1-border transition-colors"
          >
            Back to races
          </Link>
        </div>
      </div>
    </div>
  );
}
