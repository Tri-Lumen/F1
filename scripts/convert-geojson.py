#!/usr/bin/env python3
"""
Converts bacinger/f1-circuits GeoJSON files to SVG path strings for CircuitMap.tsx.
Coordinates are [lon, lat]; we use simple linear scaling to SVG space.
"""
import json, math, os, sys

TRACK_DIR = os.path.join(os.path.dirname(__file__), 'track-data')
VIEW_W, VIEW_H = 200, 130
PADDING = 12
RDP_EPSILON = 0.0002  # in degrees – tune for ~50-80 points


def rdp(pts, eps):
    if len(pts) <= 2:
        return pts
    start, end = pts[0], pts[-1]
    max_d, max_i = 0, 0
    for i in range(1, len(pts)-1):
        d = perp_dist(pts[i], start, end)
        if d > max_d:
            max_d, max_i = d, i
    if max_d > eps:
        left  = rdp(pts[:max_i+1], eps)
        right = rdp(pts[max_i:], eps)
        return left[:-1] + right
    return [start, end]


def perp_dist(p, a, b):
    dx, dy = b[0]-a[0], b[1]-a[1]
    length = math.hypot(dx, dy)
    if length == 0:
        return math.hypot(p[0]-a[0], p[1]-a[1])
    return abs(dx*(a[1]-p[1]) - (a[0]-p[0])*dy) / length


def scale_to_viewbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    rx, ry = max_x-min_x, max_y-min_y
    if rx == 0 or ry == 0:
        return pts
    sx = (VIEW_W - 2*PADDING) / rx
    sy = (VIEW_H - 2*PADDING) / ry
    s  = min(sx, sy)
    ox = PADDING + ((VIEW_W - 2*PADDING) - rx*s) / 2
    oy = PADDING + ((VIEW_H - 2*PADDING) - ry*s) / 2
    # Flip Y: lat increases upward, SVG increases downward
    return [(round((x-min_x)*s+ox), round((max_y-y)*s+oy)) for x,y in pts]


def build_path(pts):
    parts = [f"{'M' if i==0 else 'L'} {p[0]},{p[1]}" for i,p in enumerate(pts)]
    parts.append('Z')
    return ' '.join(parts)


def build_sectors(pts):
    n = len(pts)
    i1, i2 = n//3, 2*n//3
    def seg(a,b,extra=None):
        sub = pts[a:b+1]
        if extra:
            sub = sub + [extra]
        return ' '.join(f"{'M' if j==0 else 'L'} {p[0]},{p[1]}" for j,p in enumerate(sub))
    return [seg(0, i1), seg(i1, i2), seg(i2, n-1, pts[0])]


def start_finish(pts):
    p0, p1 = pts[0], pts[1]
    dx, dy = p1[0]-p0[0], p1[1]-p0[1]
    le = math.hypot(dx, dy) or 1
    px, py = -dy/le, dx/le
    hl = 6
    return [round(p0[0]-px*hl), round(p0[1]-py*hl),
            round(p0[0]+px*hl), round(p0[1]+py*hl)]


def convert(geojson_path, ergast_id):
    with open(geojson_path) as f:
        data = json.load(f)
    coords = data['features'][0]['geometry']['coordinates']
    # coords are [lon, lat]
    pts = [(c[0], c[1]) for c in coords]

    # Adaptive RDP
    eps = RDP_EPSILON
    simp = rdp(pts, eps)
    while len(simp) > 80 and eps < 0.01:
        eps *= 1.5
        simp = rdp(pts, eps)
    if len(simp) < 15:
        step = max(1, len(pts)//60)
        simp = pts[::step]

    scaled = scale_to_viewbox(simp)

    sf = start_finish(scaled)
    sectors = build_sectors(scaled)
    path = build_path(scaled)

    print(f'  // ── {data["features"][0]["properties"]["Name"]} [bacinger] ──')
    print(f'  {ergast_id}: {{')
    print(f'    viewBox: "0 0 {VIEW_W} {VIEW_H}",')
    print(f'    path: "{path}",')
    print(f'    startFinish: [{sf[0]}, {sf[1]}, {sf[2]}, {sf[3]}],')
    print(f'    sectors: [')
    for s in sectors:
        print(f'      "{s}",')
    print(f'    ],')
    print(f'  }},')
    return True


TRACKS = [
    ('sa-2021.geojson',  'jeddah'),
    ('jp-1962.geojson',  'suzuka'),
    ('mc-1929.geojson',  'monaco'),
    ('az-2016.geojson',  'baku'),
    ('sg-2008.geojson',  'marina_bay'),
    ('qa-2004.geojson',  'losail'),
    ('it-1953.geojson',  'imola'),
    ('es-2026.geojson',  'madrid'),
    ('us-2022.geojson',  'miami'),
    ('us-2023.geojson',  'las_vegas'),
]

print('--- GENERATED GEOJSON-DERIVED CIRCUITS ---\n')
for fname, eid in TRACKS:
    fpath = os.path.join(TRACK_DIR, fname)
    if os.path.exists(fpath):
        convert(fpath, eid)
    else:
        print(f'  // MISSING: {fname}', file=sys.stderr)
