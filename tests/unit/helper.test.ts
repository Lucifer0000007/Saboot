// Helper mode: every farmer a helper captures for has their own hash-chained log. Consent and photos are sealed in that
// farmer's chain, the packet names the helper on every photo, a live log drives its plot instead of the script, and one
// farmer's log never leaks into another's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rawScenario, activePlotId, model } from '../../src/sim/engine.ts';
import { appendLink, canonical, sha256, verifyChain, type ChainLink } from '../../src/lib/hash.ts';
import { reduce, packetBody, liveViews, logs, DEMO, SCRIPT, type FocusEvent, type Link } from '../../src/farmer/focus.ts';
import { plotState, plotTimes } from '../../src/sim/cohort.ts';
import { stateOf, nextScreen } from '../../src/farmer/helper.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
rawScenario.value = raw;
const m = model.value!;
const plot = (id: string) => m.plots.find((p) => p.id === id)!;

const HELPER = { helper: 'Test Helper', role: 'Sarpanch', method: 'hold' as const };
const consent = (farmer: string, simT: number): FocusEvent => ({ type: 'consent', simT, data: { farmer, ...HELPER, text: `I, ${farmer}, allow ${HELPER.helper} to take photos.` } });
const shot = (kind: 'wide' | 'close' | 'landmark', simT: number, tag: string): FocusEvent => ({
  type: 'shot', simT,
  data: { kind, photoId: `ph-${tag}-${kind}`, sha: `${tag}${kind}`.padEnd(64, '0'), bytes: 1000, w: 640, h: 480, geo: { lat: 30, lon: 75, acc: 8, src: 'sim' }, synthetic: true, helper: HELPER.helper, queued: false },
});
async function chainOf(events: FocusEvent[]): Promise<Link[]> {
  const c: Link[] = [];
  for (const e of events) c.push(await appendLink(c, e));
  return c;
}
/** A farmer's own log: consent, three photos, a seal. */
const sealed = (name: string, alertT: number, tag: string) => chainOf([
  consent(name, alertT + 2.5),
  shot('wide', alertT + 3, tag), shot('close', alertT + 3.02, tag), shot('landmark', alertT + 3.04, tag),
  { type: 'seal', simT: alertT + 3.1, data: { packetHash: 'f'.repeat(64), shots: [], queued: false } },
]);

test('the scenario names the helper queue: four farmers of the demo farmer’s village, two flooded and two false alarms', () => {
  assert.ok(raw.helperQueue && raw.helperQueue.length === 4);
  const demoVillage = plot(raw.focus).v;
  for (const id of raw.helperQueue!) {
    const p = plot(id);
    assert.equal(p.v, demoVillage, `${id} is in the demo farmer's village`);
    assert.notEqual(id, raw.focus);
    assert.ok(m.det[p.idx].detected, `${id} was alerted by the rules`);
  }
  const personas = raw.helperQueue!.map((id) => plot(id).b[0]).sort();
  assert.deepEqual(personas, ['nodamage', 'nodamage', 'normal', 'normal']);
});

test('the packet carries the consent and names the helper on every photo, for the farmer being helped', async () => {
  const p = plot('P-05');
  activePlotId.value = 'P-05';
  try {
    const c = await sealed(p.name, m.det[p.idx].alertT!, 'a');
    const body = packetBody(reduce(c, 100));
    assert.equal(body.plot, 'P-05');
    assert.equal(body.farmer, p.name);
    assert.deepEqual(body.consent, { helper: 'Test Helper', role: 'Sarpanch', method: 'hold', simT: m.det[p.idx].alertT! + 2.5 });
    assert.equal(body.shots.length, 3);
    for (const s of body.shots) assert.equal(s.helper, 'Test Helper');
    assert.equal(body.rail, 'relief');
    assert.ok('adviceEndsT' in body && !('deadlineT' in body), 'the relief packet says advice, not deadline');
  } finally {
    activePlotId.value = null;
  }
});

test('two farmers helped by the same helper get different packets, and each log verifies on its own', async () => {
  const a = plot('P-05'), b = plot('P-09');
  const ca = await sealed(a.name, m.det[a.idx].alertT!, 'a');
  const cb = await sealed(b.name, m.det[b.idx].alertT!, 'b');
  activePlotId.value = 'P-05';
  const ha = await sha256(canonical(packetBody(reduce(ca, 100))));
  activePlotId.value = 'P-09';
  const hb = await sha256(canonical(packetBody(reduce(cb, 100))));
  activePlotId.value = null;
  assert.notEqual(ha, hb);
  assert.deepEqual(await verifyChain(ca as ChainLink<FocusEvent>[]), ca.map(() => 'ok'));
  assert.deepEqual(await verifyChain(cb as ChainLink<FocusEvent>[]), cb.map(() => 'ok'));
  assert.notEqual(ca[ca.length - 1].hash, cb[cb.length - 1].hash);
  // one farmer's consent cannot be moved into another's chain: the packet binds the plot, and the chain binds the order
  const swapped = [...ca.slice(0, 1), ...cb.slice(1)] as ChainLink<FocusEvent>[];
  assert.notDeepEqual(await verifyChain(swapped), swapped.map(() => 'ok'));
});

