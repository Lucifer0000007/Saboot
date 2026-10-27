// A reload (a pull-to-refresh, or a phone that dropped the page while its camera app was open) comes back to where the
// person was: the simulation tab, the console view, the replay time, the farmer screen, the farmer a helper had open, and
// the section on screen (audit R2). Kept for this tab only (sessionStorage), and read only on a reload or a return by
// Back: a link opened afresh lands where the link says.
import { t, HOURS, activePlotId } from '../sim/engine';
import { screen, type Screen } from '../farmer/nav';
import { simTab, insurerView, deepLinkDone, type SimTab, type InsurerView, type SectionId } from './layout';

const KEY = 'saboot.resume';
export interface Resume { tab: SimTab; view: InsurerView; t: number; s: Screen | null; plot: string | null; sec: SectionId | null }

/** The section a third of the way down the screen, whatever sheet is open over it. */
function section(): SectionId | null {
  const y = innerHeight / 3;
  const el = [...document.querySelectorAll('main section[id]')].find((x) => { const r = x.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
  return el && /^(problem|simulation|how|limits)$/.test(el.id) ? (el.id as SectionId) : null;
}

/** Called as the page is hidden or unloaded: a phone can drop a hidden page without another word. */
export function saveResume() {
  // before the link is applied there is nothing of the person's own to come back to
  if (!deepLinkDone.value) return;
  const r: Resume = { tab: simTab.value, view: insurerView.value, t: Math.round(t.value * 100) / 100, s: screen.value, plot: activePlotId.value, sec: section() };
  try { sessionStorage.setItem(KEY, JSON.stringify(r)); } catch { /* storage unavailable: a reload starts afresh */ }
}

export function readResume(): Resume | null {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type !== 'reload' && nav?.type !== 'back_forward') return null;
  let r: Partial<Resume> | null = null;
  try { r = JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); } catch { return null; }
  if (!r || typeof r.t !== 'number' || !(r.t >= 0 && r.t <= HOURS)) return null;
  if (!/^(farmer|insurer|explainer)$/.test(String(r.tab)) || !/^(claims|draft|ledger|impact)$/.test(String(r.view))) return null;
  return {
    tab: r.tab!, view: r.view!, t: r.t,
    s: /^(home|capture|packet|file|status|assist|helper)$/.test(String(r.s)) ? r.s! : null,
    plot: typeof r.plot === 'string' ? r.plot : null,
    sec: /^(problem|simulation|how|limits)$/.test(String(r.sec)) ? r.sec! : null,
  };
}
