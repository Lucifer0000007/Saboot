// Build-time generator for the "Flood replay" scenario. Seeded => identical output on every run.
// Run: npm run gen   (node --import ./scripts/ts-resolve.mjs scripts/gen-scenario.ts; Node >= 23.6 strips types natively)
// Writes public/data/flood-replay.json, src/generated/scenario-summary.ts and docs/scenario-facts.json (+ the docs blocks).
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildModel } from '../src/sim/model.ts';
import { modelOptions } from '../src/sim/options.ts';
import type { ScenarioRaw, PlotRaw, Behaviour, Lang } from '../src/sim/types.ts';

const SEED = 20260714;
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const range = (a: number, b: number) => a + (b - a) * rnd();
const pick = <T>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const r1 = (x: number) => Math.round(x * 10) / 10;

const W = 600, Hm = 420, CELL = 10, COLS = W / CELL, ROWS = Hm / CELL, HOURS = 168;

// ---------- geometry ----------
type P = [number, number];
function catmull(pts: P[], seg = 12): P[] {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const pathD = (pts: P[], close = false) =>
  'M' + pts.map((p) => `${Math.round(p[0])} ${Math.round(p[1])}`).join('L') + (close ? 'Z' : '');
function distToPolyline(x: number, y: number, pl: P[]) {
  let best = Infinity;
  for (let i = 0; i < pl.length - 1; i++) {
    const [ax, ay] = pl[i], [bx, by] = pl[i + 1];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}
function inPoly(x: number, y: number, p: P[]) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// District boundary: jittered rectangle.
const boundary: P[] = [];
const per = 28;
for (let i = 0; i < per; i++) {
  const t = i / per;
  let x: number, y: number;
  if (t < 0.25) { x = 8 + (W - 16) * (t / 0.25); y = 8; }
  else if (t < 0.5) { x = W - 8; y = 8 + (Hm - 16) * ((t - 0.25) / 0.25); }
  else if (t < 0.75) { x = W - 8 - (W - 16) * ((t - 0.5) / 0.25); y = Hm - 8; }
  else { x = 8; y = Hm - 8 - (Hm - 16) * ((t - 0.75) / 0.25); }
  const cx = W / 2, cy = Hm / 2;
  const k = range(0, 14);
  const dx = cx - x, dy = cy - y, dl = Math.hypot(dx, dy);
  boundary.push([x + (dx / dl) * k, y + (dy / dl) * k]);
}

const riverCtl: P[] = [[-10, 70], [70, 96], [170, 88], [255, 128], [318, 212], [400, 248], [482, 262], [556, 298], [612, 326]];
const river = catmull(riverCtl, 10);
const canal = catmull([[40, 410], [150, 360], [210, 262], [214, 200], [190, 120], [205, 10]], 6);
const roads = [
  catmull([[0, 230], [140, 236], [300, 300], [440, 210], [600, 190]], 6),
  catmull([[360, 0], [380, 120], [430, 210], [470, 420]], 6),
];

const villages = [
  { name: 'Kesarpur', x: 112, y: 150, a: -0.12 },
  { name: 'Neelkot', x: 392, y: 180, a: 0.22 },
  { name: 'Ambwali', x: 500, y: 92, a: 0.05 },
  { name: 'Dhanpura', x: 238, y: 318, a: -0.3 },
  { name: 'Sarangwal', x: 520, y: 352, a: 0.15 },
];
const BOWL = { x: 236, y: 326, s: 36, depth: 4.6 };

// ---------- terrain ----------
const lattice: number[][] = [];
for (let j = 0; j <= 8; j++) { lattice.push([]); for (let i = 0; i <= 11; i++) lattice[j].push(rnd()); }
function vnoise(x: number, y: number, sc: number) {
  const gx = x / sc, gy = y / sc;
  const i = Math.floor(gx), j = Math.floor(gy);
  const fx = gx - i, fy = gy - j;
  const s = (t: number) => t * t * (3 - 2 * t);
  const L = (a: number, b: number) => lattice[Math.min(8, Math.max(0, b))][Math.min(11, Math.max(0, a))];
  const a = L(i, j) + (L(i + 1, j) - L(i, j)) * s(fx);
  const b = L(i, j + 1) + (L(i + 1, j + 1) - L(i, j + 1)) * s(fx);
  return a + (b - a) * s(fy);
}
const elevVal: number[] = [];
const dRiver: number[] = [];
let elevStr = '';
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) {
    const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
    const d = distToPolyline(x, y, river);
    dRiver.push(d);
    if (!inPoly(x, y, boundary)) { elevVal.push(NaN); elevStr += '.'; continue; }
    let e = 0.8 + 0.042 * d + 1.1 * (vnoise(x, y, 60) - 0.5) + 0.5 * (vnoise(x + 300, y + 200, 30) - 0.5);
    e -= BOWL.depth * Math.exp(-((x - BOWL.x) ** 2 + (y - BOWL.y) ** 2) / (2 * BOWL.s ** 2));
    e = Math.max(0.2, Math.min(7, e));
    const q = Math.round(e / 0.2);
    elevVal.push(q * 0.2);
    elevStr += q.toString(36);
  }

// ---------- water level & flood ----------
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
function level(h: number) {
  if (h < 8) return 0;
  const main = h <= 20 ? 4.4 * smooth((h - 7) / 13) : 4.4 * Math.exp(-(h - 20) / 70);
  return main + 0.9 * Math.exp(-(((h - 66) / 6) ** 2));
}
let onsetStr = '', recedeStr = '';
const enc = (v: number) => v.toString(36).padStart(2, '0');
for (let i = 0; i < COLS * ROWS; i++) {
  const e = elevVal[i];
  const x = (i % COLS) * CELL + CELL / 2;
  const lag = (x / W) * 9;
  let on = -1, off = -1;
  if (!Number.isNaN(e) && dRiver[i] > 5) {
    for (let h = 0; h <= HOURS; h++) {
      const wet = e < level(h - lag);
      if (wet && on < 0) on = h;
      if (!wet && on >= 0) { off = h; break; }
    }
    if (on >= 0 && off < 0) off = HOURS + 1;
  }
  onsetStr += on < 0 ? 'zz' : enc(on);
  recedeStr += on < 0 ? 'zz' : enc(off);
}

// ---------- rainfall (tenths of mm) ----------
const gauss = (h: number, mu: number, s: number) => Math.exp(-(((h - mu) / s) ** 2) / 2);
function series(scale: number, shift: number, hail = false) {
  const out: number[] = [];
  for (let h = 0; h <= HOURS; h++) {
    let mm = scale * (14.5 * gauss(h, 13 + shift, 5) + 4.5 * gauss(h, 58 + shift, 3)) + (rnd() < 0.25 ? rnd() * 0.6 : 0);
    if (hail) mm += h === 60 ? 8 : h === 61 ? 21 : h === 62 ? 9 : 0;
    out.push(Math.round(mm * 10));
  }
  return out;
}
const stations = [
  { id: 'AWS-1', name: 'Kesarpur gauge', x: 96, y: 196, rain: series(1, 0) },
  { id: 'AWS-2', name: 'Block HQ gauge', x: 330, y: 262, rain: series(0.86, 1) },
  { id: 'AWS-3', name: 'Ambwali gauge', x: 520, y: 140, rain: series(0.32, 2, true) },
];
const sar: number[] = [];
for (let h = 6; h <= HOURS; h += 12) sar.push(h);
// The slower cadence: a pass every few days, closer to real revisit times. Still simulated.
const sarSlow: number[] = [];
for (let h = 6; h <= HOURS; h += 72) sarSlow.push(h);

// ---------- river gauges for Rule C ----------
// Drawn from their OWN seeded stream, so the plots, rain and terrain above stay byte-identical to earlier builds.
// The stage is the same simulated water level that floods the plots, read at the gauge position with the same lag:
// the river rule therefore works by construction here. That shows the mechanism, not real-world accuracy.
const rndRiver = mulberry32(SEED ^ 0x52495645);
const stageCm = (gx: number) => {
  const out: number[] = [];
  for (let h = 0; h <= HOURS; h++) out.push(Math.round(80 + 100 * level(h - (gx / W) * 9) + (rndRiver() - 0.5) * 4));
  return out;
};
const riverRule = {
  gauges: [
    { id: 'RG-1', name: 'Upstream river gauge', kind: 'stage' as const, unit: 'cm', x: 70, y: 96, series: stageCm(70), danger: 300 },
    { id: 'RG-2', name: 'Midstream river gauge', kind: 'stage' as const, unit: 'cm', x: 318, y: 212, series: stageCm(318), danger: 300 },
  ],
  // Scenario parameters (uncalibrated): round numbers chosen before looking at results.
  reachM: 1000, lowReachM: 1500, adjacentM: 500, waveKmh: 0.7, maxLagH: 12, latencyH: 0.5,
};

// ---------- plots ----------
const FIRST_F = ['Harjit', 'Gurpreet', 'Sunita', 'Manjit', 'Jaswinder', 'Savita', 'Kamla', 'Rekha', 'Paramjit', 'Amandeep', 'Pooja', 'Nirmal'];
const FIRST_M = ['Baldev', 'Sukhwinder', 'Ramesh', 'Kuldeep', 'Rajinder', 'Mohinder', 'Satnam', 'Inderjit', 'Balwinder', 'Jagdish', 'Surjit', 'Avtar', 'Gurnam', 'Dalip'];
const SUR = ['Sandhu', 'Gill', 'Dhillon', 'Sharma', 'Brar', 'Rana', 'Sidhu', 'Yadav', 'Grewal', 'Saini'];
const CROPS: Record<number, string[]> = {
  0: ['Paddy', 'Paddy', 'Paddy', 'Maize'],
  1: ['Paddy', 'Paddy', 'Sugarcane', 'Vegetables'],
  2: ['Cotton', 'Cotton', 'Maize', 'Paddy'],
  3: ['Paddy', 'Maize', 'Paddy', 'Vegetables'],
  4: ['Paddy', 'Paddy', 'Sugarcane', 'Maize'],
};
const plots: PlotRaw[] = [];
let pid = 1;
villages.forEach((v, vi) => {
  const slots: P[] = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) slots.push([(i - 1.5) * 26, (j - 1.5) * 20]);
  for (let i = slots.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [slots[i], slots[k]] = [slots[k], slots[i]]; }
  let made = 0;
  for (const [sx, sy] of slots) {
    if (made === 10) break;
    const ca = Math.cos(v.a), sa = Math.sin(v.a);
    const cx = v.x + sx * ca - sy * sa, cy = v.y + sx * sa + sy * ca;
    if (distToPolyline(cx, cy, river) < 16 || !inPoly(cx, cy, boundary)) continue;
    const hw = 12 - range(0, 1.5), hh = 9 - range(0, 1.2);
    const corners: P[] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    const pts: number[] = [];
    for (const [qx, qy] of corners) {
      const jx = qx + range(-1.6, 1.6), jy = qy + range(-1.6, 1.6);
      pts.push(Math.round(cx + jx * ca - jy * sa), Math.round(cy + jx * sa + jy * ca));
    }
    const female = rnd() < 0.4;
    const first = female ? pick(FIRST_F) : pick(FIRST_M);
    const sur = female && rnd() < 0.6 ? 'Kaur' : !female && rnd() < 0.5 ? 'Singh' : pick(SUR);
    const lr = rnd();
    const lang: Lang = lr < 0.5 ? 'pa' : lr < 0.85 ? 'hi' : 'en';
    plots.push({
      id: 'P-' + String(pid++).padStart(2, '0'),
      v: vi, pts, crop: pick(CROPS[vi]), name: `${first} ${sur}`, lang,
      khasra: `${Math.floor(range(12, 240))}/${Math.floor(range(1, 19))}`,
      b: ['quiet', 0, 0, 0, 0, -1, -1],
    });
    made++;
  }
});

