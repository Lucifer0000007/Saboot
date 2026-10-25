// The share QR code has to be small enough to read from a phone screen through a laptop webcam (audit A-05). The code is
// drawn as base45 text (QR alphanumeric mode) at the lowest error correction, which needs far fewer squares than the old
// link. Here the matrix is painted and read back with the same decoder the laptop falls back to (jsQR).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode } from 'uqr';
import jsQR from 'jsqr';
import { fromBase45, toBase45 } from '../../src/k/base45.ts';
import { codeFromQrText, makeCode, newDeviceKey, qrTextOf, verifyCode, type KInput } from '../../src/k/payload.ts';
import { qrPath } from '../../src/k/qr.ts';

const input: KInput = {
  plot: 'P-04', eventT: 11, sealT: 17.35, deviceMs: Date.UTC(2026, 9, 13, 9, 30), lat: 30.71234, lon: 76.70421,
  shots: [
    { kind: 'wide', simT: 17.25, sha: 'a'.repeat(64), photo: 'live', loc: 'live' },
    { kind: 'close', simT: 17.27, sha: 'b'.repeat(64), photo: 'live', loc: 'live' },
    { kind: 'landmark', simT: 17.29, sha: 'c'.repeat(64), photo: 'live', loc: 'live' },
  ],
};
const bytes = (s: string) => new TextEncoder().encode(s);

/** Paint the matrix the way a screen shows it: white, black squares, `px` pixels to a square. */
function paint(rows: boolean[][], px: number) {
  const w = rows.length * px;
  const data = new Uint8ClampedArray(w * w * 4).fill(255);
  rows.forEach((row, y) => row.forEach((on, x) => {
    if (!on) return;
    for (let dy = 0; dy < px; dy++) for (let dx = 0; dx < px; dx++) {
      const i = ((y * px + dy) * w + x * px + dx) * 4;
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  }));
  return { data, w };
}

test('base45 matches the published test vectors of RFC 9285', () => {
  assert.equal(toBase45(bytes('AB')), 'BB8');
  assert.equal(toBase45(bytes('Hello!!')), '%69 VD92EX0');
  assert.equal(toBase45(bytes('base-45')), 'UJCLQE7W581');
  assert.equal(new TextDecoder().decode(fromBase45('QED8WEX0')!), 'ietf!');
});

test('base45 round-trips every length, and refuses what is not base45', () => {
  for (let n = 0; n < 40; n++) {
    const b = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n * 11) & 0xff);
    assert.deepEqual(fromBase45(toBase45(b)), b, `${n} bytes`);
  }
  assert.equal(fromBase45('a'), null, 'a lowercase letter');
  assert.equal(fromBase45('ABCD'), null, 'a length of 1 more than a multiple of 3');
  assert.equal(fromBase45('GGW'), null, 'a group over 65535');
  assert.equal(fromBase45('::'), null, 'a pair over 255');
});

test('the share QR is a version 10 code that reads back, and far smaller than the old link QR', async () => {
  const code = await makeCode(input, await newDeviceKey());
  const text = qrTextOf(code);
  const q = encode(text, { ecc: 'L', border: 4 });
  assert.ok(q.version <= 10, `version ${q.version}`);
  assert.equal(q.size, 65, '57 squares a side and a 4-square quiet zone');
  const old = encode('https://moonlit-pixie-248afc.netlify.app/#k=' + code, { ecc: 'M', border: 2 });
  assert.ok(old.version >= 15, 'the old link QR was version 15');
  assert.ok(q.size < old.size * 0.85, `fewer squares: ${q.size} against ${old.size}`);
  for (const px of [3, 4, 6]) {
    const { data, w } = paint(q.data, px);
    const read = jsQR(data, w, w, { inversionAttempts: 'dontInvert' });
    assert.equal(read?.data, text, `read back at ${px} pixels a square`);
  }
  assert.equal(qrPath(text, { ecc: 'L', border: 4 }).size, q.size, 'the drawn path has the same size');
});

test('a scanned QR text becomes the code again, and the code still verifies', async () => {
  const code = await makeCode(input, await newDeviceKey());
  assert.equal(codeFromQrText(qrTextOf(code)), code);
  assert.equal((await verifyCode(codeFromQrText(qrTextOf(code)))).ok, true);
  assert.equal(codeFromQrText(code), code, 'a plain code is left alone');
  assert.equal(codeFromQrText('SB:@@@'), 'SB:@@@', 'bad QR text is left as it is, and then fails to verify');
  assert.equal((await verifyCode(codeFromQrText('SB:@@@'))).failed, 'decode');
});
