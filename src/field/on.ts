// Field mode switch (owner's minimal field mode): real photos for a real farmer, kept apart from the simulation.
// Tiny on purpose: it lives in the initial chunk; the field screens themselves are a lazy chunk (src/field/FieldMode.tsx).
import { signal } from '@preact/signals';

const hasDom = typeof location !== 'undefined';
export const fieldOn = signal(hasDom && new URLSearchParams(location.search).get('mode') === 'field');

function mark(on: boolean) {
  const u = new URL(location.href);
  if (on) u.searchParams.set('mode', 'field');
  else u.searchParams.delete('mode');
  history.replaceState(history.state, '', u.href);
}

export function enterField() {
  fieldOn.value = true;
  mark(true);
  // a sheet that just closed (the settings) steps the history back after this: mark that entry too, once
  addEventListener('popstate', () => mark(fieldOn.value), { once: true });
  scrollTo(0, 0);
}

/** Back to the simulation, exactly as it was: field mode never touches the demo's state. */
export function leaveField() {
  fieldOn.value = false;
  mark(false);
  scrollTo(0, 0);
}
