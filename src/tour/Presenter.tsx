// Presenter mode: global keyboard shortcuts for live demos + an optional heads-up display.
import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { fmtClock, fmtT } from '../lib/time';
import { showToast } from '../lib/announce';
import { setLang, langReady } from '../lib/i18n';
import { network, voiceMode, textScale, lowData, rail, cadence } from '../lib/prefs';
import { SCENARIO } from '../generated/scenario-summary';
import { simTab, insurerView, scrollToId, type SimTab } from '../site/layout';
import { t, toggle, seek, pause, playing, speed, HOURS } from '../sim/engine';
import { moments, jumpTo, type MomentId } from '../sim/moments';
import { requestReset } from '../ui/ControlBar';
import { startTour, tourStep } from './state';

export const hud = signal(false);
export const help = signal(false);

const KEYS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['← / →', 'Back / forward 1 hour (Shift: 12 hours)'],
  ['1 – 6', 'Trigger · Alert · Capture · Deadline · Confirmation · Draft list (relief only)'],
  ['S', 'Cycle speed 1x / 10x / 100x'],
  ['F · D · B · E', 'Farmer · Dashboard · Tamper check (audit ledger) · Explainer'],
  ['H', 'Scroll to How it works'],
  ['M', 'Process: relief assessment / PMFBY intimation'],
  ['C', 'Radar passes: demo cadence / slower cadence'],
  ['A', 'Airplane mode (offline queue)'],
  ['W', 'Weak network (2G, fingerprints first)'],
  ['L', 'Cycle language EN / HI / PA'],
  ['V', 'Voice mode'],
  ['G · Z', 'Text size 100 / 125 / 150% · Low-data mode'],
  ['T', 'Start the judge tour'],
  ['R', 'Reset the replay'],
  ['P', 'Presenter heads-up display'],
  ['?', 'This help'],
];
const MOMENT_KEYS: MomentId[] = ['trigger', 'alert', 'capture', 'deadline', 'confirm', 'draft'];
const go = (tab: SimTab) => { simTab.value = tab; scrollToId('simulation', false); };

function onKey(e: KeyboardEvent) {
  const el = e.target instanceof Element ? e.target : document.body;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (el.closest('input, select, textarea, [contenteditable], [role=dialog]')) return;
  if (tourStep.value !== null && ['ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const stop = () => e.preventDefault();
  if (k === ' ' && !el.closest('button, a, summary, [role=button], [role=switch], [role=tab], [role=radio]')) { stop(); toggle(); return; }
  if (k === 'ArrowRight' || k === 'ArrowLeft') {
    if (el.closest('[role=tablist], [role=radiogroup], input[type=range]')) return;
    stop(); pause(); seek(t.value + (k === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 12 : 1)); return;
  }
  if (/^[1-6]$/.test(k)) {
    const id = MOMENT_KEYS[+k - 1];
    const mm = moments.value.find((x) => x.id === id);
    if (!mm) return; // the draft list exists on the relief rail only
    stop(); jumpTo(id); showToast(mm.label); return;
  }
  switch (k) {
    case 's': speed.value = speed.value === 1 ? 10 : speed.value === 10 ? 100 : 1; showToast(`Speed ${speed.value}x`); break;
    case 'f': go('farmer'); break;
    case 'd': go('insurer'); break;
    case 'b': insurerView.value = 'ledger'; go('insurer'); break;
    case 'e': go('explainer'); break;
    case 'h': scrollToId('how'); break;
    case 'm': rail.value = rail.value === 'relief' ? 'pmfby' : 'relief'; showToast(rail.value === 'relief' ? 'Relief assessment: capture-soon advice, officer decides' : 'PMFBY intimation: 72-hour window'); break;
    case 'c': cadence.value = cadence.value === 'demo' ? 'slow' : 'demo'; showToast(cadence.value === 'demo' ? `Radar every ${SCENARIO.radarCadenceHours} h (demo, simulated)` : `Radar every ${SCENARIO.radarSlowCadenceHours} h (slower, simulated)`); break;
    case 'a': network.value = network.value === 'offline' ? 'online' : 'offline'; showToast(network.value === 'offline' ? 'Airplane mode on — captures will queue' : 'Back online — syncing the queue'); break;
    case 'w': network.value = network.value === 'weak' ? 'online' : 'weak'; showToast(network.value === 'weak' ? 'Weak network (2G): fingerprints first' : 'Network back to normal'); break;
    case 'l': { const order = ['en', 'hi', 'pa'] as const; setLang(order[(order.indexOf(langReady.value) + 1) % 3]); break; }
    case 'v': voiceMode.value = !voiceMode.value; showToast(voiceMode.value ? 'Voice mode on' : 'Voice mode off'); break;
    case 'g': textScale.value = textScale.value === 100 ? 125 : textScale.value === 125 ? 150 : 100; showToast(`Text size ${textScale.value}%`); break;
    case 'z': lowData.value = !lowData.value; showToast(lowData.value ? 'Low-data mode on' : 'Low-data mode off'); break;
    case 't': startTour(); break;
    case 'r': requestReset(); break;
    case 'p': hud.value = !hud.value; break;
    case '?': help.value = !help.value; break;
    default: return;
  }
  stop();
}

export function Presenter() {
  useEffect(() => {
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  const next = moments.value.find((m) => m.t > t.value + 0.05);
  return (
    <>
      {hud.value && (
        <aside class="hud" aria-label="Presenter heads-up display" lang="en">
          <strong class="num">{fmtT(t.value)}</strong>
          <span class="num">{fmtClock(t.value)} IST · {playing.value ? `playing ${speed.value}x` : 'paused'}</span>
          <span>{rail.value === 'relief' ? 'Relief assessment' : 'PMFBY intimation'} · radar {cadence.value === 'demo' ? `every ${SCENARIO.radarCadenceHours} h (demo)` : `every ${SCENARIO.radarSlowCadenceHours} h (slower)`}</span>
          <span>Next: {next ? `${next.label} at ${fmtT(next.t)}` : '—'} · <span class="num">{Math.round((t.value / HOURS) * 100)}%</span></span>
          <span class="muted">Press ? for shortcuts · P to hide</span>
        </aside>
      )}
      {help.value && (
        <Sheet title={<><Icon name="keyboard" /> Presenter shortcuts</>} onClose={() => (help.value = false)} closeLabel="Close shortcuts" class="center keys" modal lang="en">
          <dl class="keylist">
            {KEYS.map(([k, d]) => <div key={k}><dt><kbd>{k}</kbd></dt><dd>{d}</dd></div>)}
          </dl>
        </Sheet>
      )}
    </>
  );
}
