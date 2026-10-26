// Simulation control bar (feature A). Desktop: one sticky row under the nav. Below 1024px: a compact
// bottom dock (play, time, scrubber) whose "More" button opens a sheet with speed, moments, network, reset.
import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { Icon, type IconName } from './Icon';
import { Sheet } from './Sheet';
import { tr, trr } from '../lib/i18n';
import { RailSwitch, CadenceSwitch } from './RailSwitch';
import { fmtClock, fmtT } from '../lib/time';
import { network, type Net } from '../lib/prefs';
import { showToast } from '../lib/announce';
import { t, playing, speed, toggle, seek, pause, HOURS, type Speed } from '../sim/engine';
import { moments, jumpTo, type MomentId } from '../sim/moments';
import { resetFocus, logs } from '../farmer/focus';
import { clearAssignments } from '../dashboard/assign';
import { clearNoted } from '../dashboard/responses';
import { screen } from '../farmer/nav';
import { layout, measureInto } from '../site/layout';

const more = signal(false);
const MICON: Record<MomentId, IconName> = { trigger: 'rain', alert: 'phone', capture: 'camera', deadline: 'clock', confirm: 'check', draft: 'file' };
const NETS: [Net, IconName][] = [['online', 'signal'], ['weak', 'signalWeak'], ['offline', 'plane']];

export async function resetAll() {
  pause();
  seek(0);
  await Promise.all([resetFocus(), clearAssignments(), clearNoted()]);
  screen.value = null;
  network.value = 'online';
  showToast(tr('ctl.resetDone'));
}

/** Set while the person is being asked whether to clear everything this phone captured. */
const resetAsk = signal(false);

/** Reset the replay. If the phone holds anything a person captured, ask first: photos and a sealed code cannot be got back. */
export function requestReset() {
  if (Object.values(logs.value).some((c) => c.length > 0)) { resetAsk.value = true; return; }
  void resetAll();
}

export function ResetAsk() {
  if (!resetAsk.value) return null;
  const close = () => (resetAsk.value = false);
  return (
    <Sheet title={tr('ctl.ask.t')} onClose={close} closeLabel={tr('set.close')} class="center reset-ask" modal>
      <p>{tr('ctl.ask.b')}</p>
      <div class="stack">
        <button type="button" class="pill pill-primary pill-block" onClick={close}>{tr('ctl.ask.keep')}</button>
        <button type="button" class="pill pill-ghost pill-block" data-reset-yes onClick={() => { close(); void resetAll(); }}>{tr('ctl.ask.go')}</button>
      </div>
    </Sheet>
  );
}

function Speeds() {
  return (
    <div class="seg" role="group" aria-label={tr('ctl.speed')}>
      {([1, 10, 100] as Speed[]).map((s) => (
        <button key={s} type="button" aria-pressed={speed.value === s} onClick={() => (speed.value = s)}>
          <span class="num">{s}x</span>
        </button>
      ))}
    </div>
  );
}

function Moments() {
  const now = t.value;
  return (
    <div class="chips" role="group" aria-label={tr('ctl.jump')}>
      {moments.value.map((m) => (
        <button key={m.id} type="button" class={'chip-btn' + (Math.abs(now - m.t) < 0.2 ? ' at' : '')} onClick={() => { more.value = false; jumpTo(m.id); }} aria-label={`${trr('m.' + m.id)}, ${fmtT(m.t)}`}>
          <Icon name={MICON[m.id]} size={18} />
          <span>{trr('m.' + m.id)}</span>
        </button>
      ))}
    </div>
  );
}

export function NetSwitch() {
  return (
    <div class="seg net-seg" role="radiogroup" aria-label={tr('ctl.net')}>
      {NETS.map(([n, icon]) => (
        <button key={n} type="button" role="radio" aria-checked={network.value === n} onClick={() => (network.value = n)}>
          <Icon name={icon} size={16} />
          <span>{tr('net.' + n)}</span>
        </button>
      ))}
    </div>
  );
}

function Reset() {
  return (
    <button type="button" class="pill pill-ghost pill-sm" onClick={() => { more.value = false; requestReset(); }}>
      <Icon name="reset" size={18} /> {tr('ctl.reset')}
    </button>
  );
}

export function ControlBar() {
  const now = t.value;
  const desk = layout.value === 'desktop';
  const bar = useRef<HTMLDivElement>(null);
  // Sticky offsets (scroll padding, the phone column, toasts) use the bar's real height.
  useEffect(() => (bar.current ? measureInto(bar.current, desk ? '--ctrl-real' : '--dock-real') : undefined), [desk]);
  return (
    <div class={'ctrl ' + (desk ? 'ctrl-top' : 'ctrl-dock')} role="region" aria-label={tr('ctl.label')} data-tour="ctrl" data-sticky ref={bar}>
      <div class="wrap ctrl-in">
        <button type="button" class="iconbtn solid" onClick={toggle} aria-label={playing.value ? tr('ctl.pause') : tr('ctl.play')}>
          <Icon name={playing.value ? 'pause' : 'play'} />
        </button>
        <div class="ctrl-time">
          <strong>{fmtT(now)}</strong>
          <span><span class="ctrl-date">{fmtClock(now).split(', ')[0]}, </span>{fmtClock(now, false)} IST</span>
        </div>
        <div class="scrub">
          <input
            type="range"
            min={0}
            max={HOURS}
            step={0.25}
            value={now}
            aria-label={tr('ctl.scrub')}
            aria-valuetext={`${fmtT(now)}, ${fmtClock(now)}`}
            onInput={(e) => { pause(); seek(+(e.currentTarget as HTMLInputElement).value); }}
          />
          <div class="ticks" aria-hidden="true">
            {moments.value.map((m) => <i key={m.id} class="tick" style={{ left: `${(m.t / HOURS) * 100}%` }} />)}
          </div>
        </div>
        {desk ? (
          <>
            <Speeds />
            <Reset />
          </>
        ) : (
          <button type="button" class="iconbtn ctrl-more" aria-label={tr('ctl.more')} aria-expanded={more.value} onClick={() => (more.value = true)}>
            <Icon name="layers" />
          </button>
        )}
      </div>
      {desk && (
        <div class="wrap ctrl-row2">
          <Moments />
          <NetSwitch />
        </div>
      )}
      {more.value && !desk && (
        <Sheet title={tr('ctl.moreTitle')} onClose={() => (more.value = false)} closeLabel={tr('set.close')} class="ctrl-sheet">
          <div class="stack">
            <h3 class="eyebrow">{tr('ctl.speed')}</h3>
            <Speeds />
          </div>
          <div class="stack">
            <h3 class="eyebrow">{tr('ctl.jump')}</h3>
            <Moments />
          </div>
          <div class="stack">
            <h3 class="eyebrow">{tr('ctl.net')}</h3>
            <NetSwitch />
          </div>
          <RailSwitch compact />
          <CadenceSwitch compact />
          <Reset />
        </Sheet>
      )}
    </div>
  );
}
