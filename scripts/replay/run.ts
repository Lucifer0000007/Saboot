// Replay R-1, step 5 (docs/REPLAY-METHOD.md): run the app's validation harness, fully offline, over the derived files, three ways:
// Rule A only (no river reach), Rule C only (no rain), and both. Writes qa/replay/<run>/report.{json,md} and
// qa/replay/summary.json with the raw counts the product may show. Run with the network blocked:
//   node --import ./scripts/replay/no-net.mjs --import ./scripts/ts-resolve.mjs scripts/replay/run.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runValidation, markdown, type Report } from '../validation/harness.ts';
import { METHOD } from './sample.ts';

const EVENTS = { 'R1-FLOOD': 'flood window, labels from the published extent', 'R1-DRY': 'quiet window, assumed not flooded' } as const;
const plotsHeader = 'plot_id,village,lat,lon,area_ha,crop,elev_above_river_m,low_lying,river_reach,area_no,class';
type Run = 'A' | 'C' | 'AC';

/** plots.csv with every river_reach removed (Rule A only). Rule C only also gets an empty rain file, in assemble(). */
export function plotsFor(plots: string, run: Run): string {
  if (run !== 'A') return plots;
  return plots
    .split('\n')
    .map((l) => {
      if (l.startsWith('#') || l.startsWith(plotsHeader) || !l.trim()) return l;
      const c = l.split(',');
      c[8] = '';
      return c.join(',');
    })
    .join('\n');
}

/** The input folder of one run. Everything is copied from derived/, only the files the run changes differ. */
function assemble(derived: string, runs: string, run: Run): string {
  const read = (f: string) => readFileSync(`${derived}/${f}`, 'utf8');
  const dir = `${runs}/${run}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/plots.csv`, plotsFor(read('plots.csv'), run));
  writeFileSync(`${dir}/rainfall.csv`, run === 'C' ? '# Rule C only: no rain input in this run\nstation_id,lat,lon,time_utc,rain_mm,interval_h\n' : read('rainfall.csv'));
  writeFileSync(`${dir}/river.csv`, read('river.csv'));
  writeFileSync(`${dir}/confirmed.csv`, read('confirmed.csv'));
  writeFileSync(`${dir}/PROVENANCE.json`, read('PROVENANCE.json'));
  return dir;
}

export interface Counts { caught: number; missed: number; falseAlarms: number; correctRejections: number; notEvaluable: number; noPlotData: number; points: number }
function counts(r: Report, event: string): Counts {
  const e = r.events.find((x) => x.id === event)!;
  const c = e.confusion;
  return { caught: c.tp, missed: c.fn, falseAlarms: c.fp, correctRejections: c.tn, notEvaluable: e.notEvaluable.length, noPlotData: e.noPlotData.length, points: e.villages.length };
}

export interface ReplaySummary {
  kind: 'saboot.replay-summary';
  v: 1;
  replay: string;
  /** made from a test fixture: never shown in the product */
  fixture: boolean;
  source: string;
  method: string;
  sample: Record<string, number>;
  assumptions: string[];
  ruleB: string;
  runs: Record<string, { rules: string[]; reportSha256: string; events: Record<string, Counts> }>;
}

/** Run the three variants over `derived`, write the reports under `out`, and return the summary (also written there). */
export function runReplay(derived: string, runs: string, out: string): ReplaySummary {
  const read = (f: string) => readFileSync(`${derived}/${f}`, 'utf8');
  const sample = JSON.parse(read('sample.json')) as { rainCells: unknown[]; areas: { area: number }[]; pointsWithRiverReach: number; taken: Record<string, number> };
  const prov = JSON.parse(read('PROVENANCE.json')) as { _fixture?: boolean };
  mkdirSync(out, { recursive: true });
  mkdirSync(runs, { recursive: true });
  writeFileSync(`${runs}/.gitignore`, '*\n');
  const summary: ReplaySummary = {
    kind: 'saboot.replay-summary',
    v: 1,
    replay: 'R-1',
    fixture: prov._fixture === true,
    source: 'Copernicus EMS EMSR838 (flood extent), ERA5 rain and GloFAS discharge through Open-Meteo',
    method: 'docs/REPLAY-METHOD.md',
    sample: { ...sample.taken, areas: sample.areas.length, rainCells: sample.rainCells.length, pointsWithRiverReach: sample.pointsWithRiverReach },
    assumptions: [
      'every point treated as low-lying for Rule A (an upper bound)',
      `river reach: within ${METHOD.reachKm} km of a river point, lag at ${METHOD.waveKmh} km/h`,
      'the danger level of a river point is the 90th percentile of its own baseline days, not an official level',
      'the quiet window is assumed not flooded, not confirmed',
    ],
    ruleB: 'not independently validated: the flood extent was itself made from radar, so scoring the radar rule against it would be circular',
    runs: {},
  };
  for (const run of ['A', 'C', 'AC'] as const) {
    const dir = assemble(derived, runs, run);
    const report = runValidation({ dir, overrides: { staleH: 24 } });
    if (report.errors.length) throw new Error(`run ${run}: ${report.errors.join(' | ')}`);
    mkdirSync(`${out}/${run}`, { recursive: true });
    writeFileSync(`${out}/${run}/report.json`, JSON.stringify(report, null, 2) + '\n');
    writeFileSync(`${out}/${run}/report.md`, markdown(report) + '\n');
    const byEvent = Object.fromEntries(Object.keys(EVENTS).map((e) => [e, counts(report, e)]));
    summary.runs[run] = { rules: run === 'AC' ? ['A', 'C'] : [run], reportSha256: report.reportSha256, events: byEvent };
    for (const [e, c] of Object.entries(byEvent)) console.log(`run ${run.padEnd(2)} ${e}: caught ${c.caught}, missed ${c.missed}, false alarms ${c.falseAlarms}, correct rejections ${c.correctRejections}, not evaluable ${c.notEvaluable}, points ${c.points}`);
  }
  writeFileSync(`${out}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
  console.log(`wrote ${out}/summary.json${summary.fixture ? ' (FIXTURE: never shown in the product)' : ''}`);
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runReplay('data/replay/derived', 'data/replay/runs', 'qa/replay');
