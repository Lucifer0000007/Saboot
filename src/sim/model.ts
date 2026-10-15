// Pure, deterministic model shared by the build-time generator and the app.
// No DOM, no randomness. Node runs it directly (type stripping) through scripts/ts-resolve.mjs.
import type { ScenarioRaw, PlotRaw, StationRaw } from './types';
import { modelOptions } from './options';
import { ruleA, ruleB, ruleC, combine, excess, type GaugeSeries, type RuleId, type EventSource, type Confidence } from './rules';
import type { Rail } from '../config';

export type Terrain = 0 | 1 | 2; // low, mid, high
/** Radar pass cadence: 'demo' is the simulated 12-hour cadence, 'slow' a few days (closer to real revisit times, still simulated). */
export type Cadence = 'demo' | 'slow';

export interface ModelOptions {
  rail: Rail;
  /** Hours from the event to the end of the capture window: a rule on the PMFBY rail, advice on the relief rail. */
  windowHours: number;
  cadence: Cadence;
  /** Relief rail, simulated: the hour the officer publishes the draft list (outside Saboot), and how long objections stay open. */
  publishAtHour: number;
  objectionWindowHours: number;
}

export interface Station extends StationRaw {
  mm: Float32Array; // hourly mm
  r24: Float32Array; // trailing 24 h accumulation, mm
  r72: Float32Array;
}

/** A river-stage or dam-release gauge with its position along the river. */
export interface Gauge extends GaugeSeries {
  name: string;
  unit: string;
  x: number;
  y: number;
  /** Metres along the river centre line, from its upstream end. */
  alongM: number;
}

export interface Plot extends PlotRaw {
  idx: number;
  cx: number;
  cy: number;
  areaHa: number;
  samples: Int32Array; // cell index per sample point inside the polygon
  frac: Float32Array; // flooded share per hour
  meanElev: number;
  terrain: Terrain;
  station: number;
  village: string;
  /** Crops that normally show standing water to radar in this season (paddy): the share radar sees anyway, else 0. */
  baseWater: number;
  baselineWet: boolean;
  /** Distance from the plot centre to the river centre line, metres. */
  riverDistM: number;
  /** Why Rule C applies to this plot, or null when the plot is out of the river's reach. */
  riverReach: 'riverside' | 'low-lying' | null;
  /** Gauges upstream of or adjacent to the plot, with the hours the flood wave needs to reach it. */
  reach: { gauge: string; lagH: number }[];
}

export interface Detection {
  detected: boolean;
  /** The rule that fired, or 'multiple' when more than one did. */
  rule: 'rain+terrain' | 'satellite' | 'river' | 'multiple' | null;
  fired: RuleId[];
  ruleAT: number | null; // hour Rule A (rain + terrain) fired
  ruleBT: number | null; // hour Rule B (radar change) fired (pass + processing)
  ruleCT: number | null; // hour Rule C (river or dam) fired
  detectT: number | null;
  eventT: number | null; // clock start = earliest qualifying signal (conservative)
  eventSource: EventSource | null;
  alertT: number | null;
  /** End of the capture window: eventT + windowHours. A rule on the PMFBY rail, advice on the relief rail. */
  deadlineT: number | null;
  crossT: number | null; // hour the nearest rain gauge first crossed the rain24 line
  riverCrossT: number | null; // hour the chosen river gauge reached its danger level
  riverGauge: string | null;
  riverLagH: number | null;
  confidence: Confidence | null;
}

export interface Model {
  raw: ScenarioRaw;
  opts: ModelOptions;
  /** The radar pass hours in use (the demo or the slower cadence). */
  sar: number[];
  gauges: Gauge[];
  cols: number;
  rows: number;
  cell: number;
  elev: Float32Array; // NaN outside
  onset: Int16Array; // -1 never
  recede: Int16Array;
  stations: Station[];
  plots: Plot[];
  det: Detection[];
  truth: boolean[]; // synthetic ground truth: flood-damaged
  wetHours: number[];
  hailPrompted: boolean[];
}

