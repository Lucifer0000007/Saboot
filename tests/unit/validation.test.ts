// The real-data validation harness runs the app's own rule code, scores villages against official labels, records where
// every input came from, and refuses to publish anything made from the synthetic fixture. The fixture exists only to
// prove the harness runs: its numbers must never reach the product.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCsv, readTable } from '../../scripts/validation/csv.ts';
import { runValidation, statusFrom, markdown } from '../../scripts/validation/harness.ts';
import { RULE_VERSIONS } from '../../src/sim/rules.ts';

const FIXTURE = 'tests/fixtures/validation';
const scenario = JSON.parse(readFileSync('public/data/flood-replay.json', 'utf8')) as { thresholds: { rain24: number; rainHeavy: number; lowElev: number } };

/** A scratch copy of the fixture, so a test can break one thing without touching the real files. */
function scratch(edit: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'saboot-validation-'));
  cpSync(FIXTURE, dir, { recursive: true });
  edit(dir);
  return dir;
}

test('the CSV reader handles quotes, doubled quotes, CRLF, a byte-order mark and comment lines', () => {
  const rows = parseCsv('﻿# a comment\r\na,b\r\n"x, y","say ""hi"""\r\n\r\n1,2');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'say "hi"'], ['1', '2']]);
  const t = readTable('id, name\n1, Ann\n2');
  assert.deepEqual(t.header, ['id', 'name']);
  assert.deepEqual(t.rows, [{ id: '1', name: 'Ann' }, { id: '2', name: '' }]);
});

test('on the fixture the harness finds one true positive, one false alarm, one miss and one true negative', () => {
  const r = runValidation({ dir: FIXTURE, fixture: true });
  assert.deepEqual(r.errors, []);
  assert.equal(r.fixture, true);
  assert.deepEqual(r.total.confusion, { tp: 1, fp: 1, fn: 1, tn: 1 });
  assert.equal(r.total.precision, 0.5);
  assert.equal(r.total.recall, 0.5);
  const e = r.events[0];
  assert.equal(e.id, 'FIX-1');
  const v = Object.fromEntries(e.villages.map((x) => [x.name, x]));
  // rain on a low-lying plot: Rule A, 102 mm in 24 h reached at 23:00 on day one
  assert.deepEqual(v['Fixture-A'].firedBy, ['A']);
  assert.equal(v['Fixture-A'].firstFireUtc, '2000-01-01T23:00:00Z');
  // light rain: nothing fires, so a village labelled affected is a miss and one labelled not affected is a true negative
  assert.equal(v['Fixture-B'].predicted, false);
  assert.deepEqual(e.misses, ['Fixture-C']);
  // the river crosses its danger level at 12:00; Rule C fires half an hour later: a false alarm for a village labelled not affected
  assert.deepEqual(v['Fixture-D'].firedBy, ['C']);
  assert.equal(v['Fixture-D'].firstFireUtc, '2000-01-01T12:30:00Z');
  assert.deepEqual(e.falseAlarms, ['Fixture-D']);
  // a labelled village with no plots, and one the rules could not run for, are listed and left out of the score
  assert.deepEqual(e.noPlotData, ['Fixture-E']);
  assert.deepEqual(e.notEvaluable, ['Fixture-F']);
});

test('it runs the app’s own rules with the app’s own parameters, and says which rule it could not run', () => {
  const r = runValidation({ dir: FIXTURE, fixture: true });
  assert.deepEqual(r.app.ruleVersions, RULE_VERSIONS);
  assert.equal(r.parameters.rain24, scenario.thresholds.rain24);
  assert.equal(r.parameters.rainHeavy, scenario.thresholds.rainHeavy);
  assert.equal(r.parameters.lowElevM, scenario.thresholds.lowElev);
  assert.deepEqual(r.rulesEvaluated, ['A', 'C']);
  assert.match(r.rulesNotEvaluated.B, /radar/i);
  // an override is recorded, not hidden
  const o = runValidation({ dir: FIXTURE, fixture: true, overrides: { rainHeavy: 200 } });
  assert.equal(o.parameters.rainHeavy, 200);
  assert.deepEqual(o.total.confusion, { tp: 0, fp: 1, fn: 2, tn: 1 }, 'with a higher rain line the rain rule no longer fires');
});

