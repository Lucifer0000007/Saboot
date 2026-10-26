// Real SHA-256 via WebCrypto. Canonical JSON keeps hashes stable regardless of key order.
// Outside a secure context (a plain-HTTP LAN address) crypto.subtle does not exist; a small pure-JS SHA-256 keeps
// the hash chain working there, so a capture never hangs. Signing (feature K) still needs HTTPS.

const hex = (buf: ArrayBuffer) => {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
};

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

/** SHA-256 in plain JS (FIPS 180-4), used only when crypto.subtle is unavailable. Verified against the standard vectors. */
export function sha256js(bytes: Uint8Array): string {
  const l = bytes.length;
  const padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[l] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor((l * 8) / 0x100000000));
  dv.setUint32(padded.length - 4, (l * 8) >>> 0);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) W[j] = dv.getUint32(i + j * 4);
    for (let j = 16; j < 64; j++) {
      const a = W[j - 15], b = W[j - 2];
      W[j] = W[j - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + W[j - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10));
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let j = 0; j < 64; j++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + W[j]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join('');
}

export async function sha256(data: string | ArrayBuffer | Blob): Promise<string> {
  let buf: ArrayBuffer;
  if (typeof data === 'string') buf = new TextEncoder().encode(data).buffer as ArrayBuffer;
  else if (data instanceof Blob) buf = await data.arrayBuffer();
  else buf = data;
  // No subtle (plain HTTP), or a subtle that throws (Playwright's Firefox build fails with NS_ERROR_FAILURE): same result.
  if (!globalThis.crypto?.subtle) return sha256js(new Uint8Array(buf));
  try {
    return hex(await crypto.subtle.digest('SHA-256', buf));
  } catch {
    return sha256js(new Uint8Array(buf));
  }
}

export function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  const o = v as Record<string, unknown>;
  return '{' + Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonical(o[k])).join(',') + '}';
}

export const GENESIS = '0'.repeat(64);

export interface ChainLink<T> {
  seq: number;
  body: T;
  prev: string;
  hash: string;
}

/** hash = SHA-256(prev + canonical(body)) */
export const linkHash = (prev: string, body: unknown) => sha256(prev + canonical(body));

export async function appendLink<T>(chain: ChainLink<T>[], body: T): Promise<ChainLink<T>> {
  const prev = chain.length ? chain[chain.length - 1].hash : GENESIS;
  const hash = await linkHash(prev, body);
  return { seq: chain.length, body, prev, hash };
}

export type LinkStatus = 'ok' | 'tampered' | 'broken';

/** Recompute every link from genesis. First bad record is 'tampered'; everything after is 'broken'. */
export async function verifyChain<T>(chain: ChainLink<T>[]): Promise<LinkStatus[]> {
  const out: LinkStatus[] = [];
  let prev = GENESIS;
  let failed = false;
  for (const l of chain) {
    if (failed) { out.push('broken'); continue; }
    const h = await linkHash(prev, l.body);
    if (l.prev !== prev || h !== l.hash) { out.push('tampered'); failed = true; continue; }
    out.push('ok');
    prev = l.hash;
  }
  return out;
}

/**
 * A check code a farmer can read aloud: eight digits in two groups ("4821 0937"), taken from the first 32 bits of a
 * hash. Hex letters are hard to say in Hindi or Punjabi and easy to mishear on a phone line (audit F13). It only helps
 * a person match two records by ear; the full hash is what proves anything.
 */
export function checkCode(hash: string) {
  const s = String(parseInt(hash.slice(0, 8), 16) % 1e8).padStart(8, '0');
  return s.slice(0, 4) + ' ' + s.slice(4);
}

export const short = (h: string | undefined, n = 10) => (h ? h.slice(0, n) + '…' : '—');