/** SAR under-sees water beneath tall canopy (honest limit): observed share is attenuated. */
export const TALL_CROPS = ['Sugarcane', 'Maize'];

/**
 * Simulated radar observation: the share of the plot seen as water at hour h. Tall crops hide water. Paddy in the
 * standing-water season shows its baseline water plus whatever flood water sits on top of it, which is why radar
 * alone cannot tell irrigation from flood there.
 */
export const sarFrac = (p: Plot, h: number) => {
  const seen = p.frac[h] * (TALL_CROPS.includes(p.crop) ? 0.12 : 1);
  return p.baseWater > 0 ? p.baseWater + (1 - p.baseWater) * seen : seen;
};
/** The observed water above what this crop is expected to show anyway (equal to sarFrac for dry crops). */
export const sarExcess = (p: Plot, h: number) => excess(sarFrac(p, h), p.baseWater);

const CALL_LATENCY = 0.25; // h from detection to voice call delivered

export const b36 = (s: string) => parseInt(s, 36);

export function polygonArea(p: number[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i += 2) {
    const j = (i + 2) % p.length;
    a += p[i] * p[j + 1] - p[j] * p[i + 1];
  }
  return Math.abs(a) / 2;
}

export function centroid(p: number[]): [number, number] {
  let x = 0, y = 0;
  const n = p.length / 2;
  for (let i = 0; i < p.length; i += 2) { x += p[i]; y += p[i + 1]; }
  return [x / n, y / n];
}

export function inPoly(x: number, y: number, p: number[]): boolean {
  let c = false;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** The points of an SVG path made of M and L commands (the river is drawn that way). */
export function parsePolyline(d: string): [number, number][] {
  const out: [number, number][] = [];
  for (const m of d.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)[ ,]\s*(-?\d+(?:\.\d+)?)/g)) out.push([+m[1], +m[2]]);
  return out;
}

/** Nearest point on a polyline: its distance and how far along the line it lies (both in the polyline's units). */
export function projectOnPolyline(pl: [number, number][], x: number, y: number): { dist: number; along: number } {
  let best = Infinity, along = 0, run = 0;
  for (let i = 0; i < pl.length - 1; i++) {
    const [ax, ay] = pl[i], [bx, by] = pl[i + 1];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (len * len || 1)));
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < best) { best = d; along = run + t * len; }
    run += len;
  }
  return { dist: best, along };
}

