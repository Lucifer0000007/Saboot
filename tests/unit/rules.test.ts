// The three event rules and how they combine: fires, does not fire, boundary values, conservative event time, the
// paddy baseline, the river lag. Pure functions on small hand-made series: no scenario file involved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ruleA, ruleB, ruleC, combine, excess, SAR_LATENCY_H, type GaugeSeries } from '../../src/sim/rules.ts';

const TH = { rain24: 64.5, rainHeavy: 100, floodFrac: 0.3, clearFrac: 0.05 };
const ramp = (n: number, f: (h: number) => number) => Array.from({ length: n }, (_, h) => f(h));

// ---- Rule A -------------------------------------------------------------------------------------------------------
test('Rule A fires on a low-lying plot exactly when 24 h rain reaches the heavy line, and not one hour earlier', () => {
  const r24 = ramp(40, (h) => (h < 10 ? 0 : 20 * (h - 9))); // 20, 40, ... 100 at h = 14
  const a = ruleA(r24, true, TH);
  assert.equal(r24[14], 100);
  assert.equal(a.fireT, 14, 'fires at the first hour with 100 mm');
  assert.equal(a.crossT, 13, 'the rain line (64.5 mm) was crossed at h = 13 (80 mm), before it fired');
});

test('Rule A does not fire just below the heavy line, nor on a plot that is not low-lying', () => {
  const below = ramp(40, (h) => (h < 10 ? 0 : 99.9));
  assert.equal(ruleA(below, true, TH).fireT, null);
  const heavy = ramp(40, (h) => (h < 10 ? 0 : 150));
  assert.equal(ruleA(heavy, false, TH).fireT, null, 'upland plots never fire Rule A');
  assert.equal(ruleA(heavy, false, TH).crossT, 10, 'but the rain line crossing is still recorded as a signal');
  assert.deepEqual(ruleA(ramp(10, () => 0), true, TH), { crossT: null, fireT: null });
});

test('the rain-line boundary is inclusive (64.5 mm counts)', () => {
  assert.equal(ruleA(ramp(5, (h) => (h === 3 ? 64.5 : 0)), false, TH).crossT, 3);
  assert.equal(ruleA(ramp(5, (h) => (h === 3 ? 64.49 : 0)), false, TH).crossT, null);
});

// ---- Rule B -------------------------------------------------------------------------------------------------------
const passes = [6, 18, 30, 42];
const obsFrom = (byPass: Record<number, number>) => (p: number) => byPass[p] ?? 0;

test('Rule B fires at the first pass with 30 % water above a clear baseline, plus processing time', () => {
  const b = ruleB({ passes, observed: obsFrom({ 6: 0, 18: 0.1, 30: 0.45, 42: 0.6 }), expected: 0 }, TH);
  assert.equal(b.fireT, 30 + SAR_LATENCY_H);
  assert.equal(b.lastClear, 6, 'the plot was last clear at the baseline pass: the conservative start of the window');
  assert.equal(b.baselineClear, true);
});

test('Rule B boundary: exactly the flood share fires, a hair below does not; the clear line is exclusive', () => {
  assert.equal(ruleB({ passes, observed: obsFrom({ 18: 0.3 }), expected: 0 }, TH).fireT, 19);
  assert.equal(ruleB({ passes, observed: obsFrom({ 18: 0.2999, 30: 0.2999, 42: 0.2999 }), expected: 0 }, TH).fireT, null);
  assert.equal(ruleB({ passes, observed: obsFrom({ 6: 0.05, 18: 0.9 }), expected: 0 }, TH).fireT, null, 'a baseline at the clear line is not clear');
  assert.equal(ruleB({ passes, observed: obsFrom({ 6: 0.0499, 18: 0.9 }), expected: 0 }, TH).fireT, 19);
});

test('Rule B needs a clear baseline: a plot already wet at the first pass cannot trigger it', () => {
  const b = ruleB({ passes, observed: obsFrom({ 6: 0.4, 18: 0.9, 30: 0.9 }), expected: 0 }, TH);
  assert.equal(b.fireT, null);
  assert.equal(b.baselineClear, false);
  assert.deepEqual(ruleB({ passes: [], observed: () => 1, expected: 0 }, TH), { fireT: null, lastClear: null, baselineClear: false });
});

