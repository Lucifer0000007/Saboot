// The replay run (scripts/replay/run.ts) on a tiny made-up set marked _fixture: it writes the three reports and a summary of raw
// counts, the Rule A variant drops the river reach and the Rule C variant drops the rain, a fixture is flagged so it can never be
// published, and the harness and the run import nothing that talks to the network. The fixture is generated here, not kept as
// files, so nothing in the repository can be mistaken for data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReplay, plotsFor } from '../../scripts/replay/run.ts';
import { statusFromReplay } from '../../scripts/replay/publish.ts';

const HOUR = 3600e3;
const iso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z');

/** Two points in one rain cell: FX-1 inside a flood near the river point, FX-2 dry and out of reach. Heavy rain on one day. */
function fixture(): string {
  const d = mkdtempSync(join(tmpdir(), 'saboot-replay-fixture-'));
  const D = Date.parse('2000-06-10T00:00:00Z');
  const event: [string, string] = [iso(D - 9 * 86400e3), iso(D + 6 * 86400e3)];
  const quiet: [string, string] = [iso(D - 120 * 86400e3), iso(D - 106 * 86400e3)];
  const note = '# FIXTURE: made-up numbers that prove the replay pipeline runs. Not real data. Never shown in the product.';
  writeFileSync(join(d, 'plots.csv'), [note, 'plot_id,village,lat,lon,area_ha,crop,elev_above_river_m,low_lying,river_reach,area_no,class', 'FX-1,FX-1,31.01,73.01,,,,1,FIXTURE-RIVER:2,1,affected', 'FX-2,FX-2,31.02,73.02,,,,1,,1,not_affected'].join('\n') + '\n');
  writeFileSync(join(d, 'confirmed.csv'), [note, 'event_id,window_start_utc,window_end_utc,village,status,source', `R1-FLOOD,${event[0]},${event[1]},FX-1,affected,FIXTURE`, `R1-FLOOD,${event[0]},${event[1]},FX-2,not_affected,FIXTURE`, `R1-DRY,${quiet[0]},${quiet[1]},FX-1,not_affected,FIXTURE`, `R1-DRY,${quiet[0]},${quiet[1]},FX-2,not_affected,FIXTURE`].join('\n') + '\n');
  const rain: string[] = [note, 'station_id,lat,lon,time_utc,rain_mm,interval_h'];
  for (const [s, e] of [event, quiet]) {
    for (let t = Date.parse(s) - 24 * HOUR; t <= Date.parse(e); t += HOUR) {
      const heavy = t >= D - 2 * 86400e3 && t < D - 2 * 86400e3 + 12 * HOUR; // 12 hours at 10 mm: 120 mm, over the rain line
      rain.push(`FIXTURE-CELL,31,73,${iso(t)},${heavy ? 10 : 0},1`);
    }
  }
  writeFileSync(join(d, 'rainfall.csv'), rain.join('\n') + '\n');
  const river: string[] = [note, 'gauge_id,lat,lon,kind,unit,danger_level,time_utc,value'];
  for (let t = Date.parse(quiet[0]); t <= Date.parse(event[1]) + 86400e3; t += 86400e3) river.push(`FIXTURE-RIVER,31.0,73.0,release,m3/s,100,${iso(t)},${t >= D - 86400e3 && t <= D + 86400e3 ? 150 : 50}`);
  writeFileSync(join(d, 'river.csv'), river.join('\n') + '\n');
  writeFileSync(join(d, 'sample.json'), JSON.stringify({ windows: { event, quiet }, rainCells: [{ lat: 31, lon: 73 }], areas: [{ area: 1 }], pointsWithRiverReach: 1, taken: { affected: 1, not_affected: 1, points: 2 }, farmland: { ha: 1234, source: 'made-up land-use statistics of the test set' } }));
  const prov = { source: 'FIXTURE', licence: 'none: synthetic', retrieved: 'not applicable' };
  writeFileSync(join(d, 'PROVENANCE.json'), JSON.stringify({ _fixture: true, _dataset: 'FIXTURE', 'rainfall.csv': prov, 'river.csv': prov, 'confirmed.csv': prov, 'plots.csv': prov }));
  return d;
}

