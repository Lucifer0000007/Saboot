// Simulation clock. 1x = 1 sim-hour per 10 s, 10x = 1 h/s, 100x = 10 h/s (7 days in ~17 s).
import { signal, computed } from '@preact/signals';
import { buildModel, type Model } from './model';
import { modelOptions } from './options';
import { rail, cadence } from '../lib/prefs';
import { sha256 } from '../lib/hash';
import { SCENARIO } from '../generated/scenario-summary';
import type { ScenarioRaw } from './types';

/** Length of the replay in hours: read from the scenario by `npm run gen`, never typed in here. */
export const HOURS: number = SCENARIO.hours;
export type Speed = 1 | 10 | 100;
const RATE: Record<Speed, number> = { 1: 0.1, 10: 1, 100: 10 };

/** The loaded scenario file. */
export const rawScenario = signal<ScenarioRaw | null>(null);
/** The model for the scenario, the chosen rail (capture window) and the radar cadence. Rebuilt when either changes. */
export const model = computed<Model | null>(() => {
  const raw = rawScenario.value;
  return raw ? buildModel(raw, modelOptions(rail.value, cadence.value)) : null;
});
export const loadError = signal<string | null>(null);
/** SHA-256 of the scenario file exactly as served: part of the provenance written into every export. */
export const scenarioHash = signal<string | null>(null);
/** Sim time in hours since T0. */
export const t = signal(0);
/** Throttled copy for heavy views (map, lists): updates <= ~6x/s while playing. */
export const tSlow = signal(0);
export const hour = computed(() => Math.min(HOURS, Math.floor(t.value)));
export const playing = signal(false);
export const speed = signal<Speed>(10);

let raf = 0;
let last = 0;
let lastSlow = 0;

function frame(now: number) {
  // rAF timestamps are frame-start times and can precede the performance.now() taken in play().
  const dt = Math.max(0, Math.min(0.25, (now - last) / 1000));
  last = now;
  let nt = t.value + dt * RATE[speed.value];
  if (nt >= HOURS) { nt = HOURS; playing.value = false; }
  t.value = nt;
  if (now - lastSlow > 160 || !playing.value) { tSlow.value = nt; lastSlow = now; }
  if (playing.value) raf = requestAnimationFrame(frame);
}

export function play() {
  if (playing.value) return;
  if (t.value >= HOURS) seek(0);
  playing.value = true;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}
export function pause() {
  playing.value = false;
  cancelAnimationFrame(raf);
  tSlow.value = t.value;
}
export const toggle = () => (playing.value ? pause() : play());

export function seek(h: number) {
  const v = Math.max(0, Math.min(HOURS, h));
  t.value = v;
  tSlow.value = v;
}

export async function loadScenario() {
  try {
    const res = await fetch('data/flood-replay.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const raw = JSON.parse(text) as ScenarioRaw;
    rawScenario.value = raw;
    void sha256(text).then((h) => (scenarioHash.value = h));
  } catch (e) {
    loadError.value = String(e);
  }
}

/** The demo farmer: the plot the story, the tour and the explainer follow. */
export const demoPlot = computed(() => {
  const m = model.value;
  return m ? m.plots.find((p) => p.id === m.raw.focus)! : null;
});
export const demoDet = computed(() => {
  const m = model.value, p = demoPlot.value;
  return m && p ? m.det[p.idx] : null;
});
/**
 * The plot the farmer app is acting on. null = the demo farmer. A helper session sets it to the farmer being helped, so the
 * capture, packet and filing screens work on that farmer's own plot and device log.
 */
export const activePlotId = signal<string | null>(null);
export const focusPlot = computed(() => {
  const m = model.value;
  if (!m) return null;
  return m.plots.find((p) => p.id === (activePlotId.value ?? m.raw.focus)) ?? demoPlot.value;
});
export const focusDet = computed(() => {
  const m = model.value, p = focusPlot.value;
  return m && p ? m.det[p.idx] : null;
});

/** Map units -> synthetic lat/lon (the district is fictional; coordinates are illustrative only). */
export function toLatLon(m: Model, x: number, y: number): [number, number] {
  const [lat0, lon0] = m.raw.map.origin;
  const lat = lat0 - (y * m.raw.map.scaleM) / 111320;
  const lon = lon0 + (x * m.raw.map.scaleM) / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat, lon];
}
