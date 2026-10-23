// Replay R-1, step 2 (docs/REPLAY-METHOD.md): sample points from the published flood extent and label them. No network: it reads
// data/replay/raw/ (fetched by fetch-extent.mjs) and writes data/replay/derived/plots.csv, confirmed.csv and sample.json.
// Run: node --import ./scripts/ts-resolve.mjs scripts/replay/sample.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { mulberry32, shuffle, pointInPolygon, PolygonIndex, polygonsOf, parseWktPolygon, haversineKm, era5Cell, type Polygon } from './geo.ts';

const RAW = 'data/replay/raw';
const OUT = 'data/replay/derived';

/** Every constant of the method, in one place. Changing one after the run is a "tuned" change (docs/REPLAY-METHOD.md). */
export const METHOD = {
  areas: [1, 2, 3, 4, 5, 7, 8],
  gridDeg: 0.01,
  bufferKm: 1,
  perClass: 30,
  seed: 838,
  /** a river point is in reach of a point within this distance; the lag is the distance over the nominal flood-wave speed */
  reachKm: 48,
  waveKmh: 4,
  /** the event window runs from this many days before day D to this many days after it; the quiet window starts this many days before D */
  daysBefore: 9,
  daysAfter: 6,
  quietStartDaysBefore: 120,
  quietLengthDays: 14,
  /** the danger level: this percentile of the daily discharge over `baselineDays` days that end `baselineEndsDaysBefore` days before D */
  dangerPercentile: 0.9,
  baselineDays: 90,
  baselineEndsDaysBefore: 30,
};

/** The three river points, fixed in advance (a trial request showed they snap to the right river). */
export const RIVERS = [
  { id: 'GLOFAS-CHENAB', name: 'Chenab', lat: 32.325, lon: 73.675 },
  { id: 'GLOFAS-RAVI', name: 'Ravi', lat: 31.475, lon: 74.125 },
  { id: 'GLOFAS-SUTLEJ', name: 'Sutlej', lat: 31.025, lon: 74.525 },
] as const;

export interface GridPoint { lat: number; lon: number }
export type Class = 'affected' | 'not_affected';

/** Grid points of the given step inside an outline, in a fixed order (south to north, then west to east). */
export function gridInside(outline: Polygon, step: number): GridPoint[] {
  const xs = outline[0].map((p) => p[0]), ys = outline[0].map((p) => p[1]);
  const per = Math.round(1 / step);
  const out: GridPoint[] = [];
  for (let i = Math.ceil(Math.min(...ys) * per); i <= Math.floor(Math.max(...ys) * per); i++) {
    for (let j = Math.ceil(Math.min(...xs) * per); j <= Math.floor(Math.max(...xs) * per); j++) {
      const lat = i / per, lon = j / per;
      if (pointInPolygon(lon, lat, outline)) out.push({ lat, lon });
    }
  }
  return out;
}

/** inside the extent: affected; at least `bufferKm` from every edge: not affected; anything else is dropped (null). */
export function classify(p: GridPoint, extent: PolygonIndex, bufferKm: number): Class | null {
  if (extent.contains(p.lon, p.lat)) return 'affected';
  return extent.withinKmOfEdge(p.lon, p.lat, bufferKm) ? null : 'not_affected';
}

export interface Pick { lat: number; lon: number; area: number; class: Class }

/**
 * The sample: for each area in order, the affected and the not-affected grid points shuffled by one shared generator, and the
 * first `perClass` of each taken. `candidates` is already free of dropped points.
 */
export function pickSample(candidates: Map<number, { affected: GridPoint[]; notAffected: GridPoint[] }>, areas: number[], perClass: number, seed: number): Pick[] {
  const rnd = mulberry32(seed);
  const out: Pick[] = [];
  for (const area of areas) {
    const c = candidates.get(area);
    if (!c) continue;
    const a = shuffle([...c.affected], rnd).slice(0, perClass);
    const n = shuffle([...c.notAffected], rnd).slice(0, perClass);
    out.push(...a.map((p) => ({ ...p, area, class: 'affected' as const })), ...n.map((p) => ({ ...p, area, class: 'not_affected' as const })));
  }
  return out;
}

/** The river points within reach of a point, with the hours the flood wave is taken to need. */
export function reachOf(lat: number, lon: number, rivers = RIVERS, reachKm = METHOD.reachKm, waveKmh = METHOD.waveKmh): { id: string; lagH: number }[] {
  return rivers
    .map((r) => ({ id: r.id, km: haversineKm([lon, lat], [r.lon, r.lat]) }))
    .filter((r) => r.km <= reachKm)
    .map((r) => ({ id: r.id, lagH: Math.round((r.km / waveKmh) * 10) / 10 }));
}

const DAY = 86400e3;
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
/** Day D and the windows of the method, from the activation's recorded event time. */
export function windows(eventTime: string) {
  const D = Date.parse(eventTime.slice(0, 10) + 'T00:00:00Z');
  const iso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z');
  const quietStart = D - METHOD.quietStartDaysBefore * DAY;
  return {
    D: day(D),
    event: [iso(D - METHOD.daysBefore * DAY), iso(D + METHOD.daysAfter * DAY)] as [string, string],
    quiet: [iso(quietStart), iso(quietStart + METHOD.quietLengthDays * DAY)] as [string, string],
    baseline: [day(D - (METHOD.baselineEndsDaysBefore + METHOD.baselineDays - 1) * DAY), day(D - METHOD.baselineEndsDaysBefore * DAY)] as [string, string],
  };
}

const csvCell = (s: string | number) => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
const csvLine = (xs: (string | number)[]) => xs.map(csvCell).join(',');