test('paddy in the standing-water season: its baseline water is not a flood, flood on top of it is', () => {
  const B = 0.6; // radar sees 60 % of the plot as water anyway
  // observed = B + (1 - B) * flooded share
  const obs = (flooded: Record<number, number>) => (p: number) => B + (1 - B) * (flooded[p] ?? 0);
  // no flood at all: the paddy shows 0.6 on every pass.
  const dry = ruleB({ passes, observed: obs({}), expected: B }, TH);
  assert.equal(dry.fireT, null, 'standing water alone never triggers the rule');
  assert.equal(dry.baselineClear, true, 'relative to its expected baseline the plot is clear');
  // control: the same observation read the naive way ("30 % water at a pass") would fire on every dry paddy field.
  const naive = ruleB({ passes, observed: obs({}), expected: 0 }, TH);
  assert.equal(naive.baselineClear, false, 'the naive rule sees a wet baseline');
  assert.ok(obs({})(18) >= TH.floodFrac, 'and a naive "water >= 30%" test would call every dry paddy field flooded');
  // a real flood of 45 % of the plot on top of the standing water
  const wet = ruleB({ passes, observed: obs({ 30: 0.45, 42: 0.5 }), expected: B }, TH);
  assert.equal(wet.fireT, 31);
  // the flood share needed on top of the baseline is the same 30 %
  assert.equal(ruleB({ passes, observed: obs({ 18: 0.3 }), expected: B }, TH).fireT, 19);
  assert.equal(ruleB({ passes, observed: obs({ 18: 0.29, 30: 0.29 }), expected: B }, TH).fireT, null);
});

test('excess() rescales water above the baseline to 0..1 and leaves dry crops untouched', () => {
  assert.equal(excess(0.4, 0), 0.4);
  assert.equal(excess(0.6, 0.6), 0);
  assert.equal(excess(0.5, 0.6), 0, 'below the baseline is zero, never negative');
  assert.ok(Math.abs(excess(1, 0.6) - 1) < 1e-12);
  assert.ok(Math.abs(excess(0.8, 0.6) - 0.5) < 1e-12);
});

// ---- Rule C -------------------------------------------------------------------------------------------------------
const stage = (id: string, danger: number, f: (h: number) => number, kind: GaugeSeries['kind'] = 'stage'): GaugeSeries => ({ id, kind, danger, series: ramp(60, f) });
const THC = { maxLagH: 12, latencyH: 0.5 };

test('Rule C fires when the gauge reaches its danger level (inclusive) and records the crossing as the signal time', () => {
  const g = stage('RG-1', 300, (h) => 100 + 20 * h); // 300 at h = 10
  const c = ruleC({ reach: [{ gauge: 'RG-1', lagH: 2 }] }, [g], THC);
  assert.deepEqual(c, { crossT: 10, fireT: 10.5, gauge: 'RG-1', lagH: 2 });
  const just = stage('RG-1', 301, (h) => 100 + 20 * h);
  assert.equal(ruleC({ reach: [{ gauge: 'RG-1', lagH: 2 }] }, [just], THC).crossT, 11, 'one unit short of the danger level is not a crossing');
});

test('Rule C does not fire when the river never reaches the danger level, or the plot has no reach', () => {
  const calm = stage('RG-1', 300, () => 250);
  assert.equal(ruleC({ reach: [{ gauge: 'RG-1', lagH: 1 }] }, [calm], THC).fireT, null);
  assert.equal(ruleC({ reach: [] }, [stage('RG-1', 300, () => 999)], THC).fireT, null, 'a plot out of reach is never alerted by the river');
  assert.equal(ruleC({ reach: [{ gauge: 'RG-9', lagH: 1 }] }, [stage('RG-1', 300, () => 999)], THC).fireT, null, 'an unknown gauge is ignored');
});

test('Rule C lag: a plot whose flood wave needs longer than the allowed lag is out of reach (boundary inclusive)', () => {
  const g = stage('RG-1', 300, (h) => 100 + 20 * h);
  assert.notEqual(ruleC({ reach: [{ gauge: 'RG-1', lagH: 12 }] }, [g], THC).fireT, null, '12 h is still in reach');
  assert.equal(ruleC({ reach: [{ gauge: 'RG-1', lagH: 12.01 }] }, [g], THC).fireT, null, 'just over 12 h is out of reach');
});

