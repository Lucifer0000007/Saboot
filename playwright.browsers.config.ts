// Firefox and WebKit smoke run (not a gate: the Chrome matrix in playwright.config.ts is). The main states must open
// with no console error, overflow or clipped text, the hash chain must seal and a signed packet must import.
//   npm run build && npx playwright test -c playwright.browsers.config.ts
// Needs the engines: npx playwright install firefox webkit
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/qa',
  testMatch: /browsers\.spec\.ts$/,
  outputDir: '.cache/pw-browsers-results',
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 90_000,
  reporter: [['line']],
  use: { baseURL: 'http://localhost:4331', headless: true, trace: 'off', serviceWorkers: 'block' },
  projects: [{ name: 'firefox', use: { browserName: 'firefox' } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  webServer: { command: 'node scripts/serve-dist.mjs 4331', url: 'http://localhost:4331/', reuseExistingServer: false, timeout: 30_000 },
});
