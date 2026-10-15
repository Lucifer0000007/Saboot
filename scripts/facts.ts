// Scenario facts: every number about the replay that copy, docs and tests quote, computed from the scenario file with
// the app's own model code (no number is typed in by hand). `npm run gen` writes:
//   src/generated/scenario-summary.ts   what the page shell needs before the data file has loaded
//   docs/scenario-facts.json            all facts, per rail and radar cadence (tests compare against a fresh computation)
//   docs/SCENARIO-FACTS.md              the same, readable
// then scripts/docs-facts.mjs refreshes the numbers inside the docs that quote them.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildModel, type Model } from '../src/sim/model.ts';
import { modelOptions } from '../src/sim/options.ts';
import { plotState } from '../src/sim/cohort.ts';
import { evidenceFor } from '../src/sim/evidence.ts';
import { metrics, pilotMetrics } from '../src/sim/metrics.ts';
import { reduce } from '../src/farmer/focus.ts';
import { RULE_VERSIONS } from '../src/sim/rules.ts';
import { RAILS, RELIEF, PMFBY, type Rail } from '../src/config.ts';
import type { ScenarioRaw } from '../src/sim/types.ts';

const R2 = (x: number) => Math.round(x * 100) / 100;
const R2n = (x: number | null) => (x === null ? null : R2(x));
const count = <T,>(xs: T[], f: (x: T) => string) => xs.reduce<Record<string, number>>((o, x) => { const k = f(x); o[k] = (o[k] ?? 0) + 1; return o; }, {});
const q = (xs: number[], p: number) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };

/** 3.25 -> "3 h 15 min", 0.5 -> "30 min", 68.75 -> "68 h 45 min". */
export function fmtHM(h: number): string {
  const m = Math.round(h * 60);
  const hh = Math.floor(m / 60), mm = m % 60;
  return hh ? (mm ? `${hh} h ${mm} min` : `${hh} h`) : `${mm} min`;
}

export function comboFacts(raw: ScenarioRaw, rail: Rail, cadence: 'demo' | 'slow') {
  const m: Model = buildModel(raw, modelOptions(rail, cadence));
  const H = raw.hours;
  const idle = reduce([], H); // what the dashboard shows when the judge has done nothing
  const states = m.plots.map((p) => plotState(m, p, H, idle));
  const k = metrics(m, states, H);
  const pm = pilotMetrics(m, states, H);
  const det = m.det.filter((d) => d.detected);
  const tta = det.map((d) => d.alertT! - d.eventT!);
  let tp = 0, fp = 0, fn = 0, tn = 0;
  const misses: string[] = [], falseAlarms: string[] = [];
  m.plots.forEach((p) => {
    const d = m.det[p.idx].detected, t = m.truth[p.idx];
    if (d && t) tp++; else if (d && !t) { fp++; falseAlarms.push(p.id); } else if (!d && t) { fn++; misses.push(`${p.id} ${p.crop}`); } else tn++;
  });
  const tiers = count(m.plots.map((_p, i) => evidenceFor(m, states[i], H)), (e) => e.tier);
  const fi = m.plots.findIndex((p) => p.id === raw.focus);
  const fd = m.det[fi];
  return {
    rail, cadence, windowHours: m.opts.windowHours,
    detected: det.length,
    rulesFired: { A: det.filter((d) => d.fired.includes('A')).length, B: det.filter((d) => d.fired.includes('B')).length, C: det.filter((d) => d.fired.includes('C')).length },
    onlyRule: { A: det.filter((d) => d.fired.length === 1 && d.fired[0] === 'A').length, B: det.filter((d) => d.fired.length === 1 && d.fired[0] === 'B').length, C: det.filter((d) => d.fired.length === 1 && d.fired[0] === 'C').length },
    multipleRules: det.filter((d) => d.fired.length > 1).length,
    eventSource: count(det, (d) => d.eventSource ?? 'none'),
    confidence: count(det, (d) => d.confidence ?? 'none'),
    eventToCall: { n: tta.length, minH: R2n(tta.length ? Math.min(...tta) : null), medianH: R2n(q(tta, 0.5)), p90H: R2n(q(tta, 0.9)), maxH: R2n(tta.length ? Math.max(...tta) : null) },
    clockLeftAtCallMedianH: R2n(tta.length ? m.opts.windowHours - q(tta, 0.5)! : null),
    firstTriggerT: Math.min(...det.map((d) => d.detectT!)),
    consistencyCheck: { note: 'against the generator\'s own synthetic ground truth: a consistency check, not a validation', tp, fp, fn, tn, precision: R2n(tp + fp ? tp / (tp + fp) : null), recall: R2n(tp + fn ? tp / (tp + fn) : null), misses, falseAlarms },
    pilot: {
      onList: pm.onList, truthFlooded: pm.truthFlooded, truthWithEvidence: pm.truthWithEvidence,
      eventToEvidenceMedianH: R2n(pm.eventToEvidence.median), eventToEvidenceP90H: R2n(pm.eventToEvidence.p90),
      objections: pm.objections, objectionsAnswered: pm.objectionsAnswered, objectionRatePct: pm.objectionRate === null ? null : Math.round(pm.objectionRate * 100),
    },
    cohortJudgeIdle: { alerted: k.alerted, floodEvents: k.floodEvents, filedInWindow: k.filedInWindow, filedLate: k.filedLate, missed: k.missed },
    stages: count(states, (s) => s.stage),
    tiers,
    hail: { prompted: k.hailPrompted, replied: raw.plots.filter((p) => p.hailYes).length },
    focus: {
      id: raw.focus, name: raw.plots[fi].name, lang: raw.plots[fi].lang, village: m.plots[fi].village,
      rainCrossT: fd.crossT, riverCrossT: fd.riverCrossT, detectT: fd.detectT, eventT: fd.eventT, alertT: fd.alertT, deadlineT: fd.deadlineT,
      fired: fd.fired.join('+'), eventSource: fd.eventSource, confidence: fd.confidence,
      eventToCallH: R2(fd.alertT! - fd.eventT!), hoursLeftAtAlertH: R2(fd.deadlineT! - fd.alertT!),
    },
  };
}

