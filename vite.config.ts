import { defineConfig } from 'vite';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import preact from '@preact/preset-vite';
// @ts-expect-error plain JS build plugins
import { inlineCss, fontFaces, deepLinkPreload, markerWarnings } from './scripts/vite-plugins.mjs';

// The build stamp shown in the footer and in Settings: the package version and the build time (UTC, to the minute), so a
// stale cached page can be told from a new build. `vite build` writes it to .cache/; the prerender (scripts/postbuild.mjs,
// SABOOT_PRERENDER=1) reads the same stamp back, so the static shell and the app agree. `npm run dev` shows "dev".
const STAMP_FILE = '.cache/build-stamp.json';
function buildStamp(command: string) {
  if (command === 'build') {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const stamp = { v: pkg.version as string, t: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC' };
    mkdirSync('.cache', { recursive: true });
    writeFileSync(STAMP_FILE, JSON.stringify(stamp));
    return stamp;
  }
  if (process.env.SABOOT_PRERENDER === '1') return JSON.parse(readFileSync(STAMP_FILE, 'utf8'));
  return { v: 'dev', t: '' };
}

export default defineConfig(({ command }) => ({
  base: './', // relative URLs: deployable at a domain root or a sub-path
  plugins: [
    preact({ devToolsEnabled: false, prefreshEnabled: true }),
    fontFaces(),
    inlineCss(),
    deepLinkPreload({
      insurer: 'dashboard/Dashboard.tsx',
      ledger: 'dashboard/LedgerPanel.tsx',
      explainer: 'explainer/Explainer.tsx',
      import: 'dashboard/Import.tsx',
    }),
    markerWarnings(),
  ],
  define: { __BUILD__: JSON.stringify(buildStamp(command)) },
  build: {
    target: 'es2020',
    // the page's own CSS is inlined (inlineCss); lazy chunks bring theirs (fetched before the chunk runs)
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0,
    reportCompressedSize: false,
  },
}));
