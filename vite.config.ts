import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
// @ts-expect-error plain JS build plugins
import { inlineCss, fontFaces, deepLinkPreload, markerWarnings } from './scripts/vite-plugins.mjs';

export default defineConfig({
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
  build: {
    target: 'es2020',
    // the page's own CSS is inlined (inlineCss); lazy chunks bring theirs (fetched before the chunk runs)
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0,
    reportCompressedSize: false,
  },
});