function main() {
  const record = JSON.parse(readFileSync(`${RAW}/emsr838.json`, 'utf8')).results[0] as { eventTime: string; aois: { number: number; name: string; extent: string }[] };
  const win = windows(record.eventTime);
  console.log(`day D ${win.D}; event window ${win.event.join(' to ')}; quiet window ${win.quiet.join(' to ')}; river baseline ${win.baseline.join(' to ')}`);

  // every grid point inside each outline, then the points inside two outlines are dropped
  const outlines = new Map<number, Polygon>();
  const grids = new Map<number, GridPoint[]>();
  const seen = new Map<string, number[]>();
  for (const n of METHOD.areas) {
    const a = record.aois.find((x) => x.number === n)!;
    const outline = parseWktPolygon(a.extent);
    outlines.set(n, outline);
    const g = gridInside(outline, METHOD.gridDeg);
    grids.set(n, g);
    for (const p of g) {
      const k = `${p.lat},${p.lon}`;
      seen.set(k, [...(seen.get(k) ?? []), n]);
    }
  }
  const stats: Record<string, unknown>[] = [];
  const candidates = new Map<number, { affected: GridPoint[]; notAffected: GridPoint[] }>();
  for (const n of METHOD.areas) {
    const fc = JSON.parse(readFileSync(`${RAW}/extent/AOI${String(n).padStart(2, '0')}.geojson`, 'utf8'));
    const extent = new PolygonIndex(polygonsOf(fc));
    const affected: GridPoint[] = [], notAffected: GridPoint[] = [];
    let overlap = 0, near = 0;
    for (const p of grids.get(n)!) {
      if ((seen.get(`${p.lat},${p.lon}`) ?? []).length > 1) { overlap++; continue; }
      const c = classify(p, extent, METHOD.bufferKm);
      if (c === 'affected') affected.push(p);
      else if (c === 'not_affected') notAffected.push(p);
      else near++;
    }
    candidates.set(n, { affected, notAffected });
    const name = record.aois.find((x) => x.number === n)!.name;
    stats.push({ area: n, name, gridPointsInOutline: grids.get(n)!.length, droppedInTwoOutlines: overlap, droppedNearAnEdge: near, affectedAvailable: affected.length, notAffectedAvailable: notAffected.length, floodPolygons: fc.features.length });
    console.log(`  area ${n} ${name}: ${grids.get(n)!.length} grid points, ${affected.length} affected, ${notAffected.length} not affected, ${near} near an edge, ${overlap} in two outlines`);
  }

  const picks = pickSample(candidates, METHOD.areas, METHOD.perClass, METHOD.seed)
    .sort((a, b) => a.area - b.area || a.lat - b.lat || a.lon - b.lon)
    .map((p, i, all) => ({ ...p, id: `R1-A${String(p.area).padStart(2, '0')}-${String(all.slice(0, i).filter((q) => q.area === p.area).length + 1).padStart(3, '0')}` }));

  mkdirSync(OUT, { recursive: true });
  const f5 = (x: number) => x.toFixed(5);
  writeFileSync(
    `${OUT}/plots.csv`,
    ['# Replay R-1 sample points (docs/REPLAY-METHOD.md). Each point is one plot in its own village. low_lying is 1 for every point: an assumption, not a fact.',
      'plot_id,village,lat,lon,area_ha,crop,elev_above_river_m,low_lying,river_reach,area_no,class',
      ...picks.map((p) => csvLine([p.id, p.id, f5(p.lat), f5(p.lon), '', '', '', 1, reachOf(p.lat, p.lon).map((r) => `${r.id}:${r.lagH}`).join(';'), p.area, p.class])),
    ].join('\n') + '\n',
  );
  const names = new Map(record.aois.map((a) => [a.number, a.name]));
  writeFileSync(
    `${OUT}/confirmed.csv`,
    ['# Replay R-1 labels. R1-FLOOD: from the first delivered Copernicus EMS flood extent. R1-DRY: assumed quiet, not independently confirmed.',
      'event_id,window_start_utc,window_end_utc,village,status,source',
      ...picks.map((p) => csvLine(['R1-FLOOD', win.event[0], win.event[1], p.id, p.class, `Copernicus EMS EMSR838, first delivered flood extent, area ${p.area} (${names.get(p.area)})`])),
      ...picks.map((p) => csvLine(['R1-DRY', win.quiet[0], win.quiet[1], p.id, 'not_affected', 'assumed quiet: no Copernicus EMS flood activation covers this area in this window (not independently confirmed)'])),
    ].join('\n') + '\n',
  );
  const cells = new Map<string, number>();
  for (const p of picks) {
    const c = era5Cell(p.lat, p.lon);
    const k = `${c.lat},${c.lon}`;
    cells.set(k, (cells.get(k) ?? 0) + 1);
  }
  writeFileSync(
    `${OUT}/sample.json`,
    JSON.stringify(
      {
        method: METHOD,
        windows: win,
        areas: stats,
        taken: { affected: picks.filter((p) => p.class === 'affected').length, not_affected: picks.filter((p) => p.class === 'not_affected').length, points: picks.length },
        pointsWithRiverReach: picks.filter((p) => reachOf(p.lat, p.lon).length > 0).length,
        rainCells: [...cells].map(([k, points]) => ({ lat: Number(k.split(',')[0]), lon: Number(k.split(',')[1]), points })),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`sampled ${picks.length} points (${picks.filter((p) => p.class === 'affected').length} affected, ${picks.filter((p) => p.class === 'not_affected').length} not affected) in ${cells.size} rain cells`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
