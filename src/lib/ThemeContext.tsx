"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { TEAM_THEMES, type TeamThemeColors } from "./teamThemes";
import { getTeamColor as getDefaultTeamColor } from "./api";

/** Base dark / light mode — independent of team accent */
export type ColorMode = "dark" | "light";

/** Team, retro, or custom livery accent */
export type AccentTheme = "none" | `team-${string}` | `retro-${string}` | `custom-${string}`;

/** Card corner style */
export type BorderRadius = "sharp" | "default" | "rounded";

/** A fully user-defined theme preset */
export interface CustomTheme {
  id: string;       // "custom-{timestamp}"
  name: string;
  colors: TeamThemeColors;
}

/** Maps TeamThemeColors keys → CSS custom property names */
const CSS_VARS: Record<keyof TeamThemeColors, string> = {
  bg:               "--color-f1-black",
  dark:             "--color-f1-dark",
  card:             "--color-f1-card",
  cardHover:        "--color-f1-card-hover",
  border:           "--color-f1-border",
  text:             "--color-f1-text",
  textMuted:        "--color-f1-text-muted",
  accent:           "--color-f1-accent",
  accentDark:       "--color-f1-red-dark",
  accentSecondary:  "--color-f1-accent-secondary",
};
const CUSTOM_CSS_VARS = [...Object.values(CSS_VARS), "--color-f1-red"];

/** Maps constructorId → CSS variable for team badge colors */
export const TEAM_CSS_VAR_MAP: Record<string, string> = {
  red_bull:     "--color-team-red-bull",
  ferrari:      "--color-team-ferrari",
  mclaren:      "--color-team-mclaren",
  mercedes:     "--color-team-mercedes",
  aston_martin: "--color-team-aston-martin",
  alpine:       "--color-team-alpine",
  williams:     "--color-team-williams",
  haas:         "--color-team-haas",
  rb:           "--color-team-rb",
  audi:         "--color-team-audi",
  cadillac:     "--color-team-cadillac",
};

interface ThemeContextValue {
  mode: ColorMode;
  accentTheme: AccentTheme;
  customThemes: CustomTheme[];
  teamColorOverrides: Record<string, string>;
  borderRadius: BorderRadius;
  glowIntensity: number;       // 0–100
  reduceMotion: boolean;

  setMode: (m: ColorMode) => void;
  setAccentTheme: (t: AccentTheme) => void;
  setBorderRadius: (r: BorderRadius) => void;
  setGlowIntensity: (v: number) => void;
  setReduceMotion: (v: boolean) => void;

  saveCustomTheme: (name: string, colors: TeamThemeColors) => CustomTheme;
  updateCustomTheme: (id: string, name: string, colors: TeamThemeColors) => void;
  deleteCustomTheme: (id: string) => void;

