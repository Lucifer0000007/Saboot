// The relief workflow: the officer's draft list, the objection window and the pilot metrics. The promises under test:
// Saboot lists evidence and never decides, shows no amount, names no farmer in an export, lets an objection attach a
// packet without changing what the rules compute, and quotes pilot figures that match the facts file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor, priority, PRIORITY_WEIGHTS, priorityParts } from '../../src/sim/evidence.ts';
import { pilotMetrics, metrics } from '../../src/sim/metrics.ts';
import { RELIEF } from '../../src/config.ts';
import { reduce } from '../../src/farmer/focus.ts';
import { buildDraft, draftCsv, draftJson, listState } from '../../src/dashboard/draftList.ts';
import type { Row } from '../../src/dashboard/state.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const json = readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8');
const raw = JSON.parse(json) as ScenarioRaw;
const H = raw.hours;
const facts = JSON.parse(readFileSync(new URL('../../docs/scenario-facts.json', import.meta.url), 'utf8'));
const relief = buildModel(raw, modelOptions('relief'));
const pmfby = buildModel(raw, modelOptions('pmfby'));
const SHA = 'a'.repeat(64);

const rowsAt = (m: typeof relief, t: number): Row[] =>
  m.plots.map((p) => {
    const s = plotState(m, p, t, null);
    const e = evidenceFor(m, s, t);
    return { s, e, pri: priority(s, e) };
  });
const statesAt = (m: typeof relief, t: number) => m.plots.map((p) => plotState(m, p, t, null));

// ---- objections -----------------------------------------------------------------------------------------------------
test('every scripted objection falls inside the objection window, and only the relief rail has objections', () => {
  const { publishAtHour: pub, objectionWindowHours: win } = relief.opts;
  assert.equal(pub, RELIEF.publishAtHour);
  assert.equal(win, RELIEF.objectionWindowHours);
  const withObj = raw.plots.filter((p) => p.obj);
  assert.ok(withObj.length > 0, 'the scenario scripts some objections');
  for (const p of withObj) {
    const [after, resp] = p.obj!;
    assert.ok(after >= 0 && after <= win, `${p.id} files within the window`);
    assert.ok(resp === -1 || resp >= 0, `${p.id} response is a delay or -1`);
    assert.ok(pub + after + Math.max(resp, 0) <= H, `${p.id} fits inside the replay`);
  }
  for (const p of pmfby.plots) assert.equal(plotState(pmfby, p, H, null).objection, null, `${p.id} has no objection on the PMFBY rail`);
});

test('nothing is filed or answered before the officer publishes the list', () => {
  const before = statesAt(relief, relief.opts.publishAtHour - 0.01);
  assert.equal(before.filter((s) => s.objection).length, 0);
  const closed = statesAt(relief, H);
  assert.equal(closed.filter((s) => s.objection).length, raw.plots.filter((p) => p.obj).length);
  for (const s of closed) if (s.objection?.responded) assert.ok(s.objection.respT! > s.objection.t);
});

test('an objection attaches a packet and changes nothing the rules compute: tier, score and priority are the same without it', () => {
  const stripped = buildModel({ ...raw, plots: raw.plots.map(({ obj: _o, ...p }) => p) } as ScenarioRaw, modelOptions('relief'));
  for (const t of [60, relief.opts.publishAtHour + 2, H]) {
    const a = statesAt(relief, t), b = statesAt(stripped, t);
    a.forEach((s, i) => {
      const ea = evidenceFor(relief, s, t), eb = evidenceFor(stripped, b[i], t);
      assert.deepEqual(ea, eb, `${s.plot.id} evidence at ${t}`);
      assert.equal(priority(s, ea), priority(b[i], eb));
      assert.equal(s.stage, b[i].stage);
    });
  }
});

// ---- the draft list -------------------------------------------------------------------------------------------------
test('the list is a working draft before the officer publishes, published while objections are open, then closed', () => {
  const { publishAtHour: p, objectionWindowHours: w } = relief.opts;
  assert.equal(listState(relief, p - 0.01), 'working draft');
  assert.equal(listState(relief, p), 'published');
  assert.equal(listState(relief, p + w - 0.01), 'published');
  assert.equal(listState(relief, p + w), 'objections closed');
});

const keysDeep = (v: unknown, out: string[] = []): string[] => {
  if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.push(k); keysDeep(x, out); }
  return out;
};

