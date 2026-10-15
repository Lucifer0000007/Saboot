// The deterministic event rules, as pure functions of plain numbers. The app (model.ts) and the real-data validation
// harness (scripts/validation) call this same code. No imports, no DOM, no randomness, no clock.
//
// Principles: rules own event detection and deadlines; Saboot never decides a claim. Every rule returns the time it
// fired, and the event clock starts at the EARLIEST qualifying signal, so when unsure the farmer gets less time,
// never more. All hours are "hours since T0" (the start of the replay or of the real series).

/** Bump a version when a rule's logic changes; exports and reports carry these as provenance. */
export const RULE_VERSIONS = { A: '1', B: '2', C: '1' } as const;

export interface RuleThresholds {
  /** mm of rain in 24 h that starts the event clock when a gauge crosses it (an IMD-style "heavy rain" line). */
  rain24: number;
  /** mm of rain in 24 h that, on a low-lying plot, fires Rule A. */
  rainHeavy: number;
  /** Rule B fires when the radar-observed water above the expected baseline reaches this share of the plot. */
  floodFrac: number;
  /** Below this share of the plot a radar pass counts as "clear". */
  clearFrac: number;
}

/** Hours from a radar pass to its processed flood map. */
export const SAR_LATENCY_H = 1;

// ---- Rule A: heavy rain on low-lying land ----------------------------------------------------------------------
export interface RuleAResult {
  /** First hour the plot's nearest gauge crossed the rain24 line (starts the event clock if it came before detection). */
  crossT: number | null;
  /** Hour Rule A fired: 24 h rain at the nearest gauge reached rainHeavy and the plot is low-lying. */
  fireT: number | null;
}

/** @param r24 trailing 24 h rainfall (mm) at the plot's nearest gauge, one value per hour */
export function ruleA(r24: ArrayLike<number>, lowLying: boolean, th: Pick<RuleThresholds, 'rain24' | 'rainHeavy'>): RuleAResult {
  let crossT: number | null = null;
  let fireT: number | null = null;
  for (let h = 0; h < r24.length; h++) {
    if (crossT === null && r24[h] >= th.rain24) crossT = h;
    if (fireT === null && lowLying && r24[h] >= th.rainHeavy) fireT = h;
  }
  return { crossT, fireT };
}

// ---- Rule B: radar change against the expected baseline -----------------------------------------------------------
export interface RuleBInput {
  /** Hours of the radar passes, ascending. The first is the baseline pass. */
  passes: readonly number[];
  /** Share of the plot seen as water at a pass (0..1). */
  observed: (pass: number) => number;
  /**
   * Share of water this plot is expected to show anyway: 0 for crops that stand dry, the standing-water share for
   * paddy in the season it is flooded on purpose. Radar cannot tell irrigation water from flood water, so only the
   * water ABOVE this baseline counts. Unvalidated design decision.
   */
  expected: number;
}
export interface RuleBResult {
  /** Hour Rule B fired (pass + processing latency), or null. */
  fireT: number | null;
  /** Last pass at which the plot was still clear, the conservative start of the event window. */
  lastClear: number | null;
  /** False when the baseline pass already showed water above the expected level: the change test is not valid. */
  baselineClear: boolean;
}

/** Radar-observed water above the expected baseline, rescaled to 0..1 (equal to the observation when nothing is expected). */
export const excess = (observed: number, expected: number): number =>
  expected > 0 ? Math.max(0, (observed - expected) / (1 - expected)) : observed;

export function ruleB(i: RuleBInput, th: Pick<RuleThresholds, 'floodFrac' | 'clearFrac'>, latencyH: number = SAR_LATENCY_H): RuleBResult {
  if (!i.passes.length) return { fireT: null, lastClear: null, baselineClear: false };
  const ex = (pass: number) => excess(i.observed(pass), i.expected);
  if (!(ex(i.passes[0]) < th.clearFrac)) return { fireT: null, lastClear: null, baselineClear: false };
  let lastClear: number | null = null;
  for (const pass of i.passes) {
    if (ex(pass) >= th.floodFrac) return { fireT: pass + latencyH, lastClear, baselineClear: true };
    if (ex(pass) < th.clearFrac) lastClear = pass;
  }
  return { fireT: null, lastClear, baselineClear: true };
}