test('the report records every input file: size, fingerprint, rows, time range, source, licence and retrieval date', () => {
  const r = runValidation({ dir: FIXTURE, fixture: true });
  assert.deepEqual(Object.keys(r.inputs).sort(), ['confirmed.csv', 'plots.csv', 'rainfall.csv', 'river.csv']);
  for (const [f, i] of Object.entries(r.inputs)) {
    assert.match(i.sha256, /^[0-9a-f]{64}$/, f);
    assert.ok(i.bytes > 0 && i.rows > 0, f);
    assert.ok(i.provenance?.source && i.provenance.licence && i.provenance.retrieved, `${f} has provenance`);
  }
  assert.deepEqual(r.inputs['rainfall.csv'].timeRange, ['2000-01-01T07:00:00Z', '2000-01-02T06:00:00Z']);
  assert.equal(r.inputs['rainfall.csv'].rows, 48);
});

test('the same inputs give the same report, byte for byte', () => {
  assert.equal(runValidation({ dir: FIXTURE, fixture: true }).reportSha256, runValidation({ dir: FIXTURE, fixture: true }).reportSha256);
});

test('a fixture report can never be published, and the Markdown says so at the top', () => {
  const r = runValidation({ dir: FIXTURE, fixture: true });
  assert.throws(() => statusFrom(r), /synthetic test fixture/);
  assert.match(markdown(r), /^> \*\*FIXTURE RUN\./);
  // even if someone strips the flag from the files, a fixture marker in PROVENANCE.json keeps the report a fixture
  assert.equal(runValidation({ dir: FIXTURE }).fixture, true);
});

test('a report made from files that are not the fixture can be published, with its limits and its fingerprint', () => {
  const dir = scratch((d) => {
    const p = JSON.parse(readFileSync(join(d, 'PROVENANCE.json'), 'utf8'));
    delete p._fixture;
    p._dataset = 'Test dataset';
    writeFileSync(join(d, 'PROVENANCE.json'), JSON.stringify(p));
  });
  const r = runValidation({ dir });
  assert.equal(r.fixture, false);
  const s = statusFrom(r);
  assert.equal(s.run, true);
  assert.equal(s.precision, 0.5);
  assert.equal(s.recall, 0.5);
  assert.equal(s.villagesLabelled, 4);
  assert.deepEqual(s.rulesEvaluated, ['A', 'C']);
  assert.equal(s.reportSha256, r.reportSha256);
  assert.match(s.note, /radar rule was not evaluated/);
});

test('missing provenance, a bad time or a missing column is reported, and blocks publishing', () => {
  const noProv = scratch((d) => writeFileSync(join(d, 'PROVENANCE.json'), JSON.stringify({ 'rainfall.csv': { source: 'x', licence: 'y', retrieved: 'z' } })));
  const a = runValidation({ dir: noProv });
  assert.ok(a.errors.some((e) => /no provenance for river\.csv/.test(e)));
  assert.throws(() => statusFrom(a), /inputs have problems/);

  const badTime = scratch((d) => {
    const f = join(d, 'rainfall.csv');
    writeFileSync(f, readFileSync(f, 'utf8').replace('2000-01-01T08:00:00Z', '2000-01-01 08:00'));
  });
  const b = runValidation({ dir: badTime, fixture: true });
  assert.equal(b.inputs['rainfall.csv'].problems.count, 1);
  assert.match(b.inputs['rainfall.csv'].problems.samples[0], /time_utc \(needs a zone\)/);

  const noCol = scratch((d) => {
    const f = join(d, 'plots.csv');
    writeFileSync(f, readFileSync(f, 'utf8').replace('plot_id,village,lat,lon', 'plot_id,village,lat'));
  });
  assert.match(runValidation({ dir: noCol, fixture: true }).inputs['plots.csv'].problems.samples[0], /missing column\(s\): lon/);
});

