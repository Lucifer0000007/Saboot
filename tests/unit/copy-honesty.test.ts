// The screen must not claim a check that does not exist (audit L1-01). There is no photo classifier and no check that a
// photo shows water, a real GPS fix cannot be compared with a fictional plot, and nothing "verifies hashes" in the evidence
// breakdown. These tests keep that true. (They sit beside tests/unit/claims.test.ts, which is not edited.)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { rawScenario, seek, model, focusPlot } from '../../src/sim/engine.ts';
import { network } from '../../src/lib/prefs.ts';
import { dbClear } from '../../src/lib/db.ts';
import { logs, addShot, seal, syncOutbox, liveViews } from '../../src/farmer/focus.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor } from '../../src/sim/evidence.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

rawScenario.value = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;

beforeEach(async () => {
  logs.value = {};
  network.value = 'online';
  seek(0);
  await Promise.all([dbClear('outbox'), dbClear('kv'), dbClear('photos')]);
});

test('a real capture says its location was not checked, and no breakdown line claims an AI check or a hash check', async () => {
  seek(18.9);
  for (const k of ['wide', 'close', 'landmark'] as const) await addShot(k, new Blob([k]), 64, 48, { lat: 30.9, lon: 75.85, acc: 12, src: 'gps' }, false);
  await seal();
  await syncOutbox();
  const m = model.value!;
  const { focus, live } = liveViews(Infinity);
  const s = plotState(m, focusPlot.value!, 30, focus, live);
  assert.equal(s.times.live, true);
  const factors = evidenceFor(m, s, 30).factors;
  const photos = factors.find((f) => f.id === 'photos')!;
  assert.match(photos.detail, /location not checked against the plot/);
  assert.doesNotMatch(photos.detail, /location on plot|m from plot|AI|perception|water visible/);
  assert.doesNotMatch(factors.find((f) => f.id === 'integrity')!.detail, /Hashes verify/);
});

test('every scripted plot: the breakdown never mentions an AI check or a hash check', () => {
  const m = model.value!;
  const words = /AI perception|water visible|Hashes verify/;
  for (const p of m.plots) {
    const s = plotState(m, p, 60, null);
    for (const f of evidenceFor(m, s, 60).factors) assert.doesNotMatch(f.detail, words, `${p.id} ${f.id}`);
  }
});

test('no source file contains those claims', () => {
  const bad = ['AI perception', 'Hashes verify', 'water visible ('];
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
  for (const f of walk('src').filter((x) => /\.(ts|tsx)$/.test(x))) {
    const text = readFileSync(f, 'utf8');
    for (const b of bad) assert.ok(!text.includes(b), `${f} contains "${b}"`);
  }
});
