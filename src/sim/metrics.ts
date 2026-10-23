// Replay metrics (synthetic). Used by the impact panel and the detection explainer.
import type { Model } from './model';
import type { PlotState } from './cohort';

export const q = (xs: number[], p: number) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))];
};

/**
 * Hours from the start of the event to the voice call, over every plot the rules alerted (the whole replay).
 * The median is the typical farmer; the demo farmer is one plot among them, and is not the typical case.
 */
export function eventToCall(m: Model) {
  const tta = m.det.filter((d) => d.detected && d.alertT !== null && d.eventT !== null).map((d) => d.alertT! - d.eventT!);
  return { n: tta.length, min: tta.length ? Math.min(...tta) : null, median: q(tta, 0.5), p90: q(tta, 0.9), max: tta.length ? Math.max(...tta) : null };
}

export interface Metrics {
  alerted: number;
  ttaMedian: number | null;
  ttaP90: number | null;
  ttaMax: number | null;
  tta: number[];
  floodEvents: number; // alerted flood events, excluding "no damage" replies
  filedInWindow: number;
  filedLate: number;
  missed: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number | null;
  recall: number | null;
  hailPrompted: number;
  hailYes: number;
  byLang: Record<string, number>;
}

export function metrics(m: Model, states: PlotState[], t: number): Metrics {
  const flood = states.filter((s) => s.det.detected && s.times.alertT !== null && s.times.alertT <= t);
  const tta = flood.map((s) => s.times.alertT! - s.times.eventT!);
  const ev = flood.filter((s) => s.times.noDamageT === null || s.times.noDamageT > t);
  const filedInWindow = ev.filter((s) => s.times.fileT !== null && s.times.fileT <= t && s.times.fileT <= s.times.deadlineT!).length;
  const filedLate = ev.filter((s) => s.times.fileT !== null && s.times.fileT <= t && s.times.fileT > s.times.deadlineT!).length;
  // no evidence captured yet and the window has passed, so with `filedInWindow` and `filedLate` the three never count a plot twice
  const missed = ev.filter((s) => s.times.deadlineT! <= t && (s.times.captureT === null || s.times.captureT > t)).length;
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const p of m.plots) {
    const d = m.det[p.idx];
    const detectedByNow = d.detected && d.detectT! <= t;
    const truth = m.truth[p.idx];
    if (detectedByNow && truth) tp++;
    else if (detectedByNow && !truth) fp++;
    else if (!detectedByNow && truth) fn++;
    else tn++;
  }
  const hail = states.filter((s) => s.times.hail && s.times.alertT! <= t);
  const byLang: Record<string, number> = {};
  for (const s of flood) byLang[s.plot.lang] = (byLang[s.plot.lang] ?? 0) + 1;
  return {
    alerted: flood.length,
    ttaMedian: q(tta, 0.5), ttaP90: q(tta, 0.9), ttaMax: tta.length ? Math.max(...tta) : null, tta,
    floodEvents: ev.length, filedInWindow, filedLate, missed,
    tp, fp, fn, tn,
    precision: tp + fp ? tp / (tp + fp) : null,
    recall: tp + fn ? tp / (tp + fn) : null,
    hailPrompted: hail.length,
    hailYes: hail.filter((s) => s.times.captureT !== null && s.times.captureT <= t).length,
    byLang,
  };
}

/**
 * What a pilot would measure, computed on the replay. SIMULATED: the "truth" is the generator's own flood, the farmer
 * behaviour is scripted, and nothing here is a forecast. Every figure has one plain definition, shown beside it.
 */
export interface PilotMetrics {
  /** Plots the rules found an event for, whose farmer has not answered "no damage". */
  onList: number;
  /** Plots the synthetic truth flooded, and how many of them have evidence received (and sealed) by t. */
  truthFlooded: number;
  truthWithEvidence: number;
  /** Hours from the start of the event to the evidence being received, over rule-found plots with evidence by t. */
  eventToEvidence: { n: number; median: number | null; p90: number | null };
  /** Relief rail: the officer's draft list is published (outside Saboot) from `publishAtHour`; null before that. */
  published: boolean;
  objections: number;
  /** Objections the officer has answered, outside Saboot (Saboot shows only that a response came, never what it said). */
  objectionsAnswered: number;
  objectionRate: number | null;
}

export function pilotMetrics(m: Model, states: PlotState[], t: number): PilotMetrics {
  const live = states.filter((s) => s.det.detected && s.times.alertT !== null && s.times.alertT <= t && (s.times.noDamageT === null || s.times.noDamageT > t));
  const withEv = states.filter((s) => s.det.detected && s.times.syncT !== null && s.times.syncT <= t && s.times.eventT !== null);
  const e2e = withEv.map((s) => s.times.syncT! - s.times.eventT!);
  const flooded = states.filter((s) => m.truth[s.plot.idx]);
  const published = m.opts.rail === 'relief' && t >= m.opts.publishAtHour;
  const objs = states.filter((s) => s.objection);
  return {
    onList: live.length,
    truthFlooded: flooded.length,
    truthWithEvidence: flooded.filter((s) => s.times.syncT !== null && s.times.syncT <= t).length,
    eventToEvidence: { n: e2e.length, median: q(e2e, 0.5), p90: q(e2e, 0.9) },
    published,
    objections: objs.length,
    objectionsAnswered: objs.filter((s) => s.objection!.responded).length,
    objectionRate: published && live.length ? objs.length / live.length : null,
  };
}
