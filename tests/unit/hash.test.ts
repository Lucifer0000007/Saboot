// Hash chain: append, verify, and detect a quiet edit (the tamper test) with real WebCrypto SHA-256.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendLink, verifyChain, sha256, sha256js, canonical, GENESIS, type ChainLink } from '../../src/lib/hash.ts';

type Body = { simT: number; type: string };

async function build(n: number) {
  const chain: ChainLink<Body>[] = [];
  for (let i = 0; i < n; i++) chain.push(await appendLink(chain, { simT: i, type: 'E' + i }));
  return chain;
}

test('sha256 matches a known vector', async () => {
  assert.equal(await sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('the plain-JS fallback (plain-HTTP pages) matches the standard vectors and WebCrypto', async () => {
  const enc = (s: string) => new TextEncoder().encode(s);
  assert.equal(sha256js(enc('')), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256js(enc('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256js(enc('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  for (const n of [55, 56, 63, 64, 65, 1000, 70_000]) {
    const bytes = new Uint8Array(n).map((_, i) => (i * 7919) & 255);
    assert.equal(sha256js(bytes), await sha256(bytes.buffer as ArrayBuffer), `length ${n}`);
  }
});

test('canonical JSON ignores key order and drops undefined', () => {
  assert.equal(canonical({ b: 1, a: [2, { d: undefined, c: 3 }] }), canonical({ a: [2, { c: 3 }], b: 1 }));
});

test('an untouched chain verifies from genesis', async () => {
  const c = await build(6);
  assert.equal(c[0].prev, GENESIS);
  assert.deepEqual(await verifyChain(c), Array(6).fill('ok'));
});

test('editing one record without re-hashing marks it tampered and everything after it broken', async () => {
  const c = await build(6);
  c[2] = { ...c[2], body: { ...c[2].body, simT: c[2].body.simT - 6 } };
  assert.deepEqual(await verifyChain(c), ['ok', 'ok', 'tampered', 'broken', 'broken', 'broken']);
});

test('re-hashing the edited record still breaks the next link', async () => {
  const c = await build(4);
  const forged = await appendLink(c.slice(0, 1), { simT: 99, type: 'forged' });
  c[1] = forged;
  assert.deepEqual(await verifyChain(c), ['ok', 'ok', 'tampered', 'broken']);
});
