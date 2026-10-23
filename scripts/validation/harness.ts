// Real-data validation harness. It runs the SAME rule code the app uses (src/sim/rules.ts) over real rainfall and river
// series, and compares what the rules would have detected with the villages an official process later confirmed as
// affected. It reads files, computes, and writes a report. It never fetches, scrapes or invents data.
//
// What it can and cannot say is written into every report: village level only, rules A (rain on low-lying land) and C
// (river or dam) only, because no radar input is defined, and only for the villages the confirming process labelled.
// Schemas, units, the time zone and provenance fields are documented in docs/VALIDATION.md.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readTable, type Table } from './csv.ts';
import { RULE_VERSIONS, ruleA, ruleC, combine, type GaugeSeries } from '../../src/sim/rules.ts';

export const FILES = ['rainfall.csv', 'river.csv', 'confirmed.csv', 'plots.csv'] as const;
export type FileName = (typeof FILES)[number];

const REQUIRED: Record<FileName, string[]> = {
  'rainfall.csv': ['station_id', 'lat', 'lon', 'time_utc', 'rain_mm'],
  'river.csv': ['gauge_id', 'lat', 'lon', 'kind', 'unit', 'danger_level', 'time_utc', 'value'],
  'confirmed.csv': ['event_id', 'window_start_utc', 'window_end_utc', 'village', 'status', 'source'],
  'plots.csv': ['plot_id', 'village', 'lat', 'lon'],
};

export interface Provenance { source: string; licence: string; retrieved: string; url?: string; notes?: string }
export interface ProvenanceFile { _fixture?: boolean; _dataset?: string; [file: string]: Provenance | boolean | string | undefined }

export interface Params {
  /** mm in 24 h that starts the event clock at a gauge, and mm in 24 h that fires Rule A on a low-lying plot. */
  rain24: number;
  rainHeavy: number;
  /** a plot is low-lying when it sits less than this many metres above the river (used when plots.csv has no low_lying flag) */
  lowElevM: number;
  /** Rule C: longest flood-wave travel time from a gauge to a plot, and hours from a reading to the rule being evaluated */
  maxLagH: number;
  latencyH: number;
  /** a plot uses the nearest rain station only when it is within this distance */
  maxStationKm: number;
  /** a river reading counts for this many hours after it was taken */
  staleH: number;
}

export interface Options {
  /** folder holding the four CSV files and PROVENANCE.json */
  dir: string;
  /** the app's scenario file: the default rule thresholds are read from it so app and harness cannot drift apart */
  scenario?: string;
  overrides?: Partial<Params>;
  /** the files are the synthetic test fixture: the report says so and can never be published */
  fixture?: boolean;
}

export interface InputInfo {
  bytes: number;
  sha256: string;
  rows: number;
  timeRange: [string, string] | null;
  provenance: Provenance | null;
  problems: { count: number; samples: string[] };
}

export interface VillageResult {
  name: string;
  label: 'affected' | 'not_affected';
  plots: number;
  evaluable: boolean;
  predicted: boolean;
  firedBy: string[];
  firstFireUtc: string | null;
  note?: string;
}
export interface Confusion { tp: number; fp: number; fn: number; tn: number }
export interface EventResult {
  id: string;
  window: [string, string];
  villages: VillageResult[];
  noPlotData: string[];
  notEvaluable: string[];
  confusion: Confusion;
  precision: number | null;
  recall: number | null;
  misses: string[];
  falseAlarms: string[];
}

export interface Report {
  kind: 'saboot.validation-report';
  v: 1;
  /** True when the inputs are the synthetic test fixture. A fixture report is never shown in the product. */
  fixture: boolean;
  dataset: string | null;
  app: { ruleVersions: typeof RULE_VERSIONS };
  parameters: Params;
  rulesEvaluated: string[];
  rulesNotEvaluated: Record<string, string>;
  inputs: Record<string, InputInfo>;
  events: EventResult[];
  total: { confusion: Confusion; precision: number | null; recall: number | null; villagesLabelled: number; villagesNotEvaluable: number };
  limits: string[];
  errors: string[];
  reportSha256: string;
}

const sha256 = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const round = (x: number | null, d = 3) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);
/** A full ISO-8601 date and time with its zone: 2000-01-01T08:00:00Z, 2000-01-01 08:00+05:30. Seconds and fractions are optional. */
const ISO_TIME = /^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]+)?)?(Z|[+-][0-9]{2}:?[0-9]{2})$/;
const HOUR = 3600e3;

