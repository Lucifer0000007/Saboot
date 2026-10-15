// The seeded scenario is deterministic, the docs quote numbers that come from it, and the model keeps its promises:
// the capture window follows the rail, the radar cadence is a choice, the river rule reaches only plots near the
// river, paddy radar is weak evidence, hail non-responders are unconfirmed (not missed), and the priority weights
// are the original ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel, sarExcess, sarFrac } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor, priority, priorityParts, weightsFor, WEIGHTS, TIER_RULE, RIVER_WEIGHT, PADDY_RADAR_SCALE, PADDY_RADAR_UNC } from '../../src/sim/evidence.ts';
import { metrics } from '../../src/sim/metrics.ts';
import { computeFacts } from '../../scripts/facts.ts';
import { SCENARIO } from '../../src/generated/scenario-summary.ts';
import { RELIEF, PMFBY } from '../../src/config.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const URL_JSON = new URL('../../public/data/flood-replay.json', import.meta.url);
const json = readFileSync(URL_JSON, 'utf8');
const raw = JSON.parse(json) as ScenarioRaw;
const H = raw.hours;
const relief = buildModel(raw, modelOptions('relief'));
const pmfby = buildModel(raw, modelOptions('pmfby'));
const facts = JSON.parse(readFileSync(new URL('../../docs/scenario-facts.json', import.meta.url), 'utf8'));

// ---- the scenario and its facts -------------------------------------------------------------------------------------
test('scenario data stays within the 40 KB budget, with the documented seed', () => {
  assert.ok(Buffer.byteLength(json) <= 40 * 1024);
  assert.equal(raw.seed, 20260714);
});

test('the facts file is current: recomputing it from the scenario gives the same numbers (run npm run gen if this fails)', () => {
  const fresh = JSON.parse(JSON.stringify(computeFacts(raw, json)));
  assert.deepEqual(fresh, facts);
});

test('the generated summary the page shell uses matches the scenario', () => {
  assert.equal(SCENARIO.hours, raw.hours);
  assert.equal(SCENARIO.t0, raw.t0);
  assert.equal(SCENARIO.seed, raw.seed);
  assert.equal(SCENARIO.plots, raw.plots.length);
  assert.equal(SCENARIO.villages, raw.map.villages.length);
  assert.equal(SCENARIO.rainGauges, raw.stations.length);
  assert.equal(SCENARIO.riverGauges, raw.river!.gauges.length);
  assert.equal(SCENARIO.radarCadenceHours, raw.sar[1] - raw.sar[0]);
  assert.equal(SCENARIO.radarSlowCadenceHours, raw.sarSlow![1] - raw.sarSlow![0]);
});

test('the same options build the same model every time (determinism)', () => {
  const again = buildModel(raw, modelOptions('relief'));
  assert.deepEqual(again.det, relief.det);
  assert.deepEqual(again.truth, relief.truth);
  const states = (m: typeof relief) => m.plots.map((p) => plotState(m, p, H, null));
  assert.deepEqual(metrics(again, states(again), H), metrics(relief, states(relief), H));
});

test('the demo farmer P-04: the clock starts at the event, before the call, and the window follows the rail', () => {
  for (const [m, hours] of [[relief, RELIEF.captureSoonHours], [pmfby, PMFBY.windowHours]] as const) {
    const p = m.plots.find((x) => x.id === raw.focus)!;
    const d = m.det[p.idx];
    assert.equal(p.id, 'P-04');
    assert.ok(d.detected);
    assert.ok(d.eventT! < d.alertT!, 'the clock starts before the farmer hears');
    assert.equal(d.deadlineT, d.eventT! + hours);
  }
  const f = facts.combos['pmfby-demo'].focus;
  assert.equal(f.deadlineT - f.eventT, PMFBY.windowHours);
  assert.equal(facts.combos['relief-demo'].focus.deadlineT - f.eventT, RELIEF.captureSoonHours);
});

// ---- rails and cadence -----------------------------------------------------------------------------------------------
test('the rails differ only in the capture window: detection and event times are identical', () => {
  assert.equal(RELIEF.captureSoonHours, 48);
  assert.equal(PMFBY.windowHours, 72);
  relief.det.forEach((d, i) => {
    const e = pmfby.det[i];
    assert.deepEqual({ ...d, deadlineT: 0 }, { ...e, deadlineT: 0 });
    if (d.detected) {
      assert.equal(d.deadlineT! - d.eventT!, 48);
      assert.equal(e.deadlineT! - e.eventT!, 72);
    }
  });
});

