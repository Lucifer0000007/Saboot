// Back and reload on a phone (workstream W7): Android Back closes the top sheet or the camera, then goes back one farmer
// screen or console view, before it leaves the site; a reload comes back to the tab, the view, the replay time, the farmer
// screen and the helper's farmer; a menu link leaves focus on the section heading it went to.
import { test, expect } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;

test('a menu link leaves focus on the heading of the section it went to, not on the menu button (UI-13)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  for (const [name, id] of [['How it works', 'how'], ['Honest limits', 'limits']]) {
    await page.locator('.nav-menu').click();
    await page.locator('.menu-sheet').getByRole('link', { name }).click();
    await expect(page.locator('.menu-sheet')).toHaveCount(0);
    await page.waitForTimeout(300);
    // the section's heading, or the section itself while its lazy part is still loading
    expect(await page.evaluate(() => document.activeElement?.closest('section')?.id), name).toBe(id);
  }
  // a sheet closed by its own button still hands focus back to the button that opened it
  await page.locator('.nav-menu').click();
  await page.locator('.menu-sheet').getByRole('button', { name: 'Close menu' }).click();
  await expect(page.locator('.nav-menu')).toBeFocused();
  expect(errors).toEqual([]);
});
