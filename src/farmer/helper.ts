// Helper mode: a helper (sarpanch, CSC operator, cooperative or extension worker) captures for several farmers on one
// phone. This module holds the queue and each farmer's status. Every farmer keeps their own consent, photos and sealed
// packet in their own device log (focus.ts), so "who captured what" is a property of the evidence, not a note on the side.
import { computed } from '@preact/signals';
import { model, t, activePlotId, pause, seek } from '../sim/engine';
import type { Plot } from '../sim/model';
import { logs, reduce, recordConsent, ensureFocus, endHelperSession, startHelperSession, helperSession, keepActive, storedActive, type FocusView } from './focus';
import { screen, type Screen } from './nav';

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
  /** Photos and the seal still waiting for the network, from this farmer's own log (audit H9). */
  waiting: number;
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
      waiting: v ? v.queued + v.bodyPending : 0,
    };
  });
});

/**
 * A queue opened before any of its farmers was alerted has nothing to start: move the replay to the first alert among them
 * and stay on the queue (audit H7). A replay jump, labelled as one; it records nothing.
 */
export function jumpToFirstAlert() {
  const m = model.value;
  if (!m) return;
  const first = Math.min(...helperPlots.value.map((p) => m.det[p.idx].alertT ?? Infinity));
  if (!Number.isFinite(first)) return;
  pause();
  seek(first + 0.02);
}

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
  void keepActive(id);
}

/** After a farmer is done: straight to the next farmer the helper still has work for, else the queue (audit H13). */
export function nextFarmer() {
  const q = queue.value.find((x) => x.state === 'consent' || x.state === 'ready' || x.state === 'photos');
  if (q) openFarmer(q.plot.id, q.state);
  else backToQueue();
}

/** Back to the queue. The app stops acting for any single farmer until the helper picks the next one. */
export function backToQueue() {
  activePlotId.value = null;
  screen.value = 'helper';
  void keepActive(null);
}

/** A reload comes back to this screen, and to this farmer if they are in the queue of a session still running (audit R2). */
export function resumeAt(s: Screen | null, plot: string | null) {
  if (plot !== null && !(helperSession.value && helperPlots.value.some((p) => p.id === plot))) return;
  activePlotId.value = plot;
  screen.value = s;
}

/**
 * The page opens while a helper session is running (a reload, or a phone that dropped the page while its camera app was
 * open): back to the farmer the helper had open, at the step that farmer's own log is at, else the queue (audit H4).
 * Consent and photos are in each farmer's log, so nothing is asked again.
 */
export async function resumeHelper() {
  if (!helperSession.value) return;
  const id = await storedActive();
  const q = queue.value.find((x) => x.plot.id === id);
  if (q) openFarmer(q.plot.id, q.state);
  else backToQueue();
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
