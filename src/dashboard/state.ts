import { computed, signal } from '@preact/signals';
import { model, tSlow } from '../sim/engine';
import { liveViews, type FocusView } from '../farmer/focus';
import { imported, type Imported } from '../k/imported';
import { plotState, type PlotState } from '../sim/cohort';
import { evidenceFor, priority, type Evidence, type Tier } from '../sim/evidence';
import { metrics } from '../sim/metrics';
import type { Model } from '../sim/model';

export interface Row { s: PlotState; e: Evidence; pri: number }

/** Whole cohort at the (throttled) replay time. The focus plot reflects the judge's own actions. */
export const rows = computed<Row[]>(() => {
  const m = model.value;
  if (!m) return [];
  const t = tSlow.value;
  const { focus, live } = liveViews(t);
  return m.plots.map((p) => {
    const s = plotState(m, p, t, focus, live);
    const e = evidenceFor(m, s, t);
    return { s, e, pri: priority(s, e) };
  });
});

/** Packets imported from a judge's phone (feature K), scored like the focus plot from their own times. */
export const importedRows = computed<(Row & { k: Imported })[]>(() => {
  const m = model.value;
  if (!m) return [];
  const out: (Row & { k: Imported })[] = [];
  for (const k of imported.value) {
    const plot = m.plots.find((p) => p.id === k.plot);
    if (!plot) continue;
    const t = Math.max(tSlow.value, k.sealT);
    const shotsT = k.shots.map((s) => s.simT);
    const fv = { shotCount: k.shots.length, lastShotT: Math.max(...shotsT), firstShotT: Math.min(...shotsT), queued: 0, syncedT: k.sealT, ref: null, noDamage: null, consent: null } as unknown as FocusView;
    const s = plotState(m, plot, t, fv, { [plot.id]: fv });
    const e = evidenceFor(m, s, t);
    out.push({ s, e, pri: priority(s, e), k });
  }
  return out;
});

export type SortKey = 'priority' | 'timeLeft' | 'tier';
export const sortKey = signal<SortKey>('priority');
export const tierFilter = signal<Record<Tier, boolean>>({ supported: true, partial: true, insufficient: true, none: false });
export const layers = signal({ flood: true, terrain: false, gauges: true });

const TIER_ORDER: Record<Tier, number> = { partial: 0, insufficient: 1, supported: 2, none: 3 };

export function sorted(list: Row[], key: SortKey): Row[] {
  const r = [...list];
  if (key === 'priority') r.sort((a, b) => b.pri - a.pri || a.s.plot.id.localeCompare(b.s.plot.id));
  if (key === 'timeLeft') r.sort((a, b) => (a.s.timeLeft ?? 1e9) - (b.s.timeLeft ?? 1e9) || b.pri - a.pri);
  if (key === 'tier') r.sort((a, b) => TIER_ORDER[a.e.tier] - TIER_ORDER[b.e.tier] || b.e.score - a.e.score);
  return r;
}

/**
 * The figures at the top of the console. "In window" and "missed" come from the same function as the pilot-metrics tab
 * (`metrics`), over detected floods only, so the two tabs of one console cannot disagree. Hail prompts are alerts and are
 * counted in `events`, `received` and `reported`, never in those two.
 */
export function kpisOf(m: Model, r: Row[], t: number) {
  const ev = r.filter((x) => x.s.times.alertT !== null && x.s.stage !== 'monitoring');
  const received = ev.filter((x) => x.s.times.syncT !== null && x.s.times.syncT <= t);
  const reported = ev.filter((x) => x.s.times.fileT !== null && x.s.times.fileT <= t);
  const atRisk = ev.filter((x) => x.s.stage === 'alerted' && (x.s.timeLeft ?? 99) < 24);
  const flagged = ev.filter((x) => x.s.flags.some((f) => f !== 'tall-crop' && f !== 'assisted'));
  const k = metrics(m, r.map((x) => x.s), t);
  return { events: ev.length, received: received.length, inWindow: k.filedInWindow, reported: reported.length, atRisk: atRisk.length, flagged: flagged.length, missed: k.missed };
}

export const kpis = computed(() => (model.value ? kpisOf(model.value, rows.value, tSlow.value) : { events: 0, received: 0, inWindow: 0, reported: 0, atRisk: 0, flagged: 0, missed: 0 }));