test('the slower radar cadence uses the later passes: fewer radar detections, and nobody is alerted earlier', () => {
  const slow = buildModel(raw, modelOptions('relief', 'slow'));
  assert.deepEqual(slow.sar, raw.sarSlow);
  assert.ok(slow.sar.length < relief.sar.length);
  relief.det.forEach((d, i) => {
    const s = slow.det[i];
    if (s.detected) assert.ok(s.detectT! >= d.detectT!, `plot ${i}: slower radar never alerts sooner`);
    if (d.fired.length === 1 && d.fired[0] === 'B') {
      // only the radar could see this plot: with slow passes it is alerted later, or not at all
      assert.ok(!s.detected || s.detectT! > d.detectT!);
    }
  });
  const fast = facts.combos['relief-demo'], slowFacts = facts.combos['relief-slow'];
  assert.ok(slowFacts.detected <= fast.detected);
});

// ---- Rule C reach ----------------------------------------------------------------------------------------------------
test('Rule C fires only for plots the river can reach, and every riverside plot is in reach of a gauge', () => {
  const R = raw.river!;
  for (const p of relief.plots) {
    const d = relief.det[p.idx];
    if (d.ruleCT !== null) assert.ok(p.riverReach, `${p.id} fired Rule C without being in reach`);
    if (p.riverReach === 'riverside') assert.ok(p.riverDistM <= R.reachM);
    if (p.riverReach === 'low-lying') assert.ok(p.terrain === 0 && p.riverDistM > R.reachM && p.riverDistM <= R.lowReachM);
    if (!p.riverReach) { assert.ok(p.reach.length === 0); assert.ok(p.riverDistM > R.reachM); }
    for (const r of p.reach) assert.ok(r.lagH >= 0);
  }
  const counts = facts.scenario.riverReach;
  assert.equal(relief.plots.filter((p) => p.riverReach === 'riverside').length, counts.riverside);
});

test('a river alert starts the clock at the gauge crossing, hours before the water reaches the plot', () => {
  const early = relief.plots.filter((p) => relief.det[p.idx].fired.includes('C'));
  assert.ok(early.length > 0);
  for (const p of early) {
    const d = relief.det[p.idx];
    assert.ok(d.riverCrossT !== null && d.riverGauge);
    assert.equal(d.ruleCT, d.riverCrossT! + raw.river!.latencyH);
    assert.ok(d.eventT! <= d.riverCrossT!, 'the clock never starts after the river crossing');
    assert.ok(d.alertT! >= d.detectT!);
  }
});

// ---- evidence tiers ----------------------------------------------------------------------------------------------------
test('weights always add up to one, the river factor appears only where it applies, and plain plots keep the original weights', () => {
  const R = raw.river!;
  let plain = 0, withRiver = 0, paddy = 0;
  for (const p of relief.plots) {
    for (const t of [0, 20, 72, H]) {
      const e = evidenceFor(relief, plotState(relief, p, t, null), t);
      const sum = e.factors.reduce((a, f) => a + f.weight, 0);
      assert.ok(Math.abs(sum - 1) < 1e-9, `${p.id} at ${t}: weights add up to ${sum}`);
      const reaches = !!p.riverReach && p.reach.some((r) => r.lagH <= R.maxLagH);
      assert.equal(e.factors.some((f) => f.id === 'river'), reaches);
      if (!reaches && !p.baselineWet) {
        plain++;
        for (const f of e.factors) assert.equal(f.weight, WEIGHTS[f.id as keyof typeof WEIGHTS], `${p.id} ${f.id} keeps its original weight`);
      }
      if (reaches) { withRiver++; assert.equal(e.factors.find((f) => f.id === 'river')!.weight, RIVER_WEIGHT); }
      if (p.baselineWet) paddy++;
    }
  }
  assert.ok(plain > 0 && withRiver > 0 && paddy > 0, 'the scenario exercises all three cases');
});

