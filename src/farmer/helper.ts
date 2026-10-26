// Helper mode: a helper (sarpanch, CSC operator, cooperative or extension worker) captures for several farmers on one
// phone. This module holds the queue and each farmer's status. Every farmer keeps their own consent, photos and sealed
// packet in their own device log (focus.ts), so "who captured what" is a property of the evidence, not a note on the side.
import { computed } from '@preact/signals';
import { model, t, activePlotId, pause } from '../sim/engine';
import type { Plot } from '../sim/model';
import { logs, reduce, recordConsent, ensureFocus, endHelperSession, startHelperSession, type FocusView } from './focus';
import { screen } from './nav';

/** The farmers in the helper's queue, in order. The scenario names them; the app never guesses. */
export const helperPlots = computed(() => {
  const m = model.value;
  if (!m?.raw.helperQueue) return [];
  return m.raw.helperQueue.map((id) => m.plots.find((p) => p.id === id)).filter((p): p is Plot => !!p);
});

export type QueueState = 'no-alert' | 'consent' | 'ready' | 'photos' | 'sealed' | 'no-damage';

export interface QueueItem {
  plot: Plot;
  state: QueueState;
  shots: number;
  /** Who captured for this farmer, from the consent sealed in the farmer's own log. */
  by: { name: string; role: string } | null;
  consentT: number | null;
}

export function stateOf(alertT: number | null, now: number, v: FocusView | null): QueueState {
  if (alertT === null || now < alertT) return 'no-alert';
  if (!v) return 'consent';
  if (v.noDamage !== null) return 'no-damage';
  if (v.seal) return 'sealed';
  if (v.shotCount > 0) return 'photos';
  if (v.consent) return 'ready';
  return 'consent';
}

export const queue = computed<QueueItem[]>(() => {
  const m = model.value;
  const now = t.value;
  return helperPlots.value.map((plot) => {
    const log = logs.value[plot.id];
    const v = log ? reduce(log, now) : null;
    return {
      plot,
      state: stateOf(m ? m.det[plot.idx].alertT : null, now, v),
      shots: v?.shotCount ?? 0,
      by: v?.consent ? { name: v.consent.helper, role: v.consent.role } : null,
      consentT: v?.consent?.simT ?? null,
    };
  });
});

/** Farmers whose evidence is sealed or who reported no damage: the helper has nothing left to do for them. */
export const doneCount = computed(() => queue.value.filter((q) => q.state === 'sealed' || q.state === 'no-damage').length);

/** Where the helper goes next for a farmer, from what is already recorded. */
export function nextScreen(state: QueueState): 'assist' | 'capture' | 'packet' {
  return state === 'ready' || state === 'photos' ? 'capture' : state === 'sealed' ? 'packet' : 'assist';
}

/**
 * Start or resume work for one farmer: the app switches to that farmer's plot and device log. The replay pauses, so the
 * consent, photo and seal times are the replay time when the helper acted, not hours later at playback speed (audit H6).
 */
export function openFarmer(id: string, state: QueueState) {
  pause();
  activePlotId.value = id;
  screen.value = nextScreen(state);
}

/** Back to the queue. The app stops acting for any single farmer until the helper picks the next one. */
export function backToQueue() {
  activePlotId.value = null;
  screen.value = 'helper';
}

export async function leaveHelperMode() {
  await endHelperSession();
  screen.value = null;
}

/** Roles a helper can have in helper mode (the farmer-led assisted flow keeps its own, shorter list). */
export const HELPER_ROLES = ['hm.r.sarpanch', 'hm.r.csc', 'hm.r.coop', 'hm.r.ext'] as const;

/**
 * Scripted catch-up for QA and the presenter: a helper session where the first `n` farmers in the queue have their
 * consent recorded and their evidence sealed, at their scripted times. Real user data is kept.
 */
export async function helperDemo(n: number, who = { name: 'QA helper', role: 'Sarpanch' }) {
  await startHelperSession(who);
  const back = t.value;
  try {
    for (const q of queue.value.slice(0, n)) {
      const m = model.value!;
      const d = m.det[q.plot.idx];
      if (d.alertT === null) continue;
      activePlotId.value = q.plot.id;
      if (!logs.value[q.plot.id]?.length) {
        t.value = d.alertT + 2.5;
        await recordConsent({
          farmer: q.plot.name, helper: who.name, role: who.role, method: 'hold',
          text: `I, ${q.plot.name}, allow ${who.name} to take photos of my field and send them for my crop loss report.`,
        });
      }
      await ensureFocus('sealed', true);
    }
  } finally {
    t.value = back;
    activePlotId.value = null;
  }
}