const raw: ScenarioRaw = {
  v: 1, seed: SEED,
  name: 'Flood replay',
  district: 'Kesargarh District (fictional)',
  block: 'Kesargarh block',
  t0: '2026-07-14T00:00:00+05:30',
  hours: HOURS,
  grid: { cols: COLS, rows: ROWS, cell: CELL },
  map: {
    w: W, h: Hm, scaleM: 10, origin: [30.9, 75.6],
    boundary: pathD(boundary, true), river: pathD(river), canal: pathD(canal),
    roads: roads.map((r) => pathD(r)),
    villages: villages.map(({ name, x, y }) => ({ name, x, y })),
  },
  elev: elevStr, onset: onsetStr, recede: recedeStr,
  stations, sar, sarSlow,
  // Paddy in the kharif transplanting season stands in water on purpose: radar sees this share of it water anyway.
  baselineWet: { crops: ['Paddy'], frac: 0.6 },
  river: riverRule,
  thresholds: { rain24: 64.5, rainHeavy: 100, floodFrac: 0.3, clearFrac: 0.05, damageFrac: 0.3, damageHours: 12, lowElev: 2.6, midElev: 4.2 },
  hail: { t: 61, x: 505, y: 96, r: 70 },
  focus: '',
  plots,
};

// ---------- behaviours (depend on deterministic detection) ----------
// The judge's farmer: a low-lying, truly flooded paddy plot in Kesarpur.
const m0 = buildModel(raw, modelOptions('pmfby'));
const focusIdx = m0.plots.find((p) => p.v === 0 && p.terrain === 0 && m0.truth[p.idx])!.idx;
const fp = raw.plots[focusIdx];
fp.name = 'Harjit Kaur';
fp.lang = 'pa';
fp.crop = 'Paddy';
raw.focus = fp.id;
// Personas are chosen on the PMFBY window so the 'missed' farmer is late on both rails.
const m = buildModel(raw, modelOptions('pmfby'));
const det = m.det;
const detected = m.plots.filter((p) => det[p.idx].detected);
const used = new Set<number>();
type MP = (typeof m.plots)[number];
function choose(pred: (p: MP) => boolean, why: string, fallback: (p: MP) => boolean = () => true) {
  const c = detected.find((p) => !used.has(p.idx) && pred(p)) ?? detected.find((p) => !used.has(p.idx) && fallback(p));
  if (!c) throw new Error('No plot for persona: ' + why);
  used.add(c.idx);
  return c;
}
const focus = choose((p) => p.idx === focusIdx, 'focus', () => false);
const offline = choose((p) => p.v === 1 && m.truth[p.idx], 'offline');
const missed = choose((p) => p.v === 4 && m.truth[p.idx], 'missed');
const nodmg = choose((p) => !m.truth[p.idx], 'nodamage');
const assisted = choose((p) => p.v === 3 && m.truth[p.idx], 'assisted', (p) => m.truth[p.idx]);
const partial = [choose((p) => m.truth[p.idx], 'partial1'), choose((p) => p.v === 3, 'partial2')];
const slow = [choose((p) => m.truth[p.idx] && p.v === 0, 'slow1', (p) => m.truth[p.idx]), choose((p) => m.truth[p.idx] && p.v === 4, 'slow2', (p) => m.truth[p.idx])];
const noref = choose((p) => m.truth[p.idx], 'noref');

