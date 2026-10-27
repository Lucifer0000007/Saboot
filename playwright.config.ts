// QA gates (spec §10). Runs the built site (dist/) in the system Chrome. QA_QUICK=1: 3 viewports × en/hi.
import { defineConfig } from '@playwright/test';

const quick = process.env.QA_QUICK === '1';

export default defineConfig({
  testDir: 'tests/qa',
  outputDir: '.cache/pw-results',
  fullyParallel: true,
  workers: quick ? 4 : 6,
  retries: 0,
  timeout: 90_000,
  reporter: [['line']],
  globalSetup: './tests/qa/setup.ts',
  globalTeardown: './tests/qa/contact-sheet.ts',
  use: {
    channel: 'chrome',
    baseURL: 'http://localhost:4330',
    headless: true,
    trace: 'off',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'qa', testMatch: /(matrix|extra|release|camera|helper|privacy|relief|mvp|devices|receipt|copy|robust|officer|farmer|mobile|back|field)\.spec\.ts$/ },
    { name: 'perf', testMatch: /perf\.spec\.ts$/, dependencies: ['qa'] },
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs 4330',
    url: 'http://localhost:4330/',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
