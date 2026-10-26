// Page layout state: breakpoint, simulation tabs, the open plot, deep links and section scrolling.
// SSR-safe (the prerender imports this module in Node).
import { signal, computed } from '@preact/signals';
import { PUBLIC_URL } from '../config';

export type Layout = 'mobile' | 'tablet' | 'desktop';
export type SimTab = 'farmer' | 'insurer' | 'explainer';
/** 'ledger' is the tamper check, once a tab of its own (audit S-05). */
export type InsurerView = 'claims' | 'draft' | 'ledger' | 'impact';
export type SectionId = 'problem' | 'simulation' | 'how' | 'limits';

const hasDom = typeof window !== 'undefined';

/**
 * The breakpoint follows the width in *text units*: at 200% text a 1280px window behaves like a 640px one, so the
 * phone frame and the two-column desktop grid only appear when the text actually fits. Mirrored on <html> as
 * lay-desktop / lay-tablet / lay-mobile so CSS and components always agree.
 */
const rootPx = () => (hasDom ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16);
function current(): Layout {
  if (!hasDom) return 'mobile';
  const px = rootPx();
  const w = (innerWidth * 16) / px;
  const l: Layout = w >= 1024 ? 'desktop' : w >= 600 ? 'tablet' : 'mobile';
  return l === 'desktop' && px > 20 ? 'tablet' : l;
}

export const layout = signal<Layout>(current());
/** Text above 125%: the farmer app drops its phone frame and uses the full width instead. */
export const bigText = signal(rootPx() > 20);

function sync() {
  const l = current();
  if (layout.value !== l) layout.value = l;
  bigText.value = rootPx() > 20;
  const c = document.documentElement.classList;
  c.toggle('lay-desktop', l === 'desktop');
  c.toggle('lay-tablet', l === 'tablet');
  c.toggle('lay-mobile', l === 'mobile');
}
if (hasDom) {
  sync();
  addEventListener('resize', sync);
  // text-size changes (in-app 125/150%) toggle classes on <html>
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
}

/** Publish an element's rendered height as a CSS variable (sticky offsets use real heights, not guesses). */
export function measureInto(el: Element, cssVar: string) {
  const root = document.documentElement.style;
  const ro = new ResizeObserver(() => root.setProperty(cssVar, el.getBoundingClientRect().height + 'px'));
  ro.observe(el);
  return () => { ro.disconnect(); root.removeProperty(cssVar); };
}

export const simTab = signal<SimTab>('farmer');
/** Right-hand panel on desktop (the farmer is always visible there). */
export const panelTab = computed<Exclude<SimTab, 'farmer'>>(() => (simTab.value === 'farmer' ? 'insurer' : simTab.value));
export const insurerView = signal<InsurerView>('claims');
/** Plot open in the insurer drawer. */
export const openPlot = signal<string | null>(null);
/** An imported packet open in its own drawer, by its chain head (audit OF-01: it used to open the simulated plot). */
export const openImported = signal<string | null>(null);
/** Feature K: a code to import (from a #k= link), or '' to open the import sheet empty. */
export const importCode = signal<string | null>(null);
/** Open the import sheet on what the demo receiver holds (only meaningful when prefs.receiver is on). */
export const importReceived = signal(false);
/** True once the link's tab, moment and code have been applied (the stored log is loaded first). The QA hook waits for it. */
export const deepLinkDone = signal(false);

/** Is the given simulation view on screen right now? */
export const showing = (v: SimTab) => (layout.value === 'desktop' ? v === 'farmer' || panelTab.value === v : simTab.value === v);

export function scrollToId(id: string, focus = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  if (focus) {
    const h = el.querySelector<HTMLElement>('h2, h1') ?? el;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }
}

/** Bring the open panel (the console) to the top of the view, not the section heading above it: on a desktop with its tabs,
 *  below that the panel itself (the view switch rides in the bottom dock there). */
export function scrollToPanel() {
  const el = document.querySelector<HTMLElement>('.sim-grid .panel-tabs, .sim-body > .sim-tabs, #st-panel');
  if (!el) return scrollToId('simulation', false);
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

/**
 * Bring the farmer's phone to the top of the view (the page scrolls under the sticky bars by their own scroll margin).
 * Unframed (a phone), the app starts right under the nav, and if the farmer's main button would then sit under the bottom
 * dock (a small screen, a two-line Hindi title) the page scrolls only as far as that button needs (audit F2, J12).
 */
export function scrollToPhone() {
  const el = document.querySelector<HTMLElement>('[data-tour="phone"]');
  if (!el) return scrollToId('simulation', false);
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  if (el.classList.contains('phone')) return el.scrollIntoView({ behavior, block: 'start' });
  const nav = document.querySelector('header.nav');
  const navH = nav && getComputedStyle(nav).position === 'sticky' ? nav.getBoundingClientRect().height : 0;
  let top = el.getBoundingClientRect().top + scrollY - navH;
  const cta = el.querySelector('[data-tour="cta"]');
  if (cta) {
    const dock = document.querySelector('.ctrl-dock')?.getBoundingClientRect().height ?? 0;
    top = Math.max(top, cta.getBoundingClientRect().bottom + scrollY - (innerHeight - dock - 16));
  }
  scrollTo({ top, behavior });
}

/** The phone is on screen at all (the person has not scrolled on to another section). */
export function phoneInView() {
  const r = document.querySelector('[data-tour="phone"]')?.getBoundingClientRect();
  return !!r && r.bottom > 0 && r.top < innerHeight;
}

export interface DeepLink { at?: string; tab?: SimTab; view?: InsurerView; section?: SectionId; k?: string; rail?: 'relief' | 'pmfby'; cadence?: 'demo' | 'slow'; receiver?: boolean }

/** ?at=alert (QR target), ?tab=insurer, ?rail=pmfby, ?cadence=slow, #how, #k=<payload>; old #/dashboard style links still work. */
export function readDeepLink(): DeepLink {
  if (!hasDom) return {};
  const q = new URLSearchParams(location.search);
  const out: DeepLink = {};
  const at = q.get('at');
  if (at && /^(trigger|alert|capture|deadline|confirm|draft)$/.test(at)) out.at = at;
  const rail = q.get('rail');
  if (rail === 'relief' || rail === 'pmfby') out.rail = rail;
  const cad = q.get('cadence');
  if (cad === 'demo' || cad === 'slow') out.cadence = cad;
  const tab = q.get('tab');
  if (tab && /^(farmer|insurer|explainer)$/.test(tab)) out.tab = tab as SimTab;
  // the ledger was a tab of its own: an old link opens the console's tamper check, where it now lives
  if (tab === 'ledger') { out.tab = 'insurer'; out.view = 'ledger'; }
  // the public site is never a receiver (nothing listens there), so the flag is honoured only on another host: the demo laptop
  const rc = q.get('receiver');
  if (rc === '1' && location.host !== new URL(PUBLIC_URL).host) out.receiver = true;
  else if (rc === '0') out.receiver = false;
  const h = location.hash;
  if (h.startsWith('#k=')) out.k = h.slice(3);
  else if (/^#\/dashboard/.test(h)) out.tab = 'insurer';
  else if (/^#\/detect/.test(h)) out.tab = 'explainer';
  else if (/^#\/how/.test(h)) out.section = 'how';
  else if (/^#(problem|simulation|how|limits)$/.test(h)) out.section = h.slice(1) as SectionId;
  return out;
}
