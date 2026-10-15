// Plausibility breakdown → evidence tier. Transparent weights, explicit uncertainty.
// This is an EVIDENCE TIER for prioritising human review — never a claim decision, never an eligibility decision.
import { sarExcess, TALL_CROPS, type Model } from './model';
import { SAR_LATENCY_H } from './rules';
import type { PlotState } from './cohort';

export type Tier = 'supported' | 'partial' | 'insufficient' | 'none';
export type FactorId = 'rain' | 'river' | 'terrain' | 'flood' | 'photos' | 'integrity';

export interface Factor {
  id: FactorId;
  label: string;
  weight: number;
  value: number; // 0..1
  unc: number; // ± on value
  detail: string;
}

export interface Evidence {
  factors: Factor[];
  score: number;
  lo: number;
  hi: number;
  tier: Tier;
  /** Caveats the reader must see next to the factors (for example paddy in the standing-water season). */
  notes: string[];
  /** Estimated share of the plot under water above what the crop shows anyway (radar, 0..1) and its ±. Not crop damage. */
  floodShare: number;
  floodShareUnc: number;
}

export const TIER_RULE = { supportedLo: 0.6, insufficientHi: 0.45 };

/**
 * UNCALIBRATED scenario parameters (docs/SABOOT-SPEC.md, section 15). Not fitted to any claims data.
 * BASE is the original five-factor model. A plot the river can reach adds the river factor at RIVER_WEIGHT and the
 * other factors scale down together, so a plot out of the river's reach scores exactly as before. Paddy in the
 * standing-water season keeps only PADDY_RADAR_SCALE of its radar weight (radar cannot tell irrigation from flood),
 * and the weights are renormalised.
 */
export const WEIGHTS = { rain: 0.2, terrain: 0.15, flood: 0.3, photos: 0.25, integrity: 0.1 };
export const RIVER_WEIGHT = 0.1;
export const PADDY_RADAR_SCALE = 0.4;
/** Minimum uncertainty on the radar factor for paddy in season, and extra uncertainty on its photos. */
export const PADDY_RADAR_UNC = 0.35;
export const PADDY_PHOTO_UNC = 0.1;

export function weightsFor(o: { river: boolean; baselineWet: boolean }): Record<FactorId, number> {
  const w: Record<string, number> = { ...WEIGHTS };
  if (o.baselineWet) w.flood *= PADDY_RADAR_SCALE;
  const share = o.river ? 1 - RIVER_WEIGHT : 1;
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  const norm = Math.abs(sum - 1) < 1e-9 ? 1 : sum; // the base weights add up to 1: leave them exactly as they are
  for (const k of Object.keys(w)) w[k] = (w[k] / norm) * share;
  w.river = o.river ? RIVER_WEIGHT : 0;
  return w as Record<FactorId, number>;
}

const clamp = (x: number) => Math.max(0, Math.min(1, x));

export function lastPassBefore(m: Model, t: number): number | null {
  let best: number | null = null;
  for (const p of m.sar) if (p + SAR_LATENCY_H <= t) best = p;
  return best;
}

export const PADDY_NOTE =
  'Paddy in the standing-water season: radar and photo water cues are weak evidence here, so the radar weight is lowered and its uncertainty widened. This is an unvalidated design decision.';

