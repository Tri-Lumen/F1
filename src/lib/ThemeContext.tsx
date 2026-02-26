"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { TEAM_THEMES } from "./teamThemes";

/** All valid theme identifiers: base modes + team liveries + retro liveries */
export type Theme = "dark" | "light" | `team-${string}` | `retro-${string}`;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function isValidTheme(t: string): t is Theme {
  if (t === "dark" || t === "light") return true;
  return TEAM_THEMES.some((theme) => theme.id === t);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("f1-theme");
    if (stored && isValidTheme(stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("f1-theme", theme);
  }, [theme, mounted]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
