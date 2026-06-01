"use client";

import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function ArchiveError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <EmptyState
        variant="error"
        title="Failed to load season data"
        hint="The historical data could not be fetched. This may be a temporary issue."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => reset()}
              className="rounded-lg bg-f1-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-f1-red-dark"
            >
              Try again
            </button>
            <Link
              href="/archive"
              className="rounded-lg bg-f1-dark px-4 py-2 text-sm font-medium text-f1-accent transition-colors hover:bg-f1-border"
            >
              Back to archive
            </Link>
          </div>
        }
      />
    </div>
  );
}
