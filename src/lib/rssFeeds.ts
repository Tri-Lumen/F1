import type { RssFeedSource } from "./types";

/** Default RSS feed sources for F1 news — users can toggle each on/off */
export const DEFAULT_RSS_FEEDS: RssFeedSource[] = [
  {
    id: "motorsport",
    name: "Motorsport.com",
    url: "https://www.motorsport.com/rss/f1/news/",
    enabled: true,
  },
  {
    id: "autosport",
    name: "Autosport",
    url: "https://www.autosport.com/rss/f1/news/",
    enabled: true,
  },
  {
    id: "planetf1",
    name: "PlanetF1",
    url: "https://www.planetf1.com/feed/",
    enabled: true,
  },
  {
    id: "racefans",
    name: "RaceFans",
    url: "https://www.racefans.net/feed/",
    enabled: true,
  },
  {
    id: "therace",
    name: "The Race",
    url: "https://www.the-race.com/feed/",
    enabled: true,
  },
  {
    id: "pitpass",
    name: "PitPass",
    url: "https://www.pitpass.com/fes_php/fes_usr_sit_newsfeed.php?fession_id=",
    enabled: false,
  },
  {
    id: "gpblog",
    name: "GPblog",
    url: "https://www.gpblog.com/en/rss/index.xml",
    enabled: false,
  },
  {
    id: "formulanews",
    name: "FormulaNews",
    url: "https://www.formulanews.co.uk/feed/",
    enabled: false,
  },
];

/** Canonical list of 2026 F1 driver names for keyword-based article filtering */
export const F1_DRIVERS_2026: { id: string; name: string; keywords: string[] }[] = [
  { id: "max_verstappen", name: "Max Verstappen", keywords: ["verstappen", "max verstappen"] },
  { id: "hamilton", name: "Lewis Hamilton", keywords: ["hamilton", "lewis hamilton"] },
  { id: "leclerc", name: "Charles Leclerc", keywords: ["leclerc", "charles leclerc"] },
  { id: "norris", name: "Lando Norris", keywords: ["norris", "lando norris"] },
  { id: "piastri", name: "Oscar Piastri", keywords: ["piastri", "oscar piastri"] },
  { id: "russell", name: "George Russell", keywords: ["russell", "george russell"] },
  { id: "antonelli", name: "Kimi Antonelli", keywords: ["antonelli", "kimi antonelli"] },
  { id: "alonso", name: "Fernando Alonso", keywords: ["alonso", "fernando alonso"] },
  { id: "stroll", name: "Lance Stroll", keywords: ["stroll", "lance stroll"] },
  { id: "gasly", name: "Pierre Gasly", keywords: ["gasly", "pierre gasly"] },
  { id: "albon", name: "Alex Albon", keywords: ["albon", "alex albon"] },
  { id: "sainz", name: "Carlos Sainz", keywords: ["sainz", "carlos sainz"] },
  { id: "colapinto", name: "Franco Colapinto", keywords: ["colapinto", "franco colapinto"] },
  { id: "ocon", name: "Esteban Ocon", keywords: ["ocon", "esteban ocon"] },
  { id: "bearman", name: "Oliver Bearman", keywords: ["bearman", "oliver bearman"] },
  { id: "hulkenberg", name: "Nico Hulkenberg", keywords: ["hulkenberg", "nico hulkenberg", "hülkenberg"] },
  { id: "bortoleto", name: "Gabriel Bortoleto", keywords: ["bortoleto", "gabriel bortoleto"] },
  { id: "hadjar", name: "Isack Hadjar", keywords: ["hadjar", "isack hadjar"] },
  { id: "lawson", name: "Liam Lawson", keywords: ["lawson", "liam lawson"] },
  { id: "lindblad", name: "Arvid Lindblad", keywords: ["lindblad", "arvid lindblad"] },
  { id: "bottas", name: "Valtteri Bottas", keywords: ["bottas", "valtteri bottas"] },
  { id: "perez", name: "Sergio Perez", keywords: ["perez", "sergio perez", "pérez"] },
];

/** Notable special liveries to feature in the news section */
export interface SpecialLivery {
  id: string;
  title: string;
  team: string;
  constructorId: string;
  event: string;
  description: string;
  imageUrl?: string;
  year: string;
}

export const SPECIAL_LIVERIES_2026: SpecialLivery[] = [
  {
    id: "mclaren-chrome-2026",
    title: "McLaren Chrome Livery",
    team: "McLaren",
    constructorId: "mclaren",
    event: "Pre-Season Launch",
    description: "McLaren unveiled a striking chrome finish for the MCL61, paying homage to their iconic silver heritage while incorporating papaya accents.",
    year: "2026",
  },
  {
    id: "rb-retro-2026",
    title: "Racing Bulls Retro",
    team: "Racing Bulls",
    constructorId: "rb",
    event: "Italian Grand Prix",
    description: "Racing Bulls ran a retro-inspired livery celebrating the Toro Rosso and Minardi heritage at their home race in Monza.",
    year: "2026",
  },
  {
    id: "williams-heritage-2026",
    title: "Williams Rothmans Heritage",
    team: "Williams",
    constructorId: "williams",
    event: "British Grand Prix",
    description: "Williams debuted a classic blue-and-white heritage livery inspired by the dominant FW14B for their home Grand Prix at Silverstone.",
    year: "2026",
  },
  {
    id: "ferrari-yellow-2026",
    title: "Ferrari Giallo Modena",
    team: "Ferrari",
    constructorId: "ferrari",
    event: "Monza",
    description: "Ferrari brought a special yellow livery referencing their original racing colour, Giallo Modena, to celebrate their 80th anniversary.",
    year: "2026",
  },
  {
    id: "cadillac-debut-2026",
    title: "Cadillac F1 Debut Livery",
    team: "Cadillac",
    constructorId: "cadillac",
    event: "Season Debut",
    description: "The all-new Cadillac F1 team made their debut with a bold American-inspired livery featuring silver, black, and gold accents.",
    year: "2026",
  },
  {
    id: "audi-launch-2026",
    title: "Audi F1 Launch Livery",
    team: "Audi",
    constructorId: "audi",
    event: "Season Launch",
    description: "Audi entered Formula 1 as a works team with a sleek silver-and-red livery showcasing the four rings prominently.",
    year: "2026",
  },
];
