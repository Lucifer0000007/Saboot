// FIELD evidence (src/data/fieldEvidence.ts): every number on screen comes from fieldCounts(), letters and users show only
// above zero, a quote only when the raw note has one, and the records stay anonymous.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { INTERVIEWS, LETTERS_OF_INTEREST, USERS, TARGET_STATE, fieldCounts, fieldView, type Interview } from '../../src/data/fieldEvidence.ts';
import en from '../../src/i18n/en.ts';
import hi from '../../src/i18n/hi.ts';
import pa from '../../src/i18n/pa.ts';

test('the counts are computed from the records, and match the verified list (seven people, five states, four roles)', () => {
  const c = fieldCounts();
  assert.equal(c.interviews, INTERVIEWS.length);
  assert.equal(c.states, new Set(INTERVIEWS.map((i) => i.state)).size);
  assert.equal(c.roles, new Set(INTERVIEWS.map((i) => i.role)).size);
  assert.equal(c.inTargetState, INTERVIEWS.filter((i) => i.state === TARGET_STATE).length);
  assert.equal(c.letters, LETTERS_OF_INTEREST.length);
  assert.equal(c.users, USERS.length);
  assert.deepEqual(c, { interviews: 7, states: 5, roles: 4, inTargetState: 0, letters: 0, users: 0 });
  // a description never makes a new role: two farmers described differently are still one role
  assert.equal(new Set(INTERVIEWS.filter((i) => i.role === 'Farmer').map((i) => i.roleDetail)).size > 1, true);
});

test('no field number is typed into the copy or the component: they all come from fieldCounts()', () => {
  for (const [lang, d] of [['en', en], ['hi', hi], ['pa', pa]] as const) {
    for (const [k, v] of Object.entries(d)) if (k.startsWith('fe.')) assert.ok(!/[0-9०-९੦-੯]/.test(String(v)), `${lang} ${k} contains a digit`);
  }
  const src = readFileSync('src/dashboard/Impact.tsx', 'utf8');
  const strip = src.slice(src.indexOf('function FieldStrip'), src.indexOf('export function Impact()')).replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '');
  assert.ok(strip.length > 200, 'FieldStrip found');
  // a standalone numeric literal (not part of a name like h4); 0 only appears in the empty check
  assert.ok(!/(?<![\w-])[1-9]\d*(?![\w-])/.test(strip), 'FieldStrip must not hard-code a number');
});

test('an empty quote renders nothing; a quote shows only when the record has one', () => {
  assert.deepEqual(fieldView().quotes, []);
  const one: Interview = { ...INTERVIEWS[0], quote: '  ' };
  assert.deepEqual(fieldView({ interviews: [one], letters: [], users: [] }).quotes, []);
  const two: Interview = { ...INTERVIEWS[0], quote: 'word for word' };
  assert.equal(fieldView({ interviews: [two], letters: [], users: [] }).quotes.length, 1);
});

test('letters of interest and users are hidden while zero and shown once one exists', () => {
  const v = fieldView();
  assert.equal(v.showLetters, false);
  assert.equal(v.showUsers, false);
  const rec = { id: 'L-01', role: 'test', state: 'test', date: '2026-01-01', source: 'test' };
  assert.equal(fieldView({ interviews: INTERVIEWS, letters: [rec], users: [] }).showLetters, true);
  assert.equal(fieldView({ interviews: INTERVIEWS, letters: [], users: [rec] }).showUsers, true);
});

test('every new string exists in Hindi and Punjabi too', () => {
  for (const k of Object.keys(en).filter((k) => k.startsWith('fe.') || k === 'prov.field')) {
    assert.ok(typeof hi[k] === 'string' && String(hi[k]).length > 0, `hi ${k}`);
    assert.ok(typeof pa[k] === 'string' && String(pa[k]).length > 0, `pa ${k}`);
  }
});

test('records stay anonymous and honest: ISO dates, verbal consent, no phone number, a quote only if it is in the raw note', () => {
  for (const i of INTERVIEWS) {
    assert.match(i.date, /^\d{4}-\d{2}-\d{2}$/, i.id);
    assert.equal(i.consent, 'verbal, no objection raised');
    assert.equal(i.recording, 'not consented', `${i.id}: recording was not on the consent list`);
    assert.ok(!/\d{7,}/.test(JSON.stringify(i)), `${i.id} must not hold a phone number`);
    for (const f of i.selfReportedFigures) assert.equal(f.note, 'self-reported estimate');
    if (i.quote) {
      const raw = `docs/interviews/raw/${i.source}`;
      assert.ok(existsSync(raw) && readFileSync(raw, 'utf8').includes(i.quote), `${i.id}: the quote must appear word for word in ${raw}`);
    }
  }
});