test('Rule C takes the earliest crossing among the gauges in reach, and treats a dam release like a stage', () => {
  const up = stage('RG-1', 300, (h) => 100 + 20 * h); // crosses at 10
  const mid = stage('RG-2', 300, (h) => 100 + 20 * (h - 4)); // crosses at 14
  const dam: GaugeSeries = stage('DAM-1', 1500, (h) => 200 + 200 * h, 'release'); // crosses at 7 (1600)
  const both = ruleC({ reach: [{ gauge: 'RG-2', lagH: 1 }, { gauge: 'RG-1', lagH: 5 }] }, [up, mid], THC);
  assert.equal(both.gauge, 'RG-1');
  assert.equal(both.crossT, 10);
  const withDam = ruleC({ reach: [{ gauge: 'RG-1', lagH: 5 }, { gauge: 'DAM-1', lagH: 9 }] }, [up, dam], THC);
  assert.equal(withDam.gauge, 'DAM-1', 'a release that crosses its danger level sooner starts the clock sooner');
  assert.equal(withDam.crossT, 7);
});

// ---- combining ----------------------------------------------------------------------------------------------------
const none = { crossT: null, fireT: null };
const noB = { fireT: null, lastClear: null, baselineClear: true };
const noC = { crossT: null, fireT: null, gauge: null, lagH: null };

test('nothing fired means nothing detected', () => {
  const k = combine(none, noB, noC, false);
  assert.equal(k.detected, false);
  assert.equal(k.eventT, null);
  assert.equal(k.confidence, null);
});

test('conservative clock: the event starts at the earliest qualifying signal, never later than detection', () => {
  // rain crossed at 11, river danger at 15, Rule A fired at 14, Rule C at 15.5, radar at 31
  const k = combine({ crossT: 11, fireT: 14 }, { fireT: 31, lastClear: 6, baselineClear: true }, { crossT: 15, fireT: 15.5, gauge: 'RG-1', lagH: 1 }, false);
  assert.equal(k.detectT, 14);
  assert.equal(k.eventT, 11, 'the rain crossing, which came before detection');
  assert.equal(k.eventSource, 'rain');
  assert.ok(k.eventT! <= k.detectT!);
});

test('the river crossing starts the clock when it is the earliest signal before detection', () => {
  const k = combine({ crossT: 20, fireT: null }, noB, { crossT: 12, fireT: 12.5, gauge: 'RG-1', lagH: 2 }, false);
  assert.equal(k.detectT, 12.5);
  assert.equal(k.eventT, 12);
  assert.equal(k.eventSource, 'river');
  // a rain crossing that came AFTER detection is not a signal that precedes it
  assert.equal(combine({ crossT: 13, fireT: null }, noB, { crossT: 12, fireT: 12.5, gauge: 'RG-1', lagH: 2 }, false).eventT, 12);
});

test('with no earlier signal the last clear radar pass starts the clock; failing that, the detection itself', () => {
  const radar = combine(none, { fireT: 31, lastClear: 18, baselineClear: true }, noC, false);
  assert.equal(radar.eventT, 18);
  assert.equal(radar.eventSource, 'radar-pass');
  const bare = combine(none, { fireT: 31, lastClear: null, baselineClear: true }, noC, false);
  assert.equal(bare.eventT, 31);
  assert.equal(bare.eventSource, 'detection');
});

test('confidence: two independent rules are high, radar alone on paddy is low, anything else is medium', () => {
  const b = { fireT: 31, lastClear: 6, baselineClear: true };
  assert.equal(combine({ crossT: 11, fireT: 14 }, b, noC, false).confidence, 'high');
  assert.equal(combine(none, b, { crossT: 12, fireT: 12.5, gauge: 'RG-1', lagH: 1 }, false).confidence, 'high');
  assert.equal(combine(none, b, noC, true).confidence, 'low', 'radar alone cannot tell irrigation from flood on paddy');
  assert.equal(combine(none, b, noC, false).confidence, 'medium');
  assert.equal(combine(none, noB, { crossT: 12, fireT: 12.5, gauge: 'RG-1', lagH: 1 }, true).confidence, 'medium');
});
