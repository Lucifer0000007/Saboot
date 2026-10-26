import { computed } from '@preact/signals';
import { model, demoDet, seek, pause, activePlotId } from './engine';
import { full, ensureFocus, SCRIPT } from '../farmer/focus';
import { screen } from '../farmer/nav';
import { insurerView } from '../site/layout';

export type MomentId = 'trigger' | 'alert' | 'capture' | 'deadline' | 'confirm' | 'draft';
export interface Moment { id: MomentId; t: number; label: string; hint: string }

export const moments = computed<Moment[]>(() => {
  const m = model.value, d = demoDet.value;
  if (!m || !d || d.alertT === null) return [];
  const trig = Math.min(...m.det.filter((x) => x.detected).map((x) => x.detectT!));
  const f = full.value;
  const capT = f.lastShotT ?? d.alertT + SCRIPT.capture + 0.04;
  const refT = f.ref?.simT ?? d.alertT + SCRIPT.ref;
  const list: Moment[] = [
    { id: 'trigger', t: trig, label: 'Trigger', hint: 'Rules fire: rain over threshold on low-lying land' },
    { id: 'alert', t: d.alertT + 0.02, label: 'Alert', hint: 'Voice call reaches the farmer; clock already running' },
    { id: 'capture', t: capT + 0.05, label: 'Capture', hint: 'Three geo-tagged, hashed photos' },
    m.opts.rail === 'pmfby'
      ? { id: 'deadline', t: d.deadlineT!, label: 'Deadline', hint: `${m.opts.windowHours} h after the event began` }
      : { id: 'deadline', t: d.deadlineT!, label: 'Advice ends', hint: `End of the capture-soon advice, ${m.opts.windowHours} h after the event began (not a deadline)` },
    { id: 'confirm', t: refT + SCRIPT.ack + 0.1, label: 'Confirmation', hint: 'Insurer acknowledges; inspection scheduled' },
  ];
  // relief rail only: the officer has published the draft list (outside Saboot, simulated) and the first scripted farmer has
  // attached sealed evidence, so the moment shows an objection (audit OF-05), while the window is still open
  const firstObj = Math.min(...m.plots.flatMap((p) => (p.obj ? [p.obj[0]] : [])));
  if (m.opts.rail === 'relief') list.push({ id: 'draft', t: m.opts.publishAtHour + (Number.isFinite(firstObj) ? firstObj : 0) + 0.5, label: 'Draft list', hint: 'The draft list is published (simulated) and the first farmer has attached sealed evidence' });
  return list;
});

export async function jumpTo(id: MomentId) {
  pause();
  // every moment is the demo farmer's story: a jump never acts for a farmer a helper has open (audit CC-01)
  activePlotId.value = null;
  if (id === 'capture') await ensureFocus('captured');
  if (id === 'deadline' || id === 'confirm' || id === 'draft') await ensureFocus('filed');
  const mm = moments.value.find((x) => x.id === id);
  if (mm) seek(mm.t);
  if (id === 'draft') insurerView.value = 'draft';
  screen.value = id === 'capture' ? 'capture' : id === 'deadline' || id === 'confirm' || id === 'draft' ? 'status' : 'home';
}