test('villages the confirming process did not label are not scored as "not affected"', () => {
  const dir = scratch((d) => {
    const f = join(d, 'confirmed.csv');
    writeFileSync(f, readFileSync(f, 'utf8').split('\n').filter((l) => !l.includes('Fixture-B')).join('\n'));
  });
  const r = runValidation({ dir, fixture: true });
  assert.equal(r.events[0].villages.some((v) => v.name === 'Fixture-B'), false);
  assert.deepEqual(r.total.confusion, { tp: 1, fp: 1, fn: 1, tn: 0 });
});

// ---- the fixture stays out of the product -----------------------------------------------------------------------------
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));

test('nothing in the product reads or names the fixture, and the product status starts as "not run"', () => {
  for (const f of walk('src')) assert.ok(!/fixtures?\/validation|FIXTURE/.test(readFileSync(f, 'utf8')), `${f} must not mention the validation fixture`);
  const status = JSON.parse(readFileSync('public/data/validation-status.json', 'utf8'));
  // "not run", or a replay of a real past flood published by scripts/replay/publish.ts: raw counts, no fixture, no percentage
  if (status.run) {
    assert.equal(status.v, 2);
    assert.equal(status.replay.id, 'R-1');
    assert.ok(status.replay.runs.A.events['R1-FLOOD'].points > 0);
    assert.ok(!/fixture|FIXTURE/.test(JSON.stringify(status)));
    assert.ok(!('precision' in status) && !('recall' in status));
  } else assert.deepEqual(status, { v: 1, run: false });
  assert.ok(!existsSync('public/data/validation-fixture.json'));
});

// ---- audit L1-09, L1-10, L1-11: a published recall must not be silently wrong ---------------------------------------------
import { spawnSync } from 'node:child_process';
import { parseTime } from '../../scripts/validation/harness.ts';

/** A scratch dataset whose only rain is one station's `rows`, so Rule A on Fixture-A depends on nothing else. */
function rainOnly(rows: string[], plots?: (t: string) => string) {
  return scratch((d) => {
    writeFileSync(join(d, 'rainfall.csv'), ['station_id,lat,lon,time_utc,rain_mm,interval_h', ...rows].join('\n') + '\n');
    if (plots) writeFileSync(join(d, 'plots.csv'), plots(readFileSync(join(d, 'plots.csv'), 'utf8')));
  });
}
const villageA = (r: ReturnType<typeof runValidation>) => r.events[0].villages.find((v) => v.name === 'Fixture-A')!;

test('a reading is never credited before it was taken: 08:30 counts from the next whole hour, not from 08:00', () => {
  const r = runValidation({ dir: rainOnly(['FIXTURE-R1,30.000,75.000,2000-01-01T08:30:00Z,150,1']), fixture: true });
  assert.equal(villageA(r).predicted, true);
  assert.equal(villageA(r).firstFireUtc, '2000-01-01T09:00:00Z');
});

test('a daily total is not spread back over the day: it counts from the moment it was taken', () => {
  const r = runValidation({ dir: rainOnly(['FIXTURE-R1,30.000,75.000,2000-01-02T03:00:00Z,150,24']), fixture: true });
  assert.equal(villageA(r).firstFireUtc, '2000-01-02T03:00:00Z');
});

test('only a full ISO time with its zone is a time: digits that look like an offset in a date do not count', () => {
  for (const ok of ['2000-01-01T08:00:00Z', '2000-01-01T08:00Z', '2000-01-01T08:00:00+05:30', '2000-01-01 08:00:00+0530', '2000-01-01T08:00:00.250Z']) assert.notEqual(parseTime(ok), null, ok);
  for (const bad of ['01-02-2000', '1/2/2000 08:00 +0530', '2000-01-01', '2000-01-01T08:00:00', '2000-01-01T25:00:00Z', '2000-13-01T00:00:00Z', 'Jan 1 2000 08:00 +0530', '']) assert.equal(parseTime(bad), null, bad);
  assert.equal(parseTime('2000-01-01T08:00:00+05:30'), Date.parse('2000-01-01T02:30:00Z'));
});