test('paddy in season: the radar weight is lowered, its uncertainty widened, and a note is shown; other crops get no note', () => {
  const wp = weightsFor({ river: false, baselineWet: true });
  assert.ok(wp.flood < WEIGHTS.flood);
  assert.ok(Math.abs(wp.flood - (WEIGHTS.flood * PADDY_RADAR_SCALE) / (1 - WEIGHTS.flood * (1 - PADDY_RADAR_SCALE))) < 1e-12);
  assert.ok(Math.abs(Object.values(wp).reduce((a, b) => a + b, 0) - 1) < 1e-12);
  const wr = weightsFor({ river: true, baselineWet: false });
  assert.ok(Math.abs(wr.river - RIVER_WEIGHT) < 1e-12 && Math.abs(wr.flood - WEIGHTS.flood * (1 - RIVER_WEIGHT)) < 1e-12, 'other factors scale down together');
  for (const p of relief.plots) {
    const e = evidenceFor(relief, plotState(relief, p, H, null), H);
    const flood = e.factors.find((f) => f.id === 'flood')!;
    if (p.baselineWet) {
      assert.ok(e.notes.length === 1 && /standing-water/.test(e.notes[0]));
      assert.ok(flood.unc >= PADDY_RADAR_UNC);
    } else assert.deepEqual(e.notes, []);
  }
  // the radar observation of paddy includes its standing water; the excess removes it
  const paddy = relief.plots.find((p) => p.baselineWet)!;
  assert.ok(sarFrac(paddy, 0) >= paddy.baseWater);
  assert.equal(sarExcess(paddy, 0), 0, 'before any flood the radar sees nothing above the baseline');
});

test('evidence tiers follow the band rule, and hail is never "supported"', () => {
  for (const m of [relief, pmfby]) {
    for (const p of m.plots) {
      for (const t of [24, 72, H]) {
        const s = plotState(m, p, t, null);
        const e = evidenceFor(m, s, t);
        if (e.tier === 'supported') assert.ok(e.lo >= TIER_RULE.supportedLo);
        if (e.tier === 'insufficient') assert.ok(e.hi < TIER_RULE.insufficientHi);
        if (s.times.hail) assert.notEqual(e.tier, 'supported');
        const pri = priority(s, e);
        assert.ok(pri >= 0 && pri <= 100);
      }
    }
  }
});

// ---- hail non-responders ---------------------------------------------------------------------------------------------
test('a hail prompt nobody answered is "unconfirmed" once its window ends, never "missed", and ranks low on urgency', () => {
  const silent = pmfby.plots.filter((p) => pmfby.hailPrompted[p.idx] && !pmfby.det[p.idx].detected && !p.hailYes);
  assert.ok(silent.length > 0);
  for (const p of silent) {
    const during = plotState(pmfby, p, pmfby.raw.hail.t + 10, null);
    assert.equal(during.stage, 'hail-prompt');
    const after = plotState(pmfby, p, H, null);
    assert.equal(after.stage, 'unconfirmed');
    const e = evidenceFor(pmfby, after, H);
    assert.notEqual(e.tier, 'supported');
    assert.equal(priorityParts(after, e).urgency, 0.2, 'not treated as a missed window');
  }
  for (const p of pmfby.plots) assert.ok(!(pmfby.hailPrompted[p.idx] && plotState(pmfby, p, H, null).stage === 'missed'));
});

test('a farmer whose field the synthetic truth did not flood answers "no damage": false alarms close at no cost', () => {
  raw.plots.forEach((p, i) => {
    if (relief.det[i].detected && !relief.truth[i] && p.id !== raw.focus) assert.equal(p.b[0], 'nodamage', `${p.id}`);
  });
});

// ---- priority --------------------------------------------------------------------------------------------------------
test('inspection priority keeps its original weights: the result equals the first-build formula for every plot', () => {
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const original = (s: ReturnType<typeof plotState>, e: ReturnType<typeof evidenceFor>) => {
    if (e.tier === 'none') return 0;
    const amb = e.tier === 'partial' ? 1 : e.tier === 'insufficient' ? 0.6 : 0.2;
    const open = s.stage === 'alerted' || s.stage === 'hail-prompt' || s.stage === 'queued';
    const urg = open && s.timeLeft !== null ? clamp(1 - s.timeLeft / 72) : s.stage === 'missed' ? 0.8 : 0.2;
    const area = clamp(s.plot.areaHa / 6);
    const flags = clamp(s.flags.filter((f) => f !== 'tall-crop' && f !== 'assisted').length * 0.34);
    return Math.round(100 * (0.35 * amb + 0.3 * urg + 0.15 * area + 0.2 * flags));
  };
  let checked = 0;
  for (const p of pmfby.plots) {
    for (const t of [10, 20, 30, 48, 72, 96, 120, H]) {
      const s = plotState(pmfby, p, t, null), e = evidenceFor(pmfby, s, t);
      assert.equal(priority(s, e), original(s, e), `${p.id} at T+${t}`);
      const parts = priorityParts(s, e);
      assert.equal(Math.round(100 * parts.total), priority(s, e));
      checked++;
    }
  }
  assert.ok(checked >= 400);
});
