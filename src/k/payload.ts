// Feature K: a compact, signed evidence payload that moves a sealed packet from a phone to a laptop
// with no server. ~253 bytes → ~338 base64url characters (QR / copyable code / #k= link).
// Photos never leave the phone: only their SHA-256 fingerprints, times and a coarse location do.
//
// Layout v1 (big-endian):
//   u8 version · u8 plot no. · u16 eventT×100 · u16 sealT×100 · u32 device unix seconds
//   i32 lat×1000 · i32 lon×1000 (≈100 m) · u8 n · n × (u8 kind, u16 simT×100, 32 B sha256)
//   32 B chain head · 33 B compressed P-256 public key · 64 B ECDSA signature over everything before it
// Chain: link_i = SHA-256(link_{i-1} ‖ record_i), link_-1 = 32 zero bytes; records = each shot, then the seal.

export type KKind = 'wide' | 'close' | 'landmark';
const KINDS: KKind[] = ['wide', 'close', 'landmark'];

export interface KShot { kind: KKind; simT: number; sha: string }
export interface KInput { plot: string; eventT: number; sealT: number; deviceMs: number; lat: number; lon: number; shots: KShot[] }
export interface KPayload extends KInput { head: string; pub: string }
export type KStep = 'decode' | 'chain' | 'signature';
export interface KResult { ok: boolean; failed: KStep | null; reason?: string; payload?: KPayload }

const VERSION = 1;
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
const hours = (h: number) => Math.max(0, Math.min(65535, Math.round(h * 100)));

function body(p: KInput) {
  const n = p.shots.length;
  const b = new Uint8Array(19 + n * 35);
  const v = new DataView(b.buffer);
  v.setUint8(0, VERSION);
  v.setUint8(1, Math.max(0, Math.min(255, parseInt(p.plot.replace(/\D/g, ''), 10) || 0)));
  v.setUint16(2, hours(p.eventT));
  v.setUint16(4, hours(p.sealT));
  v.setUint32(6, Math.floor(p.deviceMs / 1000));
  v.setInt32(10, Math.round(p.lat * 1000));
  v.setInt32(14, Math.round(p.lon * 1000));
  v.setUint8(18, n);
  p.shots.forEach((s, i) => {
    const o = 19 + i * 35;
    v.setUint8(o, KINDS.indexOf(s.kind));
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

/** Build the signed code (base64url) for a sealed packet. */
export async function makeCode(input: KInput, key: CryptoKeyPair): Promise<string> {
  const b = body(input);
  const head = await chainHead(b);
  const pub = compress(new Uint8Array(await subtle().exportKey('raw', key.publicKey)));
  const signed = cat(b, head, pub);
  const sig = new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, key.privateKey, signed as BufferSource));
  return b64url(cat(signed, sig));
}

/** Decode, recompute the chain, verify the signature. Says only "not altered since sealing". */
export async function verifyCode(code: string): Promise<KResult> {
  let all: Uint8Array;
  try {
    all = unb64url(code.trim().replace(/^.*#k=/, ''));
  } catch {
    return { ok: false, failed: 'decode', reason: 'Not a Saboot evidence code.' };
  }
  if (all.length < 19 || all[0] !== VERSION) return { ok: false, failed: 'decode', reason: 'Unknown code version or too short.' };
  const n = all[18];
  const bodyLen = 19 + n * 35;
  if (n < 1 || n > 3 || all.length !== bodyLen + 32 + 33 + 64) return { ok: false, failed: 'decode', reason: 'Code length does not match its contents.' };
  const b = all.slice(0, bodyLen);
  const head = all.slice(bodyLen, bodyLen + 32);
  const pub = all.slice(bodyLen + 32, bodyLen + 65);
  const sig = all.slice(bodyLen + 65);
  const v = new DataView(b.buffer);
  const payload: KPayload = {
    plot: 'P-' + String(v.getUint8(1)).padStart(2, '0'),
    eventT: v.getUint16(2) / 100,
    sealT: v.getUint16(4) / 100,
    deviceMs: v.getUint32(6) * 1000,
    lat: v.getInt32(10) / 1000,
    lon: v.getInt32(14) / 1000,
    shots: Array.from({ length: n }, (_, i) => ({
      kind: KINDS[v.getUint8(19 + i * 35)] ?? 'wide',
      simT: v.getUint16(19 + i * 35 + 1) / 100,
      sha: toHex(b.slice(19 + i * 35 + 3, 19 + i * 35 + 35)),
    })),
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
