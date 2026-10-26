// The check code a farmer reads aloud (audit F13): eight digits from the packet hash, the same on the phone and the console.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCode } from '../../src/lib/hash.ts';

test('eight digits in two groups, zero-padded, taken from the start of the hash', () => {
  assert.equal(checkCode('00000000' + 'f'.repeat(56)), '0000 0000');
  assert.equal(checkCode('ffffffff' + '0'.repeat(56)), '9496 7295'); // 4294967295 % 1e8
  assert.equal(checkCode('95b3f887' + '0'.repeat(56)), checkCode('95b3f887' + '1'.repeat(56)));
  assert.match(checkCode('95b3f8879d682953' + '0'.repeat(48)), /^\d{4} \d{4}$/);
});
