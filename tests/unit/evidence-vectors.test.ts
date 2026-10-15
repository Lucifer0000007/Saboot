// The evidence packet format has two verifiers: the one inside the app (src/k/payload.ts) and a standalone script that
// shares no code with it (scripts/verify-packet.mjs). Both must agree on every test vector in tests/vectors, and on every
// single-bit change to a valid packet: any change anywhere in a packet must be caught.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { b64url, unb64url, verifyCode } from '../../src/k/payload.ts';
import { verify as verifyStandalone, inputToCode } from '../../scripts/verify-packet.mjs';

interface Vector {
  name: string;
  description: string;
  input: string;
  expect: { ok: boolean; failed: string | null; plot?: string; photos?: number; chainHead?: string; publicKey?: string; firstPhotoSha256?: string };
}
const file = JSON.parse(readFileSync('tests/vectors/evidence-v1.json', 'utf8')) as { vectors: Vector[] };
const byName = (n: string) => file.vectors.find((v) => v.name === n)!;

test('the vector set covers a valid packet, a link, a tampered photo hash, a tampered chain, a wrong signature and a wrong version', () => {
  const names = file.vectors.map((v) => v.name);
  for (const n of ['valid', 'valid-link', 'tampered-photo-hash', 'tampered-chain-head', 'tampered-seal-time', 'edited-and-rechained', 'wrong-signature', 'wrong-version', 'truncated', 'not-a-code']) {
    assert.ok(names.includes(n), `vector ${n}`);
  }
  assert.equal(byName('valid').expect.ok, true);
  assert.deepEqual(
    Object.fromEntries(file.vectors.filter((v) => !v.expect.ok).map((v) => [v.name, v.expect.failed])),
    { 'tampered-photo-hash': 'chain', 'tampered-chain-head': 'chain', 'tampered-seal-time': 'chain', 'edited-and-rechained': 'signature', 'wrong-signature': 'signature', 'wrong-version': 'decode', truncated: 'decode', 'not-a-code': 'decode' },
  );
});

for (const v of file.vectors) {
  test(`vector ${v.name}: the app's verifier gives the documented result`, async () => {
    const r = await verifyCode(v.input);
    assert.equal(r.ok, v.expect.ok, v.description);
    assert.equal(r.failed, v.expect.failed);
    if (v.expect.plot) {
      assert.equal(r.payload?.plot, v.expect.plot);
      assert.equal(r.payload?.shots.length, v.expect.photos);
      assert.equal(r.payload?.head, v.expect.chainHead);
      assert.equal(r.payload?.pub, v.expect.publicKey);
      assert.equal(r.payload?.shots[0].sha, v.expect.firstPhotoSha256);
    } else {
      assert.equal(r.payload, undefined);
    }
  });

  test(`vector ${v.name}: the standalone verifier agrees`, async () => {
    const r = await verifyStandalone(v.input);
    assert.equal(r.ok, v.expect.ok, v.description);
    assert.equal(r.failed, v.expect.failed);
    if (v.expect.plot) {
      const p = r.payload!;
      assert.equal(p.plot, v.expect.plot);
      assert.equal(p.photos.length, v.expect.photos);
      assert.equal(p.chainHead, v.expect.chainHead);
      assert.equal(p.publicKey, v.expect.publicKey);
      assert.equal(p.photos[0].sha256, v.expect.firstPhotoSha256);
    } else {
      assert.equal(r.payload, undefined);
    }
  });
}

test('the command-line verifier exits 0 for a valid packet, 1 for a bad one, and prints what it does not prove', () => {
  const run = (input: string, ...flags: string[]) => spawnSync(process.execPath, ['scripts/verify-packet.mjs', ...flags, input], { encoding: 'utf8' });
  const good = run(byName('valid').input);
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /^VERIFIED: not altered since it was sealed\./);
  assert.match(good.stdout, /does not prove who sealed it, that the photos are true,/);
  const bad = run(byName('tampered-photo-hash').input);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /^NOT VERIFIED: A record does not match the chain head/);
  assert.match(bad.stdout, /FAIL {2}Packet chain recomputed/);
  assert.match(bad.stdout, /- {2}ECDSA P-256 signature valid for the key in the code \(not reached\)/);
  const json = JSON.parse(run(byName('wrong-signature').input, '--json').stdout);
  assert.equal(json.ok, false);
  assert.equal(json.failed, 'signature');
  assert.equal(run('').status, 2, 'no input is a usage error');
});

test('the command-line verifier reads a code from a file, from an evidence bundle, and from standard input', () => {
  const dir = mkdtempSync(join(tmpdir(), 'saboot-vec-'));
  const code = byName('valid').input;
  writeFileSync(join(dir, 'code.txt'), code + '\n');
  writeFileSync(join(dir, 'bundle.json'), JSON.stringify({ kind: 'saboot.evidence-bundle', v: 1, code }));
  writeFileSync(join(dir, 'not-a-bundle.json'), JSON.stringify({ hello: 1 }));
  assert.equal(inputToCode(join(dir, 'code.txt')), code);
  assert.equal(inputToCode(join(dir, 'bundle.json')), code);
  assert.throws(() => inputToCode(join(dir, 'not-a-bundle.json')), /no "code" field/);
  const viaFile = spawnSync(process.execPath, ['scripts/verify-packet.mjs', join(dir, 'bundle.json')], { encoding: 'utf8' });
  assert.equal(viaFile.status, 0);
  const viaStdin = spawnSync(process.execPath, ['scripts/verify-packet.mjs', '-'], { encoding: 'utf8', input: code });
  assert.equal(viaStdin.status, 0);
});

test('any single-bit change anywhere in a valid packet is caught, and both verifiers name the same failing step', async () => {
  const raw = unb64url(byName('valid').input);
  let checked = 0;
  for (let i = 0; i < raw.length; i++) {
    for (let bit = 0; bit < 8; bit++) {
      const b = raw.slice();
      b[i] ^= 1 << bit;
      const code = b64url(b);
      const a = await verifyCode(code);
      const s = await verifyStandalone(code);
      assert.equal(a.ok, false, `byte ${i} bit ${bit} must not verify`);
      assert.equal(s.ok, false, `byte ${i} bit ${bit} must not verify (standalone)`);
      assert.equal(a.failed, s.failed, `byte ${i} bit ${bit}: both name the same step`);
      checked++;
    }
  }
  assert.equal(checked, raw.length * 8);
});

test('the standalone verifier shares no code with the app: it imports only Node built-ins', () => {
  const src = readFileSync('scripts/verify-packet.mjs', 'utf8');
  const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
  assert.ok(imports.length > 0);
  for (const i of imports) assert.ok(i.startsWith('node:'), `${i} must be a Node built-in`);
  assert.ok(!/from '\.\.?\//.test(src), 'no relative import of Saboot code');
});