/**
 * Parse an ISO-8601 time that carries its zone. Anything else is rejected: a time without a zone is ambiguous, and a looser
 * check let the digits of a year ("01-02-2000") pass for an offset.
 */
export function parseTime(s: string | undefined): number | null {
  const x = s?.trim() ?? '';
  if (!ISO_TIME.test(x)) return null;
  const t = Date.parse(x.replace(' ', 'T').replace(/([+-][0-9]{2})([0-9]{2})$/, '$1:$2'));
  return Number.isFinite(t) ? t : null;
}
const num = (s: string | undefined): number | null => (s === undefined || s.trim() === '' ? null : Number.isFinite(Number(s)) ? Number(s) : null);
const iso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z');

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Default parameters: exactly the ones the app uses, read from its scenario file, then any override. */
export function defaultParams(scenarioPath = 'public/data/flood-replay.json', overrides: Partial<Params> = {}): Params {
  const raw = JSON.parse(readFileSync(scenarioPath, 'utf8')) as { thresholds: { rain24: number; rainHeavy: number; lowElev: number }; river?: { maxLagH: number; latencyH: number } };
  return {
    rain24: raw.thresholds.rain24,
    rainHeavy: raw.thresholds.rainHeavy,
    lowElevM: raw.thresholds.lowElev,
    maxLagH: raw.river?.maxLagH ?? 12,
    latencyH: raw.river?.latencyH ?? 0.5,
    maxStationKm: 25,
    staleH: 6,
    ...overrides,
  };
}

interface Rain {
  id: string;
  pos: [number, number];
  /** depth by absolute hour (ms since epoch / HOUR): a reading counts from the hour boundary at or after its time */
  perHour: Map<number, number>;
  /** the hours a reading covers (its interval ending at its time), whether or not the depth is placed there */
  covered: Set<number>;
}

/** A rain station is used when, between its first and last hour in the window, at least this share of the hours were reported. */
const MIN_COVERAGE = 0.9;

/** Hours reported in [from, to]: usable when there are some and few of the hours between the first and the last are missing. */
function reportsCleanly(s: Rain, from: number, to: number): boolean {
  let first = Infinity, last = -Infinity, n = 0;
  for (const h of s.covered) if (h >= from && h <= to) { n++; if (h < first) first = h; if (h > last) last = h; }
  return n > 0 && n / (last - first + 1) >= MIN_COVERAGE;
}
interface Gauge { id: string; pos: [number, number]; kind: 'stage' | 'release'; unit: string; danger: number; readings: [number, number][] }

