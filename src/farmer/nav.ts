import { signal } from '@preact/signals';

export type Screen = 'home' | 'capture' | 'packet' | 'file' | 'status' | 'assist' | 'helper';
/** null = derive the screen from the replay state. */
export const screen = signal<Screen | null>(null);
export const settingsOpen = signal(false);
