// Run the real-data validation harness.
//   npm run validate:real                       reads data/real/, writes qa/validation/report.json and report.md
//   npm run validate:real -- --publish          also writes public/data/validation-status.json (REAL reports only)
//   npm run validate:fixture                    runs the synthetic fixture under tests/ to prove the harness works
// If data/real/ holds no CSV files nothing is fetched, scraped or invented: the run stops and says what to put there.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runValidation, markdown, statusFrom, FILES, type Params } from './harness.ts';

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const val = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const numArg = (n: string) => { const v = val(n); return v === undefined ? undefined : Number(v); };

const fixture = flag('--fixture');
const dir = val('--data') ?? (fixture ? 'tests/fixtures/validation' : 'data/real');
const out = val('--out') ?? (fixture ? 'qa/validation/fixture' : 'qa/validation');

const present = existsSync(dir) ? readdirSync(dir).filter((f) => (FILES as readonly string[]).includes(f)) : [];
if (!present.length) {
  console.log(`No input files in ${dir}.`);
  console.log('Nothing was fetched, scraped or invented. Put the four CSV files and PROVENANCE.json there; the formats and some public sources to check are in docs/VALIDATION.md.');
  console.log('To see the harness run on a clearly labelled synthetic fixture instead: npm run validate:fixture');
  process.exit(0);
}

const overrides: Partial<Params> = {};
for (const [flagName, key] of [['--rain24', 'rain24'], ['--rain-heavy', 'rainHeavy'], ['--low-elev-m', 'lowElevM'], ['--max-lag-h', 'maxLagH'], ['--latency-h', 'latencyH'], ['--max-station-km', 'maxStationKm'], ['--stale-h', 'staleH']] as const) {
  const v = numArg(flagName);
  if (v !== undefined) overrides[key] = v;
}
const report = runValidation({ dir, fixture, overrides });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
writeFileSync(join(out, 'report.md'), markdown(report) + '\n');

console.log(`${report.fixture ? 'FIXTURE run (synthetic, not validation)' : 'Validation run'}: ${report.events.length} event(s), ${report.total.villagesLabelled} village(s) scored`);
console.log(`  TP ${report.total.confusion.tp} · FP ${report.total.confusion.fp} · FN ${report.total.confusion.fn} · TN ${report.total.confusion.tn} · precision ${report.total.precision ?? 'n/a'} · recall ${report.total.recall ?? 'n/a'}`);
for (const e of report.errors) console.log(`  ! ${e}`);
console.log(`  wrote ${join(out, 'report.json')} and ${join(out, 'report.md')}`);

if (flag('--publish')) {
  try {
    const status = statusFrom(report);
    writeFileSync('public/data/validation-status.json', JSON.stringify(status) + '\n');
    console.log('  published public/data/validation-status.json (the product will show these numbers with their limits)');
  } catch (e) {
    console.error(`  ✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
if (report.errors.length) process.exitCode = 2;