const B = (p: { idx: number }, b: Behaviour) => { raw.plots[p.idx].b = b; };
for (const p of detected) {
  if (used.has(p.idx)) continue;
  // [persona, capture, shots, geoOffset m, sync, file, ack]
  // A plot the synthetic truth did not flood is a false alarm, and its farmer answers "no damage" (no claim is started).
  if (!m.truth[p.idx]) { B(p, ['nodamage', r1(range(1.2, 14)), 0, 0, 0, -1, -1]); continue; }
  B(p, ['normal', r1(range(1.2, 14)), 3, 0, r1(range(0.1, 0.6)), r1(range(0.5, 6)), r1(range(18, 56))]);
}
B(focus, ['focus', 3, 3, 0, 0.1, 2, 70]);
B(offline, ['offline', 6.5, 3, 0, 11.5, 3, 40]);
// "missed": first contact only after the deadline (e.g. away; phone off)
const md = det[missed.idx];
B(missed, ['missed', r1(md.deadlineT! - md.alertT! + 7.5), 3, 0, 0.2, 2, -1]);
B(nodmg, ['nodamage', 2.5, 0, 0, 0, -1, -1]);
B(assisted, ['assisted', 9, 3, 0, 0.3, 4, 46]);
B(partial[0], ['partial', 5, 1, 0, 0.2, 3, 50]);
B(partial[1], ['partial', 8, 3, 460, 0.2, 2, 44]);
B(slow[0], ['slowack', 4, 3, 0, 0.2, 2, -1]);
B(slow[1], ['slowack', 7, 3, 0, 0.3, 5, -1]);
B(noref, ['noref', 4.5, 3, 0, 0.2, -1, -1]);