export function buildModel(raw: ScenarioRaw, opts: ModelOptions = modelOptions()): Model {
  const { cols, rows, cell } = raw.grid;
  const n = cols * rows;
  const elev = new Float32Array(n);
  const onset = new Int16Array(n);
  const recede = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const e = raw.elev[i];
    elev[i] = e === '.' ? NaN : b36(e) * 0.2;
    const o = raw.onset.slice(i * 2, i * 2 + 2);
    const r = raw.recede.slice(i * 2, i * 2 + 2);
    onset[i] = o === 'zz' ? -1 : b36(o);
    recede[i] = r === 'zz' ? -1 : b36(r);
  }
  const H = raw.hours;
  const stations: Station[] = raw.stations.map((s) => {
    const mm = new Float32Array(H + 1);
    const r24 = new Float32Array(H + 1);
    const r72 = new Float32Array(H + 1);
    for (let h = 0; h <= H; h++) mm[h] = s.rain[h] / 10;
    for (let h = 0; h <= H; h++) {
      let a = 0, b = 0;
      for (let k = Math.max(0, h - 23); k <= h; k++) a += mm[k];
      for (let k = Math.max(0, h - 71); k <= h; k++) b += mm[k];
      r24[h] = a;
      r72[h] = b;
    }
    return { ...s, mm, r24, r72 };
  });

  // River geometry for Rule C: where each plot and each gauge sits along the river.
  const scaleM = raw.map.scaleM;
  const riverLine = raw.river ? parsePolyline(raw.map.river) : [];
  const gauges: Gauge[] = (raw.river?.gauges ?? []).map((g) => ({
    id: g.id, kind: g.kind, name: g.name, unit: g.unit, x: g.x, y: g.y, danger: g.danger, series: Int32Array.from(g.series),
    alongM: projectOnPolyline(riverLine, g.x, g.y).along * scaleM,
  }));
  const wetCrops = raw.baselineWet?.crops ?? [];

  const plots: Plot[] = raw.plots.map((p, idx) => {
    const [cx, cy] = centroid(p.pts);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < p.pts.length; i += 2) {
      x0 = Math.min(x0, p.pts[i]); x1 = Math.max(x1, p.pts[i]);
      y0 = Math.min(y0, p.pts[i + 1]); y1 = Math.max(y1, p.pts[i + 1]);
    }
    const s: number[] = [];
    for (let y = y0 + 1; y < y1; y += 2)
      for (let x = x0 + 1; x < x1; x += 2)
        if (inPoly(x, y, p.pts)) {
          const c = Math.min(cols - 1, Math.floor(x / cell)) + Math.min(rows - 1, Math.floor(y / cell)) * cols;
          s.push(c);
        }
    const samples = Int32Array.from(s);
    let me = 0;
    for (const c of samples) me += elev[c];
    me /= samples.length || 1;
    // Difference array: +1 when a sample floods, -1 when it drains; prefix sum = wet samples per hour.
    const diff = new Int32Array(H + 2);
    for (const c of samples) {
      if (onset[c] < 0) continue;
      diff[Math.min(onset[c], H + 1)]++;
      diff[Math.min(recede[c], H + 1)]--;
    }
    const frac = new Float32Array(H + 1);
    for (let h = 0, w = 0; h <= H; h++) {
      w += diff[h];
      frac[h] = w / (samples.length || 1);
    }
    let best = 0, bd = Infinity;
    stations.forEach((st, i) => {
      const d = (st.x - cx) ** 2 + (st.y - cy) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    const th = raw.thresholds;
    const terrain: Terrain = me < th.lowElev ? 0 : me < th.midElev ? 1 : 2;
    const areaHa = (polygonArea(p.pts) * scaleM ** 2) / 10000;
    // Rule C reach: riverside plots, and low-lying plots a little farther out, served by gauges upstream or adjacent.
    let riverDistM = Infinity, alongM = 0;
    let riverReach: Plot['riverReach'] = null;
    let reach: Plot['reach'] = [];
    const R = raw.river;
    if (R && riverLine.length > 1) {
      const pr = projectOnPolyline(riverLine, cx, cy);
      riverDistM = pr.dist * scaleM;
      alongM = pr.along * scaleM;
      riverReach = riverDistM <= R.reachM ? 'riverside' : terrain === 0 && riverDistM <= R.lowReachM ? 'low-lying' : null;
      if (riverReach) {
        reach = gauges
          .filter((g) => g.alongM <= alongM + R.adjacentM)
          .map((g) => ({ gauge: g.id, lagH: Math.max(0, (alongM - g.alongM) / 1000 / R.waveKmh) }));
      }
    }
    const baselineWet = wetCrops.includes(p.crop);
    return {
      ...p, idx, cx, cy, areaHa, samples, frac, meanElev: me, terrain, station: best,
      village: raw.map.villages[p.v].name,
      baseWater: baselineWet ? raw.baselineWet!.frac : 0, baselineWet,
      riverDistM, riverReach, reach,
    };
  });

  const m: Model = {
    raw, opts, sar: opts.cadence === 'slow' && raw.sarSlow ? raw.sarSlow : raw.sar, gauges,
    cols, rows, cell, elev, onset, recede, stations, plots,
    det: [], truth: [], wetHours: [], hailPrompted: [],
  };
  for (const p of plots) {
    m.det.push(detect(m, p));
    let wet = 0;
    for (let h = 0; h <= H; h++) if (p.frac[h] >= raw.thresholds.damageFrac) wet++;
    m.wetHours.push(wet);
    m.truth.push(wet >= raw.thresholds.damageHours);
    const hz = raw.hail;
    m.hailPrompted.push((p.cx - hz.x) ** 2 + (p.cy - hz.y) ** 2 <= hz.r ** 2);
  }
  return m;
}

