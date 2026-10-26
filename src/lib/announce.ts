import { signal } from '@preact/signals';

/** Screen-reader announcements (rendered into an aria-live region) + visual toasts. */
export const liveMsg = signal('');
/** A new service worker took over this page: the new build shows after a reload (src/main.tsx). */
export const updateReady = signal(false);
/** `text` may be a function, read at render, so a toast still on screen follows a language switch (audit J19). */
export const toast = signal<{ id: number; text: string | (() => string); tone?: 'ok' | 'warn' } | null>(null);
let n = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export function announce(text: string) {
  liveMsg.value = '';
  // next frame so identical consecutive messages are still announced
  requestAnimationFrame(() => (liveMsg.value = text));
}

/** A short visual note (the words also go to the live region). A warning stays 5 s, anything else 3 s (audit H14, S-16). */
export function showToast(text: string | (() => string), tone?: 'ok' | 'warn') {
  toast.value = { id: ++n, text, tone };
  announce(typeof text === 'function' ? text() : text);
  clearTimeout(timer);
  timer = setTimeout(() => (toast.value = null), tone === 'warn' ? 5000 : 3000);
}
