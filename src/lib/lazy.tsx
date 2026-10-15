import { h, type ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { tr } from './i18n';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let bust = 0;

/**
 * Chrome keeps a failed module fetch in its module map: calling the same import() again never refetches, so one
 * dropped request (flaky venue Wi-Fi) would leave a panel loading forever. A retry therefore re-imports the chunk under
 * a fresh URL taken from the error message (the service worker and static hosts ignore the query). When a shared
 * dependency failed instead, or the browser does not name the URL, the slot offers a page reload.
 */
async function importWithRetry<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (e) {
    const url = /https?:\/\/\S+?\.js\b/.exec(String((e as Error)?.message ?? ''))?.[0];
    if (!url) throw e;
    for (let i = 1; i <= 3; i++) {
      await wait(400 * i);
      try {
        return (await import(/* @vite-ignore */ `${url}?retry=${++bust}`)) as T;
      } catch { /* next attempt */ }
    }
    throw e;
  }
}

/** Route/tab-level code splitting without preact/compat. The placeholder reserves height (no layout shift). */
export function lazy<P extends object>(load: () => Promise<{ default: ComponentType<P> }>, minHeight = 480) {
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
      start().then(() => alive && force((x) => x + 1), () => alive && setFailed(true));
      return () => { alive = false; };
    }, []);
    if (C) return h(C, props);
    if (failed) {
      return (
        <div class="load-failed" style={{ minHeight: minHeight + 'px' }} role="alert">
          <p>{tr('lazy.failed')}</p>
          <button type="button" class="pill pill-dark" onClick={() => location.reload()}>{tr('lazy.reload')}</button>
        </div>
      );
    }
    return (
      <div class="loading" style={{ minHeight: minHeight + 'px' }} role="status" aria-busy="true">
        <span class="spin" aria-hidden="true" />
      </div>
    );
  }
  Lazy.preload = () => start().catch(() => {});
  return Lazy;
}
