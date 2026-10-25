// Small geometry helpers for the replay (docs/REPLAY-METHOD.md): sampling points inside a published flood extent and far from
// its edge. Plain functions over [lon, lat] pairs, no dependencies, no network. Distances are short (a few kilometres), so a
// flat local projection at the point's latitude is accurate to far better than the 1 km buffer needs.

export type Pos = [number, number]; // [lon, lat]
export type Ring = Pos[];
/** A polygon: an outer ring, then any holes. */
export type Polygon = Ring[];

/** A small seeded generator (mulberry32): the same seed gives the same sequence everywhere. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates, in place, with the given generator. */
export function shuffle<T>(xs: T[], rnd: () => number): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

export function pointInRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring and not inside a hole. */
export function pointInPolygon(x: number, y: number, poly: Polygon): boolean {
  if (!poly.length || !pointInRing(x, y, poly[0])) return false;
  for (let k = 1; k < poly.length; k++) if (pointInRing(x, y, poly[k])) return false;
  return true;
}

const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LON_AT_EQUATOR = 111.32;

/** Distance in km from (x, y) to the segment a-b, in a flat projection centred on the point. */
export function distToSegmentKm(x: number, y: number, a: Pos, b: Pos): number {
  const kx = KM_PER_DEG_LON_AT_EQUATOR * Math.cos((y * Math.PI) / 180);
  const ax = (a[0] - x) * kx, ay = (a[1] - y) * KM_PER_DEG_LAT, bx = (b[0] - x) * kx, by = (b[1] - y) * KM_PER_DEG_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

export interface Box { minX: number; minY: number; maxX: number; maxY: number }
export function boxOf(poly: Polygon): Box {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly[0] ?? []) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** Polygons bucketed on a coarse grid, so a point only meets the polygons near it. */
export class PolygonIndex {
  readonly polygons: Polygon[];
  private size: number;
  private cells = new Map<string, number[]>();
  private boxes: Box[] = [];
  constructor(polygons: Polygon[], size = 0.02) {
    this.polygons = polygons;
    this.size = size;
    polygons.forEach((p, i) => {
      const b = boxOf(p);
      this.boxes.push(b);
      for (let ix = Math.floor(b.minX / size); ix <= Math.floor(b.maxX / size); ix++) {
        for (let iy = Math.floor(b.minY / size); iy <= Math.floor(b.maxY / size); iy++) {
          const k = ix + ',' + iy;
          const c = this.cells.get(k);
          if (c) c.push(i);
          else this.cells.set(k, [i]);
        }
      }
    });
  }

  /** Indices of polygons whose box, grown by `padDeg`, may contain the point. */
  near(x: number, y: number, padDeg: number): number[] {
    const out = new Set<number>();
    for (let ix = Math.floor((x - padDeg) / this.size); ix <= Math.floor((x + padDeg) / this.size); ix++) {
      for (let iy = Math.floor((y - padDeg) / this.size); iy <= Math.floor((y + padDeg) / this.size); iy++) {
        for (const i of this.cells.get(ix + ',' + iy) ?? []) {
          const b = this.boxes[i];
          if (x >= b.minX - padDeg && x <= b.maxX + padDeg && y >= b.minY - padDeg && y <= b.maxY + padDeg) out.add(i);
        }
      }
    }
    return [...out];
  }

  contains(x: number, y: number): boolean {
    return this.near(x, y, 0).some((i) => pointInPolygon(x, y, this.polygons[i]));
  }

  /** True when the point is closer than `km` to an edge of any polygon (inside or outside). Stops at the first. */
  withinKmOfEdge(x: number, y: number, km: number): boolean {
    const pad = km / 85; // a degree is 110 km north-south and at least about 90 km east-west here: a safe margin
    for (const i of this.near(x, y, pad)) {
      for (const ring of this.polygons[i]) {
        for (let k = 0, j = ring.length - 1; k < ring.length; j = k++) if (distToSegmentKm(x, y, ring[j], ring[k]) < km) return true;
      }
    }
    return false;
  }
}

/** The polygons of a GeoJSON FeatureCollection (Polygon and MultiPolygon), flattened. */
export function polygonsOf(fc: { features: { geometry: { type: string; coordinates: unknown } | null }[] }): Polygon[] {
  const out: Polygon[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') out.push(g.coordinates as Polygon);
    else if (g.type === 'MultiPolygon') for (const p of g.coordinates as Polygon[]) out.push(p);
  }
  return out;
}

/** A single-ring WKT polygon such as "POLYGON ((x y, x y, ...))". */
export function parseWktPolygon(wkt: string): Polygon {
  const m = /^\s*POLYGON\s*\(\((.*)\)\)\s*$/i.exec(wkt);
  if (!m) throw new Error('not a single-ring POLYGON: ' + wkt.slice(0, 40));
  return [m[1].split(',').map((p) => p.trim().split(/\s+/).map(Number) as Pos)];
}

export function haversineKm(a: Pos, b: Pos): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The 0.25 degree grid cell a point falls in, as the centre Open-Meteo's ERA5 grid uses. */
export function era5Cell(lat: number, lon: number): { lat: number; lon: number } {
  return { lat: Math.round(lat * 4) / 4, lon: Math.round(lon * 4) / 4 };
}

/** The p-th percentile (0..1) of a list, by linear interpolation between ranks. */
export function percentile(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const h = (s.length - 1) * p;
  const lo = Math.floor(h), hi = Math.ceil(h);
  return s[lo] + (s[hi] - s[lo]) * (h - lo);
}
