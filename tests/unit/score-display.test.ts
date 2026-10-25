// What the officer reads beside a tier must not contradict the tier's own rule (audit L1-12). "Supported" needs the whole 90%
// band at or above 60, "insufficient" needs all of it below 45. A band end of 0.5964 used to print as "60" beside "Partial",
// and 0.4497 as "45" beside "Insufficient". Band ends are shown rounded down, so a printed end never crosses a line it has not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor, bandPct, TIER_RULE } from '../../src/sim/evidence.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
const TIMES = [10, 18, 18.5, 19, 19.5, 20, 24, 30, 48, 72, 100, raw.hours];

test('a printed band end never crosses a tier line that the exact value has not crossed', () => {
  const supported = Math.round(TIER_RULE.supportedLo * 100);
  const insufficient = Math.round(TIER_RULE.insufficientHi * 100);
  let checked = 0;
  for (const rail of ['relief', 'pmfby'] as const) {
    const m = buildModel(raw, modelOptions(rail));
    for (const t of TIMES) {
      for (const p of m.plots) {
        const s = plotState(m, p, t, null);
        const e = evidenceFor(m, s, t);
        if (e.tier === 'none') continue;
        checked++;
        const where = `${rail} ${p.id} t=${t} tier=${e.tier} band ${e.lo}..${e.hi}`;
        // hail is held at "partial" whatever the band says (an honest limit), so only the other tiers follow the rule
        if (!s.times.hail) assert.equal(bandPct(e.lo) >= supported, e.tier === 'supported', where);
        assert.equal(bandPct(e.hi) < insufficient, e.tier === 'insufficient', where);
      }
    }
  }
  assert.ok(checked > 500);
});

test('bandPct rounds down, and is not fooled by 57 / 100 being 56.99999999999999', () => {
  assert.equal(bandPct(0.5964), 59);
  assert.equal(bandPct(0.4497), 44);
  assert.equal(bandPct(0.57), 57);
  assert.equal(bandPct(0.6), 60);
  assert.equal(bandPct(1), 100);
  assert.equal(bandPct(0), 0);
});
