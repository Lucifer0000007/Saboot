// Static page sections: announcement, hero, problem, honest limits, footer. Prerendered into
// index.html at build time (src/ssr.tsx), so they must stay SSR-safe: no window access at render.
import { useEffect, useState } from 'preact/hooks';
import { Icon, Mark, type IconName } from '../ui/Icon';
import { Seal } from '../ui/Seal';
import { ProvTag, FieldTag } from '../ui/ProvTag';
import { INTERVIEWS, TARGET_STATE, fieldCounts } from '../data/fieldEvidence';
import { tr, tList } from '../lib/i18n';
import { buildLabel } from '../lib/build';
import { reducedMotion } from '../lib/prefs';
import { TEAM_NAME, PROJECT, TRACK, EVENT, REPO_URL } from '../config';
import { SCENARIO } from '../generated/scenario-summary';
import { runSimulation } from './actions';
import { startTour } from '../tour/state';

export function Announcement() {
  return (
    <div class="ann on-ink" id="top" role="region" aria-label={tr('ann.label')}>
      <div class="wrap ann-in">
        <p>{tr('ann.text')}</p>
        {/* the same action as the hero's "Explore it yourself": go to the demo and start it (audit J11) */}
        <a class="pill" href="#simulation" onClick={(e) => { e.preventDefault(); runSimulation(); }}>
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
        <div class="hero-copy">
          <p class="eyebrow">{tr('hero.eyebrow')}</p>
          <h1 id="hero-h" class="display">{tr('hero.h')}</h1>
          <div class="hero-lines">
            <p>{tr('hero.l1')}</p>
            <p>{tr('hero.l2')}</p>
          </div>
          <div class="cta-row">
            {/* the guided tour first, where a first-time visitor starts (audit J11); the tour's code loads only on the tap */}
            <button id="hero-cta" type="button" class="pill pill-primary pill-lg" data-hero-tour onClick={() => startTour()}>
              {tr('tour.hero')} <span class="arrow" aria-hidden="true">→</span>
            </button>
            <a class="pill pill-ghost pill-lg" href="#simulation" onClick={(e) => { e.preventDefault(); runSimulation(); }}>{tr('hero.run')}</a>
          </div>
        </div>
        {/* the product's real moment: the clock that starts at the event, the seal, and the labels on every value */}
        <div class="hero-visual">
          <div class="hero-board">
            <Seal state="sealed" size={88} class="hero-seal" />
            <div class="hero-time">
              <HeroClock />
              <p class="hero-clock-cap">{tr('hero.clockCap')}</p>
            </div>
          </div>
          <div class="hero-labels">
            <p>{tr('hero.labels')}</p>
            <div class="row">
              <ProvTag prov="live" />
              <ProvTag prov="replay" />
              <ProvTag prov="sim" />
              <ProvTag prov="hand" />
              <FieldTag />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PROBLEMS: [IconName, string][] = [['clock', 'pb.1'], ['phone', 'pb.2'], ['image', 'pb.3']];

// the plain roles of src/data/fieldEvidence.ts, translated for the landing list (an unknown role shows as recorded)
const ROLE_KEY: Record<string, string> = { Patwari: 'fe.role.patwari', 'Insurer loss assessor': 'fe.role.assessor', Farmer: 'fe.role.farmer', 'CSC operator': 'fe.role.csc' };

/** Who the team spoke to (src/data/fieldEvidence.ts): role and state, one row per pair, with how many. Real, not simulated. */
function FieldPeople() {
  const c = fieldCounts();
  if (c.interviews === 0) return null;
  const rows = new Map<string, { role: string; state: string; n: number }>();
  for (const i of INTERVIEWS) {
    const k = i.role + '|' + i.state;
    rows.set(k, { role: i.role, state: i.state, n: (rows.get(k)?.n ?? 0) + 1 });
  }
  return (
    <div class="card field-people" data-field-people>
      <div class="row-between">
        <h3>{tr('fe.landing.h')}</h3>
        <FieldTag />
      </div>
      <p class="fe-strip">{tr('fe.strip', { n: c.interviews, states: c.states, roles: c.roles })}</p>
      {/* one row per role and state is long on a phone: the list opens on request (audit J20) */}
      <details class="fp-more" data-fp-more>
        <summary><span>{tr('fe.who')}</span><Icon name="down" /></summary>
        <ul class="fp-list" role="list">
          {[...rows.values()].map((r) => (
            <li key={r.role + r.state}><strong>{ROLE_KEY[r.role] ? tr(ROLE_KEY[r.role]) : r.role}</strong><span>{r.state}{r.n > 1 ? ` · ${r.n}` : ''}</span></li>
          ))}
        </ul>
        <a class="link-arrow" href={REPO_URL + '/blob/main/docs/INTERVIEWS.md'} target="_blank" rel="noopener noreferrer">{tr('fe.listLink')}</a>
      </details>
      <p class="muted small" data-fp-note>{c.inTargetState === 0 ? tr('fe.next', { state: TARGET_STATE }) : tr('fe.target', { state: TARGET_STATE, n: c.inTargetState })} {tr('fe.landing.note')}</p>
    </div>
  );
}

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
        <FieldPeople />
      </div>
    </section>
  );
}

/** The numbers an answer may quote: the scenario's own, so the page cannot disagree with the data. */
const FAQ_VARS = { plots: SCENARIO.plots, cadence: SCENARIO.radarCadenceHours, slow: SCENARIO.radarSlowCadenceHours };

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
              <div class="ans">{tList('faq.a' + i, FAQ_VARS).map((p, j) => <p key={j}>{p}</p>)}</div>
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
          <a class="foot-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">{tr('foot.code')}</a>
          <p class="small muted foot-build">{tr('foot.build', { b: buildLabel() })}</p>
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
