// Size budgets over dist/ (gzip -9, like a static host would serve) + a third-party URL scan.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { PUBLIC_URL } from '../src/config.ts';

/** The site's own public address (canonical link, social tags) is not a third party. */
const OWN_HOST = new URL(PUBLIC_URL).host;
/** Addresses a person can follow from the page. Each is named here on purpose, and the page never fetches one. */
const LINKS = new Set(['https://github.com/Lucifer0000007/Saboot', 'https://open-meteo.com/']); // the replay's data licence (CC BY 4.0) asks for a link beside the data

const KB = 1024;
const B = { initial: 200 * KB, total: 700 * KB, lazy: 60 * KB, data: 40 * KB, clip: 20 * KB };
const DIST = 'dist';
let fail = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { fail++; console.log('  ✗ ' + m); };
const check = (cond, m) => (cond ? ok(m) : bad(m));
const kb = (n) => (n / KB).toFixed(1) + ' KB';

const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const files = walk(DIST).map((p) => {
  const buf = readFileSync(p);
  return { path: relative(DIST, p).replace(/\\/g, '/'), raw: buf.length, gz: gzipSync(buf, { level: 9 }).length };
});
const by = Object.fromEntries(files.map((f) => [f.path, f]));
const html = readFileSync(join(DIST, 'index.html'), 'utf8');

// Initial load = index.html (with inlined CSS + prerendered shell) + entry JS + its static imports + preloaded fonts.
const initial = new Set(['index.html']);
for (const m of html.matchAll(/<script[^>]+src="\.?\/?([^"]+)"/g)) initial.add(m[1]);
for (const m of html.matchAll(/<link[^>]+rel="(?:modulepreload|stylesheet|preload)"[^>]*href="\.?\/?([^"]+)"/g)) initial.add(m[1]);
// the boot script preloads the entry and its static imports after the first paint (scripts/postbuild.mjs): still the initial load
for (const m of html.matchAll(/const P=(\[[^\]]*\])/g)) for (const h of JSON.parse(m[1])) initial.add(h.replace(/^\.?\//, ''));
for (const r of [...initial]) {
  if (!r.endsWith('.js') || !by[r]) continue;
  const src = readFileSync(join(DIST, r), 'utf8');
  for (const m of src.matchAll(/(?:^|;|\n)\s*import\s*(?:[^'"]*from\s*)?["']\.\/([^"']+\.js)["']/g)) initial.add('assets/' + m[1]);
}
// the scenario JSON is fetched at low priority after first paint; count it separately
initial.delete('data/flood-replay.json');
const init = [...initial].filter((r) => by[r]);
const initGz = init.reduce((a, r) => a + by[r].gz, 0);
console.log('  initial set: ' + init.map((r) => `${r} ${kb(by[r].gz)}`).join(', '));
check(initGz <= B.initial, `initial load ${kb(initGz)} gz (budget ${kb(B.initial)})`);

const nonAudio = files.filter((f) => !f.path.startsWith('audio/'));
const total = nonAudio.reduce((a, f) => a + f.gz, 0);
check(total <= B.total, `whole site ${kb(total)} gz excluding audio (budget ${kb(B.total)})`);

for (const f of files.filter((f) => f.path.endsWith('.js') && !init.includes(f.path))) check(f.gz <= B.lazy, `lazy ${f.path} ${kb(f.gz)} gz (budget ${kb(B.lazy)})`);
const data = by['data/flood-replay.json'];
check(data && data.raw <= B.data, `scenario data ${data ? kb(data.raw) : 'missing'} raw (budget ${kb(B.data)})`);
for (const f of files.filter((f) => f.path.startsWith('audio/'))) check(f.raw <= B.clip, `audio ${f.path} ${kb(f.raw)} (budget ${kb(B.clip)})`);

// Zero runtime third-party requests: no absolute http(s) asset URLs anywhere in what we ship.
const offenders = files
  .filter((f) => /\.(js|html|css|webmanifest|json)$/.test(f.path))
  .flatMap((f) =>
    [...readFileSync(join(DIST, f.path), 'utf8').matchAll(/https?:\/\/(?!localhost|127\.0\.0\.1|www\.w3\.org)[a-z0-9.-]+\.[a-z]{2,}[^"'`\s)<>]*/gi)]
      .map((m) => m[0])
      .filter((u) => !LINKS.has(u))
      .filter((u) => { try { return new URL(u).host !== OWN_HOST; } catch { return true; } })
      .map((u) => `${f.path}: ${u}`));
check(offenders.length === 0, `no third-party URLs in the bundle${offenders.length ? ':\n      ' + offenders.slice(0, 10).join('\n      ') : ''}`);
process.exit(fail ? 1 : 0);
