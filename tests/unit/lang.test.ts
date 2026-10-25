// A first-time visitor sees their device's language when the app has it (audit L4-03): a Hindi or Punjabi phone no longer
// opens in English. A saved choice still wins; that part is a QA test, because it reads localStorage in a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickLang } from '../../src/lib/prefs.ts';

test('the first device language the app has wins; anything else is English', () => {
  assert.equal(pickLang(['hi-IN', 'en-IN']), 'hi');
  assert.equal(pickLang(['pa-IN']), 'pa');
  assert.equal(pickLang(['pa', 'hi']), 'pa');
  assert.equal(pickLang(['en-US']), 'en');
  assert.equal(pickLang(['ta-IN', 'hi-IN']), 'hi', 'a language the app lacks is skipped');
  assert.equal(pickLang(['ta-IN', 'fr']), 'en');
  assert.equal(pickLang([]), 'en');
  assert.equal(pickLang(undefined), 'en');
});

test('a locale tag in any case is understood', () => {
  assert.equal(pickLang(['HI-in']), 'hi');
  assert.equal(pickLang(['Pa-Guru-IN']), 'pa');
});