test('a plot with no elevation information is not evaluated for rain, rather than counted as a quiet false negative', () => {
  const dir = rainOnly(['FIXTURE-R1,30.000,75.000,2000-01-01T08:00:00Z,150,1'], (t) => t.replace('FA-1,Fixture-A,30.001,75.001,1.2,paddy,1.5,1,', 'FA-1,Fixture-A,30.001,75.001,1.2,paddy,,,'));
  const r = runValidation({ dir, fixture: true });
  assert.equal(villageA(r).evaluable, false);
  assert.ok(r.events[0].notEvaluable.includes('Fixture-A'));
});

test('a rain station that reports only half of its hours is not used: the gaps would read as dry weather', () => {
  const rows = [7, 8, 9, 10, 11, 12].map((h) => `FIXTURE-R1,30.000,75.000,2000-01-01T${String(h).padStart(2, '0')}:00:00Z,${h === 12 ? 150 : 0},1`).filter((_, i) => i % 2 === 0);
  const r = runValidation({ dir: rainOnly(rows), fixture: true });
  assert.equal(villageA(r).evaluable, false, 'three of the six hours between its first and last reading are missing');
});

test('rows that were rejected are reported as an error, so a recall built from mostly-rejected data cannot be published', () => {
  const dir = scratch((d) => {
    const f = join(d, 'rainfall.csv');
    // 12 of the 48 hourly rows lose their time zone
    const lines = readFileSync(f, 'utf8').split('\n');
    let n = 0;
    writeFileSync(f, lines.map((l) => (/T\d\d:00:00Z/.test(l) && n++ < 12 ? l.replace(/Z,/, ',') : l)).join('\n'));
    // not the fixture, so the only thing that can stop it being published is the rejected rows
    const p = JSON.parse(readFileSync(join(d, 'PROVENANCE.json'), 'utf8'));
    delete p._fixture;
    writeFileSync(join(d, 'PROVENANCE.json'), JSON.stringify(p));
  });
  const r = runValidation({ dir });
  assert.equal(r.inputs['rainfall.csv'].problems.count, 12);
  assert.ok(r.errors.some((e) => /12 of 48 rows in rainfall\.csv were rejected/.test(e)), r.errors.join(' | '));
  assert.throws(() => statusFrom(r), /inputs have problems/);
});

test('an unbalanced quote is a reported problem, not a silent loss of the rest of the file', () => {
  assert.equal(readTable('a,b\n"x,1\n2,3\n').unterminated, true);
  assert.equal(readTable('a,b\n"x",1\n').unterminated, false);
  const dir = scratch((d) => {
    const f = join(d, 'plots.csv');
    writeFileSync(f, readFileSync(f, 'utf8').replace('FB-1,Fixture-B', '"FB-1,Fixture-B'));
  });
  assert.ok(runValidation({ dir, fixture: true }).errors.some((e) => /unbalanced quote/.test(e) && /plots\.csv/.test(e)));
});

test('a file with a hundred and fifty thousand rows is read without running out of stack', () => {
  const rows: string[] = [];
  for (let i = 0; i < 150_000; i++) rows.push(`FIXTURE-R1,30.000,75.000,${new Date(Date.UTC(2000, 0, 1, 7) + i * 3600e3).toISOString().replace('.000Z', 'Z')},0,1`);
  const r = runValidation({ dir: rainOnly(rows), fixture: true });
  assert.equal(r.inputs['rainfall.csv'].rows, 150_000);
});

test('a command-line number that is not a number stops the run instead of silently making nothing fire', () => {
  const r = spawnSync(process.execPath, ['--import', './scripts/ts-resolve.mjs', 'scripts/validation/run.ts', '--fixture', '--rain24', 'abc'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--rain24 must be a number/);
});
