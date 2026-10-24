import { signal, effect } from '@preact/signals';
import type { Lang } from '../sim/types';
import type { Cadence } from '../sim/model';
import { DEFAULT_RAIL, RAILS, type Rail } from '../config';

// Per-viewer conveniences only (localStorage may be unavailable — always guarded). SSR-safe.
function load<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem('saboot.' + k);
    return v === null ? d : (JSON.parse(v) as T);
  } catch {
    return d;
  }
}
function persist<T>(k: string, s: { value: T }) {
  effect(() => {
    const v = s.value;
    try { localStorage.setItem('saboot.' + k, JSON.stringify(v)); } catch { /* private mode / SSR */ }
  });
}

export type TextScale = 100 | 125 | 150;
/** Simulated phone network. 'offline' = airplane mode; 'weak' = 2G (slow, hash-first sync). */
export type Net = 'online' | 'weak' | 'offline';

/** The language a first-time visitor sees: the first of their device's languages that the app has, else English. */
export function pickLang(languages: readonly string[] | undefined): Lang {
  for (const l of languages ?? []) {
    const p = l.slice(0, 2).toLowerCase();
    if (p === 'hi' || p === 'pa' || p === 'en') return p;
  }
  return 'en';
}
const deviceLang = (): Lang => (typeof navigator === 'undefined' ? 'en' : pickLang(navigator.languages?.length ? navigator.languages : [navigator.language]));

export const lang = signal<Lang>(load('lang', deviceLang()));
export const textScale = signal<TextScale>(load<TextScale>('textScale', load('largeText', false) ? 125 : 100));
export const voiceMode = signal<boolean>(load('voice', false));
export const lowData = signal<boolean>(load('lowData', false));
export const highContrast = signal<boolean>(load('hc', false));
export const network = signal<Net>('online');
export const tourSeen = signal<boolean>(load('tourSeen', false));
/** The rail on show: the relief assessment (primary) or the PMFBY intimation (second). A per-viewer choice. */
export const rail = signal<Rail>((RAILS as readonly string[]).includes(load<string>('rail', DEFAULT_RAIL)) ? load<Rail>('rail', DEFAULT_RAIL) : DEFAULT_RAIL);
/** Radar cadence of the replay: 'demo' (simulated 12 h) or 'slow' (a few days, closer to real revisit times, still simulated). */
export const cadence = signal<Cadence>('demo');
/**
 * True on a phone or laptop that opened the app from the demo receiver's own address with ?receiver=1 (scripts/receipt-server.mjs).
 * Off by default, and then no request beyond the site's own files is ever made. The receiver is this page's origin, so no address
 * is stored; ?receiver=0 forgets it.
 */
export const receiver = signal<boolean>(load('receiver', false));

persist('lang', lang);
persist('textScale', textScale);
persist('voice', voiceMode);
persist('lowData', lowData);
persist('hc', highContrast);
persist('tourSeen', tourSeen);
persist('rail', rail);
persist('receiver', receiver);

const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const reducedMotion = signal<boolean>(reduce);
/** Real browser connectivity (navigator.onLine); a real outage forces the simulated phone offline too. */
export const browserOnline = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine !== false);

if (typeof document !== 'undefined') {
  addEventListener('online', () => (browserOnline.value = true));
  addEventListener('offline', () => (browserOnline.value = false));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => (reducedMotion.value = e.matches));
  effect(() => {
    const r = document.documentElement.classList;
    const ts = textScale.value;
    if (r.contains('t125') !== (ts === 125) || r.contains('t150') !== (ts === 150)) {
      r.toggle('t125', ts === 125);
      r.toggle('t150', ts === 150);
      // Chrome keeps em-based container queries from before a root font-size change: make them re-evaluate.
      requestAnimationFrame(() => document.querySelectorAll<HTMLElement>('.panel, .how-body, .sheet-body, .nav, .ctrl, .farmer').forEach((el) => {
        el.style.containerType = 'normal';
        void el.offsetWidth;
        el.style.containerType = '';
      }));
    }
    r.toggle('lowdata', lowData.value);
    r.toggle('hc', highContrast.value);
    r.toggle('still', lowData.value || reducedMotion.value);
  });
}
