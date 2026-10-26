// Audit ledger rebuilds race on a slow phone (October audit CC-09): only the latest rebuild may write, so an older one that
// finishes late cannot show a stale ledger, and one still running when a tamper test starts cannot wipe it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModel } from '../../src/sim/model.ts';
import { modelOptions } from '../../src/sim/options.ts';
import { plotState } from '../../src/sim/cohort.ts';
import { evidenceFor, priority } from '../../src/sim/evidence.ts';
import { ledger, statuses, tamper, rebuild, tamperTest, restore } from '../../src/sim/ledger.ts';
import type { Row } from '../../src/dashboard/state.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
const m = buildModel(raw, modelOptions('relief'));
const rowsAt = (t: number): Row[] =>
  m.plots.map((p) => {
    const s = plotState(m, p, t, null);
    const e = evidenceFor(m, s, t);
    return { s, e, pri: priority(s, e) };
  });

test('CC-09: an older ledger rebuild that finishes last does not replace the newer one', async () => {
  const late = rowsAt(raw.hours), early = rowsAt(30);
  await rebuild(early, 30, {});
  const small = ledger.value.length;
  await rebuild(late, raw.hours, {});
  const big = ledger.value.length;
  assert.ok(big > small, 'the later time has more records');
  // the person scrubs from the end back to hour 30: the big rebuild starts first and finishes last
  await Promise.all([rebuild(late, raw.hours, {}), rebuild(early, 30, {})]);
  assert.equal(ledger.value.length, small, 'the ledger shows hour 30, the last one asked for');
});

test('CC-09: a rebuild still running when a tamper test starts does not wipe the tampered record', async () => {
  await rebuild(rowsAt(60), 60, {});
  const running = rebuild(rowsAt(60), 60, {});
  await tamperTest();
  await running;
  assert.ok(tamper.value, 'the tamper test is still on');
  assert.ok(statuses.value?.includes('tampered'), 'and the ledger on screen still shows the edited record');
  await restore();
});
