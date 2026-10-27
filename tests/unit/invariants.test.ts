// Properties of the evidence score, its band, its tier and the review priority, checked over every plot of the replay at
// many moments on both rails, rather than a few fixed examples. They guard the rules the audit and the spec state:
// more evidence never lowers a score, an uncertain reading never earns a higher tier, and priority ranks review work.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { capHand, evidenceFor, priority, priorityParts, TIER_RULE, type Evidence } from '../../src/sim/evidence.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
const TIMES = [6, 12, 18, 19, 20, 24, 36, 48, 72, 100, 140, raw.hours];
const RANK = { none: 0, insufficient: 1, partial: 2, supported: 3 } as const;

function each(fn: (a: { rail: string; id: string; t: number; m: ReturnType<typeof buildModel>; s: ReturnType<typeof plotState>; e: Evidence }) => void): number {
  let n = 0;
  for (const rail of ['relief', 'pmfby'] as const) {
    const m = buildModel(raw, modelOptions(rail));
    for (const t of TIMES) for (const p of m.plots) { const s = plotState(m, p, t, null); fn({ rail, id: p.id, t, m, s, e: evidenceFor(m, s, t) }); n++; }
  }
  return n;
}

test('the score and its band stay in 0..1, the band holds the score, and the weights add to one', () => {
  const n = each(({ rail, id, t, e }) => {
    const where = `${rail} ${id} t=${t}`;
    for (const x of [e.score, e.lo, e.hi]) assert.ok(x >= 0 && x <= 1 + 1e-9, `${where}: ${x} outside 0..1`);
    assert.ok(e.lo <= e.score + 1e-9 && e.score <= e.hi + 1e-9, `${where}: band ${e.lo}..${e.hi} does not hold ${e.score}`);
    assert.ok(Math.abs(e.factors.reduce((a, f) => a + f.weight, 0) - 1) < 1e-9, `${where}: weights do not add to 1`);
  });
  assert.ok(n > 1000);
});

test('adding a photo never lowers the evidence score (all else equal)', () => {
  each(({ rail, id, t, m, s }) => {
    let prev = -1;
    for (const shots of [0, 1, 2, 3]) {
      const score = evidenceFor(m, { ...s, shotsNow: shots }, t).score;
      assert.ok(score >= prev - 1e-12, `${rail} ${id} t=${t}: ${shots} photos scored ${score}, fewer scored ${prev}`);
      prev = score;
    }
  });
});

test('a tier never outruns its band: supported needs the whole band at or above the line, insufficient all of it below', () => {
  each(({ rail, id, t, e }) => {
    const where = `${rail} ${id} t=${t} ${e.tier} ${e.lo}..${e.hi}`;
    if (e.tier === 'supported') assert.ok(e.lo >= TIER_RULE.supportedLo, where);
    if (e.tier === 'insufficient') assert.ok(e.hi < TIER_RULE.insufficientHi, where);
    if (e.tier === 'partial') assert.ok(e.lo < TIER_RULE.supportedLo || e.hi >= TIER_RULE.insufficientHi, where);
  });
});

test('hand-entered evidence can lower a tier, never raise one, and never touches a tier below supported', () => {
  let seed = 7;
  const next = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const PROV = ['live', 'replay', 'sim', 'hand'] as const;
  for (let i = 0; i < 2000; i++) {
    const factors = Array.from({ length: 1 + Math.floor(next() * 5) }, () => ({ weight: next() < 0.2 ? 0 : next(), value: next() < 0.2 ? 0 : next(), prov: PROV[Math.floor(next() * 4)] }));
    for (const tier of ['none', 'insufficient', 'partial', 'supported'] as const) {
      const out = capHand(tier, factors);
      assert.ok(RANK[out] <= RANK[tier], `${tier} became ${out}`);
      if (tier !== 'supported') assert.equal(out, tier, 'only "supported" may be capped');
    }
  }
});

test('priority is 0..100, zero without a tier, and ranks the ambiguous first: partial, then insufficient, then supported', () => {
  each(({ rail, id, t, s, e }) => {
    const p = priority(s, e);
    assert.ok(Number.isInteger(p) && p >= 0 && p <= 100, `${rail} ${id} t=${t}: priority ${p}`);
    if (e.tier === 'none') return assert.equal(p, 0);
    const total = (tier: Evidence['tier']) => priorityParts(s, { ...e, tier }).total;
    assert.ok(total('partial') >= total('insufficient') && total('insufficient') >= total('supported'), `${rail} ${id} t=${t}: ambiguity does not rank first`);
  });
});
