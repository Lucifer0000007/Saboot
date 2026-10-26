// Judge tour (feature E): seven steps, about two minutes when auto-advancing, Skip and Restart. Drives the
// replay, the simulation tabs and farmer screens. Under reduced motion it never auto-advances.
import '../styles/tour.css';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { tourStep } from './state';
import { tourSeen, reducedMotion, network } from '../lib/prefs';
import { announce } from '../lib/announce';
import { tr, trr } from '../lib/i18n';
import { fmtDur } from '../lib/time';
import { eventToCall } from '../sim/metrics';
import { layout, openPlot, insurerView, simTab, scrollToId, type SimTab } from '../site/layout';
import { pause, seek, t, model, demoPlot, demoDet } from '../sim/engine';
import { jumpTo } from '../sim/moments';
import { screen } from '../farmer/nav';
import { ensureFocus, full } from '../farmer/focus';
import { nm } from '../lib/names';

interface Step {
  key: string;
  target: () => string | null;
  setup: () => Promise<void> | void;
  /** Undo what the step changed, when the tour moves on or closes. */
  leave?: () => void;
}

const STEP_MS = 17500;
const go = (tab: SimTab) => { simTab.value = tab; };
const desk = () => layout.value === 'desktop';

export const STEPS: Step[] = [
  {
    key: 's1',
    // on a phone the spotlight holds one thing the free space above the card can show (audit UI-05)
    target: () => (desk() ? '#problem .cards3' : '#problem .cards3 > li:first-child'),
    setup: () => { pause(); openPlot.value = null; seek(0); screen.value = null; go('farmer'); scrollToId('problem', false); },
  },
  {
    key: 's2',
    target: () => (desk() ? '[data-tour=rules] .rules' : '[data-tour=rules] .rules-short'),
    setup: async () => { openPlot.value = null; go('explainer'); await jumpTo('trigger'); },
  },
  {
    key: 's3',
    target: () => (desk() ? '[data-tour=alert]' : '[data-tour=alert] .countdown'),
    setup: async () => { go('farmer'); await jumpTo('alert'); },
  },
  {
    key: 's4',
    target: () => (desk() ? '[data-tour=phone]' : '[data-tour=shots]'),
    setup: async () => { go('farmer'); await jumpTo('capture'); screen.value = 'capture'; },
  },
  {
    key: 's5',
    target: () => (desk() ? '[data-tour=phone]' : '[data-tour=hash]'),
    setup: async () => {
      go('farmer');
      await ensureFocus('sealed');
      const sealT = full.value.seal?.simT;
      if (sealT !== undefined) seek(Math.max(t.value, sealT + 0.05));
      screen.value = 'packet';
    },
  },
  {
    // the strongest proof moment, once only reachable by hand (audit J2): the console's ledger at a populated moment, with the
    // tamper test one tap away; the step restores the record when the tour moves on
    key: 's5t',
    target: () => (document.querySelector('.ledger .lg-verdict') ? '.ledger .lg-verdict' : desk() ? '[data-tour=ledger]' : '.ledger .lg-actions'),
    setup: async () => { await jumpTo('deadline'); openPlot.value = null; insurerView.value = 'ledger'; go('insurer'); },
    leave: () => document.querySelector<HTMLButtonElement>('[data-lg-restore]')?.click(),
  },
  {
    key: 's6',
    target: () => '[data-tour=pipeline]',
    setup: async () => { insurerView.value = 'claims'; go('insurer'); await jumpTo('confirm'); openPlot.value = null; },
  },
];

/** Numbers and names for the tour text, taken from the loaded scenario so they cannot go stale. */
function tourVars(): Record<string, string> {
  const m = model.value, p = demoPlot.value, d = demoDet.value;
  if (!m || !p || !d || d.alertT === null || d.eventT === null) return {};
  const e = eventToCall(m);
  return {
    name: nm(p.name),
    language: tr('lang.name.' + p.lang),
    gauge: m.stations[p.station].name.replace(/ gauge$/, ''),
    focus: fmtDur(d.alertT - d.eventT),
    left: fmtDur(d.deadlineT! - d.alertT),
    median: e.median === null ? '—' : fmtDur(e.median),
    p90: e.p90 === null ? '—' : fmtDur(e.p90),
  };
}

