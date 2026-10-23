// Scripted farmer behaviour for every plot, evaluated at sim time t. The focus plot uses the judge's
// real actions (hash-chained device log) instead of the script.
import type { Model, Plot, Detection } from './model';
import type { Persona } from './types';
import type { FocusView } from '../farmer/focus';
import type { Rail } from '../config';
import { SCRIPT } from '../farmer/focus';

export type Stage =
  | 'monitoring' // no event
  | 'hail-prompt' // low-confidence prompt sent, no reply
  | 'alerted' // waiting for evidence
  | 'queued' // captured offline, not yet received
  | 'evidence' // evidence received, not yet filed
  | 'filed' // reference recorded
  | 'acknowledged' // insurer acknowledged
  | 'no-damage' // farmer reported no damage (closed)
  | 'unconfirmed' // hail prompt sent, no reply by the end of the window: not an event, not a miss
  | 'missed'; // window closed without evidence

export type Flag = 'sync-gap' | 'geo-mismatch' | 'late' | 'no-ref' | 'ack-overdue' | 'escalated' | 'partial-shots' | 'assisted' | 'low-confidence' | 'tall-crop';

export interface PlotTimes {
  eventT: number | null;
  alertT: number | null;
  deadlineT: number | null;
  consentT: number | null;
  captureT: number | null;
  syncT: number | null;
  fileT: number | null;
  ackT: number | null;
  noDamageT: number | null;
  /** Relief rail: when the farmer attached sealed evidence to an entry of the published draft list, and when the officer responded (outside Saboot). */
  objectionT: number | null;
  objectionRespT: number | null;
  /** Who captured for the farmer, from the consent sealed in the farmer's own log. Null for scripted plots. */
  helper: { name: string; role: string; method: 'hold' | 'voice' } | null;
  shots: number;
  geoOffM: number;
  /** Driven by a real log on a phone, not by the script: nothing is known about where its photos were taken relative to the plot. */
  live: boolean;
  hail: boolean;
}

export interface PlotState {
  rail: Rail;
  plot: Plot;
  det: Detection;
  persona: Persona;
  times: PlotTimes;
  stage: Stage;
  shotsNow: number;
  timeLeft: number | null; // to intimation deadline (hours), null if no event
  flags: Flag[];
  ref: string | null;
  /** Relief rail: set once the farmer has attached sealed evidence to the published draft list. Saboot never resolves it. */
  objection: { t: number; respT: number | null; responded: boolean } | null;
}

const HAIL_PROMPT_LAG = 1; // h after the convective cell
const HAIL_REPLY = 4; // h for a "yes" + photos

/**
 * Times for one plot. `focus` is the demo farmer's own log; `live` holds the logs of farmers a helper captured for.
 * A plot with a live log is driven by what was really done on the phone, never by the script.
 */
export function plotTimes(m: Model, p: Plot, focus: FocusView | null, live?: Record<string, FocusView>): PlotTimes {
  const d = m.det[p.idx];
  const [persona, cap, shots, geoOff, sync, file, ack] = p.b;
  const base: PlotTimes = {
    eventT: d.eventT, alertT: d.alertT, deadlineT: d.deadlineT, consentT: null, captureT: null, syncT: null,
    fileT: null, ackT: null, noDamageT: null, objectionT: null, objectionRespT: null, helper: null, shots: 0, geoOffM: geoOff, hail: false, live: false,
  };
  const lv = live?.[p.id] ?? (persona === 'focus' ? focus : null);
  if (lv) {
    base.live = true;
    const all = lv.shotCount >= 3 || !!lv.seal;
    base.shots = lv.shotCount;
    base.captureT = lv.shotCount ? lv.lastShotT : null;
    base.syncT = all && lv.queued === 0 ? lv.syncedT : null;
    base.fileT = lv.ref?.simT ?? null;
    base.ackT = base.fileT !== null ? base.fileT + SCRIPT.ack : null;
    base.noDamageT = lv.noDamage;
    base.consentT = lv.consent?.simT ?? null;
    base.helper = lv.consent ? { name: lv.consent.helper, role: lv.consent.role, method: lv.consent.method } : null;
    base.objectionT = lv.objection?.simT ?? null;
    base.objectionRespT = base.objectionT !== null ? base.objectionT + SCRIPT.objectionResponse : null;
    return base;
  }
  if (!d.detected) {
    if (m.hailPrompted[p.idx]) {
      const ht = m.raw.hail.t;
      base.hail = true;
      base.eventT = ht;
      base.alertT = ht + HAIL_PROMPT_LAG;
      base.deadlineT = ht + m.opts.windowHours;
      if (p.hailYes) {
        base.captureT = ht + HAIL_REPLY;
        base.shots = 3;
        base.syncT = base.captureT + 0.2;
        base.fileT = base.captureT + 2;
        base.ackT = base.fileT + 40;
      }
    }
    return base;
  }
  if (persona === 'nodamage') { base.noDamageT = d.alertT! + cap; return base; }
  base.shots = shots;
  base.captureT = d.alertT! + cap;
  base.syncT = base.captureT + sync;
  base.fileT = file >= 0 ? base.captureT + file : null;
  base.ackT = base.fileT !== null && ack >= 0 ? base.fileT + ack : null;
  if (persona === 'assisted') base.consentT = base.captureT - 0.4;
  if (m.opts.rail === 'relief' && p.obj) {
    base.objectionT = m.opts.publishAtHour + p.obj[0];
    base.objectionRespT = p.obj[1] >= 0 ? base.objectionT + p.obj[1] : null;
  }
  return base;
}

