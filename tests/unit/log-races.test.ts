// Races in the farmer's log (October audit, lens code-core). CC-10: a sync must not drop what was queued while it ran.
// CC-12: a seal made while the replay is scrubbed back covers the whole log and follows its head; two seals at once write one.
// (CC-03, two catch-up jumps at once, needs the photo canvas: tests/qa/robust.spec.ts.)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rawScenario, seek } from '../../src/sim/engine.ts';
import { network } from '../../src/lib/prefs.ts';
import { dbClear, dbKeys, dbSet } from '../../src/lib/db.ts';
import { canonical, sha256 } from '../../src/lib/hash.ts';
import { logs, DEMO, addShot, seal, syncOutbox, sending, reduce, packetBody, rewound } from '../../src/farmer/focus.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
rawScenario.value = raw;

const geo = { lat: 30.9, lon: 75.85, acc: 12, src: 'gps' as const };
const photo = (s: string) => new Blob([s]);
const events = () => logs.value[DEMO] ?? [];

beforeEach(async () => {
  logs.value = {};
  rewound.value = false;
  network.value = 'online';
  seek(0);
  await Promise.all([dbClear('outbox'), dbClear('kv'), dbClear('photos')]);
});

test('CC-10: a photo queued while a sync is running is not dropped: it stays queued or goes out in the same sync', async () => {
  network.value = 'offline';
  seek(20);
  await addShot('wide', photo('w'), 64, 48, geo, false);
  network.value = 'online';
  let injected = false;
  const stop = sending.subscribe((n) => {
    if (n > 0 && !injected) {
      injected = true;
      void dbSet('outbox', 'ph-late', { kind: 'photo', id: 'ph-late', simT: 20, plot: DEMO });
    }
  });
  await syncOutbox();
  stop();
  assert.ok(injected, 'the late photo was queued while the sync ran');
  const sent = events().some((l) => l.body.type === 'sync' && l.body.data.photoIds.includes('ph-late'));
  const queued = (await dbKeys('outbox')).includes('ph-late');
  assert.ok(sent || queued, 'the late photo is either sent or still waiting, never silently deleted');
});

test('CC-12: a seal made while the replay is scrubbed back covers every photo, and its prev is the head of the log', async () => {
  for (const [k, at] of [['wide', 20], ['close', 21], ['landmark', 22]] as const) {
    seek(at);
    await addShot(k, photo(k), 64, 48, geo, false);
  }
  seek(21.5); // scrubbed back behind the last photo
  await seal();
  const c = events();
  const s = c.at(-1)!.body;
  assert.equal(s.type, 'seal');
  assert.ok(s.type === 'seal');
  assert.equal(s.data.shots.length, 3, 'the packet holds all three photos');
  const expected = await sha256(canonical(packetBody(reduce(c.slice(0, -1), Infinity))));
  assert.equal(s.data.packetHash, expected, 'the packet was built from the whole log the seal follows');
});

test('CC-12: two seals at once write one seal', async () => {
  seek(20);
  await addShot('wide', photo('a'), 64, 48, geo, false);
  await Promise.all([seal(), seal()]);
  assert.equal(events().filter((l) => l.body.type === 'seal').length, 1);
});
