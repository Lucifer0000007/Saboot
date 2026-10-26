import { Icon } from '../../ui/Icon';
import { tr, trr } from '../../lib/i18n';
import { rail } from '../../lib/prefs';
import { railHardDeadline } from '../../config';
import { fmtClock, fmtDur } from '../../lib/time';
import { t, model, focusPlot, focusDet, activePlotId } from '../../sim/engine';
import { view, reportNoDamage, policyNo } from '../focus';
import { screen } from '../nav';
import { backToQueue } from '../helper';
import { Countdown, PlotMini, VoiceCaption, cropName, countdownTone } from '../parts';

/** Helper mode is a first-class entry on the home screen, for the sarpanch, CSC operator, cooperative or extension worker. */
function HelperCard() {
  return (
    <section class="card helper-card" aria-labelledby="hm-card-h" data-helper-card>
      <h3 id="hm-card-h"><Icon name="users" /> {tr('hm.card.title')}</h3>
      <p>{tr('hm.card.body')}</p>
      <button type="button" class="pill pill-ghost" onClick={backToQueue}>{tr('hm.card.btn')} <span class="arrow" aria-hidden="true">→</span></button>
    </section>
  );
}

export function Home() {
  const m = model.value!, p = focusPlot.value!, d = focusDet.value!;
  const now = t.value;
  const v = view.value;
  const alerted = d.alertT !== null && now >= d.alertT;

  if (!alerted) {
    const rain = m.stations[p.station].r24[Math.floor(now)];
    const watch = rain >= 30;
    return (
      <div class="stack f-stack">
        <h2 class="f-title">{tr('reg.title')}</h2>
        <p class={'note ' + (watch ? 'note-warn' : 'note-ok')}>
          <Icon name={watch ? 'rain' : 'okShape'} />
          <span>{watch ? tr('reg.watch') : tr('reg.allClear')} · {tr('reg.rain', { mm: rain.toFixed(0) })}</span>
        </p>
        <PlotMini />
        <dl class="facts">
          <div><dt>{tr('reg.plot')}</dt><dd>{p.id} · {p.village}</dd></div>
          <div><dt>{tr('reg.crop')}</dt><dd>{cropName(p.crop)} · {p.areaHa.toFixed(1)} ha</dd></div>
          <div><dt>{trr('reg.policy')}</dt><dd class="num id">{policyNo(p.id)}</dd></div>
          <div><dt>{tr('reg.khasra')}</dt><dd>{p.khasra}</dd></div>
          <div><dt>{tr('reg.season')}</dt><dd>{tr('reg.kharif')}</dd></div>
        </dl>
        <p class="f-lead"><Icon name="satellite" /><span>{tr('reg.watching')}</span></p>
        <VoiceCaption id="reg" text={trr('reg.voice')} clip={'reg-' + rail.value} label={tr('reg.listen')} />
        <HelperCard />
      </div>
    );
  }

  const left = d.deadlineT! - now;
  const hard = railHardDeadline(rail.value);
  const windowH = d.deadlineT! - d.eventT!;
  const expired = left <= 0;
  const done = v.shotCount >= 3;
  // a helper acting for a farmer: the farmer's words are not the helper's ("No damage at my field"), audit H11
  const helped = activePlotId.value !== null;
  const needConsent = helped && !v.consent;
  // once the relief advice window has passed, the label stops saying "Best to capture within" (audit J16)
  const clockLabel = expired && !hard ? tr('al.passedLabel') : trr('al.clock');

  if (v.noDamage !== null) {
    return (
      <div class="stack f-stack">
        <h2 class="f-title">{helped ? tr('hm.s.nodamage') : tr('al.noDamage')}</h2>
        <p class="note note-ok" role="status"><Icon name="okShape" /><span>{helped ? tr('hm.noDamageDone', { farmer: p.name }) : trr('al.noDamageDone')}</span></p>
        <button type="button" class="pill pill-ghost" onClick={() => reportNoDamage(true)}>{tr('al.undo')}</button>
      </div>
    );
  }

  // the one action sits right under the message, so it is on the first screen on a small phone
  const cta = done ? (
    <button type="button" class="pill pill-primary pill-lg pill-block" onClick={() => (screen.value = 'packet')}>
      {tr('al.next')} <span class="arrow" aria-hidden="true">→</span>
    </button>
  ) : (
    <button type="button" class="pill pill-primary pill-lg pill-block" data-tour="cta" onClick={() => (screen.value = 'capture')}>
      <Icon name="camera" /> {tr('al.cta')} <span class="arrow" aria-hidden="true">→</span>
    </button>
  );
  return (
    <div class="stack f-stack">
      <div class={'card-elev alert-card tone-' + countdownTone(left, hard)} data-tour="alert">
        <p class="alert-kicker"><Icon name={expired ? 'clock' : 'water'} /><span>{tr('m.alert')}</span></p>
        <h2 class="f-title">{expired && !done ? trr('al.expired') : tr('al.title')}</h2>
        <p>{tr('al.msg')}</p>
        {cta}
        <div class="alert-clock">
          <p class="clock-label">{clockLabel}</p>
          <Countdown left={left} total={windowH} hard={hard} label={clockLabel} ended={tr('al.endedAt', { time: fmtClock(d.deadlineT!) })} />
        </div>
        <p class="alert-started">{trr('al.started', { time: fmtClock(d.eventT!) })}</p>
      </div>
      {expired && !done && <p class={'note ' + (hard ? 'note-bad' : 'note-plain')}><Icon name={hard ? 'barShape' : 'info'} /><span>{trr('al.expiredMsg', { time: fmtClock(d.deadlineT!) })}</span></p>}
      {!expired && !done && now > d.alertT! + 6 && (
        <p class="note note-warn" role="status"><Icon name="clock" /><span>{trr('al.reminder', { left: fmtDur(left) })}</span></p>
      )}
      {done ? (
        <p class="note note-ok"><Icon name="okShape" /><span>{trr('al.done')}</span></p>
      ) : (
        <>
          <VoiceCaption id="alert" text={trr('al.voice')} clip={'alert-' + rail.value} label={tr('al.play')} />
          {needConsent ? (
            // a helper records nothing for a farmer, not even "no damage", before that farmer agrees (audit CC-02, H3)
            <div class="stack" data-need-consent>
              <p class="note note-warn" role="status"><Icon name="info" /><span>{tr('cap.needConsent', { farmer: p.name })}</span></p>
              <button type="button" class="pill pill-ghost" onClick={() => (screen.value = 'assist')}>{tr('cap.askConsent')} <span class="arrow" aria-hidden="true">→</span></button>
            </div>
          ) : <div class="f-row2">
            <button type="button" class="pill pill-ghost" onClick={() => reportNoDamage()}>
              <Icon name="check" /> {helped ? tr('hm.noDamage') : tr('al.noDamage')}
            </button>
            {/* the helper is the help */}
            {!helped && (
              <button type="button" class="pill pill-ghost" onClick={() => (screen.value = 'assist')}>
                <Icon name="users" /> {tr('al.help')}
              </button>
            )}
          </div>}
        </>
      )}
      {!helped && <HelperCard />}
    </div>
  );
}