export function plotState(m: Model, p: Plot, t: number, focus: FocusView | null, live?: Record<string, FocusView>): PlotState {
  const d = m.det[p.idx];
  const persona = p.b[0];
  const tm = plotTimes(m, p, focus, live);
  const flags: Flag[] = [];
  const at = (x: number | null) => x !== null && x <= t;
  let stage: Stage = 'monitoring';
  if (tm.alertT !== null && t >= tm.alertT) {
    if (at(tm.noDamageT)) stage = 'no-damage';
    else if (at(tm.ackT)) stage = 'acknowledged';
    else if (at(tm.fileT)) stage = 'filed';
    else if (at(tm.syncT)) stage = 'evidence';
    else if (at(tm.captureT)) stage = 'queued';
    else if (tm.deadlineT !== null && t >= tm.deadlineT) stage = tm.hail ? 'unconfirmed' : 'missed';
    else stage = tm.hail ? 'hail-prompt' : 'alerted';
  }
  const shotsNow = at(tm.captureT) ? tm.shots : 0;
  if (tm.hail) flags.push('low-confidence');
  if (shotsNow && tm.shots < 3) flags.push('partial-shots');
  if (shotsNow && tm.geoOffM > 100) flags.push('geo-mismatch');
  if (at(tm.syncT) && tm.syncT! - tm.captureT! > 2) flags.push('sync-gap');
  if (at(tm.captureT) && tm.deadlineT !== null && tm.captureT! > tm.deadlineT) flags.push('late');
  if (at(tm.captureT) && tm.fileT === null && t > tm.captureT! + 12 && persona !== 'focus') flags.push('no-ref');
  if (at(tm.fileT) && t > tm.fileT! + SCRIPT.ackDue && !at(tm.ackT)) flags.push('ack-overdue');
  if (at(tm.fileT) && t > tm.fileT! + SCRIPT.escalate && !at(tm.ackT)) flags.push('escalated');
  if (at(tm.consentT)) flags.push('assisted');
  if (d.detected && (p.crop === 'Sugarcane' || p.crop === 'Maize')) flags.push('tall-crop');
  const timeLeft = tm.deadlineT !== null && tm.alertT !== null && t >= tm.alertT ? tm.deadlineT - t : null;
  const ref = at(tm.fileT) ? (persona === 'focus' ? focus?.ref?.ref ?? null : `SIM-REF-${(7000 + p.idx * 37).toString()}`) : null;
  const objection = at(tm.objectionT) ? { t: tm.objectionT!, respT: tm.objectionRespT, responded: at(tm.objectionRespT) } : null;
  return { rail: m.opts.rail, plot: p, det: d, persona, times: tm, stage, shotsNow, timeLeft, flags, ref, objection };
}

const STAGE_LABELS: Record<Rail, Record<Stage, string>> = {
  pmfby: {
    monitoring: 'Monitoring',
    'hail-prompt': 'Hail prompt sent',
    alerted: 'Alerted · awaiting evidence',
    queued: 'Captured · queued offline',
    evidence: 'Evidence received',
    filed: 'Reported (ref. recorded)',
    acknowledged: 'Insurer acknowledged',
    'no-damage': 'Farmer: no damage',
    unconfirmed: 'Unconfirmed · hail prompt, no reply',
    missed: 'Window missed',
  },
  relief: {
    monitoring: 'Monitoring',
    'hail-prompt': 'Hail prompt sent',
    alerted: 'Alerted · awaiting evidence',
    queued: 'Captured · queued offline',
    evidence: 'Evidence received',
    filed: 'Shown to the officer (ref. noted)',
    acknowledged: 'Officer acknowledged',
    'no-damage': 'Farmer: no damage',
    unconfirmed: 'Unconfirmed · hail prompt, no reply',
    missed: 'No evidence after the advice window',
  },
};
export const stageLabel = (s: Pick<PlotState, 'stage' | 'rail'>) => STAGE_LABELS[s.rail][s.stage];

const FLAG_LABELS: Record<Rail, Record<Flag, string>> = {
  pmfby: {
    'sync-gap': 'Device→server delay',
    'geo-mismatch': 'Photo location off-plot',
    late: 'Captured after deadline',
    'no-ref': 'No filing reference',
    'ack-overdue': 'Acknowledgement overdue',
    escalated: 'Escalated to district',
    'partial-shots': 'Incomplete shot list',
    assisted: 'Assisted capture (consent)',
    'low-confidence': 'Low-confidence (hail)',
    'tall-crop': 'Tall crop: radar under-sees water',
  },
  relief: {
    'sync-gap': 'Device→server delay',
    'geo-mismatch': 'Photo location off-plot',
    late: 'Captured after the advice window',
    'no-ref': 'No receipt noted',
    'ack-overdue': 'Officer acknowledgement overdue',
    escalated: 'Escalated to district',
    'partial-shots': 'Incomplete shot list',
    assisted: 'Assisted capture (consent)',
    'low-confidence': 'Low-confidence (hail)',
    'tall-crop': 'Tall crop: radar under-sees water',
  },
};
export const flagLabel = (f: Flag, rail: Rail) => FLAG_LABELS[rail][f];
