// Farmer and village names in the farmer's script (audit F15): every name in the shipped scenario has a Devanagari and a
// Gurmukhi form, English keeps the Latin name, and a name with an unknown word stays Latin, whole.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nameIn } from '../../src/lib/names.ts';
import type { ScenarioRaw } from '../../src/sim/types.ts';

const raw = JSON.parse(readFileSync(new URL('../../public/data/flood-replay.json', import.meta.url), 'utf8')) as ScenarioRaw;
const names = [...raw.plots.map((p) => p.name), ...raw.map.villages.map((v) => v.name)];

test('every farmer and village name in the scenario is written in Devanagari for Hindi and in Gurmukhi for Punjabi', () => {
  for (const n of names) {
    assert.match(nameIn(n, 'hi'), /^[ऀ-ॿ ]+$/, `${n} in Hindi`);
    assert.match(nameIn(n, 'pa'), /^[਀-੿ ]+$/, `${n} in Punjabi`);
    assert.equal(nameIn(n, 'en'), n);
  }
  assert.equal(nameIn('Harjit Kaur', 'pa'), 'ਹਰਜੀਤ ਕੌਰ');
});

test('a name with a word not on the list stays in Latin script, whole', () => {
  assert.equal(nameIn('Harjit Unknownson', 'hi'), 'Harjit Unknownson');
  assert.equal(nameIn('constructor', 'pa'), 'constructor');
});
