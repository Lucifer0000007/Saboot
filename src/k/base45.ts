// Base45 (RFC 9285), used only to draw the share QR code. Its 45 characters are all in the QR alphanumeric set, which packs
// 5.5 bits per character against 8 for the lowercase text of a base64url code, so the same 253 bytes need a version 10 QR code
// (57 squares a side) instead of a version 12 (65). It is a way of spelling the same packet for the camera: the code itself
// stays base64url, `verifyCode` and scripts/verify-packet.mjs read only that, and the scanner converts back before verifying.
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
/** Marks QR text as a spelling of a Saboot code. */
export const QR_PREFIX = 'SB:';

export function toBase45(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      const n = bytes[i] * 256 + bytes[i + 1];
      s += ALPHABET[n % 45] + ALPHABET[Math.floor(n / 45) % 45] + ALPHABET[Math.floor(n / 2025)];
    } else {
      s += ALPHABET[bytes[i] % 45] + ALPHABET[Math.floor(bytes[i] / 45)];
    }
  }
  return s;
}

/** The bytes, or null when the text is not valid base45 (a stray character, a bad length, or a group that is too large). */
export function fromBase45(text: string): Uint8Array | null {
  const v: number[] = [];
  for (const c of text) {
    const i = ALPHABET.indexOf(c);
    if (i < 0) return null;
    v.push(i);
  }
  if (v.length % 3 === 1) return null;
  const out: number[] = [];
  for (let i = 0; i < v.length; i += 3) {
    if (i + 2 < v.length) {
      const n = v[i] + v[i + 1] * 45 + v[i + 2] * 2025;
      if (n > 0xffff) return null;
      out.push(n >> 8, n & 0xff);
    } else {
      const n = v[i] + v[i + 1] * 45;
      if (n > 0xff) return null;
      out.push(n);
    }
  }
  return Uint8Array.from(out);
}
