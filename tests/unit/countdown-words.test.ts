// The relief rail's advice window reads in words, never as a clock (audit L4-09): "44:43:48" at 46 px looked like a time of
// day and ticked seconds for a 45 h piece of advice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtCountdownWords, fmtCountdown } from '../../src/lib/time.ts';

test('days and hours, hours alone, minutes alone, and the window passed', () => {
  assert.equal(fmtCountdownWords(44.73, true), 'about 1 day 21 h');
  assert.equal(fmtCountdownWords(44.4, true), 'about 1 day 20 h');
  assert.equal(fmtCountdownWords(48, true), 'about 2 days');
  assert.equal(fmtCountdownWords(20.2, true), 'about 20 h');
  assert.equal(fmtCountdownWords(1.4, true), 'about 1 h');
  assert.equal(fmtCountdownWords(0.75, true), 'about 50 min');
  assert.equal(fmtCountdownWords(0.05, true), 'about 10 min');
  assert.equal(fmtCountdownWords(0, true), 'the advice window has passed');
  assert.equal(fmtCountdownWords(-2, true), 'the advice window has passed');
});

test('the insurance rail keeps its clock', () => {
  assert.equal(fmtCountdown(44.73), '44:43:48');
});
