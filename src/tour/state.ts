import { signal } from '@preact/signals';

/** Index of the active judge-tour step, or null when the tour is closed. */
export const tourStep = signal<number | null>(null);
export function startTour() {
  tourStep.value = 0;
}
