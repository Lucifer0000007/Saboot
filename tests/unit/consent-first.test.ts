// A helper acts for a farmer only with that farmer's consent (audit L1-05). Real photos and a seal are refused without it, a
// simulated photo is not (nothing real is captured), and a photo lands in the log of the farmer whose consent was checked,
// even if the helper moves on to another farmer while it is being saved.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rawScenario, seek, activePlotId } from '../../src/sim/engine.ts';
import { network } from '../../src/lib/prefs.ts';
import { dbClear } from '../../src/lib/db.ts';
import { appendLink } from '../../src/lib/hash.ts';
import { logs, addShot, seal, recordConsent, type FocusEvent, type Link } from '../../src/farmer/focus.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

rawScenario.value = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;

const geo = { lat: 30.9, lon: 75.85, acc: 12, src: 'gps' as const };
const photo = (s: string) => new Blob([s]);
const types = (key: string) => (logs.value[key] ?? []).map((l) => l.body.type);
const agree = (farmer: string) => recordConsent({ farmer, helper: 'Test Helper', role: 'Sarpanch', method: 'hold', text: `I, ${farmer}, allow Test Helper to take photos.` });

beforeEach(async () => {
  logs.value = {};
  network.value = 'online';
  seek(30);
  activePlotId.value = 'P-05';
  await Promise.all([dbClear('outbox'), dbClear('kv'), dbClear('photos')]);
});
afterEach(() => {
  activePlotId.value = null;
});

test('a real photo is refused for a farmer who has not agreed, and nothing is written to their log', async () => {
  await assert.rejects(addShot('wide', photo('a'), 64, 48, geo, false), { name: 'ConsentMissing' });
  assert.deepEqual(types('P-05'), []);
});

test('after the farmer agrees the same photo is stored, and it names the helper', async () => {
  await agree('Test Farmer');
  await addShot('wide', photo('a'), 64, 48, geo, false, 'Test Helper');
  assert.deepEqual(types('P-05'), ['consent', 'shot']);
  const s = logs.value['P-05'][1].body;
  assert.ok(s.type === 'shot' && s.data.helper === 'Test Helper' && s.data.synthetic === false);
});

test('a simulated photo needs no consent: nothing real is captured', async () => {
  await addShot('wide', photo('sim'), 64, 48, { ...geo, src: 'sim' }, true);
  assert.deepEqual(types('P-05'), ['shot']);
});

test('a seal over real photos is refused without consent', async () => {
  const real: FocusEvent = { type: 'shot', simT: 20, data: { kind: 'wide', photoId: 'ph-x', sha: 'a'.repeat(64), bytes: 1, w: 64, h: 48, geo, synthetic: false, queued: false } };
  const c: Link[] = [await appendLink([], real)];
  logs.value = { 'P-05': c };
  await assert.rejects(seal(), { name: 'ConsentMissing' });
  assert.deepEqual(types('P-05'), ['shot']);
});

test('a photo lands in the log of the farmer whose consent was checked, even if the helper moves on while it is saved', async () => {
  await agree('Farmer Five');
  activePlotId.value = 'P-09';
  await agree('Farmer Nine');
  activePlotId.value = 'P-05';
  const saving = addShot('wide', photo('five'), 64, 48, geo, false, 'Test Helper');
  activePlotId.value = 'P-09'; // the helper taps on to the next farmer before the photo is written
  await saving;
  assert.deepEqual(types('P-05'), ['consent', 'shot']);
  assert.deepEqual(types('P-09'), ['consent']);
});
