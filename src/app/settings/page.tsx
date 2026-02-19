"use client";

import { useState } from "react";
import { useTheme, type Theme } from "@/lib/ThemeContext";

const themes: { id: Theme; label: string; description: string }[] = [
  {
    id: "dark",
    label: "Dark",
    description: "Official F1 dark theme — true blacks with red accents",
  },
  {
    id: "light",
    label: "Light",
    description: "Light theme — white cards on light gray background",
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{
    success: boolean;
    updated: boolean;
    steps: { step: string; output: string }[];
  } | null>(null);

  async function handleUpdate() {
    setUpdating(true);
    setUpdateResult(null);
    try {
      const res = await fetch("/api/update", { method: "POST" });
      const data = await res.json();
      setUpdateResult(data);
      if (data.success && data.updated) {
        // Reload after a short delay so the user can read the result
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch {
      setUpdateResult({
        success: false,
        updated: false,
        steps: [{ step: "error", output: "Network error — could not reach the server." }],
      });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-1">
        <span className="text-f1-red">Settings</span>
      </h1>
      <p className="text-sm text-f1-text-muted mb-8">
        Customize appearance and manage updates
      </p>

      {/* ── Theme Selection ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">Appearance</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {themes.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`group relative rounded-xl border-2 p-5 text-left transition-all ${
                  active
                    ? "border-f1-red bg-f1-card"
                    : "border-f1-border bg-f1-card hover:border-f1-text-muted"
                }`}
              >
                {/* Preview strip */}
                <div className="mb-4 flex gap-2">
                  {t.id === "dark" ? (
                    <>
                      <span className="h-8 w-8 rounded-md bg-[#101010] border border-[#363636]" />
                      <span className="h-8 w-8 rounded-md bg-[#242424] border border-[#363636]" />
                      <span className="h-8 w-8 rounded-md bg-[#e10600]" />
                    </>
                  ) : (
                    <>
                      <span className="h-8 w-8 rounded-md bg-[#f4f4f4] border border-[#d4d4d4]" />
                      <span className="h-8 w-8 rounded-md bg-[#ffffff] border border-[#d4d4d4]" />
                      <span className="h-8 w-8 rounded-md bg-[#e10600]" />
                    </>
                  )}
                </div>

                <p className="font-bold text-lg">{t.label}</p>
                <p className="text-sm text-f1-text-muted mt-1">
                  {t.description}
                </p>

                {active && (
                  <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-f1-red text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Docker Update ── */}
      <section>
        <h2 className="text-lg font-bold mb-2">Application Update</h2>
        <p className="text-sm text-f1-text-muted mb-4">
          Pull the latest changes from GitHub and rebuild. Only works when
          running inside the Docker container with git available.
        </p>

        <button
          onClick={handleUpdate}
          disabled={updating}
          className="inline-flex items-center gap-2 rounded-lg bg-f1-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-f1-red-dark disabled:opacity-50"
        >
          {updating ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Updating…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check for Updates
            </>
          )}
        </button>

        {updateResult && (
          <div
            className={`mt-4 rounded-xl border p-4 ${
              updateResult.success
                ? "border-green-500/30 bg-green-500/10"
                : "border-f1-red/30 bg-f1-red/10"
            }`}
          >
            <p className="font-bold mb-2">
              {updateResult.success
                ? updateResult.updated
                  ? "Update applied — reloading…"
                  : "Already up to date"
                : "Update failed"}
            </p>
            <div className="space-y-2 text-xs font-mono text-f1-text-muted">
              {updateResult.steps.map((s, i) => (
                <div key={i}>
                  <span className="text-f1-text font-bold">{s.step}:</span>{" "}
                  <span className="whitespace-pre-wrap">{s.output}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