test('a plot with a live log is driven by that log, not the script; other plots keep their script', async () => {
  const p = plot('P-05'), other = plot('P-09');
  const alertT = m.det[p.idx].alertT!;
  const view = reduce(await sealed(p.name, alertT, 'a'), 100);
  const scripted = plotTimes(m, p, null);
  const live = plotTimes(m, p, null, { 'P-05': view });
  assert.notEqual(live.captureT, scripted.captureT, 'the live capture time replaces the scripted one');
  assert.equal(live.captureT, alertT + 3.04);
  assert.equal(live.consentT, alertT + 2.5);
  assert.deepEqual(live.helper, { name: 'Test Helper', role: 'Sarpanch', method: 'hold' });
  assert.equal(live.shots, 3);
  assert.equal(scripted.helper, null);
  // the other farmer is untouched by P-05's log
  assert.deepEqual(plotTimes(m, other, null, { 'P-05': view }), plotTimes(m, other, null));
  // the live farmer is flagged as an assisted capture
  assert.ok(plotState(m, p, 100, null, { 'P-05': view }).flags.includes('assisted'));
});

test('the demo farmer’s log and the helper logs are separate: liveViews keeps them apart', async () => {
  const p = plot('P-05');
  const demoChain = await chainOf([shot('wide', 20, 'd')]);
  const helperChain = await sealed(p.name, m.det[p.idx].alertT!, 'a');
  logs.value = { [DEMO]: demoChain, 'P-05': helperChain };
  try {
    const { focus, live } = liveViews(100);
    assert.equal(focus.shotCount, 1);
    assert.deepEqual(Object.keys(live), ['P-05']);
    assert.equal(live['P-05'].shotCount, 3);
    assert.equal(live['P-05'].consent?.helper, 'Test Helper');
    assert.equal(focus.consent, null, 'the demo farmer gave no consent');
  } finally {
    logs.value = {};
  }
});

test('the queue state follows what is recorded: no alert, consent, ready, photos, sealed, no damage', async () => {
  const alertT = 15.75;
  assert.equal(stateOf(null, 20, null), 'no-alert');
  assert.equal(stateOf(alertT, 10, null), 'no-alert');
  assert.equal(stateOf(alertT, 20, null), 'consent');
  const name = 'X';
  assert.equal(stateOf(alertT, 100, reduce(await chainOf([consent(name, 18)]), 100)), 'ready');
  assert.equal(stateOf(alertT, 100, reduce(await chainOf([consent(name, 18), shot('wide', 19, 'x')]), 100)), 'photos');
  assert.equal(stateOf(alertT, 100, reduce(await sealed(name, alertT, 'x'), 100)), 'sealed');
  const nd = await chainOf([consent(name, 18), { type: 'no_damage', simT: 19, data: {} }]);
  assert.equal(stateOf(alertT, 100, reduce(nd, 100)), 'no-damage');
  // scrubbing back un-happens it
  assert.equal(stateOf(alertT, 17, reduce(nd, 17)), 'consent');
});

test('the helper goes to the right screen next', () => {
  assert.equal(nextScreen('consent'), 'assist');
  assert.equal(nextScreen('no-alert'), 'assist');
  assert.equal(nextScreen('ready'), 'capture');
  assert.equal(nextScreen('photos'), 'capture');
  assert.equal(nextScreen('sealed'), 'packet');
  assert.equal(nextScreen('no-damage'), 'assist');
});

test('scripted reply times of the objection window are unchanged by helper mode', () => {
  assert.equal(SCRIPT.objectionResponse, 20);
});

test('a farmer a helper sealed for is not flagged "no receipt" for a step the helper flow does not have', async () => {
  const p = plot('P-05');
  const alertT = m.det[p.idx].alertT!;
  const view = reduce(await sealed(p.name, alertT, 'a'), 200);
  // well past 12 h after the capture, with no receipt number ever recorded
  const s = plotState(m, p, alertT + 3.04 + 40, null, { 'P-05': view });
  assert.equal(s.times.live, true);
  assert.equal(s.times.fileT, null);
  assert.ok(!s.flags.includes('no-ref'), 'no no-ref flag for a log the helper made');
});
