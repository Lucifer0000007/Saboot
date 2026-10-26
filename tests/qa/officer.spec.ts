// The officer console on a phone and a laptop (audit workstream W4): the card tables, the one ranked worklist, the tamper
// check, the imported packet's own record, objections, the deep link, the map's tap targets and the import sheet.
import { test, expect, type Page } from '@playwright/test';
import { ALL_VIEWPORTS, open } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);

test('card tables on a phone: a label that wraps to two lines makes its cell taller instead of running into the next row (OF-08, J17)', async ({ page }) => {
  const errors: string[] = [];
  await open(page, V('390x844'), 'en', errors);
  await sab(page, `s.seek(168); s.tab('insurer'); s.insurer('impact');`);
  const cells = page.locator('.impactp .rtable td[data-l]');
  await expect(cells.first()).toBeVisible({ timeout: 20_000 });
  const bad = await cells.evaluateAll((els) => els.flatMap((td) => {
    const label = parseFloat(getComputedStyle(td, '::before').height) || 0;
    const cs = getComputedStyle(td);
    const inner = td.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    return label > inner + 1 ? [`${td.getAttribute('data-l')}: label ${label} px in a ${inner} px cell`] : [];
  }));
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});