/** Press the ledger's own Tamper test button, once the ledger has finished building (it is disabled until then). */
function runTamper() {
  const t0 = Date.now();
  const tryIt = () => {
    const b = document.querySelector<HTMLButtonElement>('.ledger .tamper-btn');
    if (b && !b.disabled) b.click();
    else if (Date.now() - t0 < 8000) setTimeout(tryIt, 150);
  };
  tryIt();
}

/** A sheet or the camera viewfinder is open: it sits above the tour. */
const layerOnTop = () => !!document.querySelector('.sheet, .finder');

interface Box { x: number; y: number; w: number; h: number }

/** Wide screens: the card sits bottom-right; when that would cover the spotlight, it moves to the free space on the
 *  left (the width it gets there), or stays put when there is no such space. */
function dockLeft(b: Box, card: HTMLElement | null): number | null {
  if (!card || innerWidth < 768) return null;
  const w = Math.min(440, innerWidth - 48);
  const top = innerHeight - 24 - card.offsetHeight;
  if (b.x + b.w <= innerWidth - 24 - w || b.y + b.h <= top) return null;
  const room = b.x - 48;
  return room >= 320 ? Math.min(440, room) : null;
}

export default function Tour() {
  const i = tourStep.value ?? 0;
  const step = STEPS[i];
  const manual = reducedMotion.value;
  const [box, setBox] = useState<Box | null>(null);
  const [dock, setDock] = useState<number | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const [tampered, setTampered] = useState(false);
  const [paused, setPaused] = useState(manual);
  const [elapsed, setElapsed] = useState(0);
  const head = useRef<HTMLHeadingElement>(null);
  const title = tr(`tour.${step.key}.t`);

  const close = () => { tourStep.value = null; tourSeen.value = true; };
  const next = () => (i < STEPS.length - 1 ? (tourStep.value = i + 1) : close());
  const back = () => i > 0 && (tourStep.value = i - 1);

  // the spotlight scrolls only once the step's setup is done, or the setup's own scrolling would undo it
  const ready = useRef(-1);
  useEffect(() => {
    let alive = true;
    setElapsed(0);
    Promise.resolve(step.setup()).then(() => {
      if (!alive) return;
      ready.current = i;
      head.current?.focus({ preventScroll: true });
      announce(`${tr('tour.step', { n: i + 1, total: STEPS.length })}: ${title}`);
    });
    return () => { alive = false; step.leave?.(); };
  }, [i]);

  // Track the spotlight target for the whole step (tabs and lazy chunks render asynchronously, and the page can scroll or
  // reflow at any time, audit UI-06). A step whose target changes scrolls once more, to the new one.
  useLayoutEffect(() => {
    let raf = 0;
    let scrolled: string | null = null;
    const tick = () => {
      const sel = step.target();
      const el = sel ? document.querySelector(sel) : null;
      if (el) {
        if (scrolled !== sel && ready.current === i) {
          // a target inside a closed <details> (the Proof screen's technical details) is opened first
          for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null) d.open = true;
          el.scrollIntoView({ block: desk() ? 'center' : 'start', behavior: reducedMotion.value ? 'auto' : 'smooth' });
          scrolled = sel;
        }
        const r = el.getBoundingClientRect();
        const b = { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 };
        // a phone's card sits across the bottom: the spotlight ends above it instead of running underneath (audit UI-05)
        const ct = card.current && innerWidth < 768 ? card.current.getBoundingClientRect().top : null;
        if (ct !== null) b.h = Math.max(24, Math.min(b.h, ct - 8 - b.y));
        // a new box only when it moved: the loop runs for the whole step and must not re-render the card every frame
        setBox((o) => (o && o.x === b.x && o.y === b.y && o.w === b.w && o.h === b.h ? o : b));
        setDock(dockLeft(b, card.current));
      } else {
        setBox(null);
        setDock(null);
      }
      // the step text scrolls inside a short card; a fade says there is more (audit J10)
      const bd = body.current;
      setMore(!!bd && bd.scrollHeight - bd.scrollTop - bd.clientHeight > 2);
      setTampered(!!document.querySelector('[data-lg-restore]'));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setElapsed((e) => {
      // a sheet or the camera open on top of the tour holds it, as a pause would (audit UI-10)
      if (layerOnTop()) return e;
      if (e + 250 >= STEP_MS) { next(); return 0; }
      return e + 250;
    }), 250);
    return () => clearInterval(id);
  }, [paused, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // keys belong to the topmost layer: a sheet or the camera opened over the tour handles its own Escape (audit UI-10)
      if (layerOnTop()) return;
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'ArrowRight' && tag !== 'INPUT') next();
      else if (e.key === 'ArrowLeft' && tag !== 'INPUT') back();
    };
    addEventListener('keydown', onKey, true);
    return () => removeEventListener('keydown', onKey, true);
  }, [i]);

  return (
    <div class="tour" role="dialog" aria-modal="false" aria-labelledby="tour-h" aria-describedby="tour-b">
      {box && <div class="spot" style={{ left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` }} aria-hidden="true" />}
      <div class="tour-card" ref={card} style={dock ? { left: '24px', right: 'auto', width: `${dock}px` } : undefined}>
        <div class="tour-top">
          <span class="eyebrow">{tr('tour.step', { n: i + 1, total: STEPS.length })}</span>
          <button type="button" class="link-arrow" onClick={close}>{tr('tour.skip')}</button>
        </div>
        <h2 id="tour-h" class="h-sm" tabIndex={-1} ref={head}>{title}</h2>
        <div class={'tour-body' + (more ? ' more' : '')} ref={body} tabIndex={more ? 0 : undefined}>
          <p id="tour-b">{trr(`tour.${step.key}.b`, tourVars())}</p>
          {manual && <p class="muted tour-manual">{tr('tour.manual')}</p>}
        </div>
        {step.key === 's5t' && !tampered && (
          <button type="button" class="pill pill-ghost pill-sm tour-try" data-tour-tamper onClick={runTamper}>
            <Icon name="alert" size={16} /> {tr('tour.tamperTry')}
          </button>
        )}
        {/* the network switch lives in the closed dock sheet; the step that asks for it carries it (audit J10) */}
        {step.key === 's4' && (
          <button type="button" class="pill pill-ghost pill-sm tour-try" data-tour-net aria-pressed={network.value === 'offline'} onClick={() => (network.value = network.value === 'offline' ? 'online' : 'offline')}>
            <Icon name={network.value === 'offline' ? 'wifi' : 'wifiOff'} size={16} /> {network.value === 'offline' ? tr('tour.online') : tr('tour.offline')}
          </button>
        )}
        <div class="tour-foot">
          <div class="tour-progress" aria-hidden="true" style={{ '--n': STEPS.length } as Record<string, number>}>
            {STEPS.map((_, k) => <i key={k} style={{ '--k': k < i ? 1 : k === i ? (manual ? 1 : elapsed / STEP_MS) : 0 } as Record<string, number>} />)}
          </div>
          <div class="tour-actions">
            <button type="button" class="iconbtn" onClick={back} disabled={i === 0} aria-label={tr('tour.prev')}><Icon name="left" /></button>
            {!manual && (
              <button type="button" class="pill pill-ghost pill-sm" onClick={() => setPaused(!paused)} aria-pressed={paused}>
                <Icon name={paused ? 'play' : 'pause'} size={16} /> <span class="lbl">{paused ? tr('tour.resume') : tr('tour.pause')}</span>
              </button>
            )}
            <button type="button" class="pill pill-ghost pill-sm" onClick={() => { setElapsed(0); if (i === 0) STEPS[0].setup(); else tourStep.value = 0; }}>
              <Icon name="reset" size={16} /> <span class="lbl">{tr('tour.restart')}</span>
            </button>
            <button type="button" class="pill pill-dark pill-sm" onClick={next}>
              {i === STEPS.length - 1 ? tr('tour.finish') : tr('tour.next')} <span class="arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
