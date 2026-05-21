/**
 * Verifies that deriveOrderFromLaps (the replay's lap-based fallback for when
 * OpenF1 has no position/interval feed) produces the correct running order for
 * a known race snapshot.
 *
 * Fixture: Miami Race 2026, session_key=11280, lap 33.
 *   Source: GET /laps?session_key=11280&lap_number=33
 *   Expected top 5 (by start/finish-line crossing order):
 *     P1 #12 ANT, P2 #1 NOR, P3 #3 VER, P4 #16 LEC, P5 #63 RUS
 *
 * Run: node scripts/verify-replay-derive.mjs
 */

// ---------------------------------------------------------------------------
// Pure-JS copy of src/app/(standard)/replay/[sessionKey]/ReplayClient.tsx
// deriveOrderFromLaps — kept in sync manually.
// ---------------------------------------------------------------------------
function deriveOrderFromLaps(sortedLaps, cutoffMs) {
  const current = new Map();
  for (const lap of sortedLaps) {
    const startMs = new Date(lap.date_start).getTime();
    if (startMs > cutoffMs) break;
    const prev = current.get(lap.driver_number);
    if (!prev || lap.lap_number > prev.lap) {
      current.set(lap.driver_number, { lap: lap.lap_number, startMs });
    }
  }

  const order = [...current.entries()].sort((a, b) => {
    if (b[1].lap !== a[1].lap) return b[1].lap - a[1].lap;
    return a[1].startMs - b[1].startMs;
  });

  const positions = new Map();
  const intervals = new Map();
  const leader = order[0]?.[1];
  let prev = null;
  order.forEach(([num, entry], i) => {
    positions.set(num, i + 1);
    if (i === 0 || !leader) {
      intervals.set(num, { gap: null, interval: null });
    } else if (entry.lap === leader.lap) {
      const gap = (entry.startMs - leader.startMs) / 1000;
      const interval = prev && entry.lap === prev.lap ? (entry.startMs - prev.startMs) / 1000 : null;
      intervals.set(num, { gap, interval });
    } else {
      intervals.set(num, { gap: null, interval: null });
    }
    prev = entry;
  });

  return { positions, intervals };
}

// ---------------------------------------------------------------------------
// Fixture: all lap-33 rows for Miami session 11280, sorted by date_start asc.
// ---------------------------------------------------------------------------
const LAP33 = [
  { driver_number: 12, lap_number: 33, date_start: "2026-05-03T17:58:52.241000+00:00" },
  { driver_number:  1, lap_number: 33, date_start: "2026-05-03T17:58:53.460000+00:00" },
  { driver_number:  3, lap_number: 33, date_start: "2026-05-03T17:58:58.317000+00:00" },
  { driver_number: 16, lap_number: 33, date_start: "2026-05-03T17:59:06.367000+00:00" },
  { driver_number: 63, lap_number: 33, date_start: "2026-05-03T17:59:07.819000+00:00" },
  { driver_number: 81, lap_number: 33, date_start: "2026-05-03T17:59:08.210000+00:00" },
  { driver_number: 44, lap_number: 33, date_start: "2026-05-03T17:59:14.695000+00:00" },
  { driver_number: 43, lap_number: 33, date_start: "2026-05-03T17:59:25.951000+00:00" },
  { driver_number: 55, lap_number: 33, date_start: "2026-05-03T17:59:32.501000+00:00" },
  { driver_number: 23, lap_number: 33, date_start: "2026-05-03T17:59:35.579000+00:00" },
  { driver_number: 87, lap_number: 33, date_start: "2026-05-03T17:59:37.282000+00:00" },
  { driver_number:  5, lap_number: 33, date_start: "2026-05-03T17:59:37.341000+00:00", is_pit_out_lap: true },
  { driver_number: 31, lap_number: 33, date_start: "2026-05-03T17:59:48.165000+00:00" },
  { driver_number: 14, lap_number: 33, date_start: "2026-05-03T17:59:55.986000+00:00" },
  { driver_number: 41, lap_number: 33, date_start: "2026-05-03T17:59:56.892000+00:00" },
  { driver_number: 11, lap_number: 33, date_start: "2026-05-03T18:00:11.642000+00:00" },
  { driver_number: 18, lap_number: 33, date_start: "2026-05-03T18:00:14.908000+00:00" },
  { driver_number: 77, lap_number: 33, date_start: "2026-05-03T18:00:42.905000+00:00" },
];

const NAMES = {
  1:"NOR", 3:"VER", 5:"BOR", 11:"PER", 12:"ANT", 14:"ALO",
  16:"LEC", 18:"STR", 23:"ALB", 31:"OCO", 41:"???", 43:"COL",
  44:"HAM", 55:"SAI", 63:"RUS", 77:"BOT", 81:"PIA", 87:"BEA",
};

// ---------------------------------------------------------------------------
// Run: use the last driver's lap-33 date_start as the cutoff so all 18 appear.
// ---------------------------------------------------------------------------
const cutoffMs = new Date(LAP33[LAP33.length - 1].date_start).getTime() + 1;
const { positions, intervals } = deriveOrderFromLaps(LAP33, cutoffMs);

const ordered = [...positions.entries()].sort((a, b) => a[1] - b[1]);

const EXPECTED_TOP5 = [12, 1, 3, 16, 63]; // ANT NOR VER LEC RUS
const actual_top5 = ordered.slice(0, 5).map(([num]) => num);

let pass = true;
const errors = [];

// Check P1–P5 driver numbers
for (let i = 0; i < 5; i++) {
  if (actual_top5[i] !== EXPECTED_TOP5[i]) {
    pass = false;
    errors.push(
      `P${i + 1}: expected #${EXPECTED_TOP5[i]} (${NAMES[EXPECTED_TOP5[i]]}), ` +
      `got #${actual_top5[i]} (${NAMES[actual_top5[i]] ?? "??"})`,
    );
  }
}

// Check ANT gap = 0 (leader)
const antIv = intervals.get(12);
if (antIv?.gap !== null && antIv?.gap !== 0) {
  pass = false;
  errors.push(`P1 (ANT) gap should be null, got ${antIv?.gap}`);
}

// Check NOR interval ≈ 1.219s
const norIv = intervals.get(1);
if (!norIv || Math.abs(norIv.gap - 1.219) > 0.001) {
  pass = false;
  errors.push(`P2 (NOR) gap should be 1.219s, got ${norIv?.gap}`);
}

// Check full grid size
if (positions.size !== LAP33.length) {
  pass = false;
  errors.push(`Expected ${LAP33.length} drivers in output, got ${positions.size}`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log("Miami Race 2026 — Lap 33 position derivation");
console.log("═".repeat(52));
ordered.forEach(([num, pos]) => {
  const iv = intervals.get(num);
  const gapStr = iv?.gap != null ? `+${iv.gap.toFixed(3)}s` : "—";
  const ivStr  = iv?.interval != null ? `+${iv.interval.toFixed(3)}s` : "—";
  const mark = pos <= 5 ? " ✓" : "";
  console.log(
    `P${String(pos).padStart(2)}  #${String(num).padStart(2)}  ${(NAMES[num] ?? "???").padEnd(3)}` +
    `  gap ${gapStr.padStart(10)}  int ${ivStr.padStart(10)}${mark}`,
  );
});
console.log("═".repeat(52));

if (pass) {
  console.log("✅  All assertions passed — deriveOrderFromLaps is correct.");
  process.exit(0);
} else {
  console.error("❌  Assertion failures:");
  errors.forEach(e => console.error("    " + e));
  process.exit(1);
}