test('the draft list shows no amount, no rupee sign and no eligibility or decision field', () => {
  const d = buildDraft(relief, rowsAt(relief, 110), 110, SHA);
  const text = draftJson(d) + draftCsv(d);
  assert.ok(!/₹|\bINR\b|\brupee/i.test(text), 'no currency');
  assert.equal(RELIEF.perAcreAmount, null);
  assert.equal(RELIEF.acreageCapHa, null);
  const keys = keysDeep(d).join(' ').toLowerCase();
  for (const bad of ['amount', 'compensation', 'payout', 'eligible', 'eligibility', 'approved', 'decision', 'verdict']) {
    assert.ok(!keys.includes(bad), `no "${bad}" field`);
  }
  assert.match(d.status, /does not decide claims, eligibility or amounts/);
  assert.equal(d.simulation, true);
});

test('an export names no farmer: plots are matched to land records by id', () => {
  const d = buildDraft(relief, rowsAt(relief, 110), 110, SHA);
  const text = draftJson(d) + draftCsv(d);
  for (const p of raw.plots) assert.ok(!text.includes(p.name), `${p.id}'s farmer name is not in the export`);
  assert.ok(!keysDeep(d.entries).some((k) => /^(farmer|name|phone|khasra|aadhaar)$/i.test(k)), 'no personal field on an entry');
});

