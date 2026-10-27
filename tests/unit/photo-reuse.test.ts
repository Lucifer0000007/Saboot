// The officer's console flags the same live-camera photo file sealed for two different plots (src/k/imported.ts, Import sheet).
// It is a flag to ask about, not a finding, and it must not fire on what is legitimate: the same plot sealed again, simulated
// photos (which repeat in the demo), or different photos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoReuse } from '../../src/k/imported.ts';
import type { KPayload, KShot } from '../../src/k/payload.ts';

const sha = (c: string) => c.repeat(64);
const shot = (kind: KShot['kind'], c: string, photo: KShot['photo'] = 'live'): KShot => ({ kind, simT: 18, sha: sha(c), photo, loc: 'live' });
const packet = (plot: string, head: string, shots: KShot[]): KPayload => ({ plot, head, pub: 'p', eventT: 11, sealT: 18, deviceMs: 1, lat: 30, lon: 75, shots });

test('the same live photo file in a packet for another plot is flagged, with the other plot named', () => {
  const a = packet('P-04', 'aa', [shot('wide', 'a'), shot('close', 'b')]);
  const b = packet('P-09', 'bb', [shot('wide', 'c'), shot('close', 'b')]);
  assert.deepEqual(photoReuse(b, [a]), [{ kind: 'close', plot: 'P-04' }]);
});

test('not flagged: the same plot sealed again, different photos, the packet itself, or simulated photos', () => {
  const a = packet('P-04', 'aa', [shot('wide', 'a')]);
  assert.deepEqual(photoReuse(packet('P-04', 'cc', [shot('wide', 'a')]), [a]), [], 'the same plot sealed again');
  assert.deepEqual(photoReuse(packet('P-09', 'bb', [shot('wide', 'b')]), [a]), [], 'a different photo');
  assert.deepEqual(photoReuse(a, [a]), [], 'the packet against itself');
  const s1 = packet('P-04', 'aa', [shot('wide', 'a', 'sim')]);
  const s2 = packet('P-09', 'bb', [shot('wide', 'a', 'sim')]);
  assert.deepEqual(photoReuse(s2, [s1]), [], 'simulated photos repeat across plots in the demo');
  assert.deepEqual(photoReuse(packet('P-09', 'bb', [shot('wide', 'a', 'live')]), [s1]), [], 'a simulated photo on the other side');
});
