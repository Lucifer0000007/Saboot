// The HAND trust rule: a hand-entered value alone can never reach "supported" (docs/FEATURE-MAP.md, decision D-09). The rule has
// no live input in this prototype, so it is pinned here with made-up factors, and the replay's own tiers are shown unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { capHand, evidenceFor } from '../../src/sim/evidence.ts';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const f = (weight: number, value: number, prov?: 'live' | 'replay' | 'sim' | 'hand') => ({ weight, value, prov });

test('only hand-entered factors adding to the score: supported becomes partial', () => {
  assert.equal(capHand('supported', [f(0.5, 1, 'hand'), f(0.5, 0.9, 'hand')]), 'partial');
  assert.equal(capHand('supported', [f(0.5, 1, 'hand'), f(0.5, 0, 'live')]), 'partial', 'a live factor at zero adds nothing');
});

test('a hand-entered value beside an observed one does not lower the tier, and lower tiers are untouched', () => {
  assert.equal(capHand('supported', [f(0.5, 1, 'hand'), f(0.5, 0.8, 'live')]), 'supported');
  assert.equal(capHand('supported', [f(0.5, 1), f(0.5, 0.8, 'sim')]), 'supported', 'observations of the replay carry no mark');
  assert.equal(capHand('partial', [f(1, 1, 'hand')]), 'partial');
  assert.equal(capHand('insufficient', [f(1, 1, 'hand')]), 'insufficient');
  assert.equal(capHand('none', []), 'none');
  assert.equal(capHand('supported', []), 'supported', 'nothing adds: nothing to cap');
});

test('no factor of the replay is hand-entered, so every tier is the same as before the rule', () => {
  const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
  const m = buildModel(raw, modelOptions('relief'));
  let supported = 0;
  for (const p of m.plots) {
    const e = evidenceFor(m, plotState(m, p, 100, null), 100);
    assert.ok(e.factors.every((x) => x.prov !== 'hand'), p.id);
    if (e.tier === 'supported') supported++;
  }
  assert.ok(supported > 0, 'the replay still has supported plots');
});
