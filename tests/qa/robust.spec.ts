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

test('CC-07: a seal that cannot be stored says so on screen, and works once storage does', async ({ page }) => {
  const errors: string[] = [];
  await open(page, PHONE, 'en', errors);
  await sab(page, `await s.jump('capture'); s.tab('farmer'); s.screen('capture');`);
  // the phone's storage refuses every write (the log is written under a Web Lock)
  await page.evaluate(() => { (navigator.locks as unknown as { request: unknown }).request = () => Promise.reject(new Error('QuotaExceededError')); });
  const btn = page.getByRole('button', { name: /Seal my evidence/ });
  await btn.click();
  await expect(page.locator('[data-seal-fail]')).toContainText('could not be sealed');
  expect(await page.evaluate('window.__sab.state().sealed')).toBe(false);
  await page.evaluate(() => { delete (navigator.locks as unknown as { request?: unknown }).request; });
  await btn.click();
  await expect.poll(() => page.evaluate('window.__sab.state().sealed')).toBe(true);
  await expect(page.locator('[data-seal-fail]')).toHaveCount(0);
});
