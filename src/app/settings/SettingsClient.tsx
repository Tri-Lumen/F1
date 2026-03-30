"use client";

import { useState, useEffect } from "react";
import { useTheme, type ColorMode, type AccentTheme } from "@/lib/ThemeContext";
import { useFavorites } from "@/lib/FavoritesContext";
import { CURRENT_TEAMS, RETRO_THEMES } from "@/lib/teamThemes";
import { getTeamColor } from "@/lib/api";
import type { DriverStanding, ConstructorStanding } from "@/lib/types";
import ThemeBuilderSection from "./ThemeBuilderSection";
import TeamColorsSection from "./TeamColorsSection";
import InterfaceSection from "./InterfaceSection";

interface Props {
  availableDrivers: DriverStanding[];
  availableTeams: ConstructorStanding[];
}

const BASE_MODES = [
  {
    id: "dark" as ColorMode,
    label: "Dark",
    description: "True blacks with red accents — the default F1 look",
    swatches: ["#101010", "#1a1a1a", "#242424", "#363636", "#e10600"],
    accent: "#e10600",
    accentSecondary: "#ffffff",
  },
  {
    id: "light" as ColorMode,
    label: "Light",
    description: "White cards on light gray — pairs with any team livery",
    swatches: ["#f4f4f4", "#e8e8e8", "#ffffff", "#d4d4d4", "#e10600"],
    accent: "#e10600",
    accentSecondary: "#151515",
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
  const { mode, accentTheme, setMode, setAccentTheme } = useTheme();
  const { favoriteDriverIds, favoriteTeamIds, toggleDriver, toggleTeam } = useFavorites();

  const [mvHost, setMvHost] = useState("localhost:10101");
  const [mvSaved, setMvSaved] = useState(false);

  // Auto-refresh interval setting
  const [refreshInterval, setRefreshInterval] = useState(60);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyLead, setNotifyLead] = useState(10);
  const [notifyPermission, setNotifyPermission] = useState<string>("default");

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("f1-multiviewer-host");
    if (saved) setMvHost(saved);
    if (typeof Notification !== "undefined") {
      setNotifyPermission(Notification.permission);
    }
    setNotifyEnabled(localStorage.getItem("f1-notify") === "true");
    setNotifyLead(parseInt(localStorage.getItem("f1-notify-lead") ?? "10") || 10);
    setRefreshInterval(parseInt(localStorage.getItem("f1-refresh-interval") ?? "60") || 60);
  }, []);

  function saveRefreshInterval(seconds: number) {
    setRefreshInterval(seconds);
    localStorage.setItem("f1-refresh-interval", String(seconds));
  }

  function resetAllSettings() {
    // Clear all F1 dashboard localStorage keys
    const keysToRemove = [
      "f1-multiviewer-host", "f1-notify", "f1-notify-lead",
      "f1-refresh-interval", "f1-favorites-drivers", "f1-favorites-teams",
      "f1-theme-mode", "f1-theme-accent", "f1-rss-feeds", "f1-rss-drivers",
    ];
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    // Also clear any other keys starting with f1-
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("f1-")) localStorage.removeItem(key);
    }
    setShowResetConfirm(false);
    window.location.reload();
  }

  function exportSettings() {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("f1-")) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "f1-dashboard-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSettings(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith("f1-") && typeof value === "string") {
            localStorage.setItem(key, value);
          }
        }
        window.location.reload();
      } catch {
        alert("Invalid settings file");
      }
    };
    reader.readAsText(file);
  }

  async function toggleNotify() {
    if (!notifyEnabled) {
      if (notifyPermission !== "granted") {
        const result = await Notification.requestPermission();
        setNotifyPermission(result);
        if (result !== "granted") return;
      }
      localStorage.setItem("f1-notify", "true");
      setNotifyEnabled(true);
    } else {
      localStorage.setItem("f1-notify", "false");
      setNotifyEnabled(false);
    }
  }

  function saveNotifyLead(minutes: number) {
    setNotifyLead(minutes);
    localStorage.setItem("f1-notify-lead", String(minutes));
  }

  function saveMvHost() {
    localStorage.setItem("f1-multiviewer-host", mvHost.trim() || "localhost:10101");
    setMvSaved(true);
    setTimeout(() => setMvSaved(false), 2000);
  }

  const isElectron =
    typeof window !== "undefined" &&
    !!(window as unknown as { electronApp?: { isElectron?: boolean } }).electronApp?.isElectron;

  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{
    success: boolean;
    updated: boolean;
    steps: { step: string; output: string }[];
    releaseUrl?: string;
    canDownload?: boolean;
    updateReady?: boolean;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);

  type ElectronAppAPI = {
    checkForUpdates: () => Promise<{ triggered: boolean; error?: string; hasUpdate?: boolean; latestVersion?: string; releaseUrl?: string; canDownload?: boolean; updateReady?: boolean; }>;
    downloadUpdate: () => Promise<{ started: boolean; error?: string }>;
    installUpdate: () => void;
    onUpdateProgress: (cb: (p: { percent: number }) => void) => void;
    onUpdateDownloaded: (cb: (info: { version: string }) => void) => void;
  };
  const getElectronApp = () =>
    (window as unknown as { electronApp: ElectronAppAPI }).electronApp;

  async function handleUpdate() {
    setUpdating(true);
    setUpdateResult(null);
    setDownloadComplete(false);
    setDownloadProgress(null);
    try {
      if (isElectron) {
        const electronApp = getElectronApp();
        const result = await electronApp.checkForUpdates();
        if (!result.triggered) {
          setUpdateResult({
            success: false,
            updated: false,
            steps: [{ step: "error", output: result.error ?? "Auto-update is not available in this build." }],
          });
        } else if (result.updateReady) {
          setDownloadComplete(true);
          setUpdateResult({
            success: true,
            updated: false,
            steps: [{ step: "ready to install", output: `${result.latestVersion ?? "Update"} has been downloaded and is ready to install.` }],
            updateReady: true,
          });
        } else if (result.hasUpdate) {
          setUpdateResult({
            success: true,
            updated: false,
            steps: [{ step: "update available", output: `${result.latestVersion} is available.` }],
            releaseUrl: result.releaseUrl,
            canDownload: result.canDownload,
          });
        } else {
          setUpdateResult({
            success: true,
            updated: false,
            steps: [{ step: "up to date", output: "You are running the latest version." }],
          });
        }
      } else {
        const res = await fetch("/api/update", { method: "POST" });
        const data = await res.json();
        setUpdateResult(data);
        if (data.success && data.updated) {
          setTimeout(() => window.location.reload(), 3000);
        }
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

  async function handleDownload() {
    const electronApp = getElectronApp();
    setDownloading(true);
    setDownloadProgress(0);

    electronApp.onUpdateProgress((p) => setDownloadProgress(p.percent));
    electronApp.onUpdateDownloaded(() => {
      setDownloading(false);
      setDownloadProgress(null);
      setDownloadComplete(true);
      setUpdateResult((prev) => prev
        ? { ...prev, steps: [{ step: "ready to install", output: "Download complete. Restart to apply the update." }], updateReady: true }
        : prev);
    });

    const result = await electronApp.downloadUpdate();
    if (!result.started) {
      setDownloading(false);
      setDownloadProgress(null);
      setUpdateResult((prev) => prev
        ? { ...prev, success: false, steps: [{ step: "error", output: result.error ?? "Failed to start download." }] }
        : prev);
    }
  }

  function handleInstall() {
    getElectronApp().installUpdate();
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
          Choose a brightness mode, then optionally apply a team livery preset below — they work together.
          Build a fully custom theme in the <span className="text-f1-text font-medium">Custom Themes</span> section.
        </p>

        {/* Dark / Light mode selector */}
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          {BASE_MODES.map((t) => {
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
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
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: t.accent }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: t.accentSecondary }}
                  />
                </div>
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
          2026 Team Presets
        </p>
        <p className="text-xs text-f1-text-muted mb-3">
          Click a livery to apply it — click again to remove. Works in both dark and light mode.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {CURRENT_TEAMS.map((t) => {
            const active = accentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAccentTheme(active ? "none" : (t.id as AccentTheme))}
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
          Retro Presets
        </p>
        <p className="text-xs text-f1-text-muted mb-3">
          Iconic historical colour schemes — also toggle-able with the dark/light mode above.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RETRO_THEMES.map((t) => {
            const active = accentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAccentTheme(active ? "none" : (t.id as AccentTheme))}
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

      {/* ── Custom Themes ── */}
      <ThemeBuilderSection />

      {/* ── Team Colors ── */}
      <TeamColorsSection />

      {/* ── Interface Controls ── */}
      <InterfaceSection />

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

      {/* ── Session Notifications ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1">Session Notifications</h2>
        <p className="text-sm text-f1-text-muted mb-4">
          Get a browser notification before upcoming sessions start. The{" "}
          <span className="text-f1-text font-medium">Notify me</span> button on
          the home page countdown card enables per-session alerts.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={toggleNotify}
            disabled={notifyPermission === "denied"}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              notifyEnabled
                ? "border-f1-accent/40 bg-f1-accent/10 text-f1-accent"
                : "border-f1-border bg-f1-dark text-f1-text-muted hover:border-f1-text-muted hover:text-f1-text"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifyPermission === "denied"
              ? "Blocked by browser"
              : notifyEnabled
              ? "Notifications on"
              : "Enable notifications"}
          </button>

          {notifyEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-f1-text-muted">Alert</span>
              <select
                value={notifyLead}
                onChange={(e) => saveNotifyLead(parseInt(e.target.value))}
                className="rounded-lg border border-f1-border bg-f1-dark px-2 py-2 text-sm text-f1-text focus:border-f1-accent focus:outline-none"
              >
                {[5, 10, 15, 30].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
              <span className="text-sm text-f1-text-muted">before session</span>
            </div>
          )}
        </div>
        {notifyPermission === "denied" && (
          <p className="mt-2 text-xs text-f1-text-muted/60">
            Notifications are blocked. Enable them in your browser&apos;s site settings for this page.
          </p>
        )}
      </section>

      {/* ── MultiViewer Configuration ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1">MultiViewer</h2>
        <p className="text-sm text-f1-text-muted mb-4">
          Configure the host and port of your{" "}
          <a
            href="https://multiviewer.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-f1-accent hover:underline"
          >
            MultiViewer
          </a>{" "}
          instance to enable live onboard camera buttons. Default is{" "}
          <code className="rounded bg-f1-dark px-1 py-0.5 text-xs">localhost:10101</code>.
          If your app runs in Docker and MultiViewer is on the host machine, use{" "}
          <code className="rounded bg-f1-dark px-1 py-0.5 text-xs">host.docker.internal:10101</code>.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={mvHost}
            onChange={(e) => setMvHost(e.target.value)}
            placeholder="localhost:10101"
            className="rounded-lg border border-f1-border bg-f1-dark px-4 py-2 text-sm text-f1-text placeholder:text-f1-text-muted focus:border-f1-accent focus:outline-none w-64"
          />
          <button
            onClick={saveMvHost}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors ${
              mvSaved ? "bg-green-600" : "bg-f1-red hover:bg-f1-red-dark"
            }`}
          >
            {mvSaved ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </section>

      {/* ── Dashboard Refresh Rate ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1">Dashboard Refresh Rate</h2>
        <p className="text-sm text-f1-text-muted mb-4">
          Control how often dashboard pages auto-refresh. Lower intervals mean fresher data but more network usage.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "15s", value: 15, desc: "Live sessions" },
            { label: "30s", value: 30, desc: "Active weekend" },
            { label: "60s", value: 60, desc: "Default" },
            { label: "2m", value: 120, desc: "Low bandwidth" },
            { label: "5m", value: 300, desc: "Background" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => saveRefreshInterval(opt.value)}
              className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                refreshInterval === opt.value
                  ? "border-f1-accent bg-f1-accent/10 text-f1-accent font-bold"
                  : "border-f1-border bg-f1-dark text-f1-text-muted hover:border-f1-text-muted hover:text-f1-text"
              }`}
            >
              <span className="block font-bold">{opt.label}</span>
              <span className="text-xs opacity-60">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Data Management ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1">Data Management</h2>
        <p className="text-sm text-f1-text-muted mb-4">
          Export your settings and favourites to a file, or import from a backup.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-f1-border bg-f1-dark px-4 py-2 text-sm font-medium text-f1-text hover:bg-f1-card transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Settings
          </button>
          <label className="inline-flex items-center gap-2 rounded-lg border border-f1-border bg-f1-dark px-4 py-2 text-sm font-medium text-f1-text hover:bg-f1-card transition-colors cursor-pointer">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Settings
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importSettings(file);
              }}
            />
          </label>
        </div>

        {/* Reset All */}
        <div className="mt-6 pt-4 border-t border-f1-border/30">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Reset all settings to defaults
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-400">This will clear all preferences, favourites, and theme settings.</p>
              <button
                onClick={resetAllSettings}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-sm text-f1-text-muted hover:text-f1-text transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Application Update ── */}
      <section>
        <h2 className="text-lg font-bold mb-2">Application Update</h2>
        <p className="text-sm text-f1-text-muted mb-4">
          {isElectron
            ? "Check for a new release of the desktop app. You will receive an OS notification if an update is available."
            : "Pull the latest changes from GitHub and rebuild. Only works when running inside the Docker container with git available."}
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

        {/* Download progress bar */}
        {downloading && downloadProgress !== null && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-f1-text-muted">
              <span>Downloading update…</span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-f1-red transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons shown after check result */}
        {updateResult?.canDownload && !downloadComplete && !downloading && (
          <button
            onClick={handleDownload}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download &amp; Install
          </button>
        )}

        {(downloadComplete || updateResult?.updateReady) && (
          <button
            onClick={handleInstall}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restart &amp; Install
          </button>
        )}

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
                ? isElectron
                  ? updateResult.updateReady
                    ? "Ready to install"
                    : updateResult.canDownload || updateResult.releaseUrl
                    ? "Update available"
                    : "Already up to date"
                  : updateResult.updated
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
            {/* Fallback link when auto-updater isn't available for this release */}
            {updateResult.releaseUrl && !updateResult.canDownload && (
              <a
                href={updateResult.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-f1-red hover:underline"
              >
                Download from GitHub Releases →
              </a>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
