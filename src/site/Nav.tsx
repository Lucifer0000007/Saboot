// Sticky nav: wordmark, section links, SIMULATION tag, language switch, CTA, mobile menu sheet.
import { signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon, Mark } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { tr, setLang, prefetchLang, LANGS, langReady, langLoading } from '../lib/i18n';
import { scrollToId, measureInto, type SectionId } from './layout';
import { runSimulation } from './actions';

const LINKS: [SectionId, string][] = [['problem', 'nav.problem'], ['simulation', 'nav.sim'], ['how', 'nav.how'], ['limits', 'nav.limits']];

/** The nav CTA turns blue only when no other primary action is on screen (one blue per screen). */
const ctaBlue = signal(false);
export const menuOpen = signal(false);

function LangSwitch() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const cur = LANGS.find((l) => l.id === (langLoading.value ?? langReady.value))!;
  useEffect(() => {
    if (!open) return;
    for (const l of LANGS) if (l.id !== langReady.value) prefetchLang(l.id);
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); box.current?.querySelector<HTMLElement>('.lang-btn')?.focus(); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    box.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div class="lang" ref={box}>
      {/* wide bars: the three languages side by side, one tap each (docs/DESIGN.md, "Language") */}
      <div class="seg lang-seg" role="radiogroup" aria-label={tr('nav.lang')}>
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            lang={l.bcp}
            aria-label={l.label}
            aria-checked={langReady.value === l.id}
            onPointerEnter={() => l.id !== langReady.value && prefetchLang(l.id)}
            onClick={() => setLang(l.id)}
          >
            {l.short}
          </button>
        ))}
      </div>
      <button
        type="button"
        class="pill pill-ghost pill-sm lang-btn"
        aria-expanded={open}
        aria-controls="lang-menu"
        onClick={() => setOpen(!open)}
        onPointerEnter={() => LANGS.forEach((l) => l.id !== langReady.value && prefetchLang(l.id))}
      >
        <Icon name="globe" size={16} />
        <span class="sr-only">{tr('nav.lang')}: </span>
        <span class="lang-all">
          {LANGS.map((l, i) => (
            <span key={l.id} lang={l.bcp} class={l.id === cur.id ? 'on' : undefined}>{i ? ' / ' : ''}{l.short}</span>
          ))}
        </span>
        <span class="lang-cur" lang={cur.bcp}>{cur.short}</span>
        {langLoading.value && <span class="spin" aria-hidden="true" />}
      </button>
      {open && (
        <div class="lang-menu" id="lang-menu" role="radiogroup" aria-label={tr('nav.lang')}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              lang={l.bcp}
              aria-checked={langReady.value === l.id}
              onClick={async () => { setOpen(false); await setLang(l.id); }}
            >
              <span>{l.label}</span>
              {langReady.value === l.id && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const bar = useRef<HTMLElement>(null);
  useEffect(() => (bar.current ? measureInto(bar.current, '--nav-real') : undefined), []);
  useEffect(() => {
    // Blue only when neither the hero CTA nor the simulation (which has its own primary) is visible.
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((es) => {
      for (const e of es) seen.set(e.target, e.isIntersecting);
      ctaBlue.value = ![...seen.values()].some(Boolean);
    });
    const watch = () => ['hero-cta', 'simulation'].forEach((id) => { const el = document.getElementById(id); if (el && !seen.has(el)) { seen.set(el, true); io.observe(el); } });
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.getElementById('main')!, { childList: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  const go = (e: Event, id: SectionId) => {
    e.preventDefault();
    menuOpen.value = false;
    if (id === 'simulation') runSimulation();
    else scrollToId(id);
  };
  return (
    <header class="nav" data-sticky ref={bar}>
      <div class="wrap nav-in">
        <a class="brand" href="#top">
          <Mark class="brand-mark" />
          <span class="brand-word">saboot</span>
          <span class="sr-only">, {tr('brand.home')}</span>
        </a>
        <nav class="nav-links" aria-label={tr('nav.label')}>
          {LINKS.map(([id, k]) => <a key={id} href={'#' + id} onClick={(e) => go(e, id)}>{tr(k)}</a>)}
        </nav>
        <div class="nav-actions">
          <span class="tag tag-sim">
            <span class="dot" aria-hidden="true" />
            <span class="tag-long">{tr('sim.tag')}</span>
            <span class="tag-short" aria-hidden="true">{tr('sim.tagShort')}</span>
          </span>
          <LangSwitch />
          <a class={'pill nav-cta ' + (ctaBlue.value ? 'pill-primary' : 'pill-dark')} href="#simulation" onClick={(e) => go(e, 'simulation')}>
            {tr('nav.run')}{ctaBlue.value && <span class="arrow" aria-hidden="true">→</span>}
          </a>
          <button type="button" class="iconbtn nav-menu" aria-label={tr('nav.menu')} aria-expanded={menuOpen.value} onClick={() => (menuOpen.value = true)}>
            <Icon name="menu" />
          </button>
        </div>
      </div>
      {menuOpen.value && (
        <Sheet title={tr('nav.menuTitle')} onClose={() => (menuOpen.value = false)} closeLabel={tr('nav.close')} class="menu-sheet" modal>
          <nav class="menu-links" aria-label={tr('nav.label')}>
            {LINKS.map(([id, k]) => (
              <a key={id} href={'#' + id} onClick={(e) => go(e, id)}>{tr(k)}<Icon name="arrow" /></a>
            ))}
          </nav>
          <a class="pill pill-primary pill-block" href="#simulation" onClick={(e) => go(e, 'simulation')}>
            {tr('nav.run')} <span class="arrow" aria-hidden="true">→</span>
          </a>
        </Sheet>
      )}
    </header>
  );
}
