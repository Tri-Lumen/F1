export interface TeamThemeColors {
  bg: string;
  dark: string;
  card: string;
  cardHover: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDark: string;
}

export interface TeamTheme {
  /** CSS data-theme attribute value, e.g. "team-red_bull" */
  id: string;
  /** Matches constructorId from the Ergast/Jolpica API */
  constructorId: string;
  name: string;
  /** Three hex colors shown as preview swatches [bg, card, accent] */
  previewColors: [string, string, string];
  colors: TeamThemeColors;
}

/**
 * Official-style color palettes for every 2025 F1 constructor.
 * Backgrounds are derived from each team's primary livery color darkened
 * to a deep, readable shade; accent replaces the default F1 red throughout
 * the app (buttons, active nav indicator, links, etc.).
 */
export const TEAM_THEMES: TeamTheme[] = [
  {
    id: "team-red_bull",
    constructorId: "red_bull",
    name: "Red Bull Racing",
    previewColors: ["#0B0D1E", "#181B36", "#3671C6"],
    colors: {
      bg: "#0B0D1E",
      dark: "#11132A",
      card: "#181B36",
      cardHover: "#1E2244",
      border: "#252A52",
      text: "#E8EAF6",
      textMuted: "#7B82B4",
      accent: "#3671C6",
      accentDark: "#2A5CAF",
    },
  },
  {
    id: "team-ferrari",
    constructorId: "ferrari",
    name: "Scuderia Ferrari",
    previewColors: ["#120808", "#221212", "#E8002D"],
    colors: {
      bg: "#120808",
      dark: "#1A0C0C",
      card: "#221212",
      cardHover: "#2C1616",
      border: "#3D1A1A",
      text: "#F5F5F5",
      textMuted: "#A0856E",
      accent: "#E8002D",
      accentDark: "#B8001E",
    },
  },
  {
    id: "team-mclaren",
    constructorId: "mclaren",
    name: "McLaren",
    previewColors: ["#141008", "#261C0E", "#FF8000"],
    colors: {
      bg: "#141008",
      dark: "#1C150A",
      card: "#261C0E",
      cardHover: "#302212",
      border: "#4A3420",
      text: "#F5F5F5",
      textMuted: "#B89060",
      accent: "#FF8000",
      accentDark: "#CC6600",
    },
  },
  {
    id: "team-mercedes",
    constructorId: "mercedes",
    name: "Mercedes-AMG Petronas",
    previewColors: ["#081210", "#112018", "#27F4D2"],
    colors: {
      bg: "#081210",
      dark: "#0C1814",
      card: "#112018",
      cardHover: "#162A20",
      border: "#1E3A2E",
      text: "#F0FFFC",
      textMuted: "#6AA090",
      accent: "#27F4D2",
      accentDark: "#1EC4A8",
    },
  },
  {
    id: "team-aston_martin",
    constructorId: "aston_martin",
    name: "Aston Martin Aramco",
    previewColors: ["#081210", "#122218", "#229971"],
    colors: {
      bg: "#081210",
      dark: "#0C1A12",
      card: "#122218",
      cardHover: "#162C1E",
      border: "#1C3A26",
      text: "#F5FFF5",
      textMuted: "#70A080",
      accent: "#229971",
      accentDark: "#1A7A5A",
    },
  },
  {
    id: "team-alpine",
    constructorId: "alpine",
    name: "BWT Alpine",
    previewColors: ["#0A0E1C", "#141C34", "#FF87BC"],
    colors: {
      bg: "#0A0E1C",
      dark: "#0E1426",
      card: "#141C34",
      cardHover: "#1A2440",
      border: "#202E50",
      text: "#F0F4FF",
      textMuted: "#7080B0",
      accent: "#FF87BC",
      accentDark: "#E0609A",
    },
  },
  {
    id: "team-williams",
    constructorId: "williams",
    name: "Williams Racing",
    previewColors: ["#080C12", "#121A24", "#64C4FF"],
    colors: {
      bg: "#080C12",
      dark: "#0C1218",
      card: "#121A24",
      cardHover: "#18222E",
      border: "#1E2E40",
      text: "#EDF4FF",
      textMuted: "#6A8CAA",
      accent: "#64C4FF",
      accentDark: "#4EB0F0",
    },
  },
  {
    id: "team-haas",
    constructorId: "haas",
    name: "MoneyGram Haas F1",
    previewColors: ["#0E0E0E", "#1C1C1C", "#E80020"],
    colors: {
      bg: "#0E0E0E",
      dark: "#141414",
      card: "#1C1C1C",
      cardHover: "#242424",
      border: "#303030",
      text: "#F5F5F5",
      textMuted: "#909090",
      accent: "#E80020",
      accentDark: "#B80018",
    },
  },
  {
    id: "team-rb",
    constructorId: "rb",
    name: "Visa Cash App RB",
    previewColors: ["#080C1A", "#121A30", "#6692FF"],
    colors: {
      bg: "#080C1A",
      dark: "#0C1222",
      card: "#121A30",
      cardHover: "#18223C",
      border: "#1E2E50",
      text: "#E8EEFF",
      textMuted: "#6878AA",
      accent: "#6692FF",
      accentDark: "#5080EE",
    },
  },
  {
    id: "team-kick_sauber",
    constructorId: "kick_sauber",
    name: "Kick Sauber",
    previewColors: ["#080E08", "#121C12", "#52E252"],
    colors: {
      bg: "#080E08",
      dark: "#0C140C",
      card: "#121C12",
      cardHover: "#182418",
      border: "#1E2E1E",
      text: "#F0FFF0",
      textMuted: "#70A070",
      accent: "#52E252",
      accentDark: "#3EC23E",
    },
  },
];

export function getTeamThemeByConstructorId(constructorId: string): TeamTheme | undefined {
  return TEAM_THEMES.find((t) => t.constructorId === constructorId);
}
