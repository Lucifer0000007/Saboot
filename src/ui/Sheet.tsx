// Overlay sheet: right-side drawer on desktop, full-height bottom sheet on mobile (CSS decides).
// Focus-trapped, Esc closes, focus returns to the opener. One component for every dialog.
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Icon } from './Icon';
import { Portal } from './Portal';
import { tr } from '../lib/i18n';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';

// Esc closes the top-most open sheet even when focus has fallen out of it (for example after the button that was
// focused is replaced by a note). A key pressed inside a sheet is handled and stopped there, so this never closes two.
const openSheets: (() => void)[] = [];
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !e.defaultPrevented && openSheets.length) openSheets[openSheets.length - 1]();
  });
}

export function trapFocus(root: HTMLElement, e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const f = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null || x === document.activeElement);
  if (!f.length) { e.preventDefault(); return; }
  const a = f[0], b = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === a || !root.contains(document.activeElement))) { e.preventDefault(); b.focus(); }
  else if (!e.shiftKey && (document.activeElement === b || !root.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
}

export function Sheet({
  title, onClose, children, class: cls, modal, closeLabel = 'Close', headExtra, headSub, lang,
}: {
  title: ComponentChildren;
  onClose: () => void;
  children: ComponentChildren;
  class?: string;
  modal?: boolean;
  closeLabel?: string;
  headExtra?: ComponentChildren;
  /** a label under the title that stays in the sticky header, for example "Design simulation" */
  headSub?: ComponentChildren;
  lang?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef('sh-' + Math.random().toString(36).slice(2, 8)).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const top = () => closeRef.current();
    openSheets.push(top);
    const prev = document.activeElement as HTMLElement | null;
    const root = ref.current!;
    (root.querySelector<HTMLElement>('[autofocus]') ?? root.querySelector<HTMLElement>('.sheet-head button') ?? root).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      trapFocus(root, e);
    };
    root.addEventListener('keydown', onKey);
    document.documentElement.classList.add('sheet-open');
    return () => {
      const i = openSheets.indexOf(top);
      if (i >= 0) openSheets.splice(i, 1);
      root.removeEventListener('keydown', onKey);
      // a sheet closed over another one leaves the page locked for the one still open (audit UI-08)
      if (!openSheets.length) document.documentElement.classList.remove('sheet-open');
      // back to the opener, unless the action that closed the sheet moved focus on itself (a menu link focuses the section
      // heading it scrolled to, audit UI-13)
      const now = document.activeElement;
      if (prev && document.contains(prev) && (!now || now === document.body || root.contains(now))) prev.focus({ preventScroll: true });
    };
  }, []);
  return (
    <Portal>
      <div class={'backdrop' + (modal ? ' modal' : '')} onClick={onClose} aria-hidden="true" />
      <div ref={ref} class={'sheet' + (modal ? ' modal' : '') + (cls ? ' ' + cls : '')} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} lang={lang}>
        <div class="sheet-head">
          <h2 id={id} class="h-sm">{title}</h2>
          <div class="row sheet-tools">
            <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" /><span class="tag-long">{lang === 'en' ? 'Simulation' : tr('sim.tag')}</span><span class="tag-short" aria-hidden="true">{lang === 'en' ? 'Sim' : tr('sim.tagShort')}</span></span>
            {headExtra}
            <button type="button" class="iconbtn" aria-label={closeLabel} onClick={onClose}><Icon name="x" /></button>
          </div>
          {headSub && <div class="sheet-sub">{headSub}</div>}
        </div>
        <div class="sheet-body" tabIndex={0}>{children}</div>
      </div>
    </Portal>
  );
}
