// {{VERIFY: ...}} markers: every real-world claim in the UI carries one in the source until a person has
// checked it. `npm run markers` lists them; `--strict` exits 1 while any remain (used by npm run deploy);
// `--readme` rewrites the marker list between <!-- markers:start --> and <!-- markers:end --> in README.md.
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN = ['src', 'index.html', 'public/manifest.webmanifest'];
const RE = /\{\{VERIFY:\s*([^}]*?)\s*\}\}/g;

function walk(p) {
  const s = statSync(p);
  if (!s.isDirectory()) return [p];
  return readdirSync(p).flatMap((n) => walk(join(p, n)));
}

export function listMarkers() {
  const out = [];
  for (const entry of SCAN) {
    const abs = join(ROOT, entry);
    if (!existsSync(abs)) continue;
    for (const f of walk(abs).filter((x) => /\.(tsx?|mjs|js|css|html|json|webmanifest)$/.test(x))) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((l, i) => {
        for (const m of l.matchAll(RE)) out.push({ file: relative(ROOT, f).replace(/\\/g, '/'), line: i + 1, text: m[1] });
      });
    }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ms = listMarkers();
  const args = process.argv.slice(2);
  if (args.includes('--readme')) {
    const p = join(ROOT, 'README.md');
    const md = readFileSync(p, 'utf8');
    const rows = ms.length
      ? ['| # | Where | What to check, and where |', '|---|---|---|', ...ms.map((m, i) => `| ${i + 1} | \`${m.file}:${m.line}\` | ${m.text.replace(/\|/g, '\\|')} |`)]
      : ['No markers remain.'];
    const next = md.replace(/<!-- markers:start -->[\s\S]*?<!-- markers:end -->/, `<!-- markers:start -->\n${rows.join('\n')}\n<!-- markers:end -->`);
    writeFileSync(p, next);
    console.log(`README.md: ${ms.length} marker(s) listed`);
  } else {
    for (const m of ms) console.log(`${m.file}:${m.line}  ${m.text}`);
    console.log(ms.length ? `\n${ms.length} {{VERIFY}} marker(s) remain.` : 'No {{VERIFY}} markers remain.');
  }
  if (args.includes('--strict') && ms.length) {
    console.error('\n✗ Refusing to deploy: resolve every {{VERIFY}} marker first (check the claim, fix the copy and its hi/pa translation, delete the marker).');
    process.exit(1);
  }
}