// Helper mode: the helper's queue is four farmers in the demo farmer's village that the rules alerted, with an ordinary
// script, so no special scenario behaviour is lost when a live device log takes a plot over: the first two whose field
// the synthetic truth flooded (script "normal") and the first two false alarms (script "nodamage"), in id order. The mix
// lets the helper meet both paths, photos and "no damage". Chosen by id: no random draws.
const inVillage = m.plots.filter((p) => p.v === focus.v && p.idx !== focus.idx && det[p.idx].detected);
const flooded = inVillage.filter((p) => raw.plots[p.idx].b[0] === 'normal' && m.truth[p.idx]).slice(0, 2);
const falseAlarms = inVillage.filter((p) => raw.plots[p.idx].b[0] === 'nodamage' && !m.truth[p.idx]).slice(0, 2);
raw.helperQueue = [...flooded, ...falseAlarms].sort((x, y) => x.idx - y.idx).map((p) => p.id);

// Relief rail, simulated objection window: a few farmers whose entry on the published draft list looks weak attach
// their sealed evidence. [hours after the officer publishes the list, hours the officer then takes to respond (-1: no
// response yet)]. The people are picked by persona and the numbers are fixed, with no random draws, so nothing else in
// the scenario moves. The judge's farmer files theirs live from the app.
const OBJECTIONS: [{ idx: number }, [number, number]][] = [
  [missed, [6, 30]], [partial[0], [14, 22]], [partial[1], [22, -1]], [slow[0], [30, 12]], [noref, [38, -1]],
];
for (const [p, o] of OBJECTIONS) raw.plots[p.idx].obj = o;