test('the list records how it was made: rule versions, parameters, scenario hash, rail and time', () => {
  const d = buildDraft(relief, rowsAt(relief, 110), 110, SHA);
  const p = d.provenance;
  assert.equal(p.rail, 'relief');
  assert.equal(p.simHour, 110);
  assert.equal(p.scenario.sha256, SHA);
  assert.deepEqual(p.ruleVersions, { A: '1', B: '2', C: '1' });
  assert.equal(p.parameters.floodedShareParameter, 0.33);
  assert.equal(p.parameters.captureSoonAdviceHours, 48);
  assert.deepEqual(p.parameters.priorityWeights, PRIORITY_WEIGHTS);
  assert.equal(p.publication.state, 'published');
  const csv = draftCsv(d);
  assert.match(csv, /^# SABOOT DRAFT ASSESSMENT LIST - SIMULATION/);
  assert.ok(csv.includes(`scenario_sha256=${SHA}`));
  assert.ok(csv.includes('rules=A1+B2+C1'));
});

test('villages are ranked by review load, and a village rank sorts its plots first', () => {
  const d = buildDraft(relief, rowsAt(relief, 110), 110, SHA);
  assert.deepEqual(d.villages.map((v) => v.rank), d.villages.map((_v, i) => i + 1));
  for (let i = 1; i < d.villages.length; i++) assert.ok(d.villages[i - 1].reviewLoad >= d.villages[i].reviewLoad);
  const rank = new Map(d.villages.map((v) => [v.name, v.rank]));
  for (let i = 1; i < d.entries.length; i++) {
    const a = d.entries[i - 1], b = d.entries[i];
    assert.ok(rank.get(a.village)! <= rank.get(b.village)!, 'entries follow village rank');
    if (a.village === b.village) {
      assert.ok(Number(a.atOrAboveShareParameter) >= Number(b.atOrAboveShareParameter), 'plots at or above the share parameter come first');
      if (a.atOrAboveShareParameter === b.atOrAboveShareParameter) assert.ok(a.priority >= b.priority);
    }
  }
});

test('hail non-responders appear as unconfirmed, apart from the flooded counts', () => {
  const d = buildDraft(relief, rowsAt(relief, H), H, SHA);
  const unconfirmed = d.entries.filter((e) => e.unconfirmed);
  assert.ok(unconfirmed.length > 0);
  assert.equal(d.villages.reduce((a, v) => a + v.unconfirmed, 0), unconfirmed.length);
  assert.equal(d.villages.reduce((a, v) => a + v.plots, 0), d.entries.length - unconfirmed.length);
});

test('a hail prompt still waiting for a reply is unconfirmed in the draft, so the published list does not rewrite itself when its window ends', () => {
  const before = 108, after = 110; // the list was published at 96
  const waiting = rowsAt(relief, before).filter((r) => r.s.stage === 'hail-prompt');
  assert.ok(waiting.length > 0, 'the scenario has hail prompts still waiting at 108 h');
  const d = buildDraft(relief, rowsAt(relief, before), before, SHA);
  for (const r of waiting) assert.equal(d.entries.find((e) => e.plot === r.s.plot.id)?.unconfirmed, true, `${r.s.plot.id} is unconfirmed`);
  const order = (t: number) => buildDraft(relief, rowsAt(relief, t), t, SHA).villages.map((v) => `${v.name}:${v.reviewLoad}`);
  assert.deepEqual(order(before), order(after), 'the village order and review load do not change when the prompts close');
});

test('the CSV has the same number of fields on every row, quoted values included', () => {
  const d = buildDraft(relief, rowsAt(relief, H), H, SHA);
  const lines = draftCsv(d).trimEnd().split('\n').filter((l) => !l.startsWith('#'));
  const fields = (l: string) => { let n = 1, q = false; for (const c of l) { if (c === '"') q = !q; else if (c === ',' && !q) n++; } return n; };
  const width = fields(lines[0]);
  assert.equal(lines.length, d.entries.length + 1);
  for (const l of lines) assert.equal(fields(l), width);
});

test('the same inputs give the same export, byte for byte', () => {
  const a = draftJson(buildDraft(relief, rowsAt(relief, 120), 120, SHA));
  const b = draftJson(buildDraft(relief, rowsAt(relief, 120), 120, SHA));
  assert.equal(a, b);
});

test('entries at or above the share parameter are exactly those whose radar estimate reaches it', () => {
  const rows = rowsAt(relief, H);
  const d = buildDraft(relief, rows, H, SHA);
  for (const e of d.entries) {
    const r = rows.find((x) => x.s.plot.id === e.plot)!;
    assert.equal(e.atOrAboveShareParameter, r.e.floodShare >= RELIEF.damageShareThreshold);
  }
});

// ---- why a plot is ranked where it is -------------------------------------------------------------------------------
test('the four parts of a priority, at the unchanged weights, add up to the priority the worklist shows', () => {
  for (const r of rowsAt(relief, 60)) {
    if (r.e.tier === 'none') continue;
    const p = priorityParts(r.s, r.e);
    const W = PRIORITY_WEIGHTS;
    const total = W.ambiguity * p.ambiguity + W.urgency * p.urgency + W.area * p.area + W.flags * p.flags;
    assert.equal(r.pri, Math.round(100 * total));
  }
  assert.deepEqual(PRIORITY_WEIGHTS, { ambiguity: 0.35, urgency: 0.3, area: 0.15, flags: 0.2 });
});

// ---- pilot metrics --------------------------------------------------------------------------------------------------
test('pilot metrics at the end of the replay match the facts file', () => {
  // the facts file describes the dashboard when the judge has done nothing: the demo farmer has sent no evidence
  const idle = reduce([], H);
  const states = relief.plots.map((p) => plotState(relief, p, H, idle));
  const pm = pilotMetrics(relief, states, H);
  const f = facts.combos['relief-demo'].pilot;
  assert.equal(pm.onList, f.onList);
  assert.equal(pm.truthFlooded, f.truthFlooded);
  assert.equal(pm.truthWithEvidence, f.truthWithEvidence);
  assert.equal(pm.objections, f.objections);
  assert.equal(pm.objectionsAnswered, f.objectionsAnswered);
  assert.equal(Math.round(pm.objectionRate! * 100), f.objectionRatePct);
  assert.equal(Math.round(pm.eventToEvidence.median! * 100) / 100, f.eventToEvidenceMedianH);
});

test('the objection rate is unknown until the list is published, and the PMFBY rail has none', () => {
  const early = pilotMetrics(relief, statesAt(relief, relief.opts.publishAtHour - 1), relief.opts.publishAtHour - 1);
  assert.equal(early.published, false);
  assert.equal(early.objectionRate, null);
  assert.equal(early.objections, 0);
  const pm = pilotMetrics(pmfby, statesAt(pmfby, H), H);
  assert.equal(pm.published, false);
  assert.equal(pm.objections, 0);
});

test('the median event-to-call is the headline, and it is not the demo farmer’s figure', () => {
  const k = metrics(relief, statesAt(relief, H), H);
  const f = facts.combos['relief-demo'];
  assert.equal(Math.round(k.ttaMedian! * 100) / 100, f.eventToCall.medianH);
  assert.notEqual(f.eventToCall.medianH, f.focus.eventToCallH, 'the demo farmer is one plot, not the typical case');
});

test('at the slower radar cadence flooded plots go unalerted, which the cadence table must show next to its percentiles', () => {
  const slow = facts.combos['relief-slow'], demo = facts.combos['relief-demo'];
  assert.ok(slow.consistencyCheck.fn > demo.consistencyCheck.fn);
  assert.ok(slow.eventToCall.n < demo.eventToCall.n, 'fewer plots are alerted, so a lower 90th percentile is not an improvement');
});
