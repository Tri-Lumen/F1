"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { TEAM_THEMES } from "./teamThemes";

/** Base dark / light mode — independent of team accent */
export type ColorMode = "dark" | "light";

/** Team or retro livery accent — "none" means no accent applied */
export type AccentTheme = "none" | `team-${string}` | `retro-${string}`;

interface ThemeContextValue {
  mode: ColorMode;
  accentTheme: AccentTheme;
  setMode: (mode: ColorMode) => void;
  setAccentTheme: (theme: AccentTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  accentTheme: "none",
  setMode: () => {},
  setAccentTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function isValidMode(m: string): m is ColorMode {
  return m === "dark" || m === "light";
}

function isValidAccent(a: string): a is AccentTheme {
  return a === "none" || TEAM_THEMES.some((t) => t.id === a);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>("dark");
  const [accentTheme, setAccentState] = useState<AccentTheme>("none");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem("f1-mode");
      const storedAccent = localStorage.getItem("f1-accent");
      if (storedMode && isValidMode(storedMode)) setModeState(storedMode);
      if (storedAccent && isValidAccent(storedAccent)) setAccentState(storedAccent);
    } catch {
      // localStorage unavailable (e.g. Safari private browsing)
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-mode", mode);
    try { localStorage.setItem("f1-mode", mode); } catch {}
  }, [mode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (accentTheme === "none") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", accentTheme);
    }
    try { localStorage.setItem("f1-accent", accentTheme); } catch {}
  }, [accentTheme, mounted]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accentTheme,
        setMode: setModeState,
        setAccentTheme: setAccentState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
