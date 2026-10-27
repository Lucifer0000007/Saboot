// Voice: pre-generated Opus clips first (lazy-loaded), then speechSynthesis, else captions only.
// Captions are always on screen; this module only reports progress for highlighting.
import { signal } from '@preact/signals';
import type { Lang } from '../sim/types';

import { CLIPS } from './clips';
const BCP: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN' };

export const speakingId = signal<string | null>(null);
export const progress = signal(0); // 0..1 through the caption text
export const voiceNA = signal<Lang | null>(null);

let audio: HTMLAudioElement | null = null;
/** Bumps with every stop (and so every say()): a voice list that arrives after the person moved on must not speak the old text. */
let turn = 0;

export function stopVoice() {
  turn++;
  if (audio) { audio.pause(); audio = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  speakingId.value = null;
}

function done() {
  progress.value = 1;
  speakingId.value = null;
}

/**
 * A voice that runs on the device. The consent sentence carries the farmer's and the helper's names, and some browsers send
 * text to a remote voice: those are never used. No local voice for the language means captions only (null). An empty list
 * means the browser has not loaded its voices yet (undefined): say() waits for them, briefly, and never speaks without one.
 */
function pickVoice(lang: Lang): SpeechSynthesisVoice | null | undefined {
  const all = speechSynthesis.getVoices();
  if (!all.length) return undefined;
  const vs = all.filter((v) => v.localService);
  const want = BCP[lang].toLowerCase();
  return vs.find((v) => v.lang.toLowerCase().replace('_', '-') === want) ?? vs.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

/** Chrome on Android, among others, returns no voices until it has loaded them; wait for that, for at most a second. */
function voicesLoaded(): Promise<void> {
  return new Promise((res) => {
    const done = () => { clearTimeout(timer); speechSynthesis.removeEventListener('voiceschanged', done); res(); };
    const timer = setTimeout(done, 1000);
    speechSynthesis.addEventListener('voiceschanged', done);
  });
}

export async function say(id: string, text: string, lang: Lang, clip?: string) {
  stopVoice();
  const my = turn;
  voiceNA.value = null;
  speakingId.value = id;
  progress.value = 0;
  if (clip && CLIPS[clip]?.includes(lang)) {
    try {
      const a = new Audio(`audio/${clip}-${lang}.webm`);
      audio = a;
      a.ontimeupdate = () => { if (a.duration) progress.value = a.currentTime / a.duration; };
      a.onended = done;
      await a.play();
      return;
    } catch {
      audio = null; // fall through to speech synthesis
    }
  }
  if ('speechSynthesis' in window) {
    let v = pickVoice(lang);
    if (v === undefined) {
      await voicesLoaded();
      if (my !== turn) return;
      v = pickVoice(lang);
    }
    // only ever an explicit voice that runs on the phone: the browser's default for a language may be a remote one
    if (!v) {
      voiceNA.value = lang;
      speakingId.value = null;
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP[lang];
    u.voice = v;
    u.rate = 0.92;
    u.onboundary = (e) => { progress.value = e.charIndex / text.length; };
    u.onend = done;
    u.onerror = () => { speakingId.value = null; };
    speechSynthesis.speak(u);
    return;
  }
  voiceNA.value = lang;
  speakingId.value = null;
}
