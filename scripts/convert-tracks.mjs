/**
 * Converts f1tenth centerline CSV data to SVG path strings for CircuitMap.tsx
 * Usage: node scripts/convert-tracks.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Parse CSV centerline data (x_m, y_m, w_tr_right_m, w_tr_left_m)
 * Returns array of [x, y] coordinate pairs
 */
function parseCenterline(csv) {
  const lines = csv.trim().split('\n');
  const points = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('x_m')) continue; // skip header
    const parts = trimmed.split(',');
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        points.push([x, y]);
      }
    }
  }
  return points;
}

/**
 * Ramer-Douglas-Peucker simplification
 */
function rdp(points, epsilon) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon);
    const right = rdp(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt(
    Math.pow(point[0] - lineStart[0], 2) + Math.pow(point[1] - lineStart[1], 2)
  );
  return Math.abs(dx * (lineStart[1] - point[1]) - (lineStart[0] - point[0]) * dy) / len;
}

/**
 * Scale points to fit in a viewBox with padding
 */
function scaleToViewBox(points, width, height, padding = 12) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  const scaleX = (width - 2 * padding) / rangeX;
  const scaleY = (height - 2 * padding) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  // Center the track
  const scaledWidth = rangeX * scale;
  const scaledHeight = rangeY * scale;
  const offsetX = padding + (width - 2 * padding - scaledWidth) / 2;
  const offsetY = padding + (height - 2 * padding - scaledHeight) / 2;

  return points.map(([x, y]) => [
    Math.round((x - minX) * scale + offsetX),
    // Flip Y axis (SVG y increases downward, but track coords usually have y increasing upward)
    Math.round((maxY - y) * scale + offsetY),
  ]);
}

/**
 * Build SVG path string from scaled points
 */
function buildPath(scaledPoints) {
  const parts = scaledPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`);
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Split points into 3 sectors and build sector paths
 */
function buildSectorPaths(scaledPoints) {
  const n = scaledPoints.length;
  const s1end = Math.floor(n / 3);
  const s2end = Math.floor(2 * n / 3);

  const s1 = scaledPoints.slice(0, s1end + 1);
  const s2 = scaledPoints.slice(s1end, s2end + 1);
  const s3 = scaledPoints.slice(s2end);
  // Close s3 back to start
  s3.push(scaledPoints[0]);

  return [
    s1.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' '),
    s2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' '),
    s3.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' '),
  ];
}

/**
 * Estimate start/finish position (use the first point, draw a short perpendicular line)
 */
function buildStartFinish(scaledPoints) {
  const p0 = scaledPoints[0];
  const p1 = scaledPoints[1] || scaledPoints[scaledPoints.length - 1];

  // Direction along track at start
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular direction
  const px = -dy / len;
  const py = dx / len;

  const halfLen = 6;
  return [
    Math.round(p0[0] - px * halfLen),
    Math.round(p0[1] - py * halfLen),
    Math.round(p0[0] + px * halfLen),
    Math.round(p0[1] + py * halfLen),
  ];
}

function convertTrack(csv, viewWidth = 200, viewHeight = 130) {
  const raw = parseCenterline(csv);
  if (raw.length < 3) throw new Error('Too few points');

  // Simplify with RDP
  // We want ~60-80 points for a good balance of accuracy and path length
  let epsilon = 0.5;
  let simplified = rdp(raw, epsilon);
  while (simplified.length > 80 && epsilon < 20) {
    epsilon *= 1.5;
    simplified = rdp(raw, epsilon);
  }
  // If still too few, use raw sample
  if (simplified.length < 15) simplified = raw.filter((_, i) => i % Math.floor(raw.length / 60) === 0);

  const scaled = scaleToViewBox(simplified, viewWidth, viewHeight);

  return {
    viewBox: `0 0 ${viewWidth} ${viewHeight}`,
    path: buildPath(scaled),
    startFinish: buildStartFinish(scaled),
    sectors: buildSectorPaths(scaled),
  };
}

// Track CSV data embedded directly
const trackCSVs = {};

// Track files to load from disk (if available in data/ directory)
const tracks = [
  { ergastId: 'bahrain', name: 'Sakhir' },
  { ergastId: 'albert_park', name: 'Melbourne' },
  { ergastId: 'shanghai', name: 'Shanghai' },
  { ergastId: 'americas', name: 'Austin' },
  { ergastId: 'rodriguez', name: 'MexicoCity' },
  { ergastId: 'interlagos', name: 'SaoPaulo' },
  { ergastId: 'spa', name: 'Spa' },
  { ergastId: 'silverstone', name: 'Silverstone' },
  { ergastId: 'monza', name: 'Monza' },
  { ergastId: 'yas_marina', name: 'YasMarina' },
  { ergastId: 'catalunya', name: 'Catalunya' },
  { ergastId: 'hungaroring', name: 'Budapest' },
  { ergastId: 'zandvoort', name: 'Zandvoort' },
  { ergastId: 'red_bull_ring', name: 'Spielberg' },
  { ergastId: 'villeneuve', name: 'Montreal' },
];

const dataDir = join(process.cwd(), 'scripts', 'track-data');
const results = {};

for (const { ergastId, name } of tracks) {
  const filePath = join(dataDir, `${name}_centerline.csv`);
  if (!existsSync(filePath)) {
    console.warn(`⚠️  Missing: ${filePath}`);
    continue;
  }
  try {
    const csv = readFileSync(filePath, 'utf8');
    const data = convertTrack(csv);
    results[ergastId] = data;
    console.log(`✓ ${name} → ${ergastId} (${data.path.split(' ').length} path tokens)`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}

// Output as TypeScript-compatible object
console.log('\n--- GENERATED CIRCUITS DATA ---\n');
for (const [id, data] of Object.entries(results)) {
  console.log(`  // ${id}`);
  console.log(`  ${id}: {`);
  console.log(`    viewBox: "${data.viewBox}",`);
  console.log(`    path: "${data.path}",`);
  console.log(`    startFinish: [${data.startFinish.join(', ')}],`);
  console.log(`    sectors: [`);
  for (const s of data.sectors) {
    console.log(`      "${s}",`);
  }
  console.log(`    ],`);
  console.log(`  },`);
}
