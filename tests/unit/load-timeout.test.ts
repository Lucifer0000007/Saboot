// A phone on a stalled mobile link can send a request that neither answers nor fails. Without a time-out, loadScenario() waits for
// ever and the page stays on "Loading the flood replay…" with no tabs, no message and no way out. Each try now gives up after
// LOAD_TIMEOUT_MS, there are three tries, and a failure is reported so the page can show it and offer Try again.
import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadScenario, loadError, rawScenario, LOAD_TIMEOUT_MS } from '../../src/sim/engine.ts';

const realFetch = globalThis.fetch;
const json = readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8');
const flush = () => new Promise<void>((r) => setImmediate(r));

afterEach(() => {
  mock.timers.reset();
  globalThis.fetch = realFetch;
  rawScenario.value = null;
  loadError.value = null;
});

/** A fetch that answers the given tries in order; `null` means "never answers" (it ends only when the caller aborts it). */
function stub(answers: (string | null)[]) {
  let calls = 0;
  globalThis.fetch = ((_url: unknown, init?: RequestInit) => {
    const answer = answers[calls++];
    if (answer !== null) return Promise.resolve(new Response(answer));
    return new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))));
  }) as typeof fetch;
  return () => calls;
}

/** Move the fake clock on in 1 s steps (the tries wait 0 s, 1 s and 3 s between them), letting promises settle between steps. */
async function run(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    mock.timers.tick(1000);
    await flush();
  }
}

test('a request that never answers is given up on after the time-out, three times, and then reported (no endless wait)', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const calls = stub([null, null, null]);
  const done = loadScenario();
  await flush();
  await run(Math.ceil((3 * LOAD_TIMEOUT_MS + 1000 + 3000) / 1000) + 2);
  await done;
  assert.equal(calls(), 3, 'three tries');
  assert.equal(rawScenario.value, null);
  assert.match(String(loadError.value), new RegExp(`no answer after ${LOAD_TIMEOUT_MS / 1000} s`));
});

test('a stalled first try followed by an answer still loads the scenario, and leaves no error', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const calls = stub([null, json]);
  const done = loadScenario();
  await flush();
  await run(Math.ceil((LOAD_TIMEOUT_MS + 1000) / 1000) + 2);
  await done;
  assert.equal(calls(), 2);
  assert.ok(rawScenario.value, 'the scenario loaded');
  assert.equal(loadError.value, null);
});

test('an answer that is an error status is retried and reported as that status, not as a time-out', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.fetch = (() => Promise.resolve(new Response('nope', { status: 503 }))) as typeof fetch;
  const done = loadScenario();
  await flush();
  await run(6);
  await done;
  assert.match(String(loadError.value), /HTTP 503/);
});