// low-confidence hail path: two farmers in the hail zone answer "yes"
m.plots.filter((p) => m.hailPrompted[p.idx] && !det[p.idx].detected).slice(0, 2).forEach((p) => (raw.plots[p.idx].hailYes = 1));

mkdirSync('public/data', { recursive: true });
const json = JSON.stringify(raw);
writeFileSync('public/data/flood-replay.json', json);

// ---------- report ----------
const m2 = buildModel(raw, modelOptions('pmfby'));
let tp = 0, fpn = 0, fn = 0;
m2.plots.forEach((p) => {
  const d = m2.det[p.idx].detected, t = m2.truth[p.idx];
  if (d && t) tp++; else if (d && !t) fpn++; else if (!d && t) fn++;
});
const fd = m2.det[focus.idx];
console.log(`flood-replay.json: ${(json.length / 1024).toFixed(1)} KB, plots ${raw.plots.length}, detected ${detected.length}`);
console.log(`TP ${tp} FP ${fpn} FN ${fn} | precision ${(tp / (tp + fpn)).toFixed(2)} recall ${(tp / (tp + fn)).toFixed(2)}`);
console.log(`focus ${fp.id} (${focus.village}) rule ${fd.rule} event T+${fd.eventT} alert T+${fd.alertT} deadline T+${fd.deadlineT}`);
const rules: Record<string, number> = {};
detected.forEach((p) => (rules[det[p.idx].rule!] = (rules[det[p.idx].rule!] || 0) + 1));
console.log('rules', rules, 'hail prompted', m2.hailPrompted.filter(Boolean).length);
console.log('personas', raw.plots.filter((p) => p.b[0] !== 'quiet' && p.b[0] !== 'normal').map((p) => `${p.id}:${p.b[0]}`).join(' '));
if (json.length > 40 * 1024) { console.error('Scenario exceeds 40 KB budget'); process.exit(1); }

// ---------- generated summary and facts ----------
const { writeGenerated } = await import('./facts.ts');
await writeGenerated(raw, json);
