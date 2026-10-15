// WebKit / Firefox smoke: the main states open without console errors, horizontal overflow or clipped text, the hash
// chain seals (WebCrypto), and a signed packet imports. Camera, storage and the service worker differ per engine and
// are noted in PREDEPLOY-REPORT.md; the Chrome matrix (matrix/extra/release/camera specs) remains the gate.
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { ALL_VIEWPORTS, STATES, open, settle, check, subjectOnScreen } from './harness';

const V = (name: string) => ALL_VIEWPORTS.find((v) => v.name === name)!;
const sab = (page: Page, js: string) => page.evaluate(`(async () => { const s = window.__sab; ${js} })()`);

for (const v of [V('390x844'), V('1280x800')]) {
  for (const id of ['landing', 'alert', 'evidence-packet', 'dashboard', 'drawer', 'ledger-tamper', 'import', 'draft-list', 'objection', 'helper-queue', 'feature-phone']) {
    const st = STATES.find((s) => s.id === id)!;
    test(`${id} · ${v.name}`, async ({ page, browserName }, info) => {
      // Playwright's Firefox build throws NS_ERROR_FAILURE from crypto.subtle (digest and ECDSA), so the signed packet
      // cannot be made there; hashing itself falls back to plain JS. Real Firefox is on the manual test list.
      test.skip(browserName === 'firefox' && id === 'import', 'Playwright Firefox build: crypto.subtle throws NS_ERROR_FAILURE');
      const errors: string[] = [];
      await open(page, v, 'en', errors);
      await st.setup(page, v);
      await settle(page, st.focus);
      const problems = [...(await subjectOnScreen(page, st.focus)), ...(await check(page, v, { only: ['overflow', 'clip', 'overlap', 'labels', 'simlabel'] }))];
      mkdirSync(`.cache/pw-browsers/shots`, { recursive: true });
      await page.screenshot({ path: `.cache/pw-browsers/shots/${info.project.name}-${id}-${v.name}.png` });
      expect(problems, 'layout checks').toEqual([]);
      expect(errors, 'console').toEqual([]);
    });
  }
}

test('hash chain and signed packet in this engine', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Playwright Firefox build: crypto.subtle throws NS_ERROR_FAILURE (ECDSA signing)');
  const errors: string[] = [];
  await open(page, V('1280x800'), 'en', errors);
  await sab(page, `await s.jump('capture'); await s.ensure('sealed'); s.seek(s.state().t + 0.3);`);
  const st = await page.evaluate('window.__sab.state()') as { shots: number; sealed: boolean };
  expect(st.shots).toBe(3);
  expect(st.sealed).toBe(true);
  const code = (await page.evaluate('window.__sab.kcode()')) as string;
  expect(code.length).toBeGreaterThan(200);
  expect(errors).toEqual([]);
});
