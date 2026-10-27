// Page-level actions shared by the hero, nav, presenter keys and deep links.
import { t, playing, play, model, stopOnceAt } from '../sim/engine';
import { moments } from '../sim/moments';
import { simTab, scrollToId, scrollToPhone, phoneInView, layout } from './layout';

/**
 * "Run the simulation": go to the simulation, show the farmer, and start the replay if it is at T+0. On a phone the page
 * goes to the farmer's phone itself, not the section heading. The replay stops once at the alert, so the person sees the
 * moment the farmer is told and the button to act on it, instead of the clock running on past it (audit F1, J1).
 */
export function runSimulation() {
  simTab.value = 'farmer';
  if (layout.value === 'desktop') scrollToId('simulation');
  // the next frame: a switch from another view has to render the phone first
  else requestAnimationFrame(() => {
    scrollToPhone();
    const h = document.querySelector<HTMLElement>('[data-tour="phone"] h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
  if (!model.value || playing.value || t.value !== 0) return;
  const alert = moments.value.find((m) => m.id === 'alert');
  if (alert) stopOnceAt(alert.t, () => { if (layout.value !== 'desktop' && simTab.value === 'farmer' && phoneInView()) scrollToPhone(); });
  play();
}
