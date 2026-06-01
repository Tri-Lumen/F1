"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-mode="dark">
      <body className="flex min-h-screen items-center justify-center bg-f1-black p-6 text-f1-text">
        <div className="w-full max-w-md rounded-xl border border-f1-red/30 bg-f1-red/10 p-10 text-center">
          <h2 className="text-xl font-bold text-f1-red">Something went wrong</h2>
          <p className="mt-1 mb-6 text-sm text-f1-text-muted">
            An unexpected error occurred. Try again, or reload the dashboard.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="rounded-lg bg-f1-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-f1-red-dark"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-lg bg-f1-dark px-4 py-2 text-sm font-medium text-f1-accent transition-colors hover:bg-f1-border"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
