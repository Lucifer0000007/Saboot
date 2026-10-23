#!/usr/bin/env node
// Verify a Saboot evidence packet. Zero dependencies: Node's built-in WebCrypto only, and it does NOT import any Saboot
// code, so it is an independent check of docs/EVIDENCE-FORMAT.md, not a copy of the app's verifier.
//
//   node scripts/verify-packet.mjs <code | link | file>   an evidence code, a link with #k=<code>, or a file holding a
//                                                         code or an evidence bundle (JSON with a "code" field)
//   node scripts/verify-packet.mjs --json <input>         print the result as JSON
//   echo <code> | node scripts/verify-packet.mjs -        read the code from standard input
//
// Exit code: 0 verified, 1 not verified, 2 usage error.
//
// Verified means ONLY: the packet has not been altered since it was sealed. It does not prove who sealed it, that the
// photos are true, or that the phone clock was right (see "What it proves" in docs/EVIDENCE-FORMAT.md).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const VERSION = 1;
const KINDS = ['wide', 'close', 'landmark'];
const subtle = globalThis.crypto.subtle;

const toHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const fromHex = (h) => new Uint8Array((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));
const cat = (...parts) => {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
const sha256 = async (b) => new Uint8Array(await subtle.digest('SHA-256', b));

// A code is about 338 characters; anything much longer is not one.
const MAX_CODE_CHARS = 1024;
const toB64url = (b) => Buffer.from(b).toString('base64url');
/**
 * The code as bytes, or null. Whitespace is ignored (a pasted code may wrap), only the base64url alphabet is allowed, and only
 * the canonical spelling counts: the last character carries unused bits, and one packet must have exactly one text.
 */
function codeBytes(input) {
  const code = String(input).trim().replace(/^[\s\S]*#k=/, '').replace(/\s+/g, '');
  if (!code || code.length > MAX_CODE_CHARS || code.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  const bytes = new Uint8Array(Buffer.from(code, 'base64url'));
  return toB64url(bytes) === code ? bytes : null;
}

// ---- P-256 point decompression: WebCrypto imports an uncompressed point (65 bytes), the packet carries 33 ----
const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const B = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
const big = (b) => BigInt('0x' + toHex(b));
const bytes32 = (n) => fromHex(n.toString(16).padStart(64, '0'));
function modpow(base, exp, m) {
  let r = 1n;
  base %= m;
  while (exp > 0n) {
    if (exp & 1n) r = (r * base) % m;
    base = (base * base) % m;
    exp >>= 1n;
  }
  return r;
}
function decompress(c) {
  const x = big(c.slice(1));
  const rhs = (((x * x) % P) * x - 3n * x + B) % P;
  let y = modpow((rhs + P) % P, (P + 1n) / 4n, P);
  if ((y & 1n) !== BigInt(c[0] & 1)) y = P - y;
  return cat(new Uint8Array([4]), bytes32(x), bytes32(y));
}

/**
 * Layout of version 1 (big-endian), the same one docs/EVIDENCE-FORMAT.md describes:
 *   u8 version | u8 plot number | u16 event hour x100 | u16 seal hour x100 | u32 phone clock, unix seconds
 *   i32 latitude x1000 | i32 longitude x1000 | u8 n photos | n x (u8 kind, u16 capture hour x100, 32 bytes SHA-256)
 *   32 bytes chain head | 33 bytes compressed P-256 public key | 64 bytes ECDSA signature over everything before it
 * A photo's kind byte: bits 0-1 the kind, bits 2-3 where the photo came from, bits 4-5 where its location came from
 * (0 not recorded, 1 live, 2 simulated, 3 entered by hand); bits 6-7 must be 0.
 * Chain: link = SHA-256(previous link, record), starting from 32 zero bytes. Records: each photo's 35 bytes, then a
 * seal record made of 0xff and bytes 1..17 of the body.
 */
async function chainHead(body) {
  const n = body[18];
  const records = Array.from({ length: n }, (_, i) => body.slice(19 + i * 35, 19 + (i + 1) * 35));
  records.push(cat(new Uint8Array([0xff]), body.slice(1, 18)));
  let link = new Uint8Array(32);
  for (const r of records) link = await sha256(cat(link, r));
  return link;
}

const ORIGIN_NAMES = ['not recorded', 'live', 'simulated', 'hand'];

export async function verify(input) {
  const all = codeBytes(input);
  if (!all) return { ok: false, failed: 'decode', reason: 'Not a Saboot evidence code.' };
  if (all.length < 19 || all[0] !== VERSION) return { ok: false, failed: 'decode', reason: 'Unknown code version or too short.' };
  const n = all[18];
  const bodyLen = 19 + n * 35;
  if (n < 1 || n > 3 || all.length !== bodyLen + 32 + 33 + 64) return { ok: false, failed: 'decode', reason: 'Code length does not match its contents.' };
  const body = all.slice(0, bodyLen);
  const head = all.slice(bodyLen, bodyLen + 32);
  const pub = all.slice(bodyLen + 32, bodyLen + 65);
  const sig = all.slice(bodyLen + 65);
  const dv = new DataView(body.buffer, body.byteOffset, body.byteLength);
  if (Math.abs(dv.getInt32(10) / 1000) > 90 || Math.abs(dv.getInt32(14) / 1000) > 180) return { ok: false, failed: 'decode', reason: 'The location is not a place on Earth.' };
  const kinds = [];
  for (let i = 0; i < n; i++) {
    const kb = dv.getUint8(19 + i * 35);
    if ((kb & 3) > 2 || kb & 0xc0) return { ok: false, failed: 'decode', reason: 'A photo record has a kind this format does not define.' };
    kinds.push(kb & 3);
  }
  if (new Set(kinds).size !== n) return { ok: false, failed: 'decode', reason: 'Two photos have the same kind.' };
  const payload = {
    formatVersion: dv.getUint8(0),
    plot: 'P-' + String(dv.getUint8(1)).padStart(2, '0'),
    eventHour: dv.getUint16(2) / 100,
    sealHour: dv.getUint16(4) / 100,
    phoneClockUtc: new Date(dv.getUint32(6) * 1000).toISOString().replace('.000Z', 'Z'),
    lat: dv.getInt32(10) / 1000,
    lon: dv.getInt32(14) / 1000,
    photos: Array.from({ length: n }, (_, i) => ({
      kind: KINDS[kinds[i]],
      photoOrigin: ORIGIN_NAMES[(dv.getUint8(19 + i * 35) >> 2) & 3],
      locationOrigin: ORIGIN_NAMES[(dv.getUint8(19 + i * 35) >> 4) & 3],
      captureHour: dv.getUint16(19 + i * 35 + 1) / 100,
      sha256: toHex(body.slice(19 + i * 35 + 3, 19 + i * 35 + 35)),
    })),
    chainHead: toHex(head),
    publicKey: toHex(pub),
  };
  if (toHex(await chainHead(body)) !== payload.chainHead) {
    return { ok: false, failed: 'chain', reason: 'A record does not match the chain head: the packet was altered.', payload };
  }
  try {
    const key = await subtle.importKey('raw', decompress(pub), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const good = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig, cat(body, head, pub));
    if (!good) return { ok: false, failed: 'signature', reason: 'The signature does not match: the code was changed after signing.', payload };
  } catch {
    return { ok: false, failed: 'signature', reason: 'The public key in the code is not valid.', payload };
  }
  return { ok: true, failed: null, payload };
}

/** A code, a link, a file with a code, or a bundle: whatever the person gave us, reduced to a code string. */
export function inputToCode(arg) {
  if (!existsSync(arg)) return arg;
  const text = readFileSync(arg, 'utf8').trim();
  if (text.startsWith('{')) {
    const j = JSON.parse(text);
    if (typeof j.code !== 'string') throw new Error('The JSON file has no "code" field: it is not a Saboot evidence bundle.');
    return j.code;
  }
  return text;
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const rest = args.filter((a) => a !== '--json');
  if (!rest.length || rest.includes('--help') || rest.includes('-h')) {
    console.error('Usage: node scripts/verify-packet.mjs [--json] <code | link | file | ->');
    process.exit(2);
  }
  let code;
  try {
    code = rest[0] === '-' ? readFileSync(0, 'utf8').trim() : inputToCode(rest[0]);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (!String(code).trim()) {
    console.error('Nothing to verify: the input is empty.');
    process.exit(2);
  }
  const r = await verify(code);
  if (json) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const step = (label, state) => console.log(`  ${state === null ? '-' : state ? 'PASS' : 'FAIL'}  ${label}${state === null ? ' (not reached)' : ''}`);
    console.log(r.ok ? 'VERIFIED: not altered since it was sealed.' : `NOT VERIFIED: ${r.reason}`);
    step('Code decoded', r.failed !== 'decode');
    step('Packet chain recomputed and matches its head', r.failed === 'decode' ? null : r.failed !== 'chain');
    step('ECDSA P-256 signature valid for the key in the code', r.failed === 'decode' || r.failed === 'chain' ? null : r.failed !== 'signature');
    if (r.payload) {
      const p = r.payload;
      console.log(`\n  plot            ${p.plot}`);
      console.log(`  event hour      ${p.eventHour} (replay hours since T0)`);
      console.log(`  seal hour       ${p.sealHour} (replay hours since T0)`);
      console.log(`  phone clock     ${p.phoneClockUtc}  (as the phone reported it; not checked against a trusted clock)`);
      console.log(`  location        ${p.lat}, ${p.lon}  (rounded to 0.001 degrees, about 100 m)`);
      for (const ph of p.photos) console.log(`  photo ${ph.kind.padEnd(8)} hour ${ph.captureHour}  sha256 ${ph.sha256}  (photo: ${ph.photoOrigin}, location: ${ph.locationOrigin})`);
      console.log(`  chain head      ${p.chainHead}`);
      console.log(`  public key      ${p.publicKey}`);
    }
    console.log('\nThis proves the packet was not altered after sealing. It does not prove who sealed it, that the photos are true,');
    console.log('or that the phone clock was right. See docs/EVIDENCE-FORMAT.md.');
  }
  process.exit(r.ok ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