test('the three runs give the expected raw counts on the fixture, and the summary says it is a fixture', () => {
  const d = fixture();
  const out = join(d, 'out');
  const s = runReplay(d, join(d, 'runs'), out);
  assert.equal(s.fixture, true);
  assert.deepEqual(Object.keys(s.runs), ['A', 'C', 'AC']);
  // rain fires on both points (one cell), the river only on the point in reach; nothing fires in the quiet window
  const c = (run: string, ev: string) => s.runs[run].events[ev];
  assert.deepEqual([c('A', 'R1-FLOOD').caught, c('A', 'R1-FLOOD').falseAlarms, c('A', 'R1-FLOOD').missed, c('A', 'R1-FLOOD').correctRejections], [1, 1, 0, 0]);
  assert.deepEqual([c('C', 'R1-FLOOD').caught, c('C', 'R1-FLOOD').notEvaluable], [1, 1]);
  assert.deepEqual([c('AC', 'R1-FLOOD').caught, c('AC', 'R1-FLOOD').falseAlarms], [1, 1]);
  for (const run of ['A', 'C', 'AC']) assert.equal(c(run, 'R1-DRY').caught + c(run, 'R1-DRY').falseAlarms, 0, `${run}: nothing fires in the quiet window`);
  assert.equal(c('A', 'R1-DRY').correctRejections, 2);
  for (const run of ['A', 'C', 'AC']) assert.ok(existsSync(join(out, run, 'report.md')) && existsSync(join(out, run, 'report.json')));
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'summary.json'), 'utf8')).runs, s.runs);
  assert.equal(runReplay(d, join(d, 'runs'), out).runs.A.reportSha256, s.runs.A.reportSha256, 'the same inputs give the same report');
});

test('the Rule A variant has no river reach, and the Rule C variant no rain', () => {
  const plots = 'plot_id,village,lat,lon,area_ha,crop,elev_above_river_m,low_lying,river_reach,area_no,class\nP,P,31,73,,,,1,G:2,1,affected\n';
  assert.equal(plotsFor(plots, 'A').split('\n')[1], 'P,P,31,73,,,,1,,1,affected');
  assert.equal(plotsFor(plots, 'AC'), plots);
  const d = fixture();
  runReplay(d, join(d, 'runs'), join(d, 'out'));
  assert.equal(readFileSync(join(d, 'runs', 'C', 'rainfall.csv'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).length, 1, 'header only');
});

test('a fixture summary can never become the product status; a real one carries its counts and no fixture mark', () => {
  const d = fixture();
  const s = runReplay(d, join(d, 'runs'), join(d, 'out'));
  assert.throws(() => statusFromReplay(s), /fixture/);
  const real = { ...s, fixture: false };
  const st = statusFromReplay(real);
  assert.equal(st.run, true);
  assert.equal(st.replay.id, 'R-1');
  assert.equal(st.replay.runs.A.events['R1-FLOOD'].caught, 1);
  assert.equal(st.replay.farmland?.ha, 1234, 'the problem-scale number travels with the counts');
  assert.ok(!JSON.stringify(st).includes('FIXTURE'));
  assert.ok(st.replay.ruleB.includes('not independently validated'));
});

test('the harness and the replay run import nothing that talks to the network', () => {
  const walk = (p: string): string[] => (statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => walk(join(p, n))) : [p]);
  const files = [...walk('scripts/validation'), 'scripts/replay/run.ts', 'scripts/replay/sample.ts', 'scripts/replay/derive.ts', 'scripts/replay/geo.ts', 'scripts/replay/publish.ts'];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    assert.ok(!/from ['"]node:(http|https|net|dns|tls|dgram)['"]|\bfetch\s*\(/.test(text), `${f} must not reach the network`);
  }
});
