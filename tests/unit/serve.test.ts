// The QA and demo file server (scripts/snap.mjs) serves the built folder and nothing outside it (security scan L2-03): a path
// that decodes to ".." is a 404, not package.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serve } from '../../scripts/snap.mjs';

test('a request that escapes the served folder is refused; a file inside it is served', async () => {
  const srv = (await serve('tests/fixtures/validation', 4399)) as { close: () => void };
  try {
    const at = (p: string) => fetch(`http://127.0.0.1:4399${p}`);
    assert.equal((await at('/plots.csv')).status, 200);
    for (const bad of ['/..%2fpackage.json', '/../package.json', '/%2e%2e/%2e%2e/package.json', '/..%5cpackage.json']) {
      const r = await at(bad);
      assert.equal(r.status, 404, bad);
      assert.ok(!(await r.text()).includes('"name"'), `${bad} must not serve package.json`);
    }
  } finally {
    srv.close();
  }
});
