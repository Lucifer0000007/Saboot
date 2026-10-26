// A simulated field visit is shown in office hours, not at 23:21 (audit F9). SCRIPT itself is unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { officeHours, simParts } from '../../src/lib/time.ts';

test('a time in office hours stays; a time at night or before ten moves to the next 10:00', () => {
  for (let h = 0; h < 200; h += 0.35) {
    const o = officeHours(h), p = simParts(o);
    assert.ok(o >= h && o - h < 24, `${h}`);
    assert.ok(p.hh >= 10 && p.hh < 17, `${h} -> ${p.hh}:${p.mm}`);
    const q = simParts(h);
    if (q.hh >= 10 && q.hh < 17) assert.equal(o, h);
    else assert.deepEqual([p.hh, p.mm], [10, 0]);
  }
});
