// Regenerate or extend the evidence-packet test vectors: tests/vectors/evidence-v1.json.
//   node --import ./scripts/ts-resolve.mjs scripts/evidence-vectors.ts
// ECDSA signatures are randomised, so running this again would produce different strings for the same inputs. So the committed
// file is canonical and is NEVER rewritten: with the file present this script only appends vectors whose name is missing, and
// it leaves every existing vector as it is. Without the file it builds the first ten from scratch.
// Everything here is synthetic: a made-up plot, made-up photo fingerprints, and throw-away keys.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { b64url, chainHead, encodeBody, fromHex, makeCode, newDeviceKey, signBody, toHex, unb64url, verifyCode, type KInput, type Origin } from '../src/k/payload.ts';

const FILE = 'tests/vectors/evidence-v1.json';

interface Vector {
  name: string;
  description: string;
  input: string;
  expect: { ok: boolean; failed: string | null; plot?: string; photos?: number; chainHead?: string; publicKey?: string; firstPhotoSha256?: string; photoOrigins?: string[]; locationOrigins?: string[] };
}

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

const NAMES: Record<string, string> = { live: 'live', sim: 'simulated', hand: 'hand' };
const describe = async (c: { name: string; description: string; input: string }): Promise<Vector> => {
  const r = await verifyCode(c.input);
  const p = r.payload;
  return {
    name: c.name,
    description: c.description,
    input: c.input,
    expect: {
      ok: r.ok,
      failed: r.failed,
      ...(p ? { plot: p.plot, photos: p.shots.length, chainHead: p.head, publicKey: p.pub, firstPhotoSha256: p.shots[0].sha } : {}),
    },
  };
};

