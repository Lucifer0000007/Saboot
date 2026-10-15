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

export const lang = signal<Lang>(load('lang', 'en'));
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

persist('lang', lang);
persist('textScale', textScale);
persist('voice', voiceMode);
persist('lowData', lowData);
persist('hc', highContrast);
persist('tourSeen', tourSeen);
persist('rail', rail);

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
