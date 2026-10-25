// Feature K: a compact, signed evidence payload that moves a sealed packet from a phone to a laptop
// with no server. ~253 bytes → ~338 base64url characters (QR / copyable code / #k= link).
// Photos never leave the phone: only their SHA-256 fingerprints, times and a coarse location do.
//
// Layout v1 (big-endian):
//   u8 version · u8 plot no. · u16 eventT×100 · u16 sealT×100 · u32 device unix seconds
//   i32 lat×1000 · i32 lon×1000 (≈100 m) · u8 n · n × (u8 kind, u16 capture simT×100, 32 B sha256)
//   32 B chain head · 33 B compressed P-256 public key · 64 B ECDSA signature over everything before it
// The kind byte: bits 0-1 the photo kind (0 wide, 1 close, 2 landmark), bits 2-3 where the photo came from and bits 4-5 where
// its location came from (0 not recorded, 1 live, 2 simulated, 3 entered by hand), bits 6-7 must be 0. Every packet made before
// these bits were used has them at 0, so it still verifies and reads "not recorded". They are inside the chained, signed bytes.
// Chain: link_i = SHA-256(link_{i-1} ‖ record_i), link_-1 = 32 zero bytes; records = each shot, then the seal.

import { QR_PREFIX, fromBase45, toBase45 } from './base45';

export type KKind = 'wide' | 'close' | 'landmark';
const KINDS: KKind[] = ['wide', 'close', 'landmark'];
/** Where a photo or its location came from. Absent means "not recorded". */
export type Origin = 'live' | 'sim' | 'hand';
const ORIGINS: (Origin | undefined)[] = [undefined, 'live', 'sim', 'hand'];
const ORIGIN_BITS: Record<Origin, number> = { live: 1, sim: 2, hand: 3 };

export interface KShot { kind: KKind; simT: number; sha: string; photo?: Origin; loc?: Origin }
export interface KInput { plot: string; eventT: number; sealT: number; deviceMs: number; lat: number; lon: number; shots: KShot[] }
export interface KPayload extends KInput { head: string; pub: string }
export type KStep = 'decode' | 'chain' | 'signature';
export interface KResult { ok: boolean; failed: KStep | null; reason?: string; payload?: KPayload }

const VERSION = 1;
/** A code is about 338 characters. Anything much longer is not one. */
export const MAX_CODE_CHARS = 1024;
const subtle = () => globalThis.crypto.subtle;

