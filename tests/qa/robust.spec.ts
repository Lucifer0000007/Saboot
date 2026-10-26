// Robustness on real phones and flaky networks (October audit, workstream W2). Each test names the audit finding it
// reproduces (.cache/audit/all.json) and failed before its fix.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const PHONE = V('360x640');
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);

test('CC-03: two jumps at once add each photo once, and no photo after the seal', async ({ page }) => {
  const errors: string[] = [];
  await open(page, PHONE, 'en', errors);
  await sab(page, `await Promise.all([s.jump('confirm'), s.jump('draft')]);`);
  const demo = (await page.evaluate('window.__sab.logs()["$demo"]')) as { shotShas: string[]; packetHash: string | null; events: number };
  expect(demo.shotShas).toHaveLength(3);
  expect(new Set(demo.shotShas).size).toBe(3);
  expect(demo.packetHash).not.toBeNull();
  expect(demo.events, 'three photos, the seal and the reference').toBe(5);
  expect(errors).toEqual([]);
});