export type ComboFacts = ReturnType<typeof comboFacts>;

export function computeFacts(raw: ScenarioRaw, json: string) {
  const m0 = buildModel(raw, modelOptions());
  const combos: Record<string, ComboFacts> = {};
  for (const rail of RAILS) for (const cadence of ['demo', 'slow'] as const) combos[`${rail}-${cadence}`] = comboFacts(raw, rail, cadence);
  const d = combos['relief-demo'];
  return {
    generatedBy: 'scripts/gen-scenario.ts (npm run gen). Do not edit by hand.',
    rulesVersion: RULE_VERSIONS,
    file: { name: 'public/data/flood-replay.json', bytes: Buffer.byteLength(json), sha256: createHash('sha256').update(json).digest('hex') },
    scenario: {
      name: raw.name, seed: raw.seed, hours: raw.hours, t0: raw.t0,
      plots: raw.plots.length, villages: raw.map.villages.map((v) => v.name), rainGauges: raw.stations.length, riverGauges: raw.river?.gauges.length ?? 0,
      radarDemoCadenceH: raw.sar[1] - raw.sar[0], radarSlowCadenceH: raw.sarSlow ? raw.sarSlow[1] - raw.sarSlow[0] : null,
      crops: count(raw.plots, (p) => p.crop), languages: count(raw.plots, (p) => p.lang), personas: count(raw.plots, (p) => p.b[0]),
      terrain: count(m0.plots, (p) => ['low', 'mid', 'high'][p.terrain]),
      floodedInTruth: m0.truth.filter(Boolean).length,
      riverReach: count(m0.plots, (p) => p.riverReach ?? 'out of reach'),
      baselineWetPlots: m0.plots.filter((p) => p.baselineWet).length,
      thresholds: raw.thresholds, river: raw.river ? { reachM: raw.river.reachM, lowReachM: raw.river.lowReachM, adjacentM: raw.river.adjacentM, waveKmh: raw.river.waveKmh, maxLagH: raw.river.maxLagH, latencyH: raw.river.latencyH, gauges: raw.river.gauges.map((g) => ({ id: g.id, unit: g.unit, danger: g.danger })) } : null,
      baselineWet: raw.baselineWet,
    },
    parameters: { relief: { captureSoonHours: RELIEF.captureSoonHours, damageShareThreshold: RELIEF.damageShareThreshold, perAcreAmount: RELIEF.perAcreAmount, acreageCapHa: RELIEF.acreageCapHa, publishAtHour: RELIEF.publishAtHour, objectionWindowHours: RELIEF.objectionWindowHours }, pmfby: { windowHours: PMFBY.windowHours, state: PMFBY.state } },
    combos,
    /** Display strings for docs: the default view is the relief rail with the demo cadence. */
    text: {
      medianEventToCall: fmtHM(d.eventToCall.medianH ?? 0),
      p90EventToCall: fmtHM(d.eventToCall.p90H ?? 0),
      focusEventToCall: fmtHM(d.focus.eventToCallH),
      focusHoursLeftPmfby: fmtHM(combos['pmfby-demo'].focus.hoursLeftAtAlertH),
      focusHoursLeftRelief: fmtHM(d.focus.hoursLeftAtAlertH),
      medianEventToCallSlow: fmtHM(combos['relief-slow'].eventToCall.medianH ?? 0),
    },
  };
}

export type Facts = ReturnType<typeof computeFacts>;