export function runValidation(opt: Options): Report {
  const errors: string[] = [];
  const params = defaultParams(opt.scenario, opt.overrides);
  const prov = existsSync(join(opt.dir, 'PROVENANCE.json')) ? (JSON.parse(readFileSync(join(opt.dir, 'PROVENANCE.json'), 'utf8')) as ProvenanceFile) : null;
  if (!prov) errors.push('PROVENANCE.json is missing: every input file needs its source, licence and retrieval date (see docs/VALIDATION.md).');
  const fixture = !!opt.fixture || prov?._fixture === true;

  const inputs: Record<string, InputInfo> = {};
  const tables = {} as Record<FileName, Table>;
  /** files whose header lacks a required column: counted as one problem that is not a row */
  const headerProblem = new Set<FileName>();
  for (const f of FILES) {
    const p = join(opt.dir, f);
    if (!existsSync(p)) {
      errors.push(`${f} is missing from ${opt.dir}`);
      tables[f] = { header: [], rows: [], lines: 0 };
      continue;
    }
    const buf = readFileSync(p);
    const t = readTable(buf.toString('utf8'));
    tables[f] = t;
    const problems: string[] = [];
    const missing = REQUIRED[f].filter((c) => !t.header.includes(c));
    if (missing.length) {
      problems.push(`missing column(s): ${missing.join(', ')}`);
      errors.push(`${f} is missing column(s): ${missing.join(', ')}`);
      headerProblem.add(f);
    }
    if (t.unterminated) errors.push(`${f} has an unbalanced quote: everything after it was read as one field. Fix the file and run again.`);
    const pv = prov?.[f];
    const provenance = pv && typeof pv === 'object' ? pv : null;
    if (!provenance) errors.push(`no provenance for ${f}: add its source, licence and retrieval date to PROVENANCE.json`);
    else for (const k of ['source', 'licence', 'retrieved'] as const) if (!provenance[k]) errors.push(`provenance for ${f} has no "${k}"`);
    inputs[f] = { bytes: buf.length, sha256: sha256(buf), rows: t.rows.length, timeRange: null, provenance, problems: { count: problems.length, samples: problems } };
  }
  const problem = (f: FileName, line: number, msg: string) => {
    const pr = inputs[f].problems;
    pr.count++;
    if (pr.samples.length < 20) pr.samples.push(`row ${line + 2}: ${msg}`);
  };
  const timeRange = (f: FileName, ts: number[]) => {
    if (!ts.length) return;
    // a loop, not Math.min(...ts): spreading a very large array into a call overflows the stack
    let lo = ts[0], hi = ts[0];
    for (const x of ts) { if (x < lo) lo = x; if (x > hi) hi = x; }
    inputs[f].timeRange = [iso(lo), iso(hi)];
  };

  // ---- rainfall: depth in the interval ENDING at time_utc. The whole depth counts from the first whole hour at or after
  // that time, and is not spread back over a longer interval: a daily total must not fire a rule before it was known.
  const stations = new Map<string, Rain>();
  const rainTimes: number[] = [];
  tables['rainfall.csv'].rows.forEach((r, i) => {
    const t = parseTime(r.time_utc), lat = num(r.lat), lon = num(r.lon), mm = num(r.rain_mm), k = r.interval_h === undefined || r.interval_h === '' ? 1 : num(r.interval_h);
    if (!r.station_id || t === null || lat === null || lon === null || mm === null || k === null || mm < 0 || k <= 0 || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      problem('rainfall.csv', i, 'bad station_id, time_utc (needs a zone), lat, lon, rain_mm (>= 0) or interval_h (> 0)');
      return;
    }
    rainTimes.push(t);
    let s = stations.get(r.station_id);
    if (!s) stations.set(r.station_id, (s = { id: r.station_id, pos: [lat, lon], perHour: new Map(), covered: new Set() }));
    // rounded UP: a reading taken at 08:30 counts from 09:00, never from 08:00
    const endHour = Math.ceil(t / HOUR);
    s.perHour.set(endHour, (s.perHour.get(endHour) ?? 0) + mm);
    for (let j = 0, hours = Math.max(1, Math.round(k)); j < hours; j++) s.covered.add(endHour - j);
  });
  timeRange('rainfall.csv', rainTimes);

  // ---- river gauges
  const gauges = new Map<string, Gauge>();
  const riverTimes: number[] = [];
  tables['river.csv'].rows.forEach((r, i) => {
    const t = parseTime(r.time_utc), lat = num(r.lat), lon = num(r.lon), v = num(r.value), danger = num(r.danger_level);
    const kind = r.kind === 'stage' || r.kind === 'release' ? r.kind : null;
    if (!r.gauge_id || t === null || lat === null || lon === null || v === null || danger === null || !kind || !r.unit) {
      problem('river.csv', i, 'bad gauge_id, kind (stage or release), unit, danger_level, time_utc (needs a zone), lat, lon or value');
      return;
    }
    riverTimes.push(t);
    let g = gauges.get(r.gauge_id);
    if (!g) gauges.set(r.gauge_id, (g = { id: r.gauge_id, pos: [lat, lon], kind, unit: r.unit, danger, readings: [] }));
    else if (g.danger !== danger || g.unit !== r.unit || g.kind !== kind) problem('river.csv', i, `${r.gauge_id}: kind, unit and danger_level must be the same on every row of a gauge`);
    g.readings.push([t, v]);
  });
  timeRange('river.csv', riverTimes);
  for (const g of gauges.values()) g.readings.sort((a, b) => a[0] - b[0]);

  // ---- plots
  interface P { id: string; village: string; pos: [number, number]; lowLying: boolean | null; reach: { gauge: string; lagH: number }[] }
  const plots: P[] = [];
  tables['plots.csv'].rows.forEach((r, i) => {
    const lat = num(r.lat), lon = num(r.lon);
    if (!r.plot_id || !r.village || lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      problem('plots.csv', i, 'bad plot_id, village, lat or lon');
      return;
    }
    const flag = r.low_lying === '1' || r.low_lying === 'true' ? true : r.low_lying === '0' || r.low_lying === 'false' ? false : null;
    const elev = num(r.elev_above_river_m ?? '');
    const lowLying = flag !== null ? flag : elev !== null ? elev < params.lowElevM : null;
    const reach: P['reach'] = [];
    for (const part of (r.river_reach ?? '').split(';').map((x) => x.trim()).filter(Boolean)) {
      const [g, lag] = part.split(':');
      const l = num(lag ?? '');
      if (!g || l === null || l < 0) problem('plots.csv', i, `river_reach "${part}" must look like GAUGE_ID:lag_hours`);
      else reach.push({ gauge: g.trim(), lagH: l });
    }
    plots.push({ id: r.plot_id, village: r.village, pos: [lat, lon], lowLying, reach });
  });

  // ---- events and their labels
  interface Ev { id: string; start: number; end: number; labels: Map<string, 'affected' | 'not_affected'> }
  const events = new Map<string, Ev>();
  tables['confirmed.csv'].rows.forEach((r, i) => {
    const a = parseTime(r.window_start_utc), b = parseTime(r.window_end_utc);
    if (!r.event_id || !r.village || a === null || b === null || b <= a || (r.status !== 'affected' && r.status !== 'not_affected')) {
      problem('confirmed.csv', i, 'bad event_id, village, window (UTC with a zone, end after start) or status (affected or not_affected)');
      return;
    }
    let e = events.get(r.event_id);
    if (!e) events.set(r.event_id, (e = { id: r.event_id, start: a, end: b, labels: new Map() }));
    else if (e.start !== a || e.end !== b) problem('confirmed.csv', i, `${r.event_id}: the window must be the same on every row of an event`);
    e.labels.set(r.village, r.status);
  });
  timeRange('confirmed.csv', [...events.values()].flatMap((e) => [e.start, e.end]));

  // ---- a row that was rejected is a row the rules never saw: say so as an error, which keeps the report from being published
  for (const f of FILES) {
    const info = inputs[f];
    if (!info) continue;
    const bad = info.problems.count - (headerProblem.has(f) ? 1 : 0);
    if (bad > 0) errors.push(`${bad} of ${info.rows} rows in ${f} were rejected or had problems (first: ${info.problems.samples.find((s) => s.startsWith('row ')) ?? 'see the report'})`);
  }

  // ---- run the rules, plot by plot, per event
  const results: EventResult[] = [];
  for (const ev of events.values()) {
    const T0 = Math.floor(ev.start / HOUR) * HOUR;
    const H = Math.ceil((ev.end - T0) / HOUR);
    // a station is used for this event only when it reported cleanly in its window; its gaps would read as dry weather
    const usable = new Set<string>();
    for (const s of stations.values()) if (reportsCleanly(s, T0 / HOUR - 24, ev.end / HOUR)) usable.add(s.id);
    const byVillage = new Map<string, P[]>();
    for (const p of plots) byVillage.set(p.village, [...(byVillage.get(p.village) ?? []), p]);
    const villages: VillageResult[] = [];
    const noPlotData: string[] = [];
    const notEvaluable: string[] = [];
    for (const [name, label] of ev.labels) {
      const ps = byVillage.get(name) ?? [];
      if (!ps.length) { noPlotData.push(name); continue; }
      let evaluable = false;
      let predicted = false;
      const fired = new Set<string>();
      let first: number | null = null;
      for (const p of ps) {
        // nearest rain station that reported cleanly, within reach
        let near: Rain | null = null, best = Infinity;
        for (const s of stations.values()) {
          const d = haversineKm(p.pos, s.pos);
          if (d <= params.maxStationKm && d < best && usable.has(s.id)) { near = s; best = d; }
        }
        let a = { crossT: null as number | null, fireT: null as number | null };
        // Rule A needs to know whether the plot is low-lying: without that, it could never fire, which is not the same as "no event"
        if (near && p.lowLying !== null) {
          const r24: number[] = [];
          for (let h = 0; h <= H; h++) {
            let sum = 0;
            for (let j = 0; j < 24; j++) sum += near.perHour.get(T0 / HOUR + h - j) ?? 0;
            r24.push(sum);
          }
          a = ruleA(r24, p.lowLying === true, params);
          evaluable = true;
        }
        const series: GaugeSeries[] = [];
        for (const r of p.reach) {
          const g = gauges.get(r.gauge);
          if (!g?.readings.length) continue;
          const hourly: number[] = [];
          for (let h = 0; h <= H; h++) {
            const at = T0 + h * HOUR;
            let v = Number.NaN;
            for (let k = g.readings.length - 1; k >= 0; k--) {
              if (g.readings[k][0] <= at) { if (at - g.readings[k][0] <= params.staleH * HOUR) v = g.readings[k][1]; break; }
            }
            hourly.push(v);
          }
          series.push({ id: g.id, kind: g.kind, series: hourly, danger: g.danger });
        }
        if (series.length) evaluable = true;
        const c = ruleC({ reach: p.reach }, series, { maxLagH: params.maxLagH, latencyH: params.latencyH });
        const det = combine(a, { fireT: null, lastClear: null, baselineClear: false }, c, false);
        if (det.detected) {
          predicted = true;
          for (const f of det.fired) fired.add(f);
          if (first === null || det.detectT! < first) first = det.detectT!;
        }
      }
      const vr: VillageResult = { name, label, plots: ps.length, evaluable, predicted, firedBy: [...fired].sort(), firstFireUtc: first === null ? null : iso(T0 + first * HOUR) };
      if (!evaluable) { vr.note = 'no rainfall within reach and no river gauge data for any plot: the rules could not run'; notEvaluable.push(name); }
      villages.push(vr);
    }
    const scored = villages.filter((v) => v.evaluable);
    const tp = scored.filter((v) => v.label === 'affected' && v.predicted).length;
    const fp = scored.filter((v) => v.label === 'not_affected' && v.predicted).length;
    const fn = scored.filter((v) => v.label === 'affected' && !v.predicted).length;
    const tn = scored.filter((v) => v.label === 'not_affected' && !v.predicted).length;
    results.push({
      id: ev.id, window: [iso(ev.start), iso(ev.end)], villages, noPlotData, notEvaluable,
      confusion: { tp, fp, fn, tn },
      precision: round(tp + fp ? tp / (tp + fp) : null), recall: round(tp + fn ? tp / (tp + fn) : null),
      misses: scored.filter((v) => v.label === 'affected' && !v.predicted).map((v) => v.name),
      falseAlarms: scored.filter((v) => v.label === 'not_affected' && v.predicted).map((v) => v.name),
    });
  }
  const sum = (k: keyof Confusion) => results.reduce((a, r) => a + r.confusion[k], 0);
  const c: Confusion = { tp: sum('tp'), fp: sum('fp'), fn: sum('fn'), tn: sum('tn') };

  const body: Omit<Report, 'reportSha256'> = {
    kind: 'saboot.validation-report', v: 1, fixture,
    dataset: typeof prov?._dataset === 'string' ? prov._dataset : null,
    app: { ruleVersions: RULE_VERSIONS },
    parameters: params,
    rulesEvaluated: ['A', 'C'],
    rulesNotEvaluated: { B: 'No radar flood-extent input is defined in the schema, so the radar rule was not run on real data.' },
    inputs, events: results,
    total: { confusion: c, precision: round(c.tp + c.fp ? c.tp / (c.tp + c.fp) : null), recall: round(c.tp + c.fn ? c.tp / (c.tp + c.fn) : null), villagesLabelled: c.tp + c.fp + c.fn + c.tn, villagesNotEvaluable: results.reduce((a, r) => a + r.notEvaluable.length, 0) },
    limits: [
      'Village level only. A village counts as detected when any of its plots fired a rule. Plot-level truth is not used.',
      'Rules A (rain on low-lying land) and C (river or dam) only. The radar rule B was not evaluated.',
      'Only villages the confirming process labelled are scored. Villages it did not label are unknown, and are not counted as not affected.',
      'The confirming process may be incomplete or late. A "not affected" label is only as good as that process.',
      'Thresholds are the app’s own scenario parameters, not official levels, unless overridden. Change them only with a stated reason.',
      'A small number of villages gives wide uncertainty. Precision and recall here are measurements on these files, not a promise for any other flood.',
      'The harness checks that detection would have happened and when. It says nothing about evidence quality, claims, eligibility or amounts.',
    ],
    errors,
  };
  return { ...body, reportSha256: sha256(JSON.stringify(body)) };
}

