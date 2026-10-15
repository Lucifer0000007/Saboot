// Refresh the scenario numbers quoted in the docs from docs/scenario-facts.json, so they cannot go stale.
//   node scripts/docs-facts.mjs           rewrite the numbers in place
//   node scripts/docs-facts.mjs --check   exit 1 if any doc is out of date (used by verify.sh)
// A quoted number is written <!--f:PATH|FORMAT-->value<!--/f--> (an HTML comment: invisible when rendered).
//   PATH    dot path into the facts file, for example combos.relief-demo.eventToCall.medianH
//   FORMAT  h (hours as "3 h 15 min"), r2 (two decimals), pct (0.91 as "91%"), int, str (as is; the default)
// A table or paragraph can also be generated whole: <!--facts:NAME:start--> ... <!--facts:NAME:end-->, NAME one of BLOCKS.
// Files that do not exist (docs/deck-brief.md is local-only and untracked) are skipped.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILES = ['README.md', 'docs/SABOOT-SPEC.md', 'docs/PILOT-PLAN.md', 'docs/BUYER-ONE-PAGER.md', 'docs/EXISTING-SOLUTIONS.md', 'docs/VALIDATION.md', 'docs/EVIDENCE-FORMAT.md', 'docs/PRIVACY-AND-CONSENT.md'];

const hm = (h) => {
  const m = Math.round(h * 60);
  const a = Math.floor(m / 60), b = m % 60;
  return a ? (b ? `${a} h ${b} min` : `${a} h`) : `${b} min`;
};
const FORMATS = {
  h: (v) => hm(Number(v)),
  r2: (v) => Number(v).toFixed(2),
  pct: (v) => `${Math.round(Number(v) * 100)}%`,
  int: (v) => String(Math.round(Number(v))),
  str: (v) => String(v),
};

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Whole blocks generated from the facts. */
const BLOCKS = {
  'scenario-table': (f) => {
    const s = f.scenario;
    return [
      '| Part | In this demo |',
      '|---|---|',
      `| Plots, villages | ${s.plots} synthetic plots in ${s.villages.length} villages, generated names, fictional district |`,
      `| Rain gauges | ${s.rainGauges} synthetic gauges with hourly series (seeded) |`,
      `| River gauges | ${s.riverGauges} synthetic river-stage gauges with hourly series (seeded, from the same simulated flood) |`,
      `| Radar | a pass every ${s.radarDemoCadenceH} h in the demo (a simulated cadence), or every ${s.radarSlowCadenceH} h in the slower option |`,
      `| Length | ${s.hours} h from the fictional start ${s.t0.slice(0, 10)} |`,
    ].join('\n');
  },
  'results-table': (f) => {
    const d = f.combos['relief-demo'];
    const sl = f.combos['relief-slow'];
    return [
      '| Result (simulated) | Value |',
      '|---|---|',
      `| Plots detected | ${d.detected} of ${f.scenario.plots} |`,
      `| Rules fired: A rain + terrain, B radar, C river | ${d.rulesFired.A}, ${d.rulesFired.B}, ${d.rulesFired.C} |`,
      `| Event to call: median, p90 | ${hm(d.eventToCall.medianH)}, ${hm(d.eventToCall.p90H)} |`,
      `| Demo farmer ${d.focus.id}: event to call | ${hm(d.focus.eventToCallH)} |`,
      `| Flooded plots with evidence on file (synthetic truth) | ${d.pilot.truthWithEvidence} of ${d.pilot.truthFlooded} |`,
      `| Event to evidence on file: median | ${hm(d.pilot.eventToEvidenceMedianH)} |`,
      `| Scripted objections, answered by the officer | ${d.pilot.objections} of ${d.pilot.onList} listed entries, ${d.pilot.objectionsAnswered} answered |`,
      `| Slower radar cadence: median event to call, flooded plots never alerted | ${hm(sl.eventToCall.medianH)}, ${sl.consistencyCheck.fn} of ${sl.pilot.truthFlooded} |`,
      `| Consistency check, not validation: precision, recall | ${d.consistencyCheck.precision}, ${d.consistencyCheck.recall} |`,
    ].join('\n');
  },
};

export function renderDoc(text, facts) {
  let out = text.replace(/<!--f:([^|>]+?)(?:\|(\w+))?-->([\s\S]*?)<!--\/f-->/g, (_all, path, fmt) => {
    const v = get(facts, path.trim());
    if (v === undefined || v === null) throw new Error(`docs-facts: no value at "${path}"`);
    return `<!--f:${path}${fmt ? '|' + fmt : ''}-->${(FORMATS[fmt || 'str'] ?? FORMATS.str)(v)}<!--/f-->`;
  });
  out = out.replace(/<!--facts:([\w-]+):start-->[\s\S]*?<!--facts:\1:end-->/g, (_all, name) => {
    if (!BLOCKS[name]) throw new Error(`docs-facts: unknown block "${name}"`);
    return `<!--facts:${name}:start-->\n${BLOCKS[name](facts)}\n<!--facts:${name}:end-->`;
  });
  return out;
}

/** Returns the list of files that changed (or, with check, would change). */
export function updateDocs({ check }) {
  if (!existsSync('docs/scenario-facts.json')) throw new Error('docs/scenario-facts.json is missing: run npm run gen');
  const facts = JSON.parse(readFileSync('docs/scenario-facts.json', 'utf8'));
  const changed = [];
  for (const f of FILES) {
    if (!existsSync(f)) continue;
    const old = readFileSync(f, 'utf8');
    const next = renderDoc(old, facts);
    if (next !== old) {
      changed.push(f);
      if (!check) writeFileSync(f, next);
    }
  }
  return changed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes('--check');
  const changed = updateDocs({ check });
  if (check && changed.length) {
    console.error(`✗ docs quote stale scenario numbers: ${changed.join(', ')}. Run: node scripts/docs-facts.mjs`);
    process.exit(1);
  }
  console.log(check ? '✓ docs quote current scenario numbers' : `docs-facts: ${changed.length} file(s) refreshed`);
}
