// Build plugins: inline all CSS into index.html (no render-blocking request), inline the generated
// @font-face block with preloads for the two Latin faces, preload the right lazy chunk for deep links,
// and print every remaining {{VERIFY}} marker at the end of the build.
import { readFileSync } from 'node:fs';
import { listMarkers } from './markers.mjs';

/** @returns {import('vite').Plugin} */
export function inlineCss() {
  return {
    name: 'saboot-inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName === 'index.html');
      if (!html) return;
      let src = String(html.source);
      for (const [name, f] of Object.entries(bundle)) {
        if (f.type !== 'asset' || !name.endsWith('.css')) continue;
        const re = new RegExp(`<link rel="stylesheet"[^>]*href="[^"]*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
        if (!re.test(src)) continue;
        src = src.replace(re, () => `<style>${String(f.source)}</style>`);
        delete bundle[name];
      }
      html.source = src;
    },
  };
}

/** Inline the generated @font-face block (document-relative URLs) + preload the Latin display and body faces only. */
/** @returns {import('vite').Plugin} */
export function fontFaces() {
  return {
    name: 'saboot-font-faces',
    transformIndexHtml(html) {
      const css = readFileSync('src/styles/fonts.css', 'utf8').replace(/\/\*.*?\*\/\s*/s, '').trim();
      const pre = ['display-latin', 'sans-latin']
        .map((f) => `<link rel="preload" href="fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`)
        .join('');
      return html.replace('<!--fonts-->', `${pre}<style>${css}</style>`);
    },
  };
}

/**
 * Deep links (?tab=insurer, ?at=…, #k=…) need a lazy chunk right away: a tiny inline script lists it in self.__dl, and
 * the boot script (scripts/postbuild.mjs) preloads it with the entry, after the first paint (the prerendered page needs
 * no script to paint). Plain visits preload nothing.
 * @param {Record<string, string>} chunks name -> module path suffix
 * @returns {import('vite').Plugin}
 */
export function deepLinkPreload(chunks) {
  return {
    name: 'saboot-deeplink-preload',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName === 'index.html');
      if (!html) return;
      const all = Object.values(bundle).filter((c) => c.type === 'chunk');
      const map = {};
      for (const [name, suffix] of Object.entries(chunks)) {
        const c = all.find((x) => x.facadeModuleId?.replace(/\\/g, '/').endsWith(suffix));
        if (c) map[name] = [c.fileName, ...c.imports.filter((i) => !bundle[i]?.isEntry)].map((f) => './' + f);
      }
      const js = `(function(){var m=${JSON.stringify(map)},q=new URLSearchParams(location.search),t=q.get('tab'),l=[];` +
        `if(t&&m[t])l=m[t];if(/^#k=/.test(location.hash)&&m.import)l=l.concat(m.import,m.insurer||[]);` +
        `self.__dl=l})()`;
      html.source = String(html.source).replace('</title>', `</title><script>${js}</script>`);
    },
  };
}

/** Print every remaining {{VERIFY}} marker after a build (npm run deploy refuses while any exist). */
/** @returns {import('vite').Plugin} */
export function markerWarnings() {
  return {
    name: 'saboot-verify-markers',
    apply: 'build',
    closeBundle() {
      const ms = listMarkers();
      if (!ms.length) return;
      console.warn(`\n⚠ ${ms.length} {{VERIFY}} marker(s) remain — real-world claims to check before deploying (npm run markers):`);
      for (const m of ms) console.warn(`  ${m.file}:${m.line}  ${m.text}`);
    },
  };
}
