// FARM-01: once the evidence is sealed, no photo can join the log, even after the replay is scrubbed back to before the seal.
// The shared code lists only sealed photos, so a later photo would be shown as sealed while the sealed one went missing.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rawScenario, seek } from '../../src/sim/engine.ts';
import { network } from '../../src/lib/prefs.ts';
import { dbClear } from '../../src/lib/db.ts';
import { logs, DEMO, addShot, seal, rewound } from '../../src/farmer/focus.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

rawScenario.value = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;

const geo = { lat: 30.9, lon: 75.85, acc: 12, src: 'gps' as const };
const photo = (s: string) => new Blob([s]);
const types = () => (logs.value[DEMO] ?? []).map((l) => l.body.type);

beforeEach(async () => {
  logs.value = {};
  rewound.value = false;
  network.value = 'online';
  seek(0);
  await Promise.all([dbClear('outbox'), dbClear('kv'), dbClear('photos')]);
});

test('FARM-01: after the seal, a photo taken with the replay scrubbed back is refused and the log is unchanged', async () => {
  seek(20);
  await addShot('wide', photo('w'), 64, 48, geo, false);
  await addShot('close', photo('c'), 64, 48, geo, false);
  await addShot('landmark', photo('l'), 64, 48, geo, false);
  await seal();
  assert.deepEqual(types(), ['shot', 'shot', 'shot', 'seal']);
  seek(14); // Moments > Trigger: before the photos and the seal
  await assert.rejects(addShot('wide', photo('new'), 64, 48, geo, false));
  await assert.rejects(addShot('wide', photo('sim'), 64, 48, { ...geo, src: 'sim' }, true));
  assert.deepEqual(types(), ['shot', 'shot', 'shot', 'seal']);
});