// ---- the first ten: built only when the file does not exist yet ----
async function firstTen(): Promise<Vector[]> {
  const valid = await makeCode(input, await newDeviceKey());
  const raw = unb64url(valid);
  const bodyLen = 19 + raw[18] * 35;
  const edit = (f: (b: Uint8Array) => void) => { const b = raw.slice(); f(b); return b64url(b); };
  const flip = (b: Uint8Array, i: number) => { b[i] ^= 0x01; };
  // an attacker who changes a photo fingerprint AND recomputes the chain head, but cannot re-sign
  const rechained = raw.slice();
  rechained[19 + 3] ^= 0x01;
  rechained.set(await chainHead(rechained.slice(0, bodyLen)), bodyLen);
  const cases = [
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
  const vectors = await Promise.all(cases.map(describe));
  const want: Record<string, string | null> = {
    valid: null, 'valid-link': null, 'tampered-photo-hash': 'chain', 'tampered-chain-head': 'chain', 'tampered-seal-time': 'chain',
    'edited-and-rechained': 'signature', 'wrong-signature': 'signature', 'wrong-version': 'decode', truncated: 'decode', 'not-a-code': 'decode',
  };
  for (const v of vectors) if (v.expect.failed !== want[v.name]) throw new Error(`${v.name}: expected ${want[v.name]}, got ${v.expect.failed}`);
  return vectors;
}

// ---- added later: where each photo and its location came from, and the strict decoding rules ----
async function provenanceAndStrictness(): Promise<{ vector: Vector; want: string | null }[]> {
  const key = await newDeviceKey(); // a second throw-away key, only for these
  const flagged = (photo: Origin | undefined, loc: (i: number) => Origin | undefined): KInput => ({ ...input, shots: input.shots.map((s, i) => ({ ...s, photo, loc: loc(i) })) });
  const live = await makeCode(flagged('live', () => 'live'), key);
  const sim = await makeCode(flagged('sim', () => 'sim'), key);
  const hand = await makeCode(flagged('live', (i) => (i === 0 ? 'hand' : 'live')), key);
  const rawLive = unb64url(live);
  const editLive = (f: (b: Uint8Array) => void) => { const b = rawLive.slice(); f(b); return b64url(b); };
  // bodies that are well formed and correctly signed, but break a rule a verifier must enforce
  const bodyWith = (f: (b: Uint8Array, v: DataView) => void) => { const b = encodeBody(flagged('live', () => 'live')); f(b, new DataView(b.buffer)); return signBody(b, key); };
  const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  // 253 bytes fill 337 characters and 2 bits of the 338th: the lower 4 bits of the last character are unused
  const altLast = live.slice(0, -1) + ALPH[ALPH.indexOf(live.at(-1)!) ^ 1];

  const rows: { name: string; description: string; input: string; want: string | null }[] = [
    { name: 'origin-live', description: 'Every photo and its location came from the live camera and GPS. The origin bits are inside the chained, signed bytes.', input: live, want: null },
    { name: 'origin-simulated', description: 'Every photo and its location was simulated. A laptop must say so.', input: sim, want: null },
    { name: 'origin-hand-location', description: 'Live photos, but the first location was entered by hand.', input: hand, want: null },
    { name: 'origin-changed-after-sealing', description: 'One origin bit of the first photo was cleared (live to not recorded). The kind byte is part of the chain, so the head no longer matches.', input: editLive((b) => { b[19] ^= 0x04; }), want: 'chain' },
    { name: 'wrapped-lines', description: 'The same live packet pasted with line breaks every 64 characters. Whitespace is ignored.', input: live.replace(/(.{64})/g, '$1\n'), want: null },
    { name: 'not-canonical-last-character', description: 'The last character changed in its four unused bits, so the bytes are identical. Only the canonical spelling is accepted: one packet, one text.', input: altLast, want: 'decode' },
    { name: 'code-too-long', description: 'More than 1,024 characters. Not a code.', input: 'A'.repeat(2000), want: 'decode' },
    { name: 'reserved-bits-set', description: 'Correctly signed, but bit 6 of the first kind byte is set. Those bits must be 0.', input: await bodyWith((b) => { b[19] |= 0x40; }), want: 'decode' },
    { name: 'unknown-photo-kind', description: 'Correctly signed, but the first photo kind is 3. Only 0, 1 and 2 exist.', input: await bodyWith((b) => { b[19] = (b[19] & ~3) | 3; }), want: 'decode' },
    { name: 'duplicate-photo-kind', description: 'Correctly signed, but two photos both say "wide".', input: await bodyWith((b) => { b[19 + 35] = (b[19 + 35] & ~3) | (b[19] & 3); }), want: 'decode' },
    { name: 'latitude-out-of-range', description: 'Correctly signed, but the latitude is 100 degrees.', input: await bodyWith((_b, v) => { v.setInt32(10, 100000); }), want: 'decode' },
  ];
  const out: { vector: Vector; want: string | null }[] = [];
  for (const r of rows) {
    const v = await describe(r);
    const p = (await verifyCode(r.input)).payload;
    if (p && ['origin-live', 'origin-simulated', 'origin-hand-location', 'origin-changed-after-sealing', 'wrapped-lines'].includes(r.name)) {
      v.expect.photoOrigins = p.shots.map((s) => (s.photo ? NAMES[s.photo] : 'not recorded'));
      v.expect.locationOrigins = p.shots.map((s) => (s.loc ? NAMES[s.loc] : 'not recorded'));
    }
    out.push({ vector: v, want: r.want });
  }
  return out;
}

const file = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf8')) as { format: string; note: string; vectors: Vector[] }) : null;
const vectors: Vector[] = file ? file.vectors : await firstTen();
let added = 0;
if (!vectors.some((v) => v.name === 'origin-live')) {
  for (const { vector, want } of await provenanceAndStrictness()) {
    // the whole point of a vector set is that the failures fail for the intended reason
    if (vector.expect.failed !== want) throw new Error(`${vector.name}: expected ${want}, got ${vector.expect.failed}`);
    vectors.push(vector);
    added++;
  }
}

mkdirSync('tests/vectors', { recursive: true });
writeFileSync(FILE, JSON.stringify({
  format: 'Saboot evidence packet, version 1 (docs/EVIDENCE-FORMAT.md)',
  note: 'Synthetic: a made-up plot, made-up photo fingerprints and throw-away keys. ECDSA signatures are randomised, so these strings are the fixed vectors: this file is only ever appended to, never regenerated. The first ten were made before the origin bits and the strict decoding rules were added; every one of them still gives the same result.',
  vectors,
}, null, 2) + '\n');
console.log(`wrote ${FILE}: ${vectors.length} vectors (${added} added), first public key ${toHex(fromHex(vectors[0].expect.publicKey!)).slice(0, 16)}…`);
