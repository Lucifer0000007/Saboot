import { useMemo } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { tr, trr } from '../lib/i18n';
import { lang, lowData } from '../lib/prefs';
import { say, stopVoice, speakingId, progress, voiceNA } from '../lib/voice';
import { fmtCountdown, fmtCountdownWords } from '../lib/time';
import { model, focusPlot } from '../sim/engine';
import type { ShotKind } from './photo';

/** Captions are always visible; the current sentence is highlighted while voice plays. */
export function VoiceCaption({ id, text, clip, label }: { id: string; text: string; clip?: string; label?: string }) {
  const active = speakingId.value === id;
  const parts = useMemo(() => text.match(/[^.!?।]+[.!?।]?\s*/g) ?? [text], [text]);
  let acc = 0;
  const at = progress.value * text.length;
  return (
    <div class="voice">
      <button
        type="button"
        class={'pill pill-ghost voice-btn' + (active ? ' on' : '')}
        aria-pressed={active}
        onClick={() => (active ? stopVoice() : say(id, text, lang.value, clip))}
      >
        <Icon name={active ? 'mute' : 'volume'} />
        {active ? tr('f.stop') : label ?? tr('f.read')}
      </button>
      <p class="captions" aria-label={tr('f.captions')}>
        {parts.map((s, i) => {
          const start = acc;
          acc += s.length;
          const cur = active && at >= start && at < acc;
          return <span key={i} class={cur ? 'cur' : undefined}>{s}</span>;
        })}
      </p>
      {voiceNA.value === lang.value && <p class="note note-warn" role="status"><Icon name="info" /><span>{tr('f.voiceNA')}</span></p>}
    </div>
  );
}

/**
 * Countdown tones: ink > 24 h, amber < 24 h, amber + "last hours" < 6 h, red only once a RULE has expired (PMFBY).
 * On the relief rail the window is advice, not a deadline: it never turns red and ends in a quiet "passed" tone.
 */
export function countdownTone(left: number, hard = true) {
  return left <= 0 ? (hard ? 'over' : 'passed') : left < 6 ? 'last' : left < 24 ? 'amber' : 'ink';
}

export function Countdown({ left, total, hard = true }: { left: number; total: number; hard?: boolean }) {
  const pct = Math.max(0, Math.min(1, left / total));
  const tone = countdownTone(left, hard);
  return (
    <div class={'countdown ' + tone}>
      {hard ? (
        <div class="count num" role="timer" aria-label={trr('al.clock')}>{fmtCountdown(left)}</div>
      ) : (
        <div class="count words" role="timer" aria-label={trr('al.clock')}>{fmtCountdownWords(left)}</div>
      )}
      {tone === 'last' && <span class="tag tag-warn last-tag"><Icon name="clock" size={16} />{trr('al.lastHours')}</span>}
      {!hard && <span class="tag advice-tag"><Icon name="info" size={16} />{tr('al.advice')}</span>}
      <div class="bar" aria-hidden="true"><i style={{ transform: `scaleX(${pct})` }} /></div>
    </div>
  );
}

/** Small locator map of the farmer's plot with a pin (hidden in low-data mode). */
export function PlotMini() {
  const m = model.value, p = focusPlot.value;
  if (!m || !p || lowData.value) return null;
  const vb = `${p.cx - 70} ${p.cy - 48} 140 96`;
  const near = m.plots.filter((q) => q.v === p.v && q.id !== p.id);
  return (
    <svg class="mini decor" viewBox={vb} role="img" aria-label={`${tr('reg.plot')} ${p.id}, ${p.village}`}>
      <rect x={p.cx - 70} y={p.cy - 48} width="140" height="96" fill="var(--sunk)" />
      <path d={m.raw.map.river} fill="none" stroke="var(--water)" stroke-width="7" stroke-linecap="round" />
      {near.map((q) => <polygon key={q.id} points={q.pts.join(' ')} fill="var(--silt)" stroke="var(--rule-strong)" stroke-width=".6" />)}
      <polygon points={p.pts.join(' ')} fill="var(--neel-tint)" stroke="var(--kali)" stroke-width="1.2" />
      <g transform={`translate(${p.cx} ${p.cy - 4})`}>
        <path d="M0 4c-4-5-6-7.5-6-10.5a6 6 0 0 1 12 0C6-3.5 4-1 0 4z" fill="var(--kali)" stroke="var(--silt)" stroke-width="1" />
        <circle cy="-6.5" r="2.2" fill="var(--silt)" />
      </g>
    </svg>
  );
}

/** Framing pictograms for the fixed shot list (line drawings, journal style). */
export function ShotPicto({ kind }: { kind: ShotKind }) {
  const ink = 'var(--kali)';
  return (
    <svg class="picto" viewBox="0 0 120 80" aria-hidden="true">
      <rect x="1" y="1" width="118" height="78" rx="10" fill="var(--silt)" stroke={ink} stroke-width="1.2" />
      {kind === 'wide' && (
        <g fill="none" stroke={ink} stroke-width="1.2" stroke-linecap="round">
          <path d="M1 40h118" />
          <path d="M1 47c12 3 24 3 36 0s24-3 36 0 24 3 46 0" stroke="var(--water)" stroke-width="2" />
          {[10, 26, 42, 58, 74, 90, 106].map((x) => <path key={x} d={`M${x} 64l-2-9M${x} 64l2-9`} />)}
          <path d="M8 8h14M8 8v10M112 8H98M112 8v10M8 72h14M8 72V62M112 72H98M112 72V62" stroke-width="2" />
        </g>
      )}
      {kind === 'close' && (
        <g fill="none" stroke={ink} stroke-width="1.2" stroke-linecap="round">
          {[30, 52, 74, 96].map((x) => <path key={x} d={`M${x} 72l-8-44M${x} 72l1-46M${x} 72l9-42`} />)}
          <path d="M10 46c14 3 28 3 42 0s28-3 58 0" stroke="var(--water)" stroke-width="2.2" />
          <path d="M110 30v28M106 34l4-4 4 4M106 54l4 4 4-4" />
        </g>
      )}
      {kind === 'landmark' && (
        <g fill="none" stroke={ink} stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 52h118" />
          <path d="M66 52V32h28v20zM62 33l18-12 18 12" />
          <circle cx="30" cy="30" r="12" />
          <path d="M30 42v10" />
          <circle cx="80" cy="40" r="24" stroke-dasharray="4 4" />
        </g>
      )}
    </svg>
  );
}

export const cropName = (c: string) => tr('crop.' + c);