// ---- Rule C: river stage or dam release ---------------------------------------------------------------------------
export interface GaugeSeries {
  id: string;
  /** 'stage' (river level) or 'release' (dam discharge): both work the same way, a series against a danger level. */
  kind: 'stage' | 'release';
  /** One value per hour, in the gauge's own unit. */
  series: ArrayLike<number>;
  /** Danger level in the same unit. A scenario parameter in the simulation, an official level in real data. */
  danger: number;
}
export interface RuleCInput {
  /** Gauges upstream of, or adjacent to, the plot, with the hours the flood wave needs to travel to it. Empty when the
   *  plot is neither riverside nor low-lying within reach. */
  reach: readonly { gauge: string; lagH: number }[];
}
export interface RuleCResult {
  /** Hour the chosen gauge first reached its danger level: the earliest qualifying signal, where the clock starts. */
  crossT: number | null;
  /** Hour Rule C fired (crossing + processing latency). */
  fireT: number | null;
  gauge: string | null;
  lagH: number | null;
}
export interface RuleCThresholds {
  /** Plots whose travel lag from the gauge exceeds this are out of reach. */
  maxLagH: number;
  /** Hours from a gauge reading to the rule being evaluated. */
  latencyH: number;
}

export function ruleC(i: RuleCInput, gauges: readonly GaugeSeries[], th: RuleCThresholds): RuleCResult {
  let best: RuleCResult = { crossT: null, fireT: null, gauge: null, lagH: null };
  for (const r of i.reach) {
    if (r.lagH > th.maxLagH) continue;
    const g = gauges.find((x) => x.id === r.gauge);
    if (!g) continue;
    let cross: number | null = null;
    for (let h = 0; h < g.series.length; h++) {
      if (g.series[h] >= g.danger) { cross = h; break; }
    }
    if (cross === null) continue;
    if (best.crossT === null || cross < best.crossT) best = { crossT: cross, fireT: cross + th.latencyH, gauge: g.id, lagH: r.lagH };
  }
  return best;
}

// ---- Combining the rules ----------------------------------------------------------------------------------------
export type RuleId = 'A' | 'B' | 'C';
export type EventSource = 'rain' | 'river' | 'radar-pass' | 'detection';
export type Confidence = 'high' | 'medium' | 'low';

export interface Combined {
  detected: boolean;
  fired: RuleId[];
  detectT: number | null;
  eventT: number | null;
  eventSource: EventSource | null;
  confidence: Confidence | null;
}

/**
 * Detection is the earliest firing rule. The event clock starts at the earliest qualifying signal that came before
 * detection: the rain crossing at the nearest gauge, or the river reaching its danger level. With neither, the last
 * clear radar pass (the water arrived somewhere after it), and failing that the detection itself. Never later.
 *
 * Confidence: high when at least two independent rules fired; low when only the radar rule fired on a crop that
 * normally shows water (it cannot tell irrigation from flood); medium otherwise.
 */
export function combine(a: RuleAResult, b: RuleBResult, c: RuleCResult, baselineWetCrop: boolean): Combined {
  const fired: RuleId[] = [];
  const cands: number[] = [];
  if (a.fireT !== null) { fired.push('A'); cands.push(a.fireT); }
  if (b.fireT !== null) { fired.push('B'); cands.push(b.fireT); }
  if (c.fireT !== null) { fired.push('C'); cands.push(c.fireT); }
  if (!cands.length) return { detected: false, fired, detectT: null, eventT: null, eventSource: null, confidence: null };
  const detectT = Math.min(...cands);
  const signals: [number, EventSource][] = [];
  if (a.crossT !== null && a.crossT <= detectT) signals.push([a.crossT, 'rain']);
  if (c.crossT !== null && c.crossT <= detectT) signals.push([c.crossT, 'river']);
  let eventT = detectT;
  let eventSource: EventSource = 'detection';
  if (signals.length) {
    signals.sort((x, y) => x[0] - y[0]);
    [eventT, eventSource] = signals[0];
  } else if (b.lastClear !== null) {
    eventT = b.lastClear;
    eventSource = 'radar-pass';
  }
  const confidence: Confidence = fired.length >= 2 ? 'high' : fired[0] === 'B' && baselineWetCrop ? 'low' : 'medium';
  return { detected: true, fired, detectT, eventT, eventSource, confidence };
}
