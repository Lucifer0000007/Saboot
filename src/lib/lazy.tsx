import { h, type ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { tr } from './i18n';
import { importWithRetry } from './chunk';
import { simTab } from '../site/layout';

/** A chunk that has neither arrived nor failed by now is reported as failed (a request that never answers never rejects). */
export const LAZY_WAIT_MS = 12000;
const RETRY_KEY = 'saboot.lazyRetry';

/**
 * A chunk whose shared dependency failed cannot be fetched again in this page: the browser remembers the failed module for
 * the life of the page, so only a reload retries it (the inline boot script does the same for the main script). Reload once
 * by itself, back on the same tab of the simulation; not twice within a minute (no loop), and not while the phone is
 * offline (a reload would then show the browser's error page instead of this one).
 */
function reloadOnce(): boolean {
  try {
    if (!navigator.onLine || Date.now() - Number(sessionStorage.getItem(RETRY_KEY) ?? 0) < 60_000) return false;
    sessionStorage.setItem(RETRY_KEY, String(Date.now()));
  } catch {
    return false;
  }
  const u = new URL(location.href);
  if (simTab.value !== 'farmer') u.searchParams.set('tab', simTab.value);
  location.replace(u.href);
  return true;
}

/**
 * Route/tab-level code splitting without preact/compat. The placeholder reserves height (no layout shift). `card` is the
 * text key for a part with no place of its own on the page (the tour): it waits, and fails, in a small card on screen.
 */
export function lazy<P extends object>(load: () => Promise<{ default: ComponentType<P> }>, minHeight = 480, card?: string) {
  let C: ComponentType<P> | null = null;
  let p: Promise<void> | null = null;
  const start = () =>
    (p ??= importWithRetry(load).then(
      (m) => { C = m.default; },
      (e) => { p = null; throw e; },
    ));
  function Lazy(props: P) {
    const [failed, setFailed] = useState(false);
    const [, force] = useState(0);
    // Effects run after paint: the chunk can arrive between this render and the effect. So the effect keys off what
    // this render showed, not off C (an already-settled promise still re-renders on the next microtask).
    const shown = !!C;
    useEffect(() => {
      if (shown) return;
      let alive = true;
      // a late arrival after the time-out still renders (C is checked before `failed`)
      const timer = setTimeout(() => alive && !C && setFailed(true), LAZY_WAIT_MS);
      start().then(
        () => alive && force((x) => x + 1),
        () => alive && !reloadOnce() && setFailed(true),
      );
      return () => { alive = false; clearTimeout(timer); };
    }, []);
    if (C) return h(C, props);
    const cls = card ? ' lazy-card' : '';
    if (failed) {
      return (
        <div class={'load-failed' + cls} style={{ minHeight: minHeight + 'px' }} role="alert">
          <p>{tr('lazy.failed')}</p>
          <button type="button" class="pill pill-dark" onClick={() => location.reload()}>{tr('lazy.reload')}</button>
        </div>
      );
    }
    return (
      <div class={'loading' + cls} style={{ minHeight: minHeight + 'px' }} role="status" aria-busy="true">
        <span class="spin" aria-hidden="true" />
        {card && <span>{tr(card)}</span>}
      </div>
    );
  }
  Lazy.preload = () => start().catch(() => {});
  return Lazy;
}
