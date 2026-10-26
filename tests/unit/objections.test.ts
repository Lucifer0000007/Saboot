// Objection responses on the draft list (audit OF-05). The officer may note, by hand, THAT a response was given and when;
// never what it said and never an outcome. A scripted response is never overwritten, and a noted time outside the
// objection's life (before it was filed, or after the list's replay time) is not shown.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor, priority } from '../../src/sim/evidence.ts';
import { buildDraft, draftCsv, draftJson } from '../../src/dashboard/draftList.ts';
import type { Row } from '../../src/dashboard/state.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
const relief = buildModel(raw, modelOptions('relief'));
const rowsAt = (t: number): Row[] => relief.plots.map((p) => {
  const s = plotState(relief, p, t, null);
  const e = evidenceFor(relief, s, t);
  return { s, e, pri: priority(s, e) };
});
const end = relief.opts.publishAtHour + relief.opts.objectionWindowHours;
const unanswered = raw.plots.filter((p) => p.obj && p.obj[1] < 0).map((p) => p.id);
const scripted = raw.plots.filter((p) => p.obj && p.obj[1] >= 0).map((p) => p.id);

test('the scenario has objections with and without a scripted response', () => {
  assert.ok(unanswered.length > 0 && scripted.length > 0);
});

test('a response noted by hand shows its time and says it was entered by hand; nothing else about it exists', () => {
  const t = end + 4;
  const id = unanswered[0];
  const before = buildDraft(relief, rowsAt(t), t, null).entries.find((e) => e.plot === id)!;
  assert.deepEqual({ ...before.objection, filedAtHour: 0 }, { filedAtHour: 0, answeredAtHour: null, responseBy: null });
  const d = buildDraft(relief, rowsAt(t), t, null, { [id]: end + 2 });
  const after = d.entries.find((e) => e.plot === id)!;
  assert.equal(after.objection!.answeredAtHour, end + 2);
  assert.equal(after.objection!.responseBy, 'hand');
  assert.deepEqual(Object.keys(after.objection!).sort(), ['answeredAtHour', 'filedAtHour', 'responseBy']);
  assert.match(draftCsv(d), /officer_response_noted_by/);
  assert.ok(!/\b(upheld|rejected|accepted|approved|granted|dismissed)\b/i.test(draftJson(d) + draftCsv(d)));
});

test('a scripted response is never replaced, and a noted time before the filing or after "now" is not shown', () => {
  const t = end + 4;
  const s = scripted[0];
  const d = buildDraft(relief, rowsAt(t), t, null, { [s]: end + 3, [unanswered[0]]: relief.opts.publishAtHour - 1, [unanswered[1] ?? unanswered[0]]: t + 10 });
  assert.equal(d.entries.find((e) => e.plot === s)!.objection!.responseBy, 'scripted');
  for (const id of unanswered) assert.equal(d.entries.find((e) => e.plot === id)!.objection!.answeredAtHour, null, id);
});
