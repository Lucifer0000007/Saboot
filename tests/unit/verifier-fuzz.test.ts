// Both verifiers parse input a stranger controls: a scanned QR, a pasted code, a link. Whatever they are given they must
// answer (never throw, never hang), refuse anything that is not exactly the original, and agree with each other.
// A seeded generator keeps every run the same, so a failure can be replayed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAX_CODE_CHARS, b64url, verifyCode } from '../../src/k/payload.ts';
import { verify as verifyStandalone } from '../../scripts/verify-packet.mjs';

const valid = (JSON.parse(readFileSync('tests/vectors/evidence-v1.json', 'utf8')) as { vectors: { name: string; input: string }[] }).vectors.find((v) => v.name === 'valid')!.input;

/** mulberry32: a small deterministic generator. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const pick = (r: () => number, s: string) => s[Math.floor(r() * s.length)];

/** Ask both verifiers. Neither may throw; the pair must agree on "ok". */
async function both(input: string) {
  const a = await verifyCode(input);
  const b = await verifyStandalone(input);
  assert.equal(a.ok, b.ok, `the two verifiers disagree on ${JSON.stringify(input.slice(0, 40))}: app ${a.ok}, standalone ${b.ok}`);
  return a.ok;
}

test('the original verifies in both, so the checks below mean something', async () => {
  assert.equal(await both(valid), true);
});

test('random text and random bytes in the code alphabet are refused, quickly', async () => {
  const r = rng(1);
  for (let i = 0; i < 300; i++) {
    const len = Math.floor(r() * 1500);
    let s = '';
    for (let j = 0; j < len; j++) s += pick(r, r() < 0.8 ? ALPHABET : ALPHABET + ' \n\t#=+/!é\u0000');
    assert.equal(await both(s), false, `random input ${i} must not verify`);
  }
});

test('every prefix of a valid code (a truncated scan) is refused', async () => {
  for (let n = 0; n < valid.length; n++) assert.equal(await both(valid.slice(0, n)), false, `prefix of ${n} characters`);
});

test('every single-character change to a valid code is refused (the one canonical spelling is the only one that verifies)', async () => {
  for (let i = 0; i < valid.length; i++) {
    const c = valid[i];
    const other = ALPHABET[(ALPHABET.indexOf(c) + 1 + (i % 7)) % ALPHABET.length];
    assert.equal(await both(valid.slice(0, i) + other + valid.slice(i + 1)), false, `character ${i} changed`);
  }
});

test('extra characters, doubled codes, and oversized input are refused without work proportional to the size', async () => {
  assert.equal(await both(valid + 'A'), false);
  assert.equal(await both(valid + valid), false);
  assert.equal(await both('A'.repeat(MAX_CODE_CHARS + 1)), false);
  const t = Date.now();
  assert.equal(await both('A'.repeat(2_000_000)), false);
  assert.ok(Date.now() - t < 2000, 'a 2 MB input must be refused at once, not parsed');
});

test('a body whose photo count or length field lies is refused, not read past its end', async () => {
  const bytes = Uint8Array.from(Buffer.from(valid.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  for (const count of [0, 4, 7, 200, 255]) {
    const lie = Uint8Array.from(bytes);
    lie[18] = count;
    assert.equal(await both(b64url(lie)), false, `photo count ${count}`);
  }
  for (const keep of [0, 1, 18, 19, 20, 100, bytes.length - 1]) assert.equal(await both(b64url(bytes.slice(0, keep))), false, `${keep} bytes`);
  assert.equal(await both(b64url(Uint8Array.from([...bytes, 0, 0, 0]))), false, 'trailing bytes');
});
