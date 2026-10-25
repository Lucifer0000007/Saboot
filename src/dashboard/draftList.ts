// The draft assessment list (relief rail): what the officer's office would review. One pure builder feeds the screen and
// both exports, so what you see is what you download. Saboot lists the evidence it holds. It never decides a claim, an
// eligibility or an amount, and no rupee figure exists anywhere in it. SIMULATED data.
import { RELIEF } from '../config';
import type { Model } from '../sim/model';
import { flagLabel, stageLabel } from '../sim/cohort';
import { PADDY_RADAR_SCALE, PRIORITY_WEIGHTS, RIVER_WEIGHT, TIER_LABEL, TIER_RULE, WEIGHTS, bandPct, type Tier } from '../sim/evidence';
import { RULE_VERSIONS } from '../sim/rules';
import type { Row } from './state';

export type ListState = 'working draft' | 'published' | 'objections closed';

export interface DraftEntry {
  plot: string;
  village: string;
  crop: string;
  areaHa: number;
  stage: string;
  /** Hail prompt sent, no reply: not an event and not a miss. Listed so the officer can see it, never counted as flooded. */
  unconfirmed: boolean;
  tier: Tier;
  tierLabel: string;
  scoreLo: number;
  scoreHi: number;
  /** Radar estimate of the share of the plot under water above what the crop shows anyway. Not crop damage. */
  floodShare: number;
  floodShareUnc: number;
  atOrAboveShareParameter: boolean;
  flags: string[];
  priority: number;
  eventAtHour: number | null;
  evidenceAtHour: number | null;
  objection: { filedAtHour: number; answeredAtHour: number | null } | null;
}

export interface DraftVillage {
  rank: number;
  name: string;
  plots: number;
  unconfirmed: number;
  areaHa: number;
  supported: number;
  partial: number;
  insufficient: number;
  atOrAbove: number;
  /** Sum of the review priority of the village's listed plots: how much review work is waiting there. */
  reviewLoad: number;
  objections: number;
}

export interface Draft {
  kind: 'saboot.draft-assessment-list';
  v: 1;
  status: string;
  simulation: true;
  provenance: {
    rail: 'relief';
    simHour: number;
    scenario: { name: string; seed: number; hours: number; t0: string; sha256: string | null };
    ruleVersions: typeof RULE_VERSIONS;
    parameters: Record<string, unknown>;
    publication: { state: ListState; publishAtHour: number; objectionWindowHours: number };
  };
  notes: string[];
  villages: DraftVillage[];
  entries: DraftEntry[];
}

const r2 = (x: number) => Math.round(x * 100) / 100;

/** A hail prompt with no reply yet, or none by the end of its window, is not a confirmed flood: it never carries a village's review load or rank. */
const unconfirmedStage = (r: Row) => r.s.stage === 'unconfirmed' || r.s.stage === 'hail-prompt';

export function listState(m: Pick<Model, 'opts'>, t: number): ListState {
  const { publishAtHour: a, objectionWindowHours: w } = m.opts;
  return t < a ? 'working draft' : t < a + w ? 'published' : 'objections closed';
}

export const DRAFT_STATUS = 'DRAFT for officer review. Saboot does not decide claims, eligibility or amounts, and shows no amount.';

