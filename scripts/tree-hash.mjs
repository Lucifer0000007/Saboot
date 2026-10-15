// Prints a hash of every source input, so `verify.sh --hook` can skip when nothing changed since a pass.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src', 'scripts', 'tests', 'public', 'index.html', 'package.json', 'vite.config.ts', 'playwright.config.ts', 'verify.sh', 'biome.json'];
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((n) => walk(join(p, n))) : [p]);
const h = createHash('sha256');
for (const r of ROOTS) if (existsSync(r)) for (const f of walk(r)) h.update(f).update(readFileSync(f));
console.log(h.digest('hex'));
