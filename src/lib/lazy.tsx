import { h, type ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { tr } from './i18n';
import { importWithRetry } from './chunk';

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
