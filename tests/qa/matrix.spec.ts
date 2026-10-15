// Spec §10.1–10.2 + axe: every state × viewport × language.
import { test, expect } from '@playwright/test';
import { STATES, VIEWPORTS, LANGS, open, settle, check, axe, record, subjectOnScreen } from './harness';

for (const st of STATES) {
  for (const v of VIEWPORTS) {
    for (const lang of LANGS) {
      test(`${st.id} · ${v.name} · ${lang}`, async ({ page }) => {
        const errors: string[] = [];
        await open(page, v, lang, errors);
        await st.setup(page, v);
        await settle(page, st.focus);
        const layout = [...(await subjectOnScreen(page, st.focus)), ...(await check(page, v))];
        const a11y = await axe(page);
        await record(page, st.id, `${v.name}-${lang}`, { state: st.id, viewport: v.name, lang, layout, axe: a11y, console: errors });
        expect.soft(errors, 'console errors').toEqual([]);
        expect.soft(layout, 'layout checks').toEqual([]);
        expect(a11y, 'axe serious/critical').toEqual([]);
      });
    }
  }
}
