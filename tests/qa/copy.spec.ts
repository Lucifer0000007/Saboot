// Copy and honesty on the built site (audit W1-copy): each screen names the real actor, a relief farmer is not told about a
// claim, and every range and time says where it comes from.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);

test('the farmer status screen says Evidence status on the relief rail and Claim status only on PMFBY', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('360x640'), 'en', errors);
  await sab(page, `await s.jump('draft'); s.tab('farmer'); s.screen('status');`);
  const title = page.locator('.farmer .f-title');
  await expect(title).toHaveText('Evidence status');
  await expect(page.locator('.farmer')).not.toContainText('Claim status');
  await sab(page, `s.rail('pmfby'); await s.jump('confirm'); s.tab('farmer'); s.screen('status');`);
  await expect(title).toHaveText('Claim status');
  expect(errors).toEqual([]);
});
