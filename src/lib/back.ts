// Android Back (the gesture or the button) closes what is on top before it leaves the site (audit R1, UI-03). Every open
// layer (a sheet, the camera, the tour, a farmer screen or console view the person went on to) owns one history entry, kept
// in history.state only: the address never changes, so deep links and the inline boot script are not affected. Back
// closes the top layer; a layer that closes itself (X, Esc, a tap) gives its entry back, so the history is never longer
// than what is open.
const layers: (() => void)[] = [];
/** This page's entries at and below the current one (history.state.sab). */
let depth = 0;
/** A history.go() of ours is on its way: nothing is pushed until it has landed. */
let moving = false;
let queued = false;
/** Until when a download or a move to another page is starting: a history call now would cancel it (Chrome does). */
let leaving = 0;

function reconcile() {
  queued = false;
  if (moving) return;
  const wait = leaving - performance.now();
  if (wait > 0) { queued = true; setTimeout(reconcile, wait); return; }
  // a browser that limits history calls (Firefox throws after many in a short time) only loses the Back step
  try {
    while (depth < layers.length) history.pushState({ sab: ++depth }, '');
    if (layers.length < depth) { moving = true; history.go(layers.length - depth); }
  } catch { moving = false; }
}
/** After the render that opened or closed a layer: a sheet closed and another opened in one tap moves the history once. */
const later = () => { if (!queued) { queued = true; setTimeout(reconcile, 0); } };

if (typeof window !== 'undefined') {
  // the page itself says where Back lands, so a Back step does not also jump to an old scroll position (and a reload comes
  // back by section, src/site/resume.ts, not by a pixel offset that by then shows another section)
  history.scrollRestoration = 'manual';
  // a reload keeps the entry the page was on: its layers are gone, so their entries go too
  depth = (history.state as { sab?: number } | null)?.sab ?? 0;
  if (depth) later();
  // the Navigation API says when a link starts a download or the page reloads itself (where the browser has it)
  type Nav = { addEventListener(t: 'navigate', f: (e: { downloadRequest: string | null; destination: { sameDocument: boolean } }) => void): void };
  (window as unknown as { navigation?: Nav }).navigation?.addEventListener('navigate', (e) => {
    if (e.downloadRequest !== null || !e.destination.sameDocument) leaving = performance.now() + 1500;
  });
  addEventListener('popstate', () => {
    depth = (history.state as { sab?: number } | null)?.sab ?? 0;
    if (moving) moving = false;
    // the person went back: close what was opened after the entry they are on now, the top one first
    else layers.slice(depth).reverse().forEach((close) => close());
    later();
  });
}

/** Back closes this layer while it is open. Returns the release, called when the layer closes in any other way. */
export function onBack(close: () => void): () => void {
  const layer = () => close();
  layers.push(layer);
  later();
  return () => {
    const i = layers.indexOf(layer);
    if (i < 0) return;
    layers.splice(i, 1);
    later();
  };
}
