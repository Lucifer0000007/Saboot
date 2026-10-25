// Feature K payload: round trip, size, and detection of edits (chain) and forgery (signature).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCode, verifyCode, newDeviceKey, compress, decompress, unb64url, b64url, type KInput } from '../../src/k/payload.ts';

const input: KInput = {
  plot: 'P-04', eventT: 11, sealT: 17.35, deviceMs: Date.UTC(2026, 9, 13, 9, 30), lat: 30.71234, lon: 76.70421,
  shots: [
    { kind: 'wide', simT: 17.25, sha: 'a'.repeat(64) },
    { kind: 'close', simT: 17.27, sha: 'b'.repeat(64) },
    { kind: 'landmark', simT: 17.29, sha: 'c'.repeat(64) },
  ],
};

test('a sealed packet round-trips and verifies; the code stays small', async () => {
  const key = await newDeviceKey();
  const code = await makeCode(input, key);
  assert.ok(code.length < 400, `code is ${code.length} chars`);
  const r = await verifyCode(code);
  assert.equal(r.ok, true, r.reason ?? '');
  assert.equal(r.payload!.plot, 'P-04');
  assert.equal(r.payload!.shots[2].sha, 'c'.repeat(64));
  assert.equal(r.payload!.lat, 30.712); // coarse: ~100 m
  assert.equal(r.payload!.sealT, 17.35);
});

test('a link with the code in the fragment also verifies', async () => {
  const code = await makeCode(input, await newDeviceKey());
  assert.equal((await verifyCode('https://example.test/#k=' + code)).ok, true);
});

test('changing a photo fingerprint breaks the chain', async () => {
  const bytes = unb64url(await makeCode(input, await newDeviceKey()));
  bytes[19 + 3] ^= 0x01; // first byte of the first sha256
  const r = await verifyCode(b64url(bytes));
  assert.equal(r.ok, false);
  assert.equal(r.failed, 'chain');
});

test('re-computing the chain after an edit still fails the signature', async () => {
  const { chainHead } = await import('../../src/k/payload.ts');
  const bytes = unb64url(await makeCode(input, await newDeviceKey()));
  const bodyLen = 19 + 3 * 35;
  bytes[5] ^= 0x01; // move the seal time
  bytes.set(await chainHead(bytes.slice(0, bodyLen)), bodyLen);
  const r = await verifyCode(b64url(bytes));
  assert.equal(r.failed, 'signature');
});

test('P-256 point compression round-trips', async () => {
  const key = await newDeviceKey();
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key.publicKey));
  assert.deepEqual(decompress(compress(raw)), raw);
});

test('garbage is rejected as undecodable', async () => {
  assert.equal((await verifyCode('not-a-code')).failed, 'decode');
});

test('where each photo and location came from is sealed into the packet and read back', async () => {
  const code = await makeCode({ ...input, shots: input.shots.map((s, i) => ({ ...s, photo: i === 0 ? 'sim' : 'live', loc: i === 2 ? 'hand' : 'sim' })) }, await newDeviceKey());
  const r = await verifyCode(code);
  assert.equal(r.ok, true);
  assert.deepEqual(r.payload!.shots.map((s) => s.photo), ['sim', 'live', 'live']);
  assert.deepEqual(r.payload!.shots.map((s) => s.loc), ['sim', 'sim', 'hand']);
});

test('a code made without origins still verifies and reads "not recorded"', async () => {
  const r = await verifyCode(await makeCode(input, await newDeviceKey()));
  assert.equal(r.ok, true);
  assert.deepEqual(r.payload!.shots.map((s) => s.photo), [undefined, undefined, undefined]);
});

test('a value the format cannot hold is refused instead of squeezed into range', async () => {
  const key = await newDeviceKey();
  const bad: [string, Partial<KInput>][] = [
    ['a missing event time', { eventT: Number.NaN }],
    ['a time past 655.35 hours', { sealT: 700 }],
    ['a plot number past 255', { plot: 'P-300' }],
    ['a latitude past 90 degrees', { lat: 100 }],
    ['a phone clock before 1970', { deviceMs: -1 }],
    ['no photos', { shots: [] }],
    ['two photos of the same kind', { shots: [input.shots[0], { ...input.shots[1], kind: 'wide' }] }],
    ['a fingerprint of the wrong length', { shots: [{ ...input.shots[0], sha: 'ab' }] }],
  ];
  for (const [what, patch] of bad) await assert.rejects(() => makeCode({ ...input, ...patch }, key), /Cannot make the code/, what);
});

test('a code is read from a link and from wrapped lines, and nothing else is accepted', async () => {
  const code = await makeCode(input, await newDeviceKey());
  assert.equal((await verifyCode(code.replace(/(.{50})/g, '$1\n  '))).ok, true, 'a wrapped paste');
  assert.equal((await verifyCode('  https://example.test/a#k=' + code + '  ')).ok, true);
  assert.equal((await verifyCode(code + '=')).failed, 'decode', 'padding is not part of the format');
  assert.equal((await verifyCode(code.replace(/-/g, '+').replace(/_/g, '/') + 'x')).failed, 'decode');
  assert.equal((await verifyCode('A'.repeat(2000))).failed, 'decode', 'too long');
});
