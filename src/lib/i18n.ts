import { signal } from '@preact/signals';
import en from '../i18n/en';
import { lang, rail } from './prefs';
import type { Lang } from '../sim/types';
import { importWithRetry } from './chunk';
import { showToast } from './announce';

export type Dict = Record<string, string | string[]>;
const dicts: Partial<Record<Lang, Dict>> = { en };
const loaders: Record<Lang, () => Promise<{ default: Dict }>> = {
  en: async () => ({ default: en }),
  hi: () => importWithRetry(() => import('../i18n/hi')),
  pa: () => importWithRetry(() => import('../i18n/pa')),
};
/** Bumps when a dictionary arrives so readers re-render. */
const ver = signal(0);
export const langReady = signal<Lang>('en');
export const langLoading = signal<Lang | null>(null);

const FONTS: Record<Lang, [string, string][]> = {
  en: [],
  hi: [['400 16px "Saboot Deva Sans"', 'अआ'], ['500 16px "Saboot Deva Sans"', 'अआ'], ['600 16px "Saboot Deva Display"', 'अआ']],
  pa: [['400 16px "Saboot Guru Sans"', 'ਅਆ'], ['500 16px "Saboot Guru Sans"', 'ਅਆ'], ['600 16px "Saboot Guru Display"', 'ਅਆ']],
};
const pending: Partial<Record<Lang, Promise<unknown>>> = {};

/** Start fetching a language's dictionary and font subsets (e.g. when the language menu opens). */
export function prefetchLang(l: Lang): Promise<unknown> {
  if (pending[l]) return pending[l]!;
  const tasks: Promise<unknown>[] = [];
  if (!dicts[l]) tasks.push(loaders[l]().then((m) => { dicts[l] = m.default; }));
  if (typeof document !== 'undefined' && document.fonts) {
    for (const [font, probe] of FONTS[l]) tasks.push(document.fonts.load(font, probe).catch(() => {}));
  }
  const p = Promise.race([Promise.all(tasks), new Promise((r) => setTimeout(r, 4000))]);
  pending[l] = p;
  // a failed load is not remembered: the next tap tries again
  p.catch(() => { if (pending[l] === p) delete pending[l]; });
  return p;
}

/** Load dictionary + fonts BEFORE switching so text reflows exactly once (no visible font swap). */
export async function setLang(l: Lang) {
  langLoading.value = l;
  try {
    await prefetchLang(l);
    if (!dicts[l]) { const m = await loaders[l](); dicts[l] = m.default; }
  } catch {
    // stay in the language the person is reading, say so, and let them try again
    langLoading.value = null;
    showToast(tr('lang.fail', { lang: LANGS.find((x) => x.id === l)!.label }), 'warn');
    return;
  }
  lang.value = l;
  langReady.value = l;
  ver.value++;
  langLoading.value = null;
  const html = document.documentElement;
  html.lang = l;
  html.classList.toggle('l-hi', l === 'hi');
  html.classList.toggle('l-pa', l === 'pa');
  html.classList.remove('lang-pending');
}

function lookup(key: string): string | string[] {
  void ver.value;
  const l = langReady.value;
  return dicts[l]?.[key] ?? en[key] ?? key;
}

type Vars = Record<string, string | number>;

/** Put each value where its {name} stands. */
export function fill(s: string, vars?: Vars): string {
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

export function tr(key: string, vars?: Vars): string {
  const s = lookup(key);
  return fill(Array.isArray(s) ? s.join(' ') : s, vars);
}

export const tList = (key: string, vars?: Vars): string[] => {
  const v = lookup(key);
  return (Array.isArray(v) ? v : [v]).map((s) => fill(s, vars));
};

/** Does the current dictionary (or English) have this key? */
function has(key: string): boolean {
  void ver.value;
  return (dicts[langReady.value]?.[key] ?? en[key]) !== undefined;
}

/**
 * Rail-aware lookup. The base key carries the wording of the relief rail (the primary one); a PMFBY variant lives under
 * key.pmfby. Where a rail has no variant, both rails read the base key.
 */
export function trr(key: string, vars?: Record<string, string | number>): string {
  const k = key + '.' + rail.value;
  return tr(has(k) ? k : key, vars);
}
export const trrList = (key: string): string[] => {
  const k = key + '.' + rail.value;
  return tList(has(k) ? k : key);
};

export const LANGS: { id: Lang; label: string; short: string; bcp: string }[] = [
  { id: 'en', label: 'English', short: 'EN', bcp: 'en' },
  { id: 'hi', label: 'हिन्दी', short: 'हि', bcp: 'hi' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ', short: 'ਪੰ', bcp: 'pa' },
];

if (typeof document !== 'undefined') {
  if (lang.value !== 'en') setLang(lang.value);
  else document.documentElement.classList.remove('lang-pending');
}
