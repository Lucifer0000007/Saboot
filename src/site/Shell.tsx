// Static page sections: announcement, hero, problem, honest limits, footer. Prerendered into
// index.html at build time (src/ssr.tsx), so they must stay SSR-safe: no window access at render.
import { useEffect, useState } from 'preact/hooks';
import { Icon, Mark, type IconName } from '../ui/Icon';
import { tr, tList } from '../lib/i18n';
import { reducedMotion } from '../lib/prefs';
import { TEAM_NAME, PROJECT, TRACK, EVENT } from '../config';
import { scrollToId } from './layout';
import { runSimulation } from './actions';

export function Announcement() {
  return (
    <div class="ann on-ink" id="top" role="region" aria-label={tr('ann.label')}>
      <div class="wrap ann-in">
        <p>{tr('ann.text')}</p>
        <a class="pill" href="#simulation" onClick={(e) => { e.preventDefault(); scrollToId('simulation'); }}>
          <span>{tr('ann.skip')}</span>
        </a>
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Decorative live clock that starts at the storm and counts up (no rule's window is implied). Static under reduced motion. */
export function HeroClock() {
  const [s, setS] = useState(0);
  const still = reducedMotion.value;
  useEffect(() => {
    if (still) { setS(0); return; }
    const id = setInterval(() => setS((x) => (x < 99 * 3600 ? x + 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [still]);
  return (
    <p class="hero-clock" role="img" aria-label={tr('hero.clockLabel')}>
      <span aria-hidden="true">{pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}</span>
    </p>
  );
}

export function Hero() {
  return (
    <section class="hero" aria-labelledby="hero-h">
      <div class="wrap hero-in">
        <p class="eyebrow">{tr('hero.eyebrow')}</p>
        <h1 id="hero-h" class="display">{tr('hero.h')}</h1>
        <div class="hero-lines">
          <p>{tr('hero.l1')}</p>
          <p>{tr('hero.l2')}</p>
        </div>
        <div class="cta-row">
          <a id="hero-cta" class="pill pill-primary" href="#simulation" onClick={(e) => { e.preventDefault(); runSimulation(); }}>
            {tr('hero.run')} <span class="arrow" aria-hidden="true">→</span>
          </a>
          <a class="pill pill-ghost" href="#how" onClick={(e) => { e.preventDefault(); scrollToId('how'); }}>{tr('hero.how')}</a>
        </div>
        <div class="hero-visual">
          <div class="wash wash-a" aria-hidden="true" />
          <HeroClock />
          <p class="hero-clock-cap">{tr('hero.clockCap')}</p>
        </div>
      </div>
    </section>
  );
}

const PROBLEMS: [IconName, string][] = [['clock', 'pb.1'], ['phone', 'pb.2'], ['image', 'pb.3']];

export function Problem() {
  return (
    <section id="problem" class="sec" aria-labelledby="pb-h">
      <div class="wrap">
        <div class="sec-head">
          <p class="eyebrow">{tr('pb.eyebrow')}</p>
          <h2 id="pb-h">{tr('pb.h')}</h2>
        </div>
        <ul class="cards3" role="list">
          {PROBLEMS.map(([icon, k]) => (
            <li key={k} class="card feature">
              <Icon name={icon} />
              <h3>{tr(k + '.t')}</h3>
              <p>{tr(k + '.b')}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Limits() {
  return (
    <section id="limits" class="sec" aria-labelledby="faq-h">
      <div class="wrap">
        <div class="sec-head">
          <p class="eyebrow">{tr('faq.eyebrow')}</p>
          <h2 id="faq-h">{tr('faq.h')}</h2>
        </div>
        <div class="faq">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <details key={i} open={i === 1}>
              <summary><span>{tr('faq.q' + i)}</span><Icon name="down" /></summary>
              <div class="ans">{tList('faq.a' + i).map((p, j) => <p key={j}>{p}</p>)}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer class="foot">
      <div class="wrap foot-in">
        <div class="stack">
          <span class="brand"><Mark class="brand-mark" /><span class="brand-word">saboot</span></span>
          <p class="small muted">{tr('foot.note')}</p>
        </div>
        <dl>
          <div><dt>{tr('foot.team')}</dt><dd>{TEAM_NAME}</dd></div>
          <div><dt>{tr('foot.project')}</dt><dd>{PROJECT}</dd></div>
          <div><dt>{tr('foot.track')}</dt><dd>{TRACK}</dd></div>
          <div><dt>{tr('foot.event')}</dt><dd>{EVENT}</dd></div>
        </dl>
      </div>
    </footer>
  );
}