export function evidenceFor(m: Model, s: PlotState, t: number): Evidence {
  const p = s.plot;
  const th = m.raw.thresholds;
  const st = m.stations[p.station];
  const h = Math.min(m.raw.hours, Math.floor(t));
  let r24 = 0;
  for (let k = 0; k <= h; k++) r24 = Math.max(r24, st.r24[k]);
  const gaugeKm = (Math.hypot(st.x - p.cx, st.y - p.cy) * m.raw.map.scaleM) / 1000;
  const rain: Factor = {
    id: 'rain', label: 'Rainfall vs threshold', weight: 0,
    value: s.times.hail ? 0.3 : clamp(r24 / th.rainHeavy), unc: 0.06 + Math.min(0.14, gaugeKm * 0.04),
    detail: `Max 24 h rain ${r24.toFixed(0)} mm at ${st.id} (${gaugeKm.toFixed(1)} km away); heavy-rain line ${th.rain24} mm`,
  };
  const terrain: Factor = {
    id: 'terrain', label: 'Terrain (low-lying)', weight: 0,
    value: [1, 0.5, 0.1][p.terrain], unc: 0.1,
    detail: `Mean ${p.meanElev.toFixed(1)} m above river · ${['low-lying', 'mid', 'upland'][p.terrain]}`,
  };

  // River: only for plots the river can reach (riverside, or low-lying within reach).
  const R = m.raw.river;
  const inReach = R && p.riverReach ? p.reach.filter((r) => r.lagH <= R.maxLagH) : [];
  let river: Factor | null = null;
  if (R && inReach.length) {
    let pick: { g: (typeof m.gauges)[number]; peak: number; lagH: number } | null = null;
    for (const r of inReach) {
      const g = m.gauges.find((x) => x.id === r.gauge);
      if (!g) continue;
      let peak = 0;
      for (let k = 0; k <= h; k++) peak = Math.max(peak, g.series[k]);
      if (!pick || peak / g.danger > pick.peak / pick.g.danger) pick = { g, peak, lagH: r.lagH };
    }
    if (pick) {
      const crossed = pick.peak >= pick.g.danger;
      river = {
        id: 'river', label: pick.g.kind === 'release' ? 'Dam release' : 'River stage', weight: 0,
        value: crossed ? 0.5 + 0.5 * clamp((pick.peak - pick.g.danger) / pick.g.danger) : 0,
        unc: 0.06 + 0.1 * clamp(pick.lagH / R.maxLagH),
        detail: crossed
          ? `${pick.g.id} reached ${pick.peak} ${pick.g.unit} (danger ${pick.g.danger} ${pick.g.unit}), about ${pick.lagH.toFixed(1)} h of travel away · ${p.riverReach} plot`
          : `${pick.g.id} at ${pick.peak} ${pick.g.unit}, below its danger level of ${pick.g.danger} ${pick.g.unit} · ${p.riverReach} plot`,
      };
    }
  }

  // Radar: only the water above what this crop shows anyway counts (zero for dry crops, standing water for paddy).
  let obs = 0, seen: number | null = null;
  for (const pass of m.sar) if (pass + SAR_LATENCY_H <= t) { const f = sarExcess(p, pass); if (f >= obs) { obs = f; seen = pass; } }
  const tall = TALL_CROPS.includes(p.crop);
  const floodUnc = s.times.hail ? 0.3 : tall ? 0.35 : seen === null ? 0.3 : 0.12;
  const flood: Factor = {
    id: 'flood', label: 'Flood extent (radar)', weight: 0,
    value: s.times.hail ? 0 : clamp(obs / 0.5), unc: p.baselineWet ? Math.max(floodUnc, PADDY_RADAR_UNC) : floodUnc,
    detail: seen === null
      ? 'No processed radar pass yet'
      : `Peak ${(obs * 100).toFixed(0)}% of plot submerged${p.baselineWet ? ' above paddy standing water' : ''} (pass T+${seen}h)${tall ? ' · canopy hides water' : ''}`,
  };

  const n = s.shotsNow;
  const inWindow = s.times.captureT !== null && s.times.deadlineT !== null && s.times.captureT <= s.times.deadlineT;
  const geoOk = s.times.geoOffM <= 100;
  const photos: Factor = {
    id: 'photos', label: 'Geo-tagged photos', weight: 0,
    value: n ? clamp((n / 3) * (inWindow ? 1 : 0.5) * (geoOk ? 1 : 0.4)) : 0,
    unc: (n ? 0.08 : 0.02) + (p.baselineWet && n ? PADDY_PHOTO_UNC : 0),
    detail: n
      ? `${n}/3 shots · ${inWindow ? (s.rail === 'pmfby' ? 'within window' : 'within the capture-soon advice') : (s.rail === 'pmfby' ? 'after deadline' : 'after the capture-soon advice')} · ${geoOk ? 'location on plot' : `${s.times.geoOffM} m from plot`} · water visible (AI perception, ±)${p.baselineWet ? ' · expected on paddy anyway' : ''}`
      : 'No photos yet',
  };
  const gap = s.times.syncT !== null && s.times.captureT !== null ? s.times.syncT - s.times.captureT : 0;
  const received = s.times.syncT !== null && s.times.syncT <= t;
  const integrity: Factor = {
    id: 'integrity', label: 'Integrity (hash chain, clocks)', weight: 0,
    value: received ? (gap > 2 ? 0.6 : 1) : 0, unc: 0.03,
    detail: received ? `Hashes verify · device→server gap ${gap.toFixed(1)} h${gap > 2 ? ' (flagged)' : ''}` : 'Nothing received yet',
  };

  const w = weightsFor({ river: river !== null, baselineWet: p.baselineWet });
  const factors = ([rain, river, terrain, flood, photos, integrity].filter(Boolean) as Factor[]).map((f) => ({ ...f, weight: w[f.id] }));
  const score = factors.reduce((a, f) => a + f.weight * f.value, 0);
  const sd = Math.sqrt(factors.reduce((a, f) => a + (f.weight * f.unc) ** 2, 0)) * 1.645; // ~90% band
  const lo = clamp(score - sd), hi = clamp(score + sd);
  let tier: Tier = 'none';
  if (s.stage !== 'monitoring' && s.stage !== 'no-damage') {
    tier = lo >= TIER_RULE.supportedLo ? 'supported' : hi < TIER_RULE.insufficientHi ? 'insufficient' : 'partial';
    if (s.times.hail && tier === 'supported') tier = 'partial'; // honest limit: hail never auto-"supported"
  }
  return { factors, score, lo, hi, tier, notes: p.baselineWet ? [PADDY_NOTE] : [], floodShare: s.times.hail ? 0 : obs, floodShareUnc: flood.unc * 0.5 };
}

