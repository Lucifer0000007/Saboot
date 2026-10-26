// Speech uses voices that run on the phone only (audit CC-06). The consent sentence holds the farmer's and the helper's names,
// and a browser's default voice for a language can be a remote one that sends the text away. Chrome on Android often has no
// voices on the first call: the text must then wait for the list, and never be handed to speak() without a local voice.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

type V = { lang: string; localService: boolean; name: string };
let voices: V[] = [];
const spoken: { voice: V | null; lang: string }[] = [];
const listeners = new Set<() => void>();
const synth = {
  getVoices: () => voices,
  speak: (u: { voice: V | null; lang: string }) => spoken.push({ voice: u.voice, lang: u.lang }),
  cancel: () => {},
  addEventListener: (_: string, f: () => void) => listeners.add(f),
  removeEventListener: (_: string, f: () => void) => listeners.delete(f),
};
const g = globalThis as Record<string, unknown>;
g.window = globalThis;
g.speechSynthesis = synth;
g.SpeechSynthesisUtterance = class { voice: V | null = null; lang = ''; rate = 1; onboundary = null; onend = null; onerror = null; text: string; constructor(text: string) { this.text = text; } };

const { say, voiceNA } = await import('../../src/lib/voice.ts');

/** The browser finishes loading its voices a moment later. */
function loadLater(list: V[]) {
  setTimeout(() => { voices = list; for (const f of [...listeners]) f(); }, 20);
}

beforeEach(() => {
  voices = [];
  spoken.length = 0;
  listeners.clear();
});

test('no voices yet, and only a remote one arrives: nothing is spoken, captions only', async () => {
  loadLater([{ lang: 'hi-IN', localService: false, name: 'Google हिन्दी' }]);
  await say('c', 'मैं, राम, सहमति देता हूँ', 'hi');
  assert.deepEqual(spoken, [], 'the text never reached speak()');
  assert.equal(voiceNA.value, 'hi');
});

test('no voices yet, then a local one arrives: it speaks, with that voice set explicitly', async () => {
  const local = { lang: 'hi-IN', localService: true, name: 'Hindi (device)' };
  loadLater([{ lang: 'hi-IN', localService: false, name: 'Google हिन्दी' }, local]);
  await say('c', 'नमस्ते', 'hi');
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].voice, local);
});

test('voices never arrive: after the short wait, captions only, nothing spoken', async () => {
  await say('c', 'hello', 'en');
  assert.deepEqual(spoken, []);
  assert.equal(voiceNA.value, 'en');
});