// ---------- bytes ----------
export const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
export const fromHex = (h: string) => new Uint8Array((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));
export function b64url(b: Uint8Array) {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64url(s: string) {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const cat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
const sha = async (b: Uint8Array) => new Uint8Array(await subtle().digest('SHA-256', b as BufferSource));
const hours = (h: number) => Math.round(h * 100);
const MAX_HOURS = 655.35;

/** What a person pasted or scanned, as bytes: a bare code or a link with #k=. Null when it is not exactly a code. */
export function codeBytes(text: string): Uint8Array | null {
  // whitespace is ignored (a code pasted from a message may wrap); anything else outside the alphabet is refused
  const code = text.trim().replace(/^[\s\S]*#k=/, '').replace(/\s+/g, '');
  if (!code || code.length > MAX_CODE_CHARS || code.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  const bytes = unb64url(code);
  // the final character carries unused bits; only the canonical spelling counts, so one code has one text
  return b64url(bytes) === code ? bytes : null;
}

/** Refuse input that the format would silently squeeze into range. */
function assertInput(p: KInput) {
  const fail = (what: string): never => { throw new Error('Cannot make the code: ' + what); };
  const plot = parseInt(p.plot.replace(/\D/g, ''), 10);
  if (!Number.isInteger(plot) || plot < 0 || plot > 255) fail('the plot number does not fit');
  for (const [what, h] of [['event', p.eventT], ['seal', p.sealT], ...p.shots.map((s) => ['photo', s.simT] as const)] as const) {
    if (!Number.isFinite(h) || h < 0 || h > MAX_HOURS) fail(`the ${what} time is missing or out of range`);
  }
  if (!Number.isFinite(p.deviceMs) || p.deviceMs < 0 || p.deviceMs / 1000 > 0xffffffff) fail('the phone clock is out of range');
  if (!(Math.abs(p.lat) <= 90) || !(Math.abs(p.lon) <= 180)) fail('the location is out of range');
  if (p.shots.length < 1 || p.shots.length > 3) fail('a code holds one to three photos');
  if (new Set(p.shots.map((s) => s.kind)).size !== p.shots.length) fail('two photos have the same kind');
  if (p.shots.some((s) => !/^[0-9a-f]{64}$/.test(s.sha))) fail('a photo fingerprint is not 64 hex characters');
}

/** The bytes that are chained and signed, for already-checked input. */
export function encodeBody(p: KInput) {
  const n = p.shots.length;
  const b = new Uint8Array(19 + n * 35);
  const v = new DataView(b.buffer);
  v.setUint8(0, VERSION);
  v.setUint8(1, parseInt(p.plot.replace(/\D/g, ''), 10));
  v.setUint16(2, hours(p.eventT));
  v.setUint16(4, hours(p.sealT));
  v.setUint32(6, Math.floor(p.deviceMs / 1000));
  v.setInt32(10, Math.round(p.lat * 1000));
  v.setInt32(14, Math.round(p.lon * 1000));
  v.setUint8(18, n);
  p.shots.forEach((s, i) => {
    const o = 19 + i * 35;
    v.setUint8(o, KINDS.indexOf(s.kind) | ((s.photo ? ORIGIN_BITS[s.photo] : 0) << 2) | ((s.loc ? ORIGIN_BITS[s.loc] : 0) << 4));
    v.setUint16(o + 1, hours(s.simT));
    b.set(fromHex(s.sha), o + 3);
  });
  return b;
}

/** Records that are chained: one per shot (35 bytes each) and a final seal record. */
function records(b: Uint8Array): Uint8Array[] {
  const n = b[18];
  const shots = Array.from({ length: n }, (_, i) => b.slice(19 + i * 35, 19 + (i + 1) * 35));
  const seal = cat(new Uint8Array([0xff]), b.slice(1, 18));
  return [...shots, seal];
}

export async function chainHead(b: Uint8Array) {
  let link = new Uint8Array(32);
  for (const r of records(b)) link = await sha(cat(link, r));
  return link;
}

// ---------- P-256 point compression (BigInt) ----------
const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const B = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
const big = (b: Uint8Array) => BigInt('0x' + toHex(b));
const bytes32 = (n: bigint) => fromHex(n.toString(16).padStart(64, '0'));
function modpow(base: bigint, exp: bigint, m: bigint) {
  let r = 1n;
  base %= m;
  while (exp > 0n) {
    if (exp & 1n) r = (r * base) % m;
    base = (base * base) % m;
    exp >>= 1n;
  }
  return r;
}
export function compress(raw: Uint8Array) {
  const y = big(raw.slice(33, 65));
  return cat(new Uint8Array([y & 1n ? 3 : 2]), raw.slice(1, 33));
}
export function decompress(c: Uint8Array) {
  const x = big(c.slice(1));
  const rhs = (((x * x) % P) * x - 3n * x + B) % P;
  let y = modpow((rhs + P) % P, (P + 1n) / 4n, P);
  if ((y & 1n) !== BigInt(c[0] & 1)) y = P - y;
  return cat(new Uint8Array([4]), bytes32(x), bytes32(y));
}

// ---------- sign / verify ----------
export async function newDeviceKey(): Promise<CryptoKeyPair> {
  return subtle().generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']) as Promise<CryptoKeyPair>;
}

/** Chain and sign already-encoded body bytes (also used to build malformed test vectors that carry a valid signature). */
export async function signBody(b: Uint8Array, key: CryptoKeyPair): Promise<string> {
  const head = await chainHead(b);
  const pub = compress(new Uint8Array(await subtle().exportKey('raw', key.publicKey)));
  const signed = cat(b, head, pub);
  const sig = new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, key.privateKey, signed as BufferSource));
  return b64url(cat(signed, sig));
}

/** Build the signed code (base64url) for a sealed packet. Throws instead of squeezing a bad value into range. */
export async function makeCode(input: KInput, key: CryptoKeyPair): Promise<string> {
  assertInput(input);
  return signBody(encodeBody(input), key);
}

/** Decode, recompute the chain, verify the signature. Says only "not altered since sealing". */
export async function verifyCode(code: string): Promise<KResult> {
  const all = codeBytes(code);
  if (!all) return { ok: false, failed: 'decode', reason: 'Not a Saboot evidence code.' };
  if (all.length < 19 || all[0] !== VERSION) return { ok: false, failed: 'decode', reason: 'Unknown code version or too short.' };
  const n = all[18];
  const bodyLen = 19 + n * 35;
  if (n < 1 || n > 3 || all.length !== bodyLen + 32 + 33 + 64) return { ok: false, failed: 'decode', reason: 'Code length does not match its contents.' };
  const b = all.slice(0, bodyLen);
  const head = all.slice(bodyLen, bodyLen + 32);
  const pub = all.slice(bodyLen + 32, bodyLen + 65);
  const sig = all.slice(bodyLen + 65);
  const v = new DataView(b.buffer);
  const lat = v.getInt32(10) / 1000;
  const lon = v.getInt32(14) / 1000;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return { ok: false, failed: 'decode', reason: 'The location is not a place on Earth.' };
  const shots: KShot[] = [];
  for (let i = 0; i < n; i++) {
    const o = 19 + i * 35;
    const kb = v.getUint8(o);
    if ((kb & 3) > 2 || kb & 0xc0) return { ok: false, failed: 'decode', reason: 'A photo record has a kind this format does not define.' };
    shots.push({
      kind: KINDS[kb & 3],
      simT: v.getUint16(o + 1) / 100,
      sha: toHex(b.slice(o + 3, o + 35)),
      photo: ORIGINS[(kb >> 2) & 3],
      loc: ORIGINS[(kb >> 4) & 3],
    });
  }
  if (new Set(shots.map((s) => s.kind)).size !== n) return { ok: false, failed: 'decode', reason: 'Two photos have the same kind.' };
  const payload: KPayload = {
    plot: 'P-' + String(v.getUint8(1)).padStart(2, '0'),
    eventT: v.getUint16(2) / 100,
    sealT: v.getUint16(4) / 100,
    deviceMs: v.getUint32(6) * 1000,
    lat,
    lon,
    shots,
    head: toHex(head),
    pub: toHex(pub),
  };
  if (toHex(await chainHead(b)) !== payload.head) return { ok: false, failed: 'chain', reason: 'A record does not match the chain head: the packet was altered.', payload };
  try {
    const key = await subtle().importKey('raw', decompress(pub) as BufferSource, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const good = await subtle().verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig as BufferSource, cat(b, head, pub) as BufferSource);
    if (!good) return { ok: false, failed: 'signature', reason: 'The signature does not match: the code was changed after signing.', payload };
  } catch {
    return { ok: false, failed: 'signature', reason: 'The public key in the code is not valid.', payload };
  }
  return { ok: true, failed: null, payload };
}

// ---------- the share QR spells the code in base45 (see base45.ts) ----------
/** The text the share QR holds for a code. */
export function qrTextOf(code: string): string {
  const bytes = codeBytes(code);
  if (!bytes) throw new Error('Cannot make the QR code: not a Saboot code.');
  return QR_PREFIX + toBase45(bytes);
}
/** What a scan or a paste gives back as a code: QR text becomes the base64url code, anything else is left as it is. */
export function codeFromQrText(text: string): string {
  const t = text.trim();
  if (!t.startsWith(QR_PREFIX)) return text;
  const bytes = fromBase45(t.slice(QR_PREFIX.length));
  return bytes ? b64url(bytes) : text;
}