  setTeamColorOverride: (constructorId: string, color: string | null) => void;
  /** Returns overridden color if set, otherwise the official default */
  getTeamColor: (constructorId: string) => string;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  accentTheme: "none",
  customThemes: [],
  teamColorOverrides: {},
  borderRadius: "default",
  glowIntensity: 50,
  reduceMotion: false,
  setMode: () => {},
  setAccentTheme: () => {},
  setBorderRadius: () => {},
  setGlowIntensity: () => {},
  setReduceMotion: () => {},
  saveCustomTheme: () => ({ id: "", name: "", colors: {} as TeamThemeColors }),
  updateCustomTheme: () => {},
  deleteCustomTheme: () => {},
  setTeamColorOverride: () => {},
  getTeamColor: getDefaultTeamColor,
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Hook that returns a team's display color, respecting user overrides */
export function useTeamColor(constructorId: string): string {
  const { getTeamColor } = useTheme();
  return getTeamColor(constructorId);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isValidMode(m: string): m is ColorMode {
  return m === "dark" || m === "light";
}
function isValidRadius(r: string): r is BorderRadius {
  return r === "sharp" || r === "default" || r === "rounded";
}
function isValidAccent(a: string, customs: CustomTheme[]): a is AccentTheme {
  if (a === "none") return true;
  if (TEAM_THEMES.some((t) => t.id === a)) return true;
  if (customs.some((t) => t.id === a)) return true;
  return false;
}
function ls(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>("dark");
  const [accentTheme, setAccentState] = useState<AccentTheme>("none");
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [teamColorOverrides, setTeamColorOverrides] = useState<Record<string, string>>({});
  const [borderRadius, setBorderRadiusState] = useState<BorderRadius>("default");
  const [glowIntensity, setGlowIntensityState] = useState(50);
  const [reduceMotion, setReduceMotionState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load all prefs on first render
  useEffect(() => {
    let parsedCustom: CustomTheme[] = [];
    let parsedOverrides: Record<string, string> = {};

    try {
      const raw = ls("f1-custom-themes");
      if (raw) parsedCustom = JSON.parse(raw);
    } catch {}
    try {
      const raw = ls("f1-team-colors");
      if (raw) parsedOverrides = JSON.parse(raw);
    } catch {}

    const storedMode    = ls("f1-mode");
    const storedAccent  = ls("f1-accent");
    const storedRadius  = ls("f1-border-radius");
    const storedGlow    = ls("f1-glow-intensity");
    const storedMotion  = ls("f1-reduce-motion");

    if (storedMode && isValidMode(storedMode)) setModeState(storedMode);
    if (storedAccent && isValidAccent(storedAccent, parsedCustom)) setAccentState(storedAccent as AccentTheme);
    if (storedRadius && isValidRadius(storedRadius)) setBorderRadiusState(storedRadius);
    if (storedGlow) setGlowIntensityState(Math.min(100, Math.max(0, parseInt(storedGlow, 10) || 50)));
    if (storedMotion) setReduceMotionState(storedMotion === "true");

    setCustomThemes(parsedCustom);
    setTeamColorOverrides(parsedOverrides);
    setMounted(true);
  }, []);

  // Apply mode
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-mode", mode);
    lsSet("f1-mode", mode);
  }, [mode, mounted]);

  // Apply accent (preset via data-theme, custom via inline CSS vars)
  useEffect(() => {
    if (!mounted) return;
    const el = document.documentElement;

    if (accentTheme.startsWith("custom-")) {
      const custom = customThemes.find((t) => t.id === accentTheme);
      if (custom) {
        el.removeAttribute("data-theme");
        for (const [key, cssVar] of Object.entries(CSS_VARS) as [keyof TeamThemeColors, string][]) {
          el.style.setProperty(cssVar, custom.colors[key]);
        }
        // f1-red mirrors accent so that bg-f1-red buttons also shift
        el.style.setProperty("--color-f1-red", custom.colors.accent);
      }
    } else {
      // Clear inline vars set by a previous custom theme
      for (const cssVar of CUSTOM_CSS_VARS) el.style.removeProperty(cssVar);
      if (accentTheme === "none") {
        el.removeAttribute("data-theme");
      } else {
        el.setAttribute("data-theme", accentTheme);
      }
    }
    lsSet("f1-accent", accentTheme);
  }, [accentTheme, customThemes, mounted]);

  // Apply team color overrides as CSS custom properties
  useEffect(() => {
    if (!mounted) return;
    const el = document.documentElement;
    for (const [id, cssVar] of Object.entries(TEAM_CSS_VAR_MAP)) {
      const override = teamColorOverrides[id];
      if (override) el.style.setProperty(cssVar, override);
      else el.style.removeProperty(cssVar);
    }
  }, [teamColorOverrides, mounted]);

  // Apply border radius
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-radius", borderRadius);
    lsSet("f1-border-radius", borderRadius);
  }, [borderRadius, mounted]);

  // Apply glow intensity → CSS vars read by globals.css body::before/after
  useEffect(() => {
    if (!mounted) return;
    const el = document.documentElement;
    el.style.setProperty("--glow-primary-opacity",   `${Math.round(glowIntensity * 0.28)}%`);
    el.style.setProperty("--glow-secondary-opacity", `${Math.round(glowIntensity * 0.14)}%`);
    lsSet("f1-glow-intensity", String(glowIntensity));
  }, [glowIntensity, mounted]);

  // Apply reduce motion
  useEffect(() => {
    if (!mounted) return;
    if (reduceMotion) document.documentElement.setAttribute("data-reduce-motion", "true");
    else document.documentElement.removeAttribute("data-reduce-motion");
    lsSet("f1-reduce-motion", String(reduceMotion));
  }, [reduceMotion, mounted]);

  // ── CRUD for custom themes ──────────────────────────────────────────────

  const saveCustomTheme = useCallback((name: string, colors: TeamThemeColors): CustomTheme => {
    const theme: CustomTheme = { id: `custom-${Date.now()}`, name, colors };
    setCustomThemes((prev) => {
      const next = [...prev, theme];
      lsSet("f1-custom-themes", JSON.stringify(next));
      return next;
    });
    return theme;
  }, []);

  const updateCustomTheme = useCallback((id: string, name: string, colors: TeamThemeColors) => {
    setCustomThemes((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, name, colors } : t));
      lsSet("f1-custom-themes", JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteCustomTheme = useCallback((id: string) => {
    setCustomThemes((prev) => {
      const next = prev.filter((t) => t.id !== id);
      lsSet("f1-custom-themes", JSON.stringify(next));
      return next;
    });
    // If the deleted theme was active, fall back to none
    setAccentState((prev) => (prev === id ? "none" : prev));
  }, []);

  // ── Team color overrides ────────────────────────────────────────────────

  const setTeamColorOverride = useCallback((constructorId: string, color: string | null) => {
    setTeamColorOverrides((prev) => {
      const next = { ...prev };
      if (color === null) delete next[constructorId];
      else next[constructorId] = color;
      lsSet("f1-team-colors", JSON.stringify(next));
      return next;
    });
  }, []);

  const getTeamColor = useCallback(
    (constructorId: string) => teamColorOverrides[constructorId] ?? getDefaultTeamColor(constructorId),
    [teamColorOverrides]
  );

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accentTheme,
        customThemes,
        teamColorOverrides,
        borderRadius,
        glowIntensity,
        reduceMotion,
        setMode: setModeState,
        setAccentTheme: setAccentState,
        setBorderRadius: setBorderRadiusState,
        setGlowIntensity: setGlowIntensityState,
        setReduceMotion: setReduceMotionState,
        saveCustomTheme,
        updateCustomTheme,
        deleteCustomTheme,
        setTeamColorOverride,
        getTeamColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