/** The reader-friendly version of a report. */
export function markdown(r: Report): string {
  const pct = (x: number | null) => (x === null ? 'not defined (no denominator)' : `${Math.round(x * 100)}%`);
  const L: string[] = [];
  if (r.fixture) L.push('> **FIXTURE RUN. Synthetic numbers that prove the harness runs. They are not validation and must never be shown in the product.**', '');
  L.push('# Saboot real-data validation report', '');
  L.push(`Dataset: ${r.dataset ?? 'not named'}  `, `Report fingerprint (SHA-256): \`${r.reportSha256}\`  `, `Rule versions: A ${r.app.ruleVersions.A}, B ${r.app.ruleVersions.B}, C ${r.app.ruleVersions.C}  `, `Rules evaluated: ${r.rulesEvaluated.join(', ')}. ${Object.entries(r.rulesNotEvaluated).map(([k, v]) => `Rule ${k} not evaluated: ${v}`).join(' ')}`, '');
  if (r.errors.length) L.push('## Problems with the inputs', '', ...r.errors.map((e) => `- ${e}`), '');
  L.push('## Inputs', '', '| File | Rows | Time range (UTC) | SHA-256 | Source | Licence | Retrieved | Row problems |', '|---|---|---|---|---|---|---|---|');
  for (const [f, i] of Object.entries(r.inputs)) {
    L.push(`| ${f} | ${i.rows} | ${i.timeRange ? `${i.timeRange[0]} to ${i.timeRange[1]}` : 'none'} | \`${i.sha256.slice(0, 12)}\` | ${i.provenance?.source ?? 'MISSING'} | ${i.provenance?.licence ?? 'MISSING'} | ${i.provenance?.retrieved ?? 'MISSING'} | ${i.problems.count} |`);
  }
  L.push('', '## Parameters', '', '```json', JSON.stringify(r.parameters, null, 2), '```', '');
  L.push('## Result', '', `Villages scored: ${r.total.villagesLabelled}. Not evaluable: ${r.total.villagesNotEvaluable}.`, '', '| | Affected | Not affected |', '|---|---|---|', `| Detected | ${r.total.confusion.tp} | ${r.total.confusion.fp} |`, `| Not detected | ${r.total.confusion.fn} | ${r.total.confusion.tn} |`, '', `Precision ${pct(r.total.precision)}. Recall ${pct(r.total.recall)}.`, '');
  for (const e of r.events) {
    L.push(`### Event ${e.id}`, '', `Window: ${e.window[0]} to ${e.window[1]}. Precision ${pct(e.precision)}, recall ${pct(e.recall)}.`, '');
    L.push('| Village | Label | Plots | Detected | Rules | First fired (UTC) |', '|---|---|---|---|---|---|');
    for (const v of e.villages) L.push(`| ${v.name} | ${v.label} | ${v.plots} | ${v.evaluable ? (v.predicted ? 'yes' : 'no') : 'not evaluable'} | ${v.firedBy.join(', ') || '-'} | ${v.firstFireUtc ?? '-'} |`);
    L.push('', `Misses: ${e.misses.join(', ') || 'none'}.  `, `False alarms: ${e.falseAlarms.join(', ') || 'none'}.  `, `Labelled but no plot data: ${e.noPlotData.join(', ') || 'none'}.  `, `Not evaluable: ${e.notEvaluable.join(', ') || 'none'}.`, '');
  }
  L.push('## Limits', '', ...r.limits.map((x) => `- ${x}`), '');
  return L.join('\n');
}

/** What the product may show about validation: only a real report, with its limits. A fixture report is refused. */
export function statusFrom(r: Report) {
  if (r.fixture) throw new Error('Refusing to publish: this report was made from the synthetic test fixture, which is never shown in the product.');
  if (r.errors.length) throw new Error(`Refusing to publish: the inputs have problems (${r.errors[0]}).`);
  if (!r.total.villagesLabelled) throw new Error('Refusing to publish: no labelled village could be scored.');
  for (const [f, i] of Object.entries(r.inputs)) if (!i.provenance) throw new Error(`Refusing to publish: ${f} has no provenance.`);
  return {
    v: 1,
    run: true,
    dataset: r.dataset,
    events: r.events.length,
    villagesLabelled: r.total.villagesLabelled,
    precision: r.total.precision,
    recall: r.total.recall,
    rulesEvaluated: r.rulesEvaluated,
    reportSha256: r.reportSha256,
    note: 'Village level, rules A and C only (the radar rule was not evaluated). See docs/VALIDATION.md for what this does and does not show.',
  };
}
