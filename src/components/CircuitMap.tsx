/**
 * Simplified schematic SVG track maps for 2026 F1 circuits.
 * Paths are stylised approximations intended to convey the general
 * character and shape of each layout, not pixel-perfect reproductions.
 */

interface CircuitData {
  path: string;
  viewBox: string;
}

/** Keyed by Ergast circuitId */
const CIRCUITS: Record<string, CircuitData> = {
  // ── Bahrain International Circuit ─────────────────────────────────────────
  // Three-sector layout — flowing S1, long back straight + hairpin in S2,
  // tight technical S3
  bahrain: {
    viewBox: "0 0 200 130",
    path: "M 35,65 L 158,65 C 170,65 176,74 176,86 L 176,95 C 176,108 164,114 152,110 L 122,102 C 108,97 100,110 96,120 L 76,120 C 62,120 50,110 48,97 L 40,78 C 37,71 35,68 35,65 Z",
  },

  // ── Jeddah Corniche Circuit ───────────────────────────────────────────────
  // Extremely long narrow street circuit — main straight, fast chicanes
  jeddah: {
    viewBox: "0 0 200 135",
    path: "M 28,118 L 28,22 C 28,12 40,8 50,12 L 165,12 C 178,12 183,22 180,32 L 172,50 C 165,62 172,72 180,78 L 180,88 C 180,102 168,108 155,105 L 128,100 C 115,96 108,108 108,118 Z",
  },

  // ── Albert Park ───────────────────────────────────────────────────────────
  // Lake circuit, flowing layout with light chicanes
  albert_park: {
    viewBox: "0 0 200 130",
    path: "M 55,25 L 148,25 C 163,25 170,38 165,52 L 148,70 C 140,82 148,95 160,100 L 168,108 C 173,118 162,128 150,125 L 60,125 C 45,125 33,112 35,98 L 35,40 C 35,30 44,25 55,25 Z",
  },

  // ── Suzuka International Racing Course ───────────────────────────────────
  // Figure-8 with distinctive crossover, S-curves, and 130R
  suzuka: {
    viewBox: "0 0 200 130",
    path: "M 100,18 C 130,18 155,35 160,58 L 160,68 C 158,82 148,90 138,93 C 155,102 165,118 165,128 M 35,128 C 35,118 45,102 62,93 C 52,88 42,80 40,68 L 40,58 C 45,35 72,18 100,18 M 35,128 L 165,128",
  },

  // ── Shanghai International Circuit ───────────────────────────────────────
  // Distinctive back straight into hairpin, sweeping sector 1
  shanghai: {
    viewBox: "0 0 200 130",
    path: "M 32,28 L 155,28 C 168,28 175,38 170,52 L 155,70 C 145,83 148,100 160,108 L 168,118 C 172,125 162,130 150,126 L 42,126 C 30,126 23,115 26,103 L 32,50 Z",
  },

  // ── Miami International Autodrome ─────────────────────────────────────────
  // Semi-oval hard braking zones, long back section
  miami: {
    viewBox: "0 0 200 130",
    path: "M 52,25 L 148,25 C 165,25 175,40 172,55 L 162,72 C 155,85 162,98 172,105 L 172,115 C 172,128 158,132 145,128 L 55,128 C 40,128 28,118 32,105 L 35,45 C 35,32 42,25 52,25 Z",
  },

  // ── Autodromo Enzo e Dino Ferrari (Imola) ─────────────────────────────────
  imola: {
    viewBox: "0 0 200 130",
    path: "M 45,28 C 62,18 88,22 102,38 L 118,55 C 132,70 150,70 165,60 L 170,55 C 176,46 176,35 168,28 L 172,24 L 48,24 M 172,24 L 180,24 M 40,125 C 28,115 24,100 32,88 L 50,68 C 58,55 50,40 40,33 L 35,28 C 32,22 38,18 45,18 L 45,28 M 40,125 L 165,125 C 178,125 183,115 178,105 L 168,90 C 160,78 168,65 178,58",
  },

  // ── Circuit de Monaco ──────────────────────────────────────────────────────
  // Tight streets, Casino Square, Loews hairpin, waterfront chicane
  monaco: {
    viewBox: "0 0 200 130",
    path: "M 42,28 L 155,28 C 168,28 172,42 165,54 L 148,65 L 165,78 L 165,98 C 165,112 152,120 138,116 L 85,105 L 55,118 C 40,122 30,110 32,96 L 32,45 C 32,35 38,28 42,28 Z",
  },

  // ── Circuit de Barcelona-Catalunya ────────────────────────────────────────
  // Long main straight, complex first corner, technical sector 2
  catalunya: {
    viewBox: "0 0 200 130",
    path: "M 35,32 L 162,32 C 174,32 178,44 172,56 L 155,75 C 148,85 152,98 162,106 L 168,118 C 172,128 160,134 147,128 L 48,125 C 34,122 28,110 33,98 L 40,75 C 42,65 35,52 28,42 L 30,36 Z",
  },

  // ── IFEMA Madrid Circuit (2026 new venue) ─────────────────────────────────
  madrid: {
    viewBox: "0 0 200 130",
    path: "M 40,25 L 160,25 C 173,25 180,35 177,48 L 162,65 C 152,78 158,92 170,100 L 175,108 C 178,118 168,126 155,124 L 78,124 C 65,124 52,115 48,105 L 40,85 C 35,72 40,58 52,50 L 55,45 C 60,35 52,28 42,28 Z",
  },

  // ── Circuit Gilles Villeneuve ──────────────────────────────────────────────
  // Island circuit, walls everywhere, hairpin chicane at end
  villeneuve: {
    viewBox: "0 0 200 130",
    path: "M 68,25 L 148,25 C 165,25 175,38 172,55 L 162,70 L 175,80 L 175,95 C 175,110 158,118 142,112 L 115,102 L 115,118 L 88,118 L 88,102 L 58,112 C 40,118 28,108 30,92 L 30,45 C 30,32 48,25 68,25 Z",
  },

  // ── Red Bull Ring ──────────────────────────────────────────────────────────
  // Short compact hilly circuit
  red_bull_ring: {
    viewBox: "0 0 200 130",
    path: "M 85,22 C 112,18 140,33 150,57 L 156,74 C 158,90 148,108 135,114 L 108,122 C 90,128 72,122 62,108 L 55,88 C 48,68 55,48 68,36 L 85,22 Z",
  },

  // ── Silverstone Circuit ───────────────────────────────────────────────────
  // High-speed layout, Maggotts/Becketts complex, Club corner
  silverstone: {
    viewBox: "0 0 200 130",
    path: "M 62,25 L 138,25 C 158,25 170,40 165,58 L 148,75 C 140,85 145,100 158,108 L 162,118 C 165,128 155,135 142,130 L 88,130 C 72,130 55,118 50,102 L 42,78 C 38,58 45,38 62,25 Z",
  },

  // ── Circuit de Spa-Francorchamps ──────────────────────────────────────────
  // Raidillon/Eau Rouge, Kemmel straight, Pouhon, Bus Stop chicane
  spa: {
    viewBox: "0 0 200 130",
    path: "M 25,32 L 92,32 C 112,22 130,18 148,25 L 168,35 C 182,45 180,63 165,70 L 140,80 C 125,88 122,108 135,120 L 138,130 L 45,130 C 30,130 20,118 24,105 L 26,52 Z",
  },

  // ── Hungaroring ───────────────────────────────────────────────────────────
  // Tight and twisty, little overtaking, flowing hillside
  hungaroring: {
    viewBox: "0 0 200 140",
    path: "M 52,25 L 92,25 C 112,25 125,40 120,58 L 108,75 C 100,90 108,105 122,110 L 150,118 C 165,122 170,135 155,138 L 65,138 C 48,138 35,126 38,110 L 45,82 C 48,68 38,52 26,45 L 26,35 C 26,28 38,25 52,25 Z",
  },

  // ── Circuit Zandvoort ─────────────────────────────────────────────────────
  // Hugenholtz banked corner, short circuit, old-school feel
  zandvoort: {
    viewBox: "0 0 200 145",
    path: "M 72,18 C 102,14 132,20 150,40 L 162,58 C 168,75 160,92 148,100 L 118,112 C 105,118 100,132 100,145 L 72,145 C 70,132 58,122 44,115 L 30,100 C 20,82 24,60 38,45 L 56,30 C 62,23 68,20 72,18 Z",
  },

  // ── Autodromo Nazionale Monza ─────────────────────────────────────────────
  // Oval-shaped temple of speed, two chicanes
  monza: {
    viewBox: "0 0 200 130",
    path: "M 45,28 L 155,28 C 168,28 175,38 172,52 L 158,65 C 148,75 148,90 158,100 L 172,112 C 175,122 165,132 152,128 L 45,128 C 32,128 22,118 26,108 L 38,95 C 48,82 48,68 38,55 L 26,42 C 22,32 32,28 45,28 Z",
  },

  // ── Baku City Circuit ─────────────────────────────────────────────────────
  // 2km main straight, narrow castle section, flowing waterfront
  baku: {
    viewBox: "0 0 200 130",
    path: "M 32,18 L 148,18 C 162,18 170,28 168,42 L 158,60 C 152,72 158,85 168,92 L 175,100 C 180,112 172,122 158,122 L 45,122 C 30,122 22,110 26,97 L 32,78 C 38,62 28,48 18,40 L 20,28 C 20,20 26,18 32,18 Z",
  },

  // ── Marina Bay Street Circuit ─────────────────────────────────────────────
  // Singapore street circuit, floating platform section
  marina_bay: {
    viewBox: "0 0 200 130",
    path: "M 42,32 L 100,32 L 100,16 L 162,16 C 176,16 183,28 180,42 L 168,58 C 160,72 165,85 178,92 L 178,104 C 178,118 165,124 150,120 L 65,120 C 48,120 35,108 33,93 L 28,55 Z",
  },

  // ── Circuit of the Americas ───────────────────────────────────────────────
  // Distinctive long back straight, T1 hairpin, Maggotts-inspired complex
  americas: {
    viewBox: "0 0 200 130",
    path: "M 45,25 L 155,25 C 170,25 178,38 172,52 L 150,68 C 138,78 142,95 155,105 L 168,115 C 175,125 168,135 155,132 L 72,132 C 55,132 40,120 38,105 L 35,80 C 32,62 40,48 50,38 L 50,30 Z",
  },

  // ── Autodromo Hermanos Rodriguez ──────────────────────────────────────────
  // High-altitude, stadium section (Foro Sol), long main straight
  rodriguez: {
    viewBox: "0 0 200 140",
    path: "M 55,28 L 145,28 C 160,28 170,40 168,55 L 155,70 L 168,85 C 175,98 168,112 155,118 L 92,122 C 78,124 68,132 65,140 L 58,140 C 42,130 35,116 40,103 L 42,52 C 42,38 48,28 55,28 Z",
  },

  // ── Autodromo José Carlos Pace (Interlagos) ───────────────────────────────
  // Anti-clockwise, S-curves, Senna S, downhill section
  interlagos: {
    viewBox: "0 0 200 140",
    path: "M 62,22 L 138,22 C 155,22 165,35 162,50 L 148,68 C 135,82 135,100 148,115 L 155,125 C 162,135 155,143 142,140 L 65,140 C 50,140 38,128 40,112 L 44,88 C 46,72 38,58 28,50 L 28,35 C 28,26 44,20 62,22 Z",
  },

  // ── Las Vegas Strip Circuit ───────────────────────────────────────────────
  // Two very long straights, casino section, fast sweepers
  las_vegas: {
    viewBox: "0 0 200 130",
    path: "M 48,18 L 155,18 C 168,18 175,28 172,42 L 162,55 C 155,68 162,80 172,85 L 172,98 C 172,112 158,118 145,115 L 92,108 L 92,132 L 68,132 L 68,108 L 52,112 C 38,118 28,108 30,92 L 32,35 C 32,24 40,18 48,18 Z",
  },

  // ── Lusail International Circuit ─────────────────────────────────────────
  // Very fast, flowing, high-speed oval-ish layout
  losail: {
    viewBox: "0 0 200 130",
    path: "M 40,35 C 44,20 62,14 80,18 L 142,18 C 160,18 174,32 176,52 L 176,80 C 174,100 160,112 142,115 L 80,115 C 62,112 44,100 40,80 L 38,55 C 38,44 39,38 40,35 Z",
  },

  // ── Yas Marina Circuit ────────────────────────────────────────────────────
  // Marina hotel tunnel section, flowing sector 3
  yas_marina: {
    viewBox: "0 0 200 130",
    path: "M 40,25 L 150,25 C 165,25 175,38 175,52 L 175,65 C 175,78 162,88 148,85 L 118,78 L 118,102 L 148,98 C 162,95 175,108 175,120 L 150,128 L 40,128 C 25,128 18,115 20,100 L 20,40 C 20,30 30,25 40,25 Z",
  },
};

/** Generic oval used as fallback for unknown circuit IDs */
const FALLBACK: CircuitData = {
  viewBox: "0 0 200 130",
  path: "M 100,20 C 148,20 172,45 172,65 C 172,85 148,110 100,110 C 52,110 28,85 28,65 C 28,45 52,20 100,20 Z",
};

interface CircuitMapProps {
  circuitId: string;
  circuitName?: string;
  className?: string;
}

export default function CircuitMap({ circuitId, className = "" }: CircuitMapProps) {
  const circuit = CIRCUITS[circuitId] ?? FALLBACK;

  return (
    <svg
      viewBox={circuit.viewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={circuit.path} />
    </svg>
  );
}