export function buildDraft(m: Model, rows: Row[], t: number, sha256: string | null): Draft {
  const share = RELIEF.damageShareThreshold;
  const listed = rows.filter((r) => r.e.tier !== 'none');
  const entryOf = (r: Row): DraftEntry => ({
    plot: r.s.plot.id,
    village: r.s.plot.village,
    crop: r.s.plot.crop,
    areaHa: r2(r.s.plot.areaHa),
    stage: stageLabel(r.s),
    unconfirmed: unconfirmedStage(r),
    tier: r.e.tier,
    tierLabel: TIER_LABEL[r.e.tier],
    // band ends are rounded down, like the screen, so an export never prints a line the exact value has not reached
    scoreLo: bandPct(r.e.lo) / 100,
    scoreHi: bandPct(r.e.hi) / 100,
    floodShare: r2(r.e.floodShare),
    floodShareUnc: r2(r.e.floodShareUnc),
    atOrAboveShareParameter: r.e.floodShare >= share,
    flags: r.s.flags.filter((f) => f !== 'tall-crop').map((f) => flagLabel(f, r.s.rail)),
    priority: r.pri,
    eventAtHour: r.s.times.eventT === null ? null : r2(r.s.times.eventT),
    evidenceAtHour: r.s.times.syncT !== null && r.s.times.syncT <= t ? r2(r.s.times.syncT) : null,
    objection: r.s.objection
      ? { filedAtHour: r2(r.s.objection.t), answeredAtHour: r.s.objection.responded && r.s.objection.respT !== null ? r2(r.s.objection.respT) : null }
      : null,
  });
  const byVillage = m.raw.map.villages
    .map((v, i) => {
      const vs = listed.filter((r) => r.s.plot.v === i);
      const confirmed = vs.filter((r) => !unconfirmedStage(r));
      return {
        i,
        n: vs.length,
        name: v.name,
        plots: confirmed.length,
        unconfirmed: vs.length - confirmed.length,
        areaHa: r2(confirmed.reduce((a, r) => a + r.s.plot.areaHa, 0)),
        supported: confirmed.filter((r) => r.e.tier === 'supported').length,
        partial: confirmed.filter((r) => r.e.tier === 'partial').length,
        insufficient: confirmed.filter((r) => r.e.tier === 'insufficient').length,
        atOrAbove: confirmed.filter((r) => r.e.floodShare >= share).length,
        reviewLoad: confirmed.reduce((a, r) => a + r.pri, 0),
        objections: vs.filter((r) => r.s.objection).length,
      };
    })
    .filter((v) => v.n > 0)
    .sort((a, b) => b.reviewLoad - a.reviewLoad || a.name.localeCompare(b.name));
  const villages: DraftVillage[] = byVillage.map((v, k) => ({
    rank: k + 1,
    name: v.name,
    plots: v.plots,
    unconfirmed: v.unconfirmed,
    areaHa: v.areaHa,
    supported: v.supported,
    partial: v.partial,
    insufficient: v.insufficient,
    atOrAbove: v.atOrAbove,
    reviewLoad: v.reviewLoad,
    objections: v.objections,
  }));
  const order = new Map(byVillage.map((v, k) => [v.i, k]));
  const entries = [...listed]
    // village by review load, then plots at or above the share parameter first, then review priority, then plot id
    .sort((a, b) => (order.get(a.s.plot.v) ?? 99) - (order.get(b.s.plot.v) ?? 99)
      || Number(b.e.floodShare >= share) - Number(a.e.floodShare >= share) || b.pri - a.pri || a.s.plot.id.localeCompare(b.s.plot.id))
    .map(entryOf);
  return {
    kind: 'saboot.draft-assessment-list',
    v: 1,
    status: DRAFT_STATUS,
    simulation: true,
    provenance: {
      rail: 'relief',
      simHour: r2(t),
      scenario: { name: m.raw.name, seed: m.raw.seed, hours: m.raw.hours, t0: m.raw.t0, sha256 },
      ruleVersions: RULE_VERSIONS,
      parameters: {
        floodedShareParameter: share,
        captureSoonAdviceHours: RELIEF.captureSoonHours,
        tierRule: TIER_RULE,
        factorWeights: WEIGHTS,
        riverWeight: RIVER_WEIGHT,
        paddyRadarWeightScale: PADDY_RADAR_SCALE,
        priorityWeights: PRIORITY_WEIGHTS,
        thresholds: m.raw.thresholds,
        radarCadence: m.opts.cadence === 'slow' ? 'slow (simulated)' : 'demo (simulated)',
      },
      publication: { state: listState(m, t), publishAtHour: m.opts.publishAtHour, objectionWindowHours: m.opts.objectionWindowHours },
    },
    notes: [
      'All values are simulated and synthetic. Nothing here is a real assessment.',
      'The flooded-share parameter is a labelled scenario setting, not an official figure. Flooded share is a radar estimate, not crop damage, which only the officer assesses.',
      'The evidence tier ranks review work. It is not a decision. The officer decides, outside Saboot.',
      'Farmer names are not included. Match plots to your land records by plot id.',
      'An objection means the farmer attached their sealed evidence. Saboot never records or shows the officer’s response, only that one came.',
    ],
    villages,
    entries,
  };
}

export const draftJson = (d: Draft) => JSON.stringify(d, null, 2) + '\n';

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function draftCsv(d: Draft): string {
  const p = d.provenance;
  const head = [
    'village_rank', 'village', 'plot', 'crop', 'area_ha', 'stage', 'evidence_tier', 'score_lo', 'score_hi',
    'flooded_share_estimate', 'flooded_share_plus_minus', 'at_or_above_share_parameter', 'review_priority', 'flags',
    'objection_filed_at_hour', 'officer_response_noted_at_hour',
  ];
  const rank = new Map(d.villages.map((v) => [v.name, v.rank]));
  const lines = d.entries.map((e) =>
    [
      rank.get(e.village) ?? '', e.village, e.plot, e.crop, e.areaHa, e.stage, e.tierLabel, e.scoreLo, e.scoreHi,
      e.floodShare, e.floodShareUnc, e.atOrAboveShareParameter ? 'yes' : 'no', e.priority, e.flags.join('; '),
      e.objection?.filedAtHour ?? '', e.objection?.answeredAtHour ?? '',
    ].map(cell).join(','),
  );
  return (
    [
      '# SABOOT DRAFT ASSESSMENT LIST - SIMULATION, synthetic data',
      `# ${d.status}`,
      `# rail=${p.rail}; list=${p.publication.state}; sim_hour=${p.simHour}; scenario_sha256=${p.scenario.sha256 ?? 'not computed'}`,
      `# rules=A${p.ruleVersions.A}+B${p.ruleVersions.B}+C${p.ruleVersions.C}; flooded_share_parameter=${RELIEF.damageShareThreshold} (a scenario setting, not an official figure); capture_soon_advice_hours=${RELIEF.captureSoonHours}`,
      ...d.notes.map((n) => `# ${n}`),
      head.join(','),
      ...lines,
    ].join('\n') + '\n'
  );
}
