// Regenerate the evidence-packet test vectors: tests/vectors/evidence-v1.json.
//   node --import ./scripts/ts-resolve.mjs scripts/evidence-vectors.ts
// The committed file is the canonical set. ECDSA signatures are randomised, so running this again produces different
// strings for the same inputs: regenerate only when the format changes, and then bump the version (docs/EVIDENCE-FORMAT.md).
// Everything here is synthetic: a made-up plot, made-up photo fingerprints, and a throw-away key.
import { mkdirSync, writeFileSync } from 'node:fs';
import { b64url, chainHead, fromHex, makeCode, newDeviceKey, toHex, unb64url, verifyCode, type KInput } from '../src/k/payload.ts';

const input: KInput = {
  plot: 'P-05',
  eventT: 11,
  sealT: 18.9,
  deviceMs: Date.UTC(2026, 6, 14, 12, 0, 0),
  lat: 30.123,
  lon: 75.456,
  shots: [
    { kind: 'wide', simT: 18.8, sha: 'a1'.repeat(32) },
    { kind: 'close', simT: 18.85, sha: 'b2'.repeat(32) },
    { kind: 'landmark', simT: 18.9, sha: 'c3'.repeat(32) },
  ],
};

const valid = await makeCode(input, await newDeviceKey());
const raw = unb64url(valid);
const bodyLen = 19 + raw[18] * 35;
const edit = (f: (b: Uint8Array) => void) => { const b = raw.slice(); f(b); return b64url(b); };
const flip = (b: Uint8Array, i: number) => { b[i] ^= 0x01; };

// an attacker who changes a photo fingerprint AND recomputes the chain head, but cannot re-sign
const rechained = (() => {
  const b = raw.slice();
  b[19 + 3] ^= 0x01;
  return b;
})();
rechained.set(await chainHead(rechained.slice(0, bodyLen)), bodyLen);

const cases: { name: string; description: string; input: string }[] = [
  { name: 'valid', description: 'A packet exactly as the phone sealed and signed it.', input: valid },
  { name: 'valid-link', description: 'The same packet inside a link: everything after #k= is the code. The fragment never reaches a server.', input: `https://example.org/saboot/#k=${valid}` },
  { name: 'tampered-photo-hash', description: 'One bit of the first photo fingerprint changed. The chain no longer matches its head.', input: edit((b) => flip(b, 19 + 3)) },
  { name: 'tampered-chain-head', description: 'One bit of the chain head changed. The recomputed chain no longer matches it.', input: edit((b) => flip(b, bodyLen)) },
  { name: 'tampered-seal-time', description: 'The seal time changed. The seal record is part of the chain, so the head no longer matches.', input: edit((b) => flip(b, 5)) },
  { name: 'edited-and-rechained', description: 'A photo fingerprint changed AND the chain head recomputed to match. The chain passes, the signature does not: only the phone’s key could sign.', input: b64url(rechained) },
  { name: 'wrong-signature', description: 'One bit of the signature changed.', input: edit((b) => flip(b, b.length - 1)) },
  { name: 'wrong-version', description: 'The version byte says 2. A verifier must refuse versions it does not know.', input: edit((b) => { b[0] = 2; }) },
  { name: 'truncated', description: 'The last ten bytes are missing.', input: b64url(raw.slice(0, raw.length - 10)) },
  { name: 'not-a-code', description: 'Not an evidence code at all.', input: 'hello world' },
];

const vectors = [];
for (const c of cases) {
  const r = await verifyCode(c.input);
  const p = r.payload;
  vectors.push({
    name: c.name,
    description: c.description,
    input: c.input,
    expect: {
      ok: r.ok,
      failed: r.failed,
      ...(p ? { plot: p.plot, photos: p.shots.length, chainHead: p.head, publicKey: p.pub, firstPhotoSha256: p.shots[0].sha } : {}),
    },
  });
}

// the whole point of a vector set is that the failures fail for the intended reason
const want: Record<string, string | null> = {
  valid: null, 'valid-link': null, 'tampered-photo-hash': 'chain', 'tampered-chain-head': 'chain', 'tampered-seal-time': 'chain',
  'edited-and-rechained': 'signature', 'wrong-signature': 'signature', 'wrong-version': 'decode', truncated: 'decode', 'not-a-code': 'decode',
};
for (const v of vectors) if (v.expect.failed !== want[v.name]) throw new Error(`${v.name}: expected ${want[v.name]}, got ${v.expect.failed}`);

mkdirSync('tests/vectors', { recursive: true });
writeFileSync('tests/vectors/evidence-v1.json', JSON.stringify({
  format: 'Saboot evidence packet, version 1 (docs/EVIDENCE-FORMAT.md)',
  note: 'Synthetic: a made-up plot, made-up photo fingerprints and a throw-away key. ECDSA signatures are randomised, so these strings are the fixed vectors. Regenerate with scripts/evidence-vectors.ts only when the format changes.',
  vectors,
}, null, 2) + '\n');
console.log(`wrote tests/vectors/evidence-v1.json: ${vectors.length} vectors, public key ${toHex(fromHex(vectors[0].expect.publicKey!)).slice(0, 16)}…`);