export const TIER_LABEL: Record<Tier, string> = {
  supported: 'Supported',
  partial: 'Partial',
  insufficient: 'Insufficient',
  none: 'No event',
};

/**
 * Inspection priority weights. UNCHANGED since the first build; the worklist shows each part so a reader can see why
 * an item sits where it does, and a unit test pins the result against the original formula.
 */
export const PRIORITY_WEIGHTS = { ambiguity: 0.35, urgency: 0.3, area: 0.15, flags: 0.2 } as const;

export interface PriorityParts {
  /** 0..1 inputs, before weighting. */
  ambiguity: number;
  urgency: number;
  area: number;
  flags: number;
  /** Weighted sum, 0..1. */
  total: number;
}

export function priorityParts(s: PlotState, e: Evidence): PriorityParts {
  if (e.tier === 'none') return { ambiguity: 0, urgency: 0, area: 0, flags: 0, total: 0 };
  const ambiguity = e.tier === 'partial' ? 1 : e.tier === 'insufficient' ? 0.6 : 0.2;
  const open = s.stage === 'alerted' || s.stage === 'hail-prompt' || s.stage === 'queued';
  const windowH = s.times.deadlineT !== null && s.times.eventT !== null ? s.times.deadlineT - s.times.eventT : 72;
  const urgency = open && s.timeLeft !== null ? clamp(1 - s.timeLeft / windowH) : s.stage === 'missed' ? 0.8 : 0.2;
  const area = clamp(s.plot.areaHa / 6);
  const flags = clamp(s.flags.filter((f) => f !== 'tall-crop' && f !== 'assisted').length * 0.34);
  const W = PRIORITY_WEIGHTS;
  return { ambiguity, urgency, area, flags, total: W.ambiguity * ambiguity + W.urgency * urgency + W.area * area + W.flags * flags };
}

/** Inspection priority 0..100: ambiguity and urgency first — this ranks review work, not claims. */
export function priority(s: PlotState, e: Evidence): number {
  if (e.tier === 'none') return 0;
  return Math.round(100 * priorityParts(s, e).total);
}
