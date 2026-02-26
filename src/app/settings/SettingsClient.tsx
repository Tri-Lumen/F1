"use client";

import { useState } from "react";
import { useTheme, type Theme } from "@/lib/ThemeContext";
import { useFavorites } from "@/lib/FavoritesContext";
import { CURRENT_TEAMS, RETRO_THEMES } from "@/lib/teamThemes";
import { getTeamColor } from "@/lib/api";
import type { DriverStanding, ConstructorStanding } from "@/lib/types";

interface Props {
  availableDrivers: DriverStanding[];
  availableTeams: ConstructorStanding[];
}

const BASE_THEMES = [
  {
    id: "dark" as Theme,
    label: "Dark",
    description: "Official F1 dark theme — true blacks with red accents",
    swatches: ["#101010", "#1a1a1a", "#242424", "#363636", "#e10600"],
  },
  {
    id: "light" as Theme,
    label: "Light",
    description: "Light theme — white cards on light gray background",
    swatches: ["#f4f4f4", "#e8e8e8", "#ffffff", "#d4d4d4", "#e10600"],
  },
];

function CheckIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function SettingsClient({ availableDrivers, availableTeams }: Props) {
  const { theme, setTheme } = useTheme();
  const { favoriteDriverIds, favoriteTeamIds, toggleDriver, toggleTeam } = useFavorites();

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
        Customize your theme, pick favourites, and manage updates
      </p>

      {/* ── Appearance ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1">Appearance</h2>
        <p className="text-sm text-f1-text-muted mb-4">
          Choose a base theme or apply an official F1 team livery
        </p>

        {/* Base dark / light */}
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          {BASE_THEMES.map((t) => {
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
                <div className="mb-4 flex gap-1.5">
                  {t.swatches.map((c, i) => (
                    <span
                      key={i}
                      className="h-8 w-8 rounded-md border border-white/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <p className="font-bold text-lg">{t.label}</p>
                <p className="text-sm text-f1-text-muted mt-1">{t.description}</p>
                {active && (
                  <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-f1-red text-white">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Team liveries */}
        <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-3 font-semibold">
          2026 Team Liveries
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {CURRENT_TEAMS.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as Theme)}
                className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${
                  active ? "" : "border-f1-border bg-f1-card hover:border-f1-text-muted"
                }`}
                style={
                  active
                    ? { borderColor: t.colors.accent, backgroundColor: t.colors.card }
                    : {}
                }
              >
                {/* 5-segment livery colour bar */}
                <div className="flex h-10 w-full">
                  {t.previewColors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm leading-tight">{t.name}</p>
                  {/* accent dots */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10"
                      style={{ backgroundColor: t.colors.accent }}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10"
                      style={{ backgroundColor: t.colors.accentSecondary }}
                    />
                  </div>
                </div>
                {active && (
                  <span
                    className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow"
                    style={{ backgroundColor: t.colors.accent }}
                  >
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Retro liveries */}
        <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-3 font-semibold">
          Retro Liveries
        </p>
        <p className="text-xs text-f1-text-muted mb-3">
          Iconic historical colour schemes from legendary F1 teams
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RETRO_THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as Theme)}
                className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${
                  active ? "" : "border-f1-border bg-f1-card hover:border-f1-text-muted"
                }`}
                style={
                  active
                    ? { borderColor: t.colors.accent, backgroundColor: t.colors.card }
                    : {}
                }
              >
                {/* 5-segment livery colour bar */}
                <div className="flex h-10 w-full">
                  {t.previewColors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm leading-tight">{t.name}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10"
                      style={{ backgroundColor: t.colors.accent }}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10"
                      style={{ backgroundColor: t.colors.accentSecondary }}
                    />
                  </div>
                </div>
                {active && (
                  <span
                    className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow"
                    style={{ backgroundColor: t.colors.accent }}
                  >
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Favourite Drivers ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1">Favourite Drivers</h2>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-f1-text-muted">
            Track up to 3 drivers on your Favourites dashboard
          </p>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              favoriteDriverIds.length === 3
                ? "bg-f1-red/20 text-f1-red"
                : "bg-f1-card text-f1-text-muted"
            }`}
          >
            {favoriteDriverIds.length}/3
          </span>
        </div>

        {availableDrivers.length === 0 ? (
          <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center text-f1-text-muted text-sm">
            Loading drivers…
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availableDrivers.map((standing) => {
              const { Driver, Constructors } = standing;
              const constructorId = Constructors[0]?.constructorId ?? "";
              const teamColor = getTeamColor(constructorId);
              const isSelected = favoriteDriverIds.includes(Driver.driverId);
              const atMax = !isSelected && favoriteDriverIds.length >= 3;

              return (
                <button
                  key={Driver.driverId}
                  onClick={() => toggleDriver(Driver.driverId)}
                  disabled={atMax}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                    isSelected
                      ? "bg-f1-card"
                      : atMax
                      ? "border-f1-border/50 bg-f1-card/50 opacity-40 cursor-not-allowed"
                      : "border-f1-border bg-f1-card hover:border-f1-text-muted"
                  }`}
                  style={isSelected ? { borderColor: teamColor } : {}}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black text-white"
                      style={{ backgroundColor: teamColor }}
                    >
                      {Driver.permanentNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm leading-tight">
                        {Driver.givenName} {Driver.familyName}
                      </p>
                      <p className="text-xs text-f1-text-muted truncate">
                        {Constructors[0]?.name ?? "—"} · P{standing.position}
                      </p>
                    </div>
                    {isSelected && (
                      <span
                        className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        <CheckIcon />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Favourite Teams ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1">Favourite Teams</h2>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-f1-text-muted">
            Track up to 2 constructors on your Favourites dashboard
          </p>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              favoriteTeamIds.length === 2
                ? "bg-f1-red/20 text-f1-red"
                : "bg-f1-card text-f1-text-muted"
            }`}
          >
            {favoriteTeamIds.length}/2
          </span>
        </div>

        {availableTeams.length === 0 ? (
          <div className="rounded-xl border border-f1-border bg-f1-card p-8 text-center text-f1-text-muted text-sm">
            Loading teams…
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableTeams.map((standing) => {
              const { Constructor } = standing;
              const teamColor = getTeamColor(Constructor.constructorId);
              const isSelected = favoriteTeamIds.includes(Constructor.constructorId);
              const atMax = !isSelected && favoriteTeamIds.length >= 2;

              return (
                <button
                  key={Constructor.constructorId}
                  onClick={() => toggleTeam(Constructor.constructorId)}
                  disabled={atMax}
                  className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${
                    isSelected
                      ? "bg-f1-card"
                      : atMax
                      ? "border-f1-border/50 bg-f1-card/50 opacity-40 cursor-not-allowed"
                      : "border-f1-border bg-f1-card hover:border-f1-text-muted"
                  }`}
                  style={isSelected ? { borderColor: teamColor } : {}}
                >
                  {/* Team colour accent strip */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: teamColor }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{Constructor.name}</p>
                        <p className="text-sm text-f1-text-muted">
                          P{standing.position} · {standing.points} pts · {standing.wins}W
                        </p>
                      </div>
                      {isSelected && (
                        <span
                          className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: teamColor }}
                        >
                          <CheckIcon />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Application Update ── */}
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
