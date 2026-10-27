// Back goes back one farmer screen or console view before it leaves the site (audit R1, UI-03). Each place the person goes
// on to (a farmer screen, the farmer a helper opens, a simulation tab, a console view) is one step Back returns from.
// Coming back to a place already on the way (a tab tapped again, Home, the helper's queue) drops the steps after it, so
// Back never walks through every tap. The tour drives these places itself and records none.
import { effect, batch } from '@preact/signals';
import { onBack } from '../lib/back';
import { screen, type Screen } from '../farmer/nav';
import { activePlotId } from '../sim/engine';
import { tourStep } from '../tour/state';
import { current } from '../farmer/FarmerApp';
import { simTab, insurerView, deepLinkDone, type SimTab, type InsurerView } from './layout';

/** `s` is the screen asked for (null: the one the replay leads to), `shown` the one on screen. */
interface Place { s: Screen | null; shown: Screen; plot: string | null; tab: SimTab; view: InsurerView }
/** Where a visit starts: the farmer's own home, the worklist behind it. Back from here leaves the site. */
const START = { shown: 'home', plot: null, tab: 'farmer', view: 'claims' } as const;
/** The same place to the person: what is on screen, not how it was asked for. */
const same = (a: Omit<Place, 's'>, b: Omit<Place, 's'>) => a.shown === b.shown && a.plot === b.plot && a.tab === b.tab && a.view === b.view;

const steps: { at: Place; release: () => void }[] = [];
const cut = (n: number) => steps.splice(n).forEach((x) => x.release());
const here = (): Place => ({ s: screen.peek(), shown: current.peek(), plot: activePlotId.peek(), tab: simTab.peek(), view: insurerView.peek() });

/** Start recording once the link's tab and moment are applied: the place a link (or a reload) lands on is the start. */
export function watchPlaces() {
  let last: Place | null = null;
  let queued = false;
  const settle = () => {
    queued = false;
    const now = here(), from = last;
    last = now;
    // the replay moving the farmer on by itself (s stays null) is not a step
    if (!from || tourStep.peek() !== null || same(now, from) || (now.s === from.s && now.plot === from.plot && now.tab === from.tab && now.view === from.view)) return;
    if (same(now, START)) return cut(0);
    const i = steps.findIndex((x) => same(x.at, now));
    if (i >= 0) return cut(i);
    const step = {
      at: from,
      release: onBack(() => {
        const k = steps.indexOf(step);
        if (k < 0) return;
        cut(k);
        last = { ...from, s: from.shown };
        // the screen the person saw there, even if the replay would lead elsewhere now
        batch(() => { screen.value = from.shown; activePlotId.value = from.plot; simTab.value = from.tab; insurerView.value = from.view; });
      }),
    };
    steps.push(step);
  };
  return effect(() => {
    void [screen.value, current.value, activePlotId.value, simTab.value, insurerView.value];
    // once the current task is done: opening a helper's farmer changes the farmer and the screen, one step in all
    if (deepLinkDone.value && !queued) { queued = true; queueMicrotask(settle); }
  });
}
