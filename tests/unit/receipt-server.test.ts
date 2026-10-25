// The optional demo receiver (scripts/receipt-server.mjs): it stamps its own clock on a posted code and keeps it, judges nothing,
// refuses what is not a code, and serves the site behind its two routes. Over plain HTTP here: TLS lives only in the script's
// main (Node has no built-in certificate maker and no dependency is allowed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error plain JavaScript, imported as the QA specs import the file server
import { receiptRoutes, compose, codeShape } from '../../scripts/receipt-server.mjs';
// @ts-expect-error plain JavaScript
import { staticHandler } from '../../scripts/snap.mjs';
import { makeCode, newDeviceKey, type KInput } from '../../src/k/payload.ts';

const PORT = 4397;
const NOW = 1_700_000_000_000;
const input: KInput = {
  plot: 'P-04', eventT: 11, sealT: 17.35, deviceMs: Date.UTC(2026, 9, 13, 9, 30), lat: 30.71234, lon: 76.70421,
  shots: [{ kind: 'wide', simT: 17.25, sha: 'a'.repeat(64) }, { kind: 'close', simT: 17.27, sha: 'b'.repeat(64) }, { kind: 'landmark', simT: 17.29, sha: 'c'.repeat(64) }],
};

async function start() {
  const store = join(mkdtempSync(join(tmpdir(), 'saboot-receipts-')), 'receipts.json');
  const srv = http.createServer(compose(receiptRoutes({ store, now: () => NOW }), staticHandler('tests/fixtures/validation')));
  await new Promise<void>((r) => srv.listen(PORT, r));
  return { srv, store };
}
// each test starts its own server on the same port: a pooled keep-alive connection to the previous one would be reset
const at = (path: string, init: RequestInit = {}) => fetch(`http://127.0.0.1:${PORT}${path}`, { ...init, headers: { ...(init.headers as Record<string, string>), connection: 'close' } });
const post = (path: string, body: string) => at(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body });

test('a posted code is kept with the laptop time, once, whatever it says', async () => {
  const { srv, store } = await start();
  try {
    const code = await makeCode(input, await newDeviceKey());
    const r1 = await post('/receipt', JSON.stringify({ code }));
    assert.equal(r1.status, 200);
    assert.deepEqual(await r1.json(), { ok: true, receivedAt: NOW });
    const r2 = await post('/receipt', JSON.stringify({ code }));
    assert.deepEqual(await r2.json(), { ok: true, receivedAt: NOW }, 'a retry keeps its first time');
    const stored = JSON.parse(readFileSync(store, 'utf8'));
    assert.deepEqual(stored, { v: 1, receipts: [{ code, receivedAt: NOW }] }, 'the code and the time, nothing else');
    // a code with a flipped character is stored too: the server judges nothing, the console verifies
    const bad = code.slice(0, 200) + (code[200] === 'A' ? 'B' : 'A') + code.slice(201);
    assert.equal((await post('/receipt', JSON.stringify({ code: bad }))).status, 200);
    const list = await post('/receipts', '');
    assert.equal(list.headers.get('cache-control'), 'no-store');
    assert.equal((await list.json()).receipts.length, 2);
  } finally {
    srv.close();
  }
});

test('what is not a code is refused and nothing is kept; the site is still served', async () => {
  const { srv, store } = await start();
  try {
    assert.equal((await post('/receipt', 'not json')).status, 400);
    for (const code of ['has space', 'abcde', '', 'x'.repeat(1025), 'a+b/c=']) assert.equal((await post('/receipt', JSON.stringify({ code }))).status, 400, code.slice(0, 12));
    assert.equal((await post('/receipt', JSON.stringify({ code: 'A'.repeat(5000) }))).status, 413);
    assert.equal(existsSync(store), false, 'nothing was written');
    assert.equal((await at('/receipt')).status, 404, 'a GET of the route is a missing file');
    assert.equal((await at('/plots.csv')).status, 200, 'the static site behind the routes');
    assert.equal((await at('/..%2fpackage.json')).status, 404, 'the path check still holds');
  } finally {
    srv.close();
  }
});

test('the shape check is the verifier’s alphabet and length rule, not a judgement', () => {
  assert.equal(codeShape('abcd'), true);
  assert.equal(codeShape('abc'), true);
  assert.equal(codeShape('abcde'), false, 'base64url never has length 1 mod 4');
  assert.equal(codeShape('ab cd'), false);
  assert.equal(codeShape(42), false);
});
