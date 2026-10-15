// The evidence bundle is the signed packet in an open JSON wrapper. It must verify with the standalone script, say that its
// context block is not signed, carry no photos and no farmer name, and never claim an integration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyCode } from '../../src/k/payload.ts';
import { makeBundle, bundleJson, codeOf, BUNDLE_KIND } from '../../src/k/bundle.ts';

const vectors = JSON.parse(readFileSync('tests/vectors/evidence-v1.json', 'utf8')) as { vectors: { name: string; input: string }[] };
const valid = vectors.vectors.find((v) => v.name === 'valid')!.input;
const link = vectors.vectors.find((v) => v.name === 'valid-link')!.input;

test('a code pasted as a link or with spaces reduces to the bare code', () => {
  assert.equal(codeOf(link), valid);
  assert.equal(codeOf(`  ${valid}\n`), valid);
});

test('the bundle decodes the code into the documented fields and carries the code itself', async () => {
  const r = await verifyCode(valid);
  const b = makeBundle(link, r.payload!);
  assert.equal(b.kind, BUNDLE_KIND);
  assert.equal(b.v, 1);
  assert.equal(b.simulation, true);
  assert.equal(b.code, valid);
  assert.equal(b.decoded.plot, 'P-05');
  assert.equal(b.decoded.formatVersion, 1);
  assert.equal(b.decoded.photos.length, 3);
  assert.deepEqual(b.decoded.photos.map((p) => p.kind), ['wide', 'close', 'landmark']);
  assert.equal(b.decoded.chainHead, r.payload!.head);
  assert.equal(b.decoded.publicKey, r.payload!.pub);
  assert.equal(b.decoded.phoneClockUtc, '2026-07-14T12:00:00Z');
  assert.deepEqual(b.decoded.location, { lat: 30.123, lon: 75.456, roundedTo: '0.001 degrees, about 100 m' });
});

test('the bundle says what it is not: no integration, no photos, no verification, and an unsigned context', async () => {
  const r = await verifyCode(valid);
  const b = makeBundle(valid, r.payload!, { rail: 'relief', capturedBy: { who: 'helper', helper: 'Test Helper', role: 'Sarpanch', consent: { method: 'hold', replayHour: 18.4 } }, packetHash: 'f'.repeat(64) });
  const text = bundleJson(b);
  assert.match(b.note, /ingestible by other systems/);
  assert.match(b.note, /not an integration with any system/);
  assert.match(b.photos, /Photos are not included/);
  assert.match(b.verifiedBy, /not verified by this file/);
  assert.match(b.context!.notSigned, /NOT covered by the signature/);
  assert.equal(b.context!.capturedBy!.helper, 'Test Helper');
  // no farmer name, no phone number, no photo data
  assert.ok(!/"farmer"|"name"|data:image|base64,/.test(text));
  assert.doesNotMatch(text, /integrat(es|ed) with/i);
});

test('a bundle without context carries none, and the standalone verifier verifies a bundle file', async () => {
  const r = await verifyCode(valid);
  const plain = makeBundle(valid, r.payload!);
  assert.equal('context' in plain, false);
  const dir = mkdtempSync(join(tmpdir(), 'saboot-bundle-'));
  const good = join(dir, 'bundle.json');
  writeFileSync(good, bundleJson(plain));
  const ok = spawnSync(process.execPath, ['scripts/verify-packet.mjs', good], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stdout);
  assert.match(ok.stdout, /^VERIFIED/);
  // a bundle whose code was altered after export no longer verifies, whatever its decoded fields say
  const altered = { ...plain, code: vectors.vectors.find((v) => v.name === 'tampered-photo-hash')!.input };
  const bad = join(dir, 'altered.json');
  writeFileSync(bad, JSON.stringify(altered));
  const no = spawnSync(process.execPath, ['scripts/verify-packet.mjs', bad], { encoding: 'utf8' });
  assert.equal(no.status, 1);
  assert.match(no.stdout, /^NOT VERIFIED/);
});
