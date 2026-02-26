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
  accentSecondary: string;
}

export interface TeamTheme {
  /** CSS data-theme attribute value, e.g. "team-red_bull" */
  id: string;
  /** Matches constructorId from the Ergast/Jolpica API */
  constructorId: string;
  name: string;
  /** Five hex colors shown as preview swatches [bg, card, border, accent, accentSecondary] */
  previewColors: [string, string, string, string, string];
  colors: TeamThemeColors;
}

/**
 * Official-style color palettes for every 2026 F1 constructor.
 * Backgrounds are derived from each team's primary livery color darkened
 * to a deep, readable shade; accent replaces the default F1 red throughout
 * the app (buttons, active nav indicator, links, etc.).
 * accentSecondary is drawn from the team's secondary livery colour.
 */
export const TEAM_THEMES: TeamTheme[] = [
  {
    id: "team-red_bull",
    constructorId: "red_bull",
    name: "Red Bull Racing",
    // bg, card, border, accent (blue), accentSecondary (gold)
    previewColors: ["#0B0D1E", "#181B36", "#252A52", "#3671C6", "#FFD700"],
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
      accentSecondary: "#FFD700",
    },
  },
  {
    id: "team-ferrari",
    constructorId: "ferrari",
    name: "Scuderia Ferrari",
    // bg, card, border, accent (red), accentSecondary (Ferrari yellow)
    previewColors: ["#120808", "#221212", "#3D1A1A", "#E8002D", "#F8C300"],
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
      accentSecondary: "#F8C300",
    },
  },
  {
    id: "team-mclaren",
    constructorId: "mclaren",
    name: "McLaren",
    // bg, card, border, accent (papaya), accentSecondary (sky blue)
    previewColors: ["#141008", "#261C0E", "#4A3420", "#FF8000", "#00BCF2"],
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
      accentSecondary: "#00BCF2",
    },
  },
  {
    id: "team-mercedes",
    constructorId: "mercedes",
    name: "Mercedes-AMG Petronas",
    // bg, card, border, accent (teal), accentSecondary (silver)
    previewColors: ["#081210", "#112018", "#1E3A2E", "#27F4D2", "#A8A9AD"],
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
      accentSecondary: "#A8A9AD",
    },
  },
  {
    id: "team-aston_martin",
    constructorId: "aston_martin",
    name: "Aston Martin Aramco",
    // bg, card, border, accent (BRG green), accentSecondary (gold)
    previewColors: ["#071210", "#112218", "#1C3A26", "#229971", "#CEAC54"],
    colors: {
      bg: "#071210",
      dark: "#0C1A12",
      card: "#112218",
      cardHover: "#162C1E",
      border: "#1C3A26",
      text: "#F5FFF5",
      textMuted: "#70A080",
      accent: "#229971",
      accentDark: "#1A7A5A",
      accentSecondary: "#CEAC54",
    },
  },
  {
    id: "team-alpine",
    constructorId: "alpine",
    name: "BWT Alpine",
    // bg, card, border, accent (BWT pink), accentSecondary (BWT blue)
    previewColors: ["#0A0E1C", "#141C34", "#202E50", "#FF87BC", "#0053A0"],
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
      accentSecondary: "#0053A0",
    },
  },
  {
    id: "team-williams",
    constructorId: "williams",
    name: "Williams Racing",
    // bg, card, border, accent (light blue), accentSecondary (red stripe)
    previewColors: ["#080C12", "#121A24", "#1E2E40", "#64C4FF", "#C3142D"],
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
      accentSecondary: "#C3142D",
    },
  },
  {
    id: "team-haas",
    constructorId: "haas",
    name: "MoneyGram Haas F1",
    // bg, card, border, accent (red), accentSecondary (silver)
    previewColors: ["#0E0E0E", "#1C1C1C", "#303030", "#E80020", "#B6BABD"],
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
      accentSecondary: "#B6BABD",
    },
  },
  {
    id: "team-rb",
    constructorId: "rb",
    name: "Visa Cash App RB",
    // bg, card, border, accent (blue), accentSecondary (red)
    previewColors: ["#080C1A", "#121A30", "#1E2E50", "#6692FF", "#C80000"],
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
      accentSecondary: "#C80000",
    },
  },
  {
    id: "team-audi",
    constructorId: "audi",
    name: "Audi F1 Team",
    // bg, card, border, accent (Audi red), accentSecondary (aluminum silver)
    // Formerly Kick Sauber — rebranded as Audi for the 2026 season
    previewColors: ["#180808", "#280E0E", "#3C1010", "#BB0000", "#C0C0C0"],
    colors: {
      bg: "#180808",
      dark: "#200A0A",
      card: "#280E0E",
      cardHover: "#321212",
      border: "#3C1010",
      text: "#FFF5F5",
      textMuted: "#A07070",
      accent: "#BB0000",
      accentDark: "#8C0000",
      accentSecondary: "#C0C0C0",
    },
  },
  {
    id: "team-cadillac",
    constructorId: "cadillac",
    name: "Cadillac F1 Team",
    // bg, card, border, accent (Cadillac gold), accentSecondary (American red)
    previewColors: ["#0A0E1A", "#141B2E", "#1E2A46", "#B8941C", "#C8001C"],
    colors: {
      bg: "#0A0E1A",
      dark: "#0E1422",
      card: "#141B2E",
      cardHover: "#1A2238",
      border: "#1E2A46",
      text: "#F0F4FF",
      textMuted: "#7080A0",
      accent: "#B8941C",
      accentDark: "#986010",
      accentSecondary: "#C8001C",
    },
  },
];

export function getTeamThemeByConstructorId(constructorId: string): TeamTheme | undefined {
  return TEAM_THEMES.find((t) => t.constructorId === constructorId);
}
