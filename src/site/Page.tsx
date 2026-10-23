// The whole page. `ssr` renders the static shell used by the build-time prerender (src/ssr.tsx):
// sections that need the browser are replaced by placeholders of the same size.
import { useEffect, useState } from 'preact/hooks';
import { lazy } from '../lib/lazy';
import { liveMsg, toast } from '../lib/announce';
import { tr } from '../lib/i18n';
import { loadScenario, model } from '../sim/engine';
import { jumpTo, type MomentId } from '../sim/moments';
import { loadFocus, restoreClock } from '../farmer/focus';
import { Settings } from '../ui/Settings';
import { Presenter } from '../tour/Presenter';
import { tourStep } from '../tour/state';
import { Announcement, Hero, Problem, Limits, Footer } from './Shell';
import { Nav } from './Nav';
import { Simulation, SimHead } from './Simulation';
import { readDeepLink, scrollToId, simTab, importCode, deepLinkDone } from './layout';
import { rail, cadence } from '../lib/prefs';

const Tour = lazy(() => import('../tour/Tour'), 0);
const HowItWorks = lazy(() => import('../how/HowItWorks'), 1600);

function SimPlaceholder() {
  return (
    <section id="simulation" class="sec sim" aria-labelledby="sim-h">
      <div class="wrap">
        <SimHead />
        <div class="loading sim-ph" role="status">{tr('sim.loading')}</div>
      </div>
    </section>
  );
}

/** How it works: a lazy chunk, fetched when the section comes within ~1.5 screens (or on idle). */
function HowSection({ ssr }: { ssr?: boolean }) {
  const near = useNear('how');
  return (
    <section id="how" class="sec how" aria-labelledby="how-h">
      <div class="wrap">{!ssr && near && model.value ? <HowItWorks /> : <div class="how-ph"><h2 id="how-h" class="sr-only">{tr('nav.how')}</h2></div>}</div>
    </section>
  );
}

function useNear(id: string) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '150% 0px' });
    io.observe(el);
    const idle = (window as Window & { requestIdleCallback?: (f: () => void, o?: object) => number }).requestIdleCallback;
    const t = idle ? idle(() => setNear(true), { timeout: 6000 }) : setTimeout(() => setNear(true), 4000);
    return () => { io.disconnect(); if (!idle) clearTimeout(t); };
  }, []);
  return near;
}

let deepLinked = false;
async function applyDeepLink() {
  if (deepLinked || !model.value) return;
  deepLinked = true;
  try {
    // the stored log must be in memory before a moment jump decides what the farmer is still missing
    await loadFocus();
    const d = readDeepLink();
    if (d.rail) rail.value = d.rail;
    if (d.cadence) cadence.value = d.cadence;
    if (d.tab) simTab.value = d.tab;
    if (d.k) {
      simTab.value = 'insurer';
      importCode.value = d.k;
    }
    if (d.at) {
      simTab.value = 'farmer';
      await jumpTo(d.at as MomentId);
    }
    if (d.at || d.tab || d.k) requestAnimationFrame(() => scrollToId('simulation', false));
    else if (d.section) requestAnimationFrame(() => scrollToId(d.section!, false));
    restoreClock();
  } finally {
    deepLinkDone.value = true;
  }
}

export function Page({ ssr }: { ssr?: boolean }) {
  useEffect(() => {
    loadScenario();
    void loadFocus().then(restoreClock);
    // a link with #k= pasted into a tab that is already open (the page does not reload for a hash change)
    const onHash = () => {
      const d = readDeepLink();
      if (d.k) {
        simTab.value = 'insurer';
        importCode.value = d.k;
      }
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => { void applyDeepLink(); }, [model.value]);
  return (
    <>
      <a class="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{tr('skip.main')}</a>
      <Announcement />
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Problem />
        {ssr ? <SimPlaceholder /> : <Simulation />}
        <HowSection ssr={ssr} />
        <Limits />
      </main>
      <Footer />
      {!ssr && (
        <>
          <Settings />
          <Presenter />
          {tourStep.value !== null && <Tour />}
          {toast.value && (
            <div class={'toast' + (toast.value.tone === 'warn' ? ' warn' : '')} key={toast.value.id} aria-hidden="true">
              {toast.value.text}
            </div>
          )}
          <div class="sr-only" aria-live="polite" aria-atomic="true">{liveMsg.value}</div>
        </>
      )}
    </>
  );
}
