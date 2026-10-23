// The median of an even count is the mean of the two middle values (audit L1-13). The headline "event to evidence" is a median,
// and it used to read the upper middle (11.05 h where the true median was 11.00).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { q } from '../../src/sim/metrics.ts';

test('the median of two, four and an odd count', () => {
  assert.equal(q([1, 3], 0.5), 2);
  assert.equal(q([4, 1, 3, 2], 0.5), 2.5, 'order does not matter');
  assert.equal(q([1, 2, 3], 0.5), 2);
  assert.equal(q([7], 0.5), 7);
  assert.equal(q([], 0.5), null);
});

test('the other percentiles keep their nearest-rank reading', () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(q(xs, 0.9), 9);
  assert.equal(q(xs, 0), 1);
  assert.equal(q(xs, 1), 10);
});
