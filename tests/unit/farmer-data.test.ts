// One farmer's copy and one farmer's deletion (audit H10): in helper mode a farmer can ask for their own data, or for it to be
// deleted, and no other farmer's evidence on the phone is shown or touched.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rawScenario, seek, activePlotId } from '../../src/sim/engine.ts';
import { network } from '../../src/lib/prefs.ts';
import { dbClear, dbGet, dbKeys, dbSet } from '../../src/lib/db.ts';
import { logs, DEMO, addShot, recordConsent, exportFarmerData, deleteFarmerData } from '../../src/farmer/focus.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

rawScenario.value = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;

const geo = { lat: 30.9, lon: 75.85, acc: 12, src: 'gps' as const };
const agree = (farmer: string) => recordConsent({ farmer, helper: 'Test Helper', role: 'Sarpanch', method: 'hold', text: `I, ${farmer}, allow Test Helper to take photos.` });
async function capture(id: string, farmer: string, photos: string[]) {
  activePlotId.value = id;
  await agree(farmer);
  for (const [i, p] of photos.entries()) await addShot((['wide', 'close', 'landmark'] as const)[i], new Blob([p]), 64, 48, geo, false, 'Test Helper');
}

beforeEach(async () => {
  logs.value = {};
  seek(30);
  await Promise.all([dbClear('outbox'), dbClear('kv'), dbClear('photos')]);
});
afterEach(() => {
  activePlotId.value = null;
  network.value = 'online';
});

test('H10: a farmer’s copy holds their own log and nothing about any other farmer', async () => {
  await capture('P-05', 'Farmer Five', ['five']);
  await capture('P-09', 'Farmer Nine', ['nine']);
  const copy = exportFarmerData('P-05');
  assert.equal(copy.plot, 'P-05');
  assert.equal(copy.log.length, 2);
  assert.doesNotMatch(JSON.stringify(copy), /Farmer Nine|P-09/);
});

test('H10: deleting one farmer removes their log, photos and queued items; every other farmer keeps theirs', async () => {
  network.value = 'offline';
  await capture('P-05', 'Farmer Five', ['five', 'shared']);
  await capture('P-09', 'Farmer Nine', ['nine', 'shared']);
  await dbSet('kv', 'k-send-queue', [{ code: 'a', plot: 'P-05' }, { code: 'b', plot: 'P-09' }]);
  const photosBefore = await dbKeys('photos');
  assert.equal(photosBefore.length, 3);
  await deleteFarmerData('P-05');
  assert.deepEqual(Object.keys(logs.value), ['P-09']);
  assert.equal(await dbGet('kv', 'log:P-05'), undefined);
  assert.deepEqual(await dbGet('kv', 'log-ids'), ['P-09']);
  // P-05's own photo is gone; the photo file P-09's log also holds stays
  assert.equal((await dbKeys('photos')).length, 2);
  const outbox = await Promise.all((await dbKeys('outbox')).map((k) => dbGet<{ plot: string }>('outbox', k)));
  assert.ok(outbox.length > 0 && outbox.every((e) => e?.plot === 'P-09'), 'only P-09’s queued items are left');
  assert.deepEqual(await dbGet('kv', 'k-send-queue'), [{ code: 'b', plot: 'P-09' }]);
  assert.ok(!(DEMO in logs.value));
});