function markdown(f: Facts): string {
  const d = f.combos['relief-demo'];
  const row = (k: string, v: string | number) => `| ${k} | ${v} |`;
  const combos = Object.values(f.combos).map((c) =>
    `| ${c.rail} | ${c.cadence} | ${c.detected} | ${c.rulesFired.A} / ${c.rulesFired.B} / ${c.rulesFired.C} | ${c.eventToCall.medianH} h | ${c.cohortJudgeIdle.filedInWindow} of ${c.cohortJudgeIdle.floodEvents} | ${c.consistencyCheck.tp} / ${c.consistencyCheck.fp} / ${c.consistencyCheck.fn} |`).join('\n');
  return `# Scenario facts (generated)

Generated by \`npm run gen\` from \`public/data/flood-replay.json\`. **Simulated numbers**: one seeded replay, scripted farmer behaviour,
a synthetic ground truth made by the same generator. The precision and recall below are a **consistency check, not a validation**.
Do not edit by hand; every number in the docs that quotes the replay is refreshed from this file.

| Scenario | |
|---|---|
${row('Seed, length', `${f.scenario.seed}, ${f.scenario.hours} h from ${f.scenario.t0}`)}
${row('Plots, villages, rain gauges, river gauges', `${f.scenario.plots}, ${f.scenario.villages.length}, ${f.scenario.rainGauges}, ${f.scenario.riverGauges}`)}
${row('Radar cadence, demo and slower (simulated)', `${f.scenario.radarDemoCadenceH} h and ${f.scenario.radarSlowCadenceH} h`)}
${row('Plots flooded in the synthetic truth', f.scenario.floodedInTruth)}
${row('Plots in reach of the river rule', JSON.stringify(f.scenario.riverReach))}
${row('Paddy plots (standing water in season)', f.scenario.baselineWetPlots)}

## Default view: relief rail, demo radar cadence

| Result (simulated) | Value |
|---|---|
${row('Plots detected', `${d.detected} of ${f.scenario.plots}`)}
${row('Rules fired: A rain + terrain, B radar, C river', `${d.rulesFired.A}, ${d.rulesFired.B}, ${d.rulesFired.C}`)}
${row('Detected by one rule only: A, B, C', `${d.onlyRule.A}, ${d.onlyRule.B}, ${d.onlyRule.C}`)}
${row('Event to call: median, p90, max', `${d.eventToCall.medianH} h, ${d.eventToCall.p90H} h, ${d.eventToCall.maxH} h`)}
${row('Demo farmer P-04: event to call', `${f.text.focusEventToCall}`)}
${row('Consistency check (not validation): TP, FP, FN', `${d.consistencyCheck.tp}, ${d.consistencyCheck.fp}, ${d.consistencyCheck.fn}`)}
${row('Consistency check: precision, recall', `${d.consistencyCheck.precision}, ${d.consistencyCheck.recall}`)}
${row('Misses', d.consistencyCheck.misses.join('; ') || 'none')}
${row('False alarms', d.consistencyCheck.falseAlarms.join('; ') || 'none')}
${row('Hail prompts sent, replies', `${d.hail.prompted}, ${d.hail.replied}`)}
${row('Truly flooded plots with evidence on file', `${d.pilot.truthWithEvidence} of ${d.pilot.truthFlooded}`)}
${row('Event to evidence on file: median, p90', `${d.pilot.eventToEvidenceMedianH} h, ${d.pilot.eventToEvidenceP90H} h`)}
${row('Scripted objections, answered by the officer', `${d.pilot.objections} of ${d.pilot.onList} listed entries, ${d.pilot.objectionsAnswered} answered`)}
${row('Evidence tiers at the end', JSON.stringify(d.tiers))}

## All views

| Rail | Radar cadence | Detected | Rules A / B / C | Median event to call | Filed in window, judge idle | TP / FP / FN |
|---|---|---|---|---|---|---|
${combos}
`;
}

export async function writeGenerated(raw: ScenarioRaw, json: string) {
  const f = computeFacts(raw, json);
  mkdirSync('src/generated', { recursive: true });
  writeFileSync('src/generated/scenario-summary.ts', `// GENERATED by scripts/gen-scenario.ts (npm run gen). Do not edit by hand: the values are read from the scenario.
// The static page shell and copy that mention the scenario use these before the data file has loaded.
export const SCENARIO = {
  seed: ${raw.seed},
  hours: ${raw.hours},
  t0: '${raw.t0}',
  plots: ${raw.plots.length},
  villages: ${raw.map.villages.length},
  rainGauges: ${raw.stations.length},
  riverGauges: ${raw.river?.gauges.length ?? 0},
  radarCadenceHours: ${f.scenario.radarDemoCadenceH},
  radarSlowCadenceHours: ${f.scenario.radarSlowCadenceH},
} as const;
`);
  writeFileSync('docs/scenario-facts.json', JSON.stringify(f, null, 2) + '\n');
  writeFileSync('docs/SCENARIO-FACTS.md', markdown(f));
  // @ts-expect-error plain JS module
  const { updateDocs } = await import('./docs-facts.mjs');
  const changed = updateDocs({ check: false });
  console.log(`facts: docs/scenario-facts.json, docs/SCENARIO-FACTS.md, src/generated/scenario-summary.ts; ${changed.length} doc(s) refreshed`);
}
