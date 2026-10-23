// The two tabs of one console agree (audit L1-08): the figures at the top and the pilot-metrics tab take "in window" and
// "missed" from the same function, so a judge who flips between them never sees two answers to one question.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor, priority } from '../../src/sim/evidence.ts';
import { metrics } from '../../src/sim/metrics.ts';
import { kpisOf } from '../../src/dashboard/state.ts';
import type { Row } from '../../src/dashboard/state.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
const TIMES = [0, 20, 30, 60, 96, 100, 108, 120, 140, raw.hours];

for (const rail of ['relief', 'pmfby'] as const) {
  const m = buildModel(raw, modelOptions(rail));
  const rowsAt = (t: number): Row[] =>
    m.plots.map((p) => {
      const s = plotState(m, p, t, null);
      const e = evidenceFor(m, s, t);
      return { s, e, pri: priority(s, e) };
    });

  test(`${rail}: the figures at the top give the same in-window and missed counts as the pilot-metrics tab, at every time`, () => {
    for (const t of TIMES) {
      const r = rowsAt(t);
      const k = kpisOf(m, r, t);
      const x = metrics(m, r.map((y) => y.s), t);
      assert.equal(k.inWindow, x.filedInWindow, `t=${t} in window`);
      assert.equal(k.missed, x.missed, `t=${t} missed`);
    }
  });

  test(`${rail}: a plot that already has evidence is never counted as missed, whatever time it was captured at`, () => {
    for (const t of TIMES) {
      const states = rowsAt(t).map((y) => y.s);
      const flood = states.filter((s) => s.det.detected && s.times.alertT !== null && s.times.alertT <= t && (s.times.noDamageT === null || s.times.noDamageT > t));
      const noEvidence = flood.filter((s) => s.times.deadlineT! <= t && (s.times.captureT === null || s.times.captureT > t));
      assert.equal(metrics(m, states, t).missed, noEvidence.length, `t=${t}`);
      for (const s of noEvidence) assert.ok(!['queued', 'evidence', 'filed', 'acknowledged'].includes(s.stage), `${s.plot.id} at t=${t} is ${s.stage}`);
    }
  });

  test(`${rail}: in window, late and missed never count one plot twice, and never exceed the flood events`, () => {
    for (const t of TIMES) {
      const x = metrics(m, rowsAt(t).map((y) => y.s), t);
      assert.ok(x.filedInWindow + x.filedLate + x.missed <= x.floodEvents, `t=${t}: ${x.filedInWindow} + ${x.filedLate} + ${x.missed} <= ${x.floodEvents}`);
    }
  });
}
