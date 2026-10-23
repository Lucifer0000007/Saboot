// Sealed evidence is never lost. The farmer's log only moves forward: a reconnect, a reload or a scrub back in the replay
// must not remove an event, two writes at once must both land, and a packet is sealed once. Each test reproduces a
// finding from docs/AUDIT-REPORT.md (L3-01, L1-03, L3-03, L1-06).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rawScenario, seek, t } from '../../src/sim/engine.ts';
import { network } from '../../src/lib/prefs.ts';
import { dbClear } from '../../src/lib/db.ts';
import { logs, DEMO, addShot, seal, syncOutbox, recordRef, reportNoDamage, full, rewound, restoreClock } from '../../src/farmer/focus.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

rawScenario.value = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;

const geo = { lat: 30.9, lon: 75.85, acc: 12, src: 'gps' as const };
const KINDS = ['wide', 'close', 'landmark'] as const;
const photo = (s: string) => new Blob([s]);
const events = () => logs.value[DEMO] ?? [];
const types = () => events().map((l) => l.body.type);

/** Three real-looking shots and a seal at replay hour `at`. */
async function capturedAndSealed(at: number) {
  seek(at);
  for (const k of KINDS) await addShot(k, photo(k + at), 64, 48, geo, false);
  await seal();
}

beforeEach(async () => {
  logs.value = {};
  rewound.value = false;
  network.value = 'online';
  seek(0);
  await Promise.all([dbClear('outbox'), dbClear('kv'), dbClear('photos')]);
});

test('a reconnect while the replay clock is behind the evidence removes nothing', async () => {
  network.value = 'offline';
  await capturedAndSealed(18.9);
  const before = events().map((l) => l.hash);
  assert.equal(full.value.shotCount, 3);
  assert.ok(full.value.seal);
  seek(0); // the page was reloaded: the replay clock is back at the start
  network.value = 'online';
  await syncOutbox();
  const after = events();
  assert.deepEqual(after.slice(0, before.length).map((l) => l.hash), before, 'every earlier event is still there, in order');
  assert.equal(full.value.shotCount, 3);
  assert.ok(full.value.seal, 'the seal survived');
  assert.ok(types().includes('sync'), 'the sync was recorded after them');
  assert.ok(after.every((l, i) => i === 0 || l.body.simT >= after[i - 1].body.simT), 'the log only moves forward');
});

test('acting while the replay is behind your last action is stamped after it, and the replay moves to it', async () => {
  await capturedAndSealed(18.9);
  const last = events().at(-1)!.body.simT;
  seek(5);
  await recordRef('REF-1');
  assert.ok(full.value.seal, 'the seal survived');
  assert.equal(full.value.shotCount, 3);
  assert.equal(full.value.ref?.ref, 'REF-1');
  assert.ok(full.value.ref!.simT >= last, 'the new action comes after the last one');
  assert.ok(t.value >= last, 'the replay moved forward so the action is visible');
  assert.equal(rewound.value, true, 'the person is told the replay moved');
});

test('two writes at the same moment both land', async () => {
  seek(10);
  await Promise.all([reportNoDamage(), recordRef('REF-2')]);
  assert.deepEqual([...types()].sort(), ['no_damage', 'ref']);
});

test('a packet is sealed once', async () => {
  await capturedAndSealed(14.5);
  const sealed = types().filter((x) => x === 'seal').length;
  await seal();
  assert.equal(sealed, 1);
  assert.equal(types().filter((x) => x === 'seal').length, 1, 'a second seal is refused');
});

test('after a reload the replay clock returns to the last thing the person did', async () => {
  await capturedAndSealed(18.9);
  const last = events().at(-1)!.body.simT;
  seek(0);
  restoreClock();
  assert.equal(t.value, last);
  seek(40);
  restoreClock();
  assert.equal(t.value, 40, 'a clock already ahead is left alone');
});

test('a sync that starts before this page holds the stored log (a reload, or a second tab) still records the sealed packet as received', async () => {
  network.value = 'offline';
  await capturedAndSealed(17.35);
  assert.ok(full.value.queued > 0);
  // the log is stored, but this page does not have it in memory yet, and the connection is back
  logs.value = {};
  network.value = 'online';
  await syncOutbox();
  assert.ok(full.value.seal, 'the seal is back from storage');
  assert.equal(full.value.queued, 0, 'the photos and the packet are all recorded as received');
  assert.notEqual(full.value.seal!.recvT, null);
});