/**
 * Deterministic event rules (src/sim/rules.ts). Rule A: very heavy 24 h rain over a low-lying plot. Rule B: radar
 * change, the water above what the crop shows anyway. Rule C: a river gauge upstream or adjacent reaches its danger
 * level and the plot is riverside or low-lying within reach. The capture window starts at the EARLIEST qualifying
 * signal, never at alert time.
 */
export function detect(m: Model, p: Plot): Detection {
  const th = m.raw.thresholds;
  const st = m.stations[p.station];
  const R = m.raw.river;
  const a = ruleA(st.r24, p.terrain === 0, th);
  const b = ruleB({ passes: m.sar, observed: (pass) => sarFrac(p, pass), expected: p.baseWater }, th);
  const c = ruleC({ reach: p.reach }, m.gauges, { maxLagH: R?.maxLagH ?? 0, latencyH: R?.latencyH ?? 0 });
  const k = combine(a, b, c, p.baselineWet);
  const rule: Detection['rule'] = !k.fired.length ? null : k.fired.length > 1 ? 'multiple' : k.fired[0] === 'A' ? 'rain+terrain' : k.fired[0] === 'B' ? 'satellite' : 'river';
  return {
    detected: k.detected, rule, fired: k.fired,
    ruleAT: a.fireT, ruleBT: b.fireT, ruleCT: c.fireT,
    detectT: k.detectT, eventT: k.eventT, eventSource: k.eventSource,
    alertT: k.detectT === null ? null : k.detectT + CALL_LATENCY,
    deadlineT: k.eventT === null ? null : k.eventT + m.opts.windowHours,
    crossT: a.crossT, riverCrossT: c.crossT, riverGauge: c.gauge, riverLagH: c.lagH,
    confidence: k.confidence,
  };
}

/** Flood cells as merged horizontal runs for one hour — a single SVG path string. */
export function floodPath(m: Model, h: number): string {
  const { cols, rows, cell, onset, recede } = m;
  let d = '';
  for (let r = 0; r < rows; r++) {
    let run = -1;
    for (let c = 0; c <= cols; c++) {
      const i = r * cols + c;
      const wet = c < cols && onset[i] >= 0 && onset[i] <= h && h < recede[i];
      if (wet && run < 0) run = c;
      if (!wet && run >= 0) {
        d += `M${run * cell} ${r * cell}h${(c - run) * cell}v${cell}h${-(c - run) * cell}z`;
        run = -1;
      }
    }
  }
  return d;
}

export function floodAreaKm2(m: Model, h: number): number {
  let n = 0;
  for (let i = 0; i < m.onset.length; i++) if (m.onset[i] >= 0 && m.onset[i] <= h && h < m.recede[i]) n++;
  const cellM = m.cell * m.raw.map.scaleM;
  return (n * cellM * cellM) / 1e6;
}

export function lowlandPath(m: Model): string {
  const { cols, rows, cell, elev } = m;
  const lim = m.raw.thresholds.lowElev;
  let d = '';
  for (let r = 0; r < rows; r++) {
    let run = -1;
    for (let c = 0; c <= cols; c++) {
      const e = c < cols ? elev[r * cols + c] : NaN;
      const low = e < lim;
      if (low && run < 0) run = c;
      if (!low && run >= 0) {
        d += `M${run * cell} ${r * cell}h${(c - run) * cell}v${cell}h${-(c - run) * cell}z`;
        run = -1;
      }
    }
  }
  return d;
}
