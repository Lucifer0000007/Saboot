// In-page layout checks (spec §10.2). Self-contained: Playwright serialises this function into the page.
export interface CheckOpts {
  only?: string[]; // run a subset: overflow, clip, overlap, sticky, targets, labels, svgsize, blue, simlabel, prov, tokens
  stickyMax?: number; // max share of the viewport sticky chrome may take (mobile)
}

export function runChecks(opts: CheckOpts): string[] {
  const out: string[] = [];
  const want = (k: string) => !opts.only || opts.only.includes(k);
  const W = innerWidth, H = innerHeight;

  const hidden = (el: Element) => {
    if (el.closest('[aria-hidden="true"], [inert], .sr-only, template')) return true;
    const cs = getComputedStyle(el);
    return cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0;
  };
  const desc = (el: Element) => {
    const id = el.id ? '#' + el.id : '';
    const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2).map((c) => '.' + c).join('');
    const txt = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
    return `${el.tagName.toLowerCase()}${id}${cls} "${txt}"`;
  };
  /** The element's rect clipped by every scrolling/clipping ancestor; null if nothing is visible. */
  const visRect = (el: Element) => {
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) return null;
    let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const ar = a.getBoundingClientRect();
        x1 = Math.max(x1, ar.left); y1 = Math.max(y1, ar.top); x2 = Math.min(x2, ar.right); y2 = Math.min(y2, ar.bottom);
        if (x2 - x1 < 0.5 || y2 - y1 < 0.5) return null;
      }
      if (cs.position === 'fixed') break;
    }
    return { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 };
  };
  const layerCache = new Map<Element, Element | null>();
  const layer = (el: Element): Element | null => {
    if (layerCache.has(el)) return layerCache.get(el)!;
    let res: Element | null = null;
    for (let a: Element | null = el; a && a !== document.body; a = a.parentElement) {
      const p = getComputedStyle(a).position;
      if (p === 'fixed' || p === 'sticky') { res = a; break; }
    }
    layerCache.set(el, res);
    return res;
  };

  // 1. no horizontal page scroll
  if (want('overflow')) {
    const de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + 1) {
      const wide = [...document.querySelectorAll('body *')]
        .filter((e) => !hidden(e) && e.getBoundingClientRect().right > de.clientWidth + 1)
        .slice(-3).map(desc);
      out.push(`horizontal overflow: scrollWidth ${de.scrollWidth} > ${de.clientWidth} (${wide.join(' | ')})`);
    }
  }

  // 2. no clipped text in overflow:hidden / ellipsis boxes (dense dashboard cells opt out with data-clip-ok)
  if (want('clip')) {
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.closest('svg, [data-clip-ok]') || hidden(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.overflowX !== 'hidden' && cs.overflowX !== 'clip' && cs.textOverflow !== 'ellipsis') continue;
      if (!(el.textContent || '').trim() || el.clientWidth <= 1 || el.clientHeight <= 1) continue; // visually-hidden technique
      if (el.scrollWidth > el.clientWidth + 1) out.push(`clipped text: ${desc(el)} (${el.scrollWidth} > ${el.clientWidth})`);
    }

    // 2b. nothing spills out of a visible box either (a tab label running into its neighbour, a countdown past the
    //     card edge). Absolutely positioned decoration (washes, glows) may extend; scroll containers are fine.
    //     Only the innermost box is reported.
    const range = document.createRange();
    const spills: Element[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.clientWidth <= 1 || el.scrollWidth <= el.clientWidth + 1) continue;
      if (el.closest('svg, [data-clip-ok]') || hidden(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.overflowX !== 'visible' || cs.display === 'contents') continue;
      const vr = visRect(el);
      if (!vr || vr.width <= 1 || vr.height <= 1) continue;
      const edge = el.getBoundingClientRect().left + el.clientLeft + el.clientWidth + 1;
      const decor = (d: Element) => {
        for (let a: Element | null = d; a && a !== el; a = a.parentElement) {
          if (/^(absolute|fixed)$/.test(getComputedStyle(a).position)) return true;
        }
        return false;
      };
      const textOut = [...el.childNodes].some((n) => {
        if (n.nodeType !== 3 || !(n.textContent || '').trim()) return false;
        range.selectNodeContents(n);
        return range.getBoundingClientRect().right > edge;
      });
      const boxOut = !textOut && [...el.querySelectorAll('*')].some((d) => !(d.closest('svg') && d.tagName !== 'svg') && !hidden(d) && !decor(d) && d.getBoundingClientRect().right > edge);
      if (textOut || boxOut) spills.push(el);
    }
    for (const el of spills) {
      if (!spills.some((o) => o !== el && el.contains(o))) out.push(`content spills out of its box: ${desc(el)} (${el.scrollWidth} > ${el.clientWidth})`);
    }
  }

  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=radio], [role=switch], [role=checkbox]';
  const items = [...document.querySelectorAll(SEL)]
    .filter((e) => !e.closest('svg') && !hidden(e))
    .map((e) => ({ e, r: visRect(e) }))
    .filter((x): x is { e: Element; r: NonNullable<ReturnType<typeof visRect>> } => !!x.r);

  // 3. no overlapping interactive elements within the same layer
  if (want('overlap')) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j];
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        if (layer(a.e) !== layer(b.e)) continue;
        const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (ix > 1 && iy > 1) out.push(`overlap ${Math.round(ix)}×${Math.round(iy)}: ${desc(a.e)} ⟷ ${desc(b.e)}`);
      }
    }
  }

  // 3b. sticky chrome never hides another sticky bar's controls (e.g. a wrapped nav under the control bar)
  if (want('sticky-cover') && !document.querySelector('.backdrop, .tour-card')) {
    for (const { e, r } of items) {
      const own = e.closest('[data-sticky]');
      if (!own || r.top < 0 || r.bottom > H) continue;
      const hit = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
      if (!hit || hit === e || e.contains(hit)) continue;
      const cover = hit.closest('[data-sticky]');
      if (cover && cover !== own) out.push(`sticky control covered by another sticky bar: ${desc(e)}`);
    }
  }

  // 4. sticky chrome leaves >= 70% of the viewport (mobile)
  if (want('sticky') && opts.stickyMax) {
    let used = 0;
    for (const el of document.querySelectorAll('[data-sticky]')) {
      if (hidden(el)) continue;
      const r = el.getBoundingClientRect();
      const stuckTop = r.top <= 1 && r.bottom > 0;
      const stuckBottom = r.bottom >= H - 1 && r.top < H;
      if (stuckTop || stuckBottom) used += Math.min(r.bottom, H) - Math.max(r.top, 0);
    }
    if (used > opts.stickyMax * H) out.push(`sticky chrome uses ${Math.round(used)}px of ${H}px (> ${Math.round(opts.stickyMax * 100)}%)`);
  }

  // 5. touch targets: >= 48px in the farmer app (with >= 12px between them), >= 44px elsewhere; inline text links exempt
  if (want('targets')) {
    const farmer: typeof items = [];
    for (const { e, r: vr } of items) {
      if (e.tagName === 'A' && getComputedStyle(e).display === 'inline' && /^(P|LI|DD|SPAN|SMALL|TD)$/.test(e.parentElement?.tagName || '')) continue;
      let r = e.getBoundingClientRect();
      if (e.matches('input[type=checkbox], input[type=radio]')) { const l = e.closest('label'); if (l) r = l.getBoundingClientRect(); }
      if (e.matches('input[type=file]')) continue;
      const inFarmer = !!e.closest('.farmer');
      const min = inFarmer ? 48 : 44;
      if (r.width < min - 0.5 || r.height < min - 0.5) out.push(`small target ${Math.round(r.width)}×${Math.round(r.height)} (< ${min}): ${desc(e)}`);
      const full = e.getBoundingClientRect();
      const clipped = Math.abs(full.top - vr.top) + Math.abs(full.bottom - vr.bottom) + Math.abs(full.left - vr.left) + Math.abs(full.right - vr.right) > 1;
      if (inFarmer && !clipped && !e.matches('input[type=checkbox], input[type=radio]')) farmer.push({ e, r: vr });
    }
    for (let i = 0; i < farmer.length; i++) {
      for (let j = i + 1; j < farmer.length; j++) {
        const a = farmer[i], b = farmer[j];
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        const gx = Math.max(b.r.left - a.r.right, a.r.left - b.r.right);
        const gy = Math.max(b.r.top - a.r.bottom, a.r.top - b.r.bottom);
        if (gx < 11.5 && gy < 11.5) out.push(`farmer targets closer than 12px (${Math.round(Math.max(gx, gy))}px): ${desc(a.e)} ⟷ ${desc(b.e)}`);
      }
    }
  }

  // 6. every image and top-level SVG is labelled or hidden from assistive tech
  if (want('labels')) {
    for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) out.push(`img without alt: ${desc(img)}`);
    for (const svg of document.querySelectorAll('svg')) {
      if (svg.parentElement?.closest('svg') || svg.closest('[aria-hidden="true"]')) continue;
      const named = svg.getAttribute('aria-label') || svg.getAttribute('aria-labelledby') || svg.querySelector(':scope > title');
      if (!named || !svg.getAttribute('role')) out.push(`unlabelled svg: ${desc(svg)}`);
    }
  }

  // 6b. an svg with a declared pixel size (an icon, a legend swatch) never draws much larger than that. A stray
  // `svg { width: 100% }` rule once stretched the river legend swatches to 300 px, below the fold where a screenshot
  // of the top of the screen cannot see it; this check reads the whole page.
  if (want('svgsize')) {
    for (const svg of document.querySelectorAll('svg[width][height]')) {
      if (svg.parentElement?.closest('svg')) continue;
      const w = parseFloat(svg.getAttribute('width') || ''), h = parseFloat(svg.getAttribute('height') || '');
      if (!(w > 0 && h > 0) || getComputedStyle(svg).display === 'none') continue;
      const r = svg.getBoundingClientRect();
      if (r.width > w * 2 + 2 || r.height > h * 2 + 2) out.push(`svg declared ${w}×${h} but drawn ${Math.round(r.width)}×${Math.round(r.height)}: ${desc(svg)}`);
    }
  }

  // 7. at most one lake-blue filled button visible on screen
  if (want('blue')) {
    const blues = items.filter(({ e, r }) => {
      if (getComputedStyle(e).backgroundColor !== 'rgb(43, 89, 209)') return false;
      if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return false;
      const hit = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
      return !!hit && (hit === e || e.contains(hit));
    });
    if (blues.length > 1) out.push(`${blues.length} blue primary buttons on screen: ${blues.map((b) => desc(b.e)).join(' | ')}`);
  }

  // 8. every visible region with simulated numbers carries a "Simulated" label; the SIM indicator is always on screen
  if (want('simlabel')) {
    for (const p of document.querySelectorAll('[data-sim-numbers]')) {
      if (hidden(p) || !visRect(p)) continue;
      const labels = [...p.querySelectorAll('[data-sim-label]'), ...(p.matches('[data-sim-label]') ? [p] : [])];
      if (!labels.some((l) => !hidden(l))) out.push(`simulated numbers without a "Simulated" label: ${desc(p)}`);
    }
    const onScreen = [...document.querySelectorAll('.nav .tag-sim, [data-sim-label], .f-sim, .ann')].some((el) => {
      if (hidden(el)) return false;
      const r = visRect(el);
      if (!r || r.bottom <= 0 || r.top >= H) return false;
      const hit = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
      return !!hit && (hit === el || el.contains(hit));
    });
    if (!onScreen) out.push('no SIMULATION indicator visible on this screen');
  }

  // 8b. every value carries a valid provenance label (LIVE, REPLAY, SIMULATED, HAND, or "not recorded" for an old packet), and
  //     no latitude/longitude is printed outside a labelled element: a coordinate must always say where it came from
  if (want('prov')) {
    const valid = ['live', 'replay', 'sim', 'hand', 'unrecorded'];
    for (const el of document.querySelectorAll('[data-v]')) {
      const p = el.getAttribute('data-prov');
      if (!p || !valid.includes(p)) out.push(`value without a valid provenance label (data-prov="${p ?? ''}"): ${desc(el)}`);
    }
    const coord = /-?\d{1,2}\.\d{3,}°?\s*[NS]?,?\s+-?\d{1,3}\.\d{3,}°?\s*[EW]?/;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest('script, style, template, [data-prov]')) continue;
      if (coord.test(n.textContent || '')) out.push(`a coordinate outside any provenance label: ${desc(el)}`);
    }
  }

  // 9. no raw {token} in the copy: a string that was meant to be filled in and was not. Reads the text itself, so the
  //    answer in a closed <details> counts too.
  if (want('tokens')) {
    const raw = /\{[A-Za-z][A-Za-z0-9_]*\}/;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      const m = el && !el.closest('script, style, template') ? raw.exec(n.textContent || '') : null;
      if (el && m) out.push(`raw placeholder ${m[0]} in the copy: ${desc(el)}`);
    }
    for (const el of document.querySelectorAll('[aria-label], [title], [alt], [placeholder]')) {
      for (const a of ['aria-label', 'title', 'alt', 'placeholder']) {
        const m = raw.exec(el.getAttribute(a) || '');
        if (m) out.push(`raw placeholder ${m[0]} in ${a}: ${desc(el)}`);
      }
    }
  }
  return out;
}

/** Pseudo-localisation: grow every visible text node by ~40% with word-like filler (spec §10.3). */
export function pseudoLocalize() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    const p = t.parentElement;
    if (!p || p.closest('script, style, svg, [aria-hidden="true"]') || !t.data.trim()) continue;
    nodes.push(t);
  }
  for (const t of nodes) {
    const add = Math.ceil(t.data.trim().length * 0.4);
    let filler = '';
    while (filler.length < add) filler += (filler ? ' ' : '') + 'ẋåmþlé'.slice(0, Math.min(6, add - filler.length));
    t.data = t.data.replace(/\s*$/, (ws) => ' ' + filler + ws);
  }
  return nodes.length;
}
