// The two rails differ in words and windows, never in how strong the evidence is (docs/SABOOT-SPEC.md; audit L1-04). The same
// plot at the same moment gets the same score, band and tier on either rail. A capture 60 h after the event used to score
// lower on the relief rail only because its 48 h "capture-soon advice", which is not a deadline, had passed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor } from '../../src/sim/evidence.ts';
import { appendLink } from '../../src/lib/hash.ts';
import { reduce, type FocusEvent, type Link } from '../../src/farmer/focus.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
const relief = buildModel(raw, modelOptions('relief'));
const pmfby = buildModel(raw, modelOptions('pmfby'));
const TIMES = [10, 20, 30, 48, 60, 72, 80, 100, 120, raw.hours];

test('every scripted plot has the same score, band and tier on both rails, at every time', () => {
  for (const t of TIMES) {
    for (const p of relief.plots) {
      const a = evidenceFor(relief, plotState(relief, p, t, null), t);
      const b = evidenceFor(pmfby, plotState(pmfby, pmfby.plots[p.idx], t, null), t);
      assert.deepEqual({ score: a.score, lo: a.lo, hi: a.hi, tier: a.tier }, { score: b.score, lo: b.lo, hi: b.hi, tier: b.tier }, `${p.id} at t=${t}`);
    }
  }
});

test('a live capture 60 h after the event scores the same on both rails', async () => {
  const focus = relief.plots.find((p) => p.id === raw.focus)!;
  const eventT = relief.det[focus.idx].eventT!;
  const geo = { lat: 30.9, lon: 75.85, acc: 12, src: 'gps' as const };
  const events: FocusEvent[] = (['wide', 'close', 'landmark'] as const).map((kind, i) => ({
    type: 'shot', simT: eventT + 60 + i * 0.02,
    data: { kind, photoId: 'ph-' + kind, sha: kind.padEnd(64, '0'), bytes: 1, w: 64, h: 48, geo, synthetic: false, queued: false },
  }));
  events.push({ type: 'seal', simT: eventT + 60.1, data: { packetHash: 'f'.repeat(64), shots: [], queued: false } });
  const chain: Link[] = [];
  for (const e of events) chain.push(await appendLink(chain, e));
  const t = eventT + 61;
  const view = reduce(chain, t);
  const a = evidenceFor(relief, plotState(relief, focus, t, view), t);
  const b = evidenceFor(pmfby, plotState(pmfby, pmfby.plots[focus.idx], t, view), t);
  assert.deepEqual({ score: a.score, tier: a.tier }, { score: b.score, tier: b.tier });
  assert.equal(a.factors.find((f) => f.id === 'photos')!.value, 1, 'three photos inside 72 h of the event are full strength on both rails');
});
