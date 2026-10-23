import { signal } from '@preact/signals';

/** Screen-reader announcements (rendered into an aria-live region) + visual toasts. */
export const liveMsg = signal('');
export const toast = signal<{ id: number; text: string; tone?: 'ok' | 'warn' } | null>(null);
let n = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export function announce(text: string) {
  liveMsg.value = '';
  // next frame so identical consecutive messages are still announced
  requestAnimationFrame(() => (liveMsg.value = text));
}

export function showToast(text: string, tone?: 'ok' | 'warn') {
  toast.value = { id: ++n, text, tone };
  announce(text);
  clearTimeout(timer);
  timer = setTimeout(() => (toast.value = null), 5000);
}
