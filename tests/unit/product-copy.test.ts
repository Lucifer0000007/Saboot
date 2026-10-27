// Product screens speak to the people who use them (audit W1-copy). The judge tour may say "judge"; the farmer, helper
// and officer screens may not, in any language.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../../src/i18n/en.ts';
import hi from '../../src/i18n/hi.ts';
import pa from '../../src/i18n/pa.ts';

test('no string outside the judge tour mentions judges', () => {
  const words = /judge|जज|ਜੱਜ/i;
  for (const [lang, d] of [['en', en], ['hi', hi], ['pa', pa]] as const) {
    for (const [k, v] of Object.entries(d)) if (!k.startsWith('tour.')) assert.doesNotMatch(String(v), words, `${lang} ${k}`);
  }
});
